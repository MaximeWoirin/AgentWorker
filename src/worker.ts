import { getPendingTasks, updateTaskStatus, createTask, TaskRecurrence } from './db.js';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { sendNotification } from './notifier.js';

const LOG_PATH = path.resolve('logs/agent-worker.md');
const INTERVAL = parseInt(process.env.WORKER_INTERVAL_MS || '60000', 10);
const GH_COPILOT_MOCK = process.env.GH_COPILOT_MOCK === 'true';

function ensureLogDir() {
  const dir = path.dirname(LOG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function appendLog({ id, status, prompt, context, output }: { id: number; status: string; prompt: string; context?: string | null; output: string }) {
  ensureLogDir();
  const timestamp = new Date().toISOString();
  const log = `## Task #${id} — ${status} — ${timestamp}\n**Prompt:** ${prompt}\n**Context:** ${context ?? ''}\n**Output:**\n${output}\n---\n`;
  fs.appendFileSync(LOG_PATH, log);
}

function runCopilot(prompt: string, context?: string | null): string {
  if (GH_COPILOT_MOCK) {
    return '[MOCK OUTPUT] Copilot would have run: ' + prompt + (context ? `\nContext: ${context}` : '');
  }
  try {
    const fullPrompt = context ? `${prompt}\n\nContext: ${context}` : prompt;
    return execFileSync('gh', ['copilot', 'suggest', '-t', 'shell', fullPrompt], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return '[ERROR] ' + (e?.stdout || '') + (e?.stderr || e?.message || String(err));
  }
}

function scheduleNext(task: { prompt: string; context?: string | null; recurrence: TaskRecurrence; scheduled_at: string }) {
  if (!task.recurrence) return;
  const last = new Date(task.scheduled_at);
  let next: Date;
  if (task.recurrence === 'daily') {
    next = new Date(last.getTime() + 24 * 60 * 60 * 1000);
  } else if (task.recurrence === 'weekly') {
    next = new Date(last.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    return;
  }
  createTask(task.prompt, next.toISOString(), task.context, task.recurrence);
}

export function startWorker(): NodeJS.Timeout {
  return setInterval(() => {
    try {
      const tasks = getPendingTasks();
      for (const task of tasks) {
        updateTaskStatus(task.id, 'running');
        const output = runCopilot(task.prompt, task.context);
        const status = output.startsWith('[ERROR]') ? 'failed' : 'completed';
        appendLog({ id: task.id, status, prompt: task.prompt, context: task.context, output });
        updateTaskStatus(task.id, status);
        sendNotification(task.id, status, output);
        if (status === 'completed' && (task.recurrence === 'daily' || task.recurrence === 'weekly')) {
          scheduleNext(task);
        }
      }
    } catch (err: unknown) {
      console.error('[worker] Unexpected error in worker loop:', err instanceof Error ? err.message : String(err));
    }
  }, INTERVAL);
}
