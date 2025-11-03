const { requireOwnerParam, requireOwnerBody } = require('../../src/middleware/ownership');

function makeReq(params: any = {}, body: any = {}, user: any = null) {
  return { params, body, user };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('ownership middleware', () => {
  test('requireOwnerParam allows owner and rejects others', () => {
    const next = jest.fn();
    const res = makeRes();

    requireOwnerParam('userId')(makeReq({ userId: 'abc' }, {}, { id: 'abc' }), res, next);
    expect(next).toHaveBeenCalled();
    next.mockClear();

    requireOwnerParam('userId')(makeReq({ userId: 'abc' }, {}, { id: 'other' }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    next.mockClear();

    requireOwnerParam('userId')(makeReq({}, {}, null), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('requireOwnerBody allows owner and rejects missing field', () => {
    const next = jest.fn();
    const res = makeRes();

    requireOwnerBody('userId')(makeReq({}, { userId: 'me' }, { id: 'me' }), res, next);
    expect(next).toHaveBeenCalled();
    next.mockClear();

    requireOwnerBody('userId')(makeReq({}, { userId: 'me' }, { id: 'notme' }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    next.mockClear();

    requireOwnerBody('userId')(makeReq({}, {}, { id: 'me' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
