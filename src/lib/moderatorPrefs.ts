const KEY = 'facecloud:moderator:auto-refresh'

/** Whether the review queue pulls in new reviews by itself. A browser preference (the backend has no such setting); on by default. */
export function getQueueAutoRefresh(): boolean {
  try { return localStorage.getItem(KEY) !== 'off' } catch { return true }
}

export function setQueueAutoRefresh(on: boolean): void {
  try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* the choice just will not be remembered */ }
}

export const QUEUE_REFRESH_MS = 30_000
