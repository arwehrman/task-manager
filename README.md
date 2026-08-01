# task-manager

A small command-line task manager written in Node.js and TypeScript. Tasks are
stored as plain JSON in a local `tasks.json` file — no database, no dependencies
at runtime.

## Requirements

- Node.js 18 or newer

## Install

```bash
npm install
```

## Commands

| Command          | Description                | Example                     |
| ---------------- | -------------------------- | --------------------------- |
| `add <title>`    | Add a new task             | `add "Buy groceries"`       |
| `list`           | List all tasks in a table  | `list`                      |
| `complete <id>`  | Mark a task as complete    | `complete 1`                |
| `delete <id>`    | Delete a task              | `delete 1`                  |
| `-h`, `--help`   | Show the help message      | `--help`                    |

Run a command with `ts-node`:

```bash
npx ts-node index.ts add "Buy groceries"
```

or through the npm script (note the `--`, which passes arguments through):

```bash
npm start -- add "Buy groceries"
```

### add

```console
$ npx ts-node index.ts add "Buy groceries"
Added task 1: Buy groceries
```

Quotes are optional — `add buy groceries` is treated as the single title
"buy groceries".

IDs are assigned one above the highest in use and are never reused, so a task ID
stays stable for as long as that task exists.

### list

```console
$ npx ts-node index.ts list
ID  Title           Status
--  --------------  -------
 1  Buy groceries   pending
 2  Write the docs  done
```

With no tasks, it prints `No tasks yet. Use add to create one.`

### complete

```console
$ npx ts-node index.ts complete 1
Completed task 1: Buy groceries
```

Completing an already-completed task is not an error — it reports
`Task 1 is already complete: Buy groceries` and exits `0`.

### delete

```console
$ npx ts-node index.ts delete 1
Deleted task 1: Buy groceries
```

## Storage

Tasks live in `tasks.json` in the **current working directory**, created
automatically as an empty array the first time it is needed. Each task is:

```json
{
  "id": 1,
  "title": "Buy groceries",
  "done": false,
  "createdAt": "2026-08-01T23:21:25.841Z"
}
```

If `tasks.json` contains invalid JSON, commands stop with an error rather than
overwriting it, so a hand-editing mistake never silently discards tasks.

## Errors

Invalid input is reported on **stderr** with an exit code of `1`, leaving
`tasks.json` untouched. Successful commands exit `0`.

```console
$ npx ts-node index.ts complete
Usage: complete <id>

$ npx ts-node index.ts complete 99
Error: No task with ID 99. Run 'list' to see your tasks.

$ npx ts-node index.ts frobnicate
Unknown command: frobnicate
... followed by the full help message
```

Because errors go to stderr, `npx ts-node index.ts list > tasks.txt` captures
only the table.

## Development

```bash
npm test          # run the test suite (node:test)
npm run build     # compile to dist/
node dist/index.js list   # run the compiled build
```

The tests run in a temporary directory and clean up after each case, so they
never touch a real `tasks.json`.

## Project structure

| File           | Purpose                                             |
| -------------- | --------------------------------------------------- |
| `index.ts`     | CLI entry point: argument parsing, validation, output |
| `task.ts`      | Task type and storage — load, save, add, complete, delete |
| `task.test.ts` | Tests for the storage layer                          |
| `tasks.json`   | Your tasks (created on first use)                    |
