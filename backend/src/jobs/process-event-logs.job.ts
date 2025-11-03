import { processPendingEvents } from '../services/rule-engine.service';

let intervalHandle: NodeJS.Timeout | null = null;

export function startEventProcessor(pollIntervalMs = 30_000) {
  if (intervalHandle) return;
  intervalHandle = setInterval(async () => {
    try {
      // process up to 100 pending events per tick
      // eslint-disable-next-line no-await-in-loop
      await processPendingEvents(100);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Event processor error', err);
    }
  }, pollIntervalMs);
}

export function stopEventProcessor() {
  if (!intervalHandle) return;
  clearInterval(intervalHandle);
  intervalHandle = null;
}

export default { startEventProcessor, stopEventProcessor };
