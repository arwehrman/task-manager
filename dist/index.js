"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const task_1 = require("./task");
/**
 * The command table — the single source of truth for validation, per-command
 * usage strings, and the help listing, so those can't drift apart.
 */
const COMMAND_SPECS = {
    add: { args: '<title>', description: 'Add a new task' },
    list: { args: '', description: 'List all tasks' },
    complete: { args: '<id>', description: 'Mark a task as complete' },
    delete: { args: '<id>', description: 'Delete a task' },
};
const COMMANDS = Object.keys(COMMAND_SPECS);
function isCommand(value) {
    return Object.prototype.hasOwnProperty.call(COMMAND_SPECS, value);
}
/** How a command is invoked, e.g. "add <title>". */
function signature(command) {
    const { args } = COMMAND_SPECS[command];
    return args === '' ? command : `${command} ${args}`;
}
/** Reports invalid input for a command and sets a failing exit code. */
function fail(command, message) {
    if (message !== undefined) {
        console.error(message);
    }
    console.error(`Usage: ${signature(command)}`);
    process.exitCode = 1;
}
function handleAdd(args) {
    // Joined so an unquoted title ("add buy milk") works as well as a quoted one.
    const title = args.join(' ').trim();
    if (title === '') {
        fail('add');
        return;
    }
    const task = (0, task_1.addTask)(title);
    console.log(`Added task ${task.id}: ${task.title}`);
}
/** Renders tasks as an aligned ID / Title / Status table. */
function formatTable(tasks) {
    const rows = tasks.map((task) => ({
        id: String(task.id),
        title: task.title,
        status: task.done ? 'done' : 'pending',
    }));
    // Widen each column to fit its longest value, header included.
    const idWidth = Math.max('ID'.length, ...rows.map((row) => row.id.length));
    const titleWidth = Math.max('Title'.length, ...rows.map((row) => row.title.length));
    const statusWidth = Math.max('Status'.length, ...rows.map((row) => row.status.length));
    const lines = [
        `${'ID'.padStart(idWidth)}  ${'Title'.padEnd(titleWidth)}  Status`,
        `${'-'.repeat(idWidth)}  ${'-'.repeat(titleWidth)}  ${'-'.repeat(statusWidth)}`,
    ];
    for (const row of rows) {
        lines.push(`${row.id.padStart(idWidth)}  ${row.title.padEnd(titleWidth)}  ${row.status}`);
    }
    return lines.join('\n');
}
function handleList(args) {
    if (args.length > 0) {
        fail('list', `Unexpected argument: '${args[0]}'.`);
        return;
    }
    const tasks = (0, task_1.loadTasks)();
    if (tasks.length === 0) {
        console.log('No tasks yet. Use add to create one.');
        return;
    }
    console.log(formatTable(tasks));
}
/**
 * Reads a task ID from the command arguments. Returns null after reporting the
 * problem itself, so callers just stop when parsing fails.
 */
function parseId(args, command) {
    const raw = args[0];
    if (raw === undefined || raw.trim() === '') {
        fail(command);
        return null;
    }
    if (args.length > 1) {
        fail(command, `Expected a single task ID but got ${args.length} arguments.`);
        return null;
    }
    const id = Number(raw);
    if (!Number.isInteger(id) || id < 1) {
        fail(command, `Invalid task ID: '${raw}'. IDs are whole numbers, e.g. 1.`);
        return null;
    }
    return id;
}
function handleComplete(args) {
    const id = parseId(args, 'complete');
    if (id === null) {
        return;
    }
    const { task, alreadyDone } = (0, task_1.completeTask)(id);
    console.log(alreadyDone
        ? `Task ${task.id} is already complete: ${task.title}`
        : `Completed task ${task.id}: ${task.title}`);
}
function handleDelete(args) {
    const id = parseId(args, 'delete');
    if (id === null) {
        return;
    }
    const task = (0, task_1.deleteTask)(id);
    console.log(`Deleted task ${task.id}: ${task.title}`);
}
/** Widest command signature, so help entries share one description column. */
const HELP_LABEL_WIDTH = Math.max(...COMMANDS.map((command) => signature(command).length));
function helpEntry(label, description) {
    return `  ${label.padEnd(HELP_LABEL_WIDTH)}  ${description}`;
}
/** The Commands block of the help text, generated from COMMAND_SPECS. */
function commandList() {
    return COMMANDS.map((command) => helpEntry(signature(command), COMMAND_SPECS[command].description)).join('\n');
}
function printUsage() {
    console.log(`task-manager — a CLI task manager

Usage:
  task <command> [arguments]

Commands:
${commandList()}

Options:
${helpEntry('-h, --help', 'Show this help message')}

Examples:
  npx ts-node index.ts add "Write the storage layer"
  npx ts-node index.ts list
  npx ts-node index.ts complete 1
  npx ts-node index.ts delete 1

Tasks are stored in ${task_1.TASKS_FILE}`);
}
function main() {
    const [command, ...args] = process.argv.slice(2);
    if (command === undefined || command === '--help' || command === '-h') {
        printUsage();
        return;
    }
    if (!isCommand(command)) {
        console.error(`Unknown command: ${command}\n`);
        printUsage();
        process.exitCode = 1;
        return;
    }
    switch (command) {
        case 'add':
            handleAdd(args);
            break;
        case 'list':
            handleList(args);
            break;
        case 'complete':
            handleComplete(args);
            break;
        case 'delete':
            handleDelete(args);
            break;
    }
}
try {
    main();
}
catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
}
