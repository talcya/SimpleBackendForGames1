export {};
// Test the guest cleanup job removes stale guest sessions
describe('Guest cleanup job', () => {
  let serverInstance: any;
  let app: any;

  beforeAll(async () => {
    const created = await require('../../dist/app').createServer();
    app = created.app;
    serverInstance = created.server;
  });

  afterAll(async () => {
    if (serverInstance && typeof serverInstance.close === 'function') {
      await new Promise((res) => serverInstance.close(() => res(null)));
    }
    try {
      const mongoose = require('mongoose');
      if (mongoose && mongoose.disconnect) await mongoose.disconnect();
    } catch (e) {
      // ignore
    }
  });

  it('removes guests older than expireMs and keeps recent guests', async () => {
    const GuestModel = require('../../dist/models/guest').default;
    const job = require('../../dist/jobs/guest-cleanup.job');

    // ensure no leftover guests
    await GuestModel.deleteMany({}).exec();

    const now = Date.now();
    // create an old guest (we'll set lastActive after creation because the
    // model's pre-save hook updates lastActive)
    const oldGuest = await GuestModel.create({});
    await GuestModel.updateOne({ guestId: oldGuest.guestId }, { $set: { lastActive: new Date(now - 10_000) } }).exec();
    // create a recent guest (pre-save sets lastActive to now)
    const recentGuest = await GuestModel.create({});

    // Prefer direct runGuestCleanupOnce if exported; otherwise fall back to
    // starting the cleanup interval briefly (covers module interop differences).
    let deletedCount = 0;
    if (typeof job.runGuestCleanupOnce === 'function') {
      const res = await job.runGuestCleanupOnce(5_000);
      deletedCount = (res && res.deletedCount) || 0;
    } else {
      if (typeof job.stopGuestCleanup === 'function') job.stopGuestCleanup();
      if (typeof job.startGuestCleanup === 'function') job.startGuestCleanup(5_000, 200);
      await new Promise((res) => setTimeout(res, 700));
      if (typeof job.stopGuestCleanup === 'function') job.stopGuestCleanup();
      // after interval fallback, compute deleted count by comparing remaining
      const remainingAfter = await GuestModel.find({}).lean().exec();
      deletedCount = 2 - remainingAfter.length; // we created 2 guests
    }

    const remaining = await GuestModel.find({}).lean().exec();
    const ids = remaining.map((g: any) => g.guestId);
    // ensure cleanup removed at least one record (the old one) and that a recent
    // guest remains
    expect(deletedCount).toBeGreaterThanOrEqual(1);
    expect(ids).toContain(recentGuest.guestId);
  }, 20000);
});
