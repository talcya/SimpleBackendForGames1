// Use real timers for this unit test to avoid Jest fake-timer complexities with async intervals.
// Mock the rule-engine service before requiring the job module.
const mockProcessPending = jest.fn().mockResolvedValue(undefined);

jest.mock('../../src/services/rule-engine.service', () => ({
  processPendingEvents: (...args) => mockProcessPending(...args),
}));

const { startEventProcessor, stopEventProcessor } = require('../../src/jobs/process-event-logs.job');

describe('process-event-logs job', () => {
  afterEach(() => {
    stopEventProcessor();
    mockProcessPending.mockReset();
  });

  test('startEventProcessor schedules processing and stopEventProcessor cancels it', async () => {
    startEventProcessor(50);

    // wait slightly longer than interval for the job to run
    await new Promise((r) => setTimeout(r, 120));
    expect(mockProcessPending).toHaveBeenCalled();

    mockProcessPending.mockClear();
    stopEventProcessor();

    // wait longer to ensure no further invocations happen after stop
    await new Promise((r) => setTimeout(r, 200));
    expect(mockProcessPending).not.toHaveBeenCalled();
  });
});
