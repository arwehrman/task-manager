import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, afterEach, test } from 'node:test';

// `./task` resolves TASKS_FILE from process.cwd() the moment it loads, so move
// into a throwaway directory first. It is pulled in with require() rather than a
// top-level import because imports are hoisted above this chdir — with one, the
// tests would read and write the real project's tasks.json.
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'task-manager-test-'));
const originalCwd = process.cwd();
process.chdir(workDir);

const { addTask, completeTask, deleteTask, TASKS_FILE } =
  require('./task') as typeof import('./task');

/** Reads tasks.json straight from disk, so tests verify what was persisted. */
function readTasksFile(): unknown {
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}

afterEach(() => {
  fs.rmSync(TASKS_FILE, { force: true });
});

after(() => {
  process.chdir(originalCwd);
  fs.rmSync(workDir, { recursive: true, force: true });
});

test('adding a task creates it in tasks.json', () => {
  const returned = addTask('write tests');

  const tasks = readTasksFile();
  assert.ok(Array.isArray(tasks), 'tasks.json should hold an array');
  assert.equal(tasks.length, 1);

  const [stored] = tasks;
  assert.equal(stored.id, 1);
  assert.equal(stored.title, 'write tests');
  assert.equal(stored.done, false);
  assert.equal(
    new Date(stored.createdAt).toISOString(),
    stored.createdAt,
    'createdAt should be an ISO timestamp'
  );
  assert.deepEqual(stored, returned, 'the returned task should match what was saved');
});

test('completing a task sets done to true', () => {
  addTask('first');
  const second = addTask('second');

  const { task, alreadyDone } = completeTask(second.id);
  assert.equal(task.done, true);
  assert.equal(alreadyDone, false);

  const tasks = readTasksFile() as { id: number; done: boolean }[];
  assert.equal(tasks.length, 2, 'completing should not add or remove tasks');
  assert.equal(tasks.find((t) => t.id === second.id)?.done, true);
  assert.equal(tasks.find((t) => t.id !== second.id)?.done, false, 'others untouched');
});

test('deleting a task removes it', () => {
  const first = addTask('first');
  const second = addTask('second');

  const removed = deleteTask(first.id);
  assert.equal(removed.id, first.id);

  const tasks = readTasksFile() as { id: number; title: string }[];
  assert.equal(tasks.length, 1);
  assert.deepEqual(
    tasks.map((t) => t.id),
    [second.id],
    'only the deleted task should be gone'
  );
});
