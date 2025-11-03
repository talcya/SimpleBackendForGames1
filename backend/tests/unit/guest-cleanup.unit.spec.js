const GuestModule = require('../../src/models/guest');
const GuestModel = GuestModule.default || GuestModule.GuestModel || GuestModule;
const job = require('../../src/jobs/guest-cleanup.job');

describe('guest-cleanup job (unit)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('runGuestCleanupOnce rejects when GuestModel.deleteMany.exec rejects', async () => {
    // mock deleteMany to return an object with exec() that rejects
    const fakeExec = jest.fn().mockRejectedValue(new Error('delete-failed'));
    jest.spyOn(GuestModel, 'deleteMany').mockImplementation(() => ({ exec: fakeExec }));

    await expect(job.runGuestCleanupOnce(1)).rejects.toThrow('delete-failed');
    expect(GuestModel.deleteMany).toHaveBeenCalled();
  });

  test('startGuestCleanup logs errors from periodic runs and does not throw', async () => {
  // mock deleteMany.exec to reject so the internal runGuestCleanupOnce will fail
  const fakeExec = jest.fn().mockRejectedValue(new Error('periodic-fail'));
  jest.spyOn(GuestModel, 'deleteMany').mockImplementation(() => ({ exec: fakeExec }));
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  // ensure any previous interval is cleared, then start with a short interval
  job.stopGuestCleanup();
  job.startGuestCleanup(1, 50); // expireMs, intervalMs

  // wait a bit to allow at least one interval execution
  await new Promise((res) => setTimeout(res, 180));

  // stop the interval
  job.stopGuestCleanup();

  expect(GuestModel.deleteMany).toHaveBeenCalled();
  expect(consoleError).toHaveBeenCalled();
  });
});
