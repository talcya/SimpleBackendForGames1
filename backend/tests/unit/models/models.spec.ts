const UserModel = require('../../../src/models/user').default;
const LeaderboardModel = require('../../../src/models/leaderboard').default;

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
