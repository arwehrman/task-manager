"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASKS_FILE = void 0;
exports.loadTasks = loadTasks;
exports.saveTasks = saveTasks;
exports.addTask = addTask;
exports.completeTask = completeTask;
exports.deleteTask = deleteTask;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/** Where tasks are persisted — the single source of truth for the storage path. */
exports.TASKS_FILE = path.join(process.cwd(), 'tasks.json');
/**
 * Reads every task from tasks.json.
 *
 * If the file does not exist it is created holding an empty array, so callers
 * can always assume a well-formed store afterwards. An existing file is never
 * overwritten here — malformed contents raise an error rather than being reset,
 * so a typo in the file can't silently destroy the user's tasks.
 */
function loadTasks() {
    if (!fs.existsSync(exports.TASKS_FILE)) {
        saveTasks([]);
        return [];
    }
    let raw;
    try {
        raw = fs.readFileSync(exports.TASKS_FILE, 'utf8');
    }
    catch (err) {
        throw new Error(`Could not read ${exports.TASKS_FILE}: ${err instanceof Error ? err.message : String(err)}`);
    }
    // An empty file is treated as an empty list rather than a parse failure.
    if (raw.trim() === '') {
        return [];
    }
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new Error(`${exports.TASKS_FILE} is not valid JSON. Fix or remove the file, then try again.`);
    }
    if (!Array.isArray(parsed)) {
        throw new Error(`${exports.TASKS_FILE} should contain an array of tasks. Fix or remove the file, then try again.`);
    }
    return parsed;
}
/** Writes the full task list back to tasks.json. */
function saveTasks(tasks) {
    try {
        fs.writeFileSync(exports.TASKS_FILE, `${JSON.stringify(tasks, null, 2)}\n`, 'utf8');
    }
    catch (err) {
        throw new Error(`Could not write ${exports.TASKS_FILE}: ${err instanceof Error ? err.message : String(err)}`);
    }
}
/**
 * Returns the next task id: one above the highest in use, so ids stay unique
 * even after tasks in the middle of the list are deleted.
 */
function nextId(tasks) {
    return tasks.reduce((max, task) => (task.id > max ? task.id : max), 0) + 1;
}
/** Appends a new task to tasks.json and returns it. */
function addTask(title) {
    const trimmed = title.trim();
    if (trimmed === '') {
        throw new Error('A task title is required. Usage: add <title>');
    }
    const tasks = loadTasks();
    const task = {
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
function findIndexById(tasks, id) {
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
function completeTask(id) {
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
function deleteTask(id) {
    const tasks = loadTasks();
    const index = findIndexById(tasks, id);
    const [removed] = tasks.splice(index, 1);
    saveTasks(tasks);
    return removed;
}
