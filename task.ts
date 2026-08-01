import * as fs from 'fs';
import * as path from 'path';

/** A single task as stored in tasks.json. */
export interface Task {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}

/** Where tasks are persisted — the single source of truth for the storage path. */
export const TASKS_FILE = path.join(process.cwd(), 'tasks.json');

/**
 * Reads every task from tasks.json.
 *
 * If the file does not exist it is created holding an empty array, so callers
 * can always assume a well-formed store afterwards. An existing file is never
 * overwritten here — malformed contents raise an error rather than being reset,
 * so a typo in the file can't silently destroy the user's tasks.
 */
export function loadTasks(): Task[] {
  if (!fs.existsSync(TASKS_FILE)) {
    saveTasks([]);
    return [];
  }

  let raw: string;
  try {
    raw = fs.readFileSync(TASKS_FILE, 'utf8');
  } catch (err: unknown) {
    throw new Error(
      `Could not read ${TASKS_FILE}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // An empty file is treated as an empty list rather than a parse failure.
  if (raw.trim() === '') {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `${TASKS_FILE} is not valid JSON. Fix or remove the file, then try again.`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `${TASKS_FILE} should contain an array of tasks. Fix or remove the file, then try again.`
    );
  }

  return parsed as Task[];
}

/** Writes the full task list back to tasks.json. */
export function saveTasks(tasks: Task[]): void {
  try {
    fs.writeFileSync(TASKS_FILE, `${JSON.stringify(tasks, null, 2)}\n`, 'utf8');
  } catch (err: unknown) {
    throw new Error(
      `Could not write ${TASKS_FILE}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Returns the next task id: one above the highest in use, so ids stay unique
 * even after tasks in the middle of the list are deleted.
 */
function nextId(tasks: Task[]): number {
  return tasks.reduce((max, task) => (task.id > max ? task.id : max), 0) + 1;
}

/** Appends a new task to tasks.json and returns it. */
export function addTask(title: string): Task {
  const trimmed = title.trim();
  if (trimmed === '') {
    throw new Error('A task title is required. Usage: add <title>');
  }

  const tasks = loadTasks();
  const task: Task = {
    id: nextId(tasks),
    title: trimmed,
    done: false,
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  saveTasks(tasks);

  return task;
}

/** Locates a task by id, or reports which id was missing. */
function findIndexById(tasks: Task[], id: number): number {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    throw new Error(`No task with ID ${id}. Run 'list' to see your tasks.`);
  }

  return index;
}

/**
 * Marks a task as done. Completing an already-done task is not an error, so
 * `alreadyDone` lets the caller phrase the confirmation accurately.
 */
export function completeTask(id: number): { task: Task; alreadyDone: boolean } {
  const tasks = loadTasks();
  const index = findIndexById(tasks, id);
  const task = tasks[index];

  if (task.done) {
    return { task, alreadyDone: true };
  }

  task.done = true;
  saveTasks(tasks);

  return { task, alreadyDone: false };
}

/** Removes a task from tasks.json and returns the removed task. */
export function deleteTask(id: number): Task {
  const tasks = loadTasks();
  const index = findIndexById(tasks, id);
  const [removed] = tasks.splice(index, 1);

  saveTasks(tasks);

  return removed;
}
