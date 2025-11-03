const UserModel = require('../../../dist/models/user').default;
const LeaderboardModel = require('../../../dist/models/leaderboard').default;

describe('Models smoke tests', () => {
  it('User model should be defined', () => {
    expect(UserModel).toBeDefined();
    expect(UserModel.schema.paths.displayName).toBeDefined();
  });

  it('Leaderboard model should be defined', () => {
    expect(LeaderboardModel).toBeDefined();
    expect(LeaderboardModel.schema.paths.score).toBeDefined();
  });
});

afterAll(async () => {
  // Disconnect mongoose if connected to allow Jest to exit cleanly
  try {
    const mongoose = require('mongoose');
    if (mongoose && mongoose.disconnect) await mongoose.disconnect();
  } catch (err) {
    // ignore
  }
});
