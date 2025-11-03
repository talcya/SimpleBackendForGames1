import GuestModel from '../models/guest';
import mongoose from 'mongoose';

let handle: NodeJS.Timeout | null = null;

// Remove guests that have been inactive for more than `expireMs` (default 30 days)
export function startGuestCleanup(expireMs = 1000 * 60 * 60 * 24 * 30, intervalMs = 1000 * 60 * 60 * 24) {
  if (handle) return;
  handle = setInterval(() => {
    // fire-and-forget the cleanup run
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    runGuestCleanupOnce(expireMs).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Error cleaning up guests', err);
    });
  }, intervalMs);
}

// Run cleanup immediately once (test-friendly)
export async function runGuestCleanupOnce(expireMs = 1000 * 60 * 60 * 24 * 30) {
  const cutoff = new Date(Date.now() - expireMs);
  return GuestModel.deleteMany({ lastActive: { $lt: cutoff } }).exec();
}

export function stopGuestCleanup() {
  if (!handle) return;
  clearInterval(handle);
  handle = null;
}

export default { startGuestCleanup, stopGuestCleanup };
