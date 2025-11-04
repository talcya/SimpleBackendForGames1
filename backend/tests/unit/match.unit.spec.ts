/* eslint-env jest */
jest.setTimeout(30000);
const mongoose = require('mongoose');
const MatchModel = require('../../src/models/match').default;
const PlayerScore = require('../../src/models/player-score').default;
const PlayerActivity = require('../../src/models/player-activity').default;
const { endMatchAndProcess } = require('../../src/helpers/matchHelpers');

describe('Match helpers', () => {
  it('should create match participants and process final scores', async () => {
    // create a match
  const playerA = new mongoose.Types.ObjectId();
  const playerB = new mongoose.Types.ObjectId();

    const match = await MatchModel.create({
      gameId: 'test_game',
      participants: [
        { player: playerA },
        { player: playerB },
      ],
      status: 'pending',
    });

    // process match
    const finalData = [
      { player: playerA, finalScore: 150, place: 1 },
      { player: playerB, finalScore: 100, place: 2 },
    ];

    const processed = await endMatchAndProcess(match._id, finalData);
    expect(processed).toBeDefined();
    const found = await MatchModel.findById(processed._id);
    expect(found).toBeDefined();
    expect(found.processed).toBe(true);

    // PlayerScore records created/upserted
    const s1 = await PlayerScore.findOne({ player: playerA, gameId: 'test_game' });
    const s2 = await PlayerScore.findOne({ player: playerB, gameId: 'test_game' });
    expect(s1).toBeDefined();
    expect(s2).toBeDefined();

    // PlayerActivity entries created
    const a1 = await PlayerActivity.findOne({ player: playerA, 'details.match': processed._id });
    expect(a1).toBeDefined();
  });
});
