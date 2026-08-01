# task-manager

## What this project does

A CLI task manager built in Node.js/TypeScript.
Supports four commands: add, list, complete, delete.
Tasks are persisted in tasks.json.

## Tech stack

- Runtime: Node.js v18+
- Language: TypeScript
- Storage: Local JSON file (tasks.json)

## Run commands

- Install: npm install
- Run: npx ts-node index.ts
- Build: npx tsc

## Conventions

- Use TypeScript strict mode
- Handle all errors gracefully with user-friendly messages
- Never delete tasks.json on startup
