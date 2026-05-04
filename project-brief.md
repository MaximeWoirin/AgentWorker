This file serves as reference for the client needs

## Project Overview
As a user, I want to schedule tasks for my AI agent and get notified when they're done.
This is a **Proof of Concept (POC)**.

## Core Requirements

### Task Definition
- **Time to run**: scheduled execution time
- **Prompt**: the prompt to send to Copilot
- **Context**: text string with additional context
- **Support**: recurring tasks (daily, weekly, etc.) + one-time tasks

### Task Statuses
- `pending` - awaiting execution time
- `running` - currently executing
- `completed` - finished successfully
- `failed` - execution failed

### Key Features (Priority Order)
1. **Schedule**: Create new tasks
2. **List**: View all tasks and their status
3. **Cancel**: Remove/delete tasks

### Copilot Integration
- CLI command: `copilot -p "prompt"`
- Reference: https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference
- Output: store only in MD log file (not in database)

### No Retries
- Failed tasks are not automatically retried
- Manual retry via cancel + reschedule

## Technical Architecture

### Core Components
1. **Node MCP Server (TypeScript)**
   - API endpoints: schedule task, list tasks, cancel task
   - No authentication required (POC)
   - JSON request/response format

2. **SQLite Database**
   - Stores task records (schedule, status, prompt, context, created/updated timestamps)

3. **Node Worker**
   - Runs at configurable interval (default: 1 minute)
   - Checks for tasks in `pending` status ready for execution
   - Updates status to `running`, executes copilot CLI, updates to `completed` or `failed`
   - Appends results to flat MD log file

### Notifications & Reporting
- Flat markdown log file for all task execution history
- No email/webhook notifications for POC
- Logs include task details, timestamps, and copilot output

## Timeline
Quick delivery (days) - AI-driven implementation