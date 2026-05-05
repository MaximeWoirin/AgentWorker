import notifier from 'node-notifier';

const SUPPORTED_PLATFORMS = new Set(['darwin', 'win32']);

/**
 * Sends a native push notification on supported platforms (macOS, Windows).
 * On unsupported platforms the call is silently ignored.
 */
export function sendNotification(taskId: number, status: 'completed' | 'failed', resultSnippet: string): void {
  if (!SUPPORTED_PLATFORMS.has(process.platform)) {
    return;
  }

  const title = `AgentWorker — Task #${taskId} ${status}`;
  const message = resultSnippet.length > 100 ? resultSnippet.slice(0, 97) + '...' : resultSnippet;

  try {
    notifier.notify({ title, message });
  } catch (err: unknown) {
    console.error('[notifier] Failed to send notification:', err instanceof Error ? err.message : String(err));
  }
}
