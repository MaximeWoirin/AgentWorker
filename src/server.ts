import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createTask, listTasks, deleteTask, getTaskById, TaskStatus } from './db.js';

const server = new McpServer({ name: 'agentworker', version: '0.1.0' });

server.registerTool(
  'schedule_task',
  {
    title: 'Schedule a new task',
    description: 'Schedule a new Copilot task for the agent to run at a specific time.',
    inputSchema: {
      prompt: z.string().min(1, 'Prompt is required'),
      scheduled_at: z.string().datetime({ message: 'Must be ISO datetime' }),
      context: z.string().optional(),
      recurrence: z.enum(['daily', 'weekly']).nullable().optional(),
    },
  },
  async (args) => {
    try {
      const task = createTask(args.prompt, args.scheduled_at, args.context, args.recurrence ?? null);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(task) }],
      };
    } catch (err: unknown) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: 'Failed to schedule task: ' + (err instanceof Error ? err.message : String(err)) }],
      };
    }
  }
);

server.registerTool(
  'list_tasks',
  {
    title: 'List tasks',
    description: 'List all scheduled tasks, optionally filtered by status.',
    inputSchema: {
      status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
    },
  },
  async (args) => {
    try {
      const tasks = listTasks(args.status as TaskStatus | undefined);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(tasks) }],
      };
    } catch (err: unknown) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: 'Failed to list tasks: ' + (err instanceof Error ? err.message : String(err)) }],
      };
    }
  }
);

server.registerTool(
  'cancel_task',
  {
    title: 'Cancel a task',
    description: 'Cancel (delete) a scheduled task by ID.',
    inputSchema: {
      id: z.number(),
    },
  },
  async (args) => {
    try {
      const task = getTaskById(args.id);
      if (!task) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `Task #${args.id} not found` }],
        };
      }
      deleteTask(args.id);
      return {
        content: [{ type: 'text' as const, text: `Task #${args.id} cancelled` }],
      };
    } catch (err: unknown) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: 'Failed to cancel task: ' + (err instanceof Error ? err.message : String(err)) }],
      };
    }
  }
);

export default server;
