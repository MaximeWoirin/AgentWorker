import Database from 'better-sqlite3';
import path from 'path';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type TaskRecurrence = null | 'daily' | 'weekly';

export interface Task {
  id: number;
  prompt: string;
  context?: string | null;
  scheduled_at: string;
  recurrence: TaskRecurrence;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

const DB_PATH = path.resolve(process.env.DB_PATH || 'agentworker.db');

let db: Database.Database;

export function initDb() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt TEXT NOT NULL,
      context TEXT,
      scheduled_at TEXT NOT NULL,
      recurrence TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export function createTask(
  prompt: string,
  scheduled_at: string,
  context?: string | null,
  recurrence?: TaskRecurrence
): Task {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO tasks (prompt, context, scheduled_at, recurrence, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
  `);
  const info = stmt.run(prompt, context ?? null, scheduled_at, recurrence ?? null, now, now);
  return getTaskById(info.lastInsertRowid as number)!;
}

export function listTasks(status?: TaskStatus): Task[] {
  if (status) {
    return db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY scheduled_at ASC').all(status) as Task[];
  }
  return db.prepare('SELECT * FROM tasks ORDER BY scheduled_at ASC').all() as Task[];
}

export function getTaskById(id: number): Task | undefined {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
}

export function updateTaskStatus(id: number, status: TaskStatus) {
  const now = new Date().toISOString();
  db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
}

export function deleteTask(id: number) {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function getPendingTasks(): Task[] {
  const now = new Date().toISOString();
  return db.prepare('SELECT * FROM tasks WHERE status = "pending" AND scheduled_at <= ? ORDER BY scheduled_at ASC').all(now) as Task[];
}
