# AgentWorker

A proof-of-concept tool to schedule tasks for an AI agent (GitHub Copilot CLI) and get notified when they're done.

## What is it?
AgentWorker lets you schedule shell tasks for GitHub Copilot CLI to run at a future time, with optional recurrence. It stores tasks in SQLite and logs results to a Markdown file.

## Features
- Schedule a Copilot task for a future time (with optional context and recurrence)
- List all tasks, filter by status
- Cancel (delete) a scheduled task
- Results are logged to `logs/agent-worker.md`

## Installation

1. Clone the repo
2. Install dependencies:
   ```sh
   npm install
   ```

## Configuration

Copy `.env.example` to `.env` and edit as needed:

```
WORKER_INTERVAL_MS=60000   # How often the worker checks for tasks (ms)
GH_COPILOT_MOCK=true       # If true, does not run Copilot CLI, just mocks output
```

## Running

Build the project:
```sh
npm run build
```

Start the MCP server (stdio):
```sh
npm start
```

Or run in dev mode (with ts-node):
```sh
npm run dev
```

## MCP Tools

- **schedule_task**: Schedule a new task
  - `prompt` (string, required)
  - `scheduled_at` (ISO datetime, required)
  - `context` (string, optional)
  - `recurrence` ("daily" | "weekly", optional)
- **list_tasks**: List all tasks (optionally filter by status)
  - `status` ("pending" | "running" | "completed" | "failed", optional)
- **cancel_task**: Cancel (delete) a task by ID
  - `id` (number, required)

## Log File Format

Results are appended to `logs/agent-worker.md`:

```
## Task #<id> — <status> — <timestamp>
**Prompt:** <prompt>
**Context:** <context>
**Output:**
<copilot output or error message>
---
```

## Notes
- The Copilot CLI (`gh copilot suggest`) must be installed and authenticated unless `GH_COPILOT_MOCK=true`.
- The MCP server runs over stdio (no HTTP server).
- No authentication is required.
- No retries on failure.

## License
MIT
