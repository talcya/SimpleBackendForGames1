const { requireRole, requireAnyRole } = require('../../src/middleware/roles');

function makeReq(user: any) {
  return { user };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('roles middleware', () => {
  test('requireRole allows exact role and admin', () => {
    const next = jest.fn();
    const res = makeRes();

    // moderator allowed
    requireRole('moderator')(makeReq({ id: '1', role: 'moderator' }), res, next);
    expect(next).toHaveBeenCalled();
    next.mockClear();

    // admin allowed
    requireRole('moderator')(makeReq({ id: '2', role: 'admin' }), res, next);
    expect(next).toHaveBeenCalled();
    next.mockClear();

    // user denied
    requireRole('moderator')(makeReq({ id: '3', role: 'user' }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAnyRole allows any listed role and admin', () => {
    const next = jest.fn();
    const res = makeRes();

    requireAnyRole(['user', 'moderator'])(makeReq({ id: '1', role: 'user' }), res, next);
    expect(next).toHaveBeenCalled();
    next.mockClear();

    requireAnyRole(['user', 'moderator'])(makeReq({ id: '2', role: 'moderator' }), res, next);
    expect(next).toHaveBeenCalled();
    next.mockClear();

    requireAnyRole(['user'])(makeReq({ id: '3', role: 'admin' }), res, next);
    expect(next).toHaveBeenCalled();
    next.mockClear();

    requireAnyRole(['moderator'])(makeReq({ id: '4', role: 'guest' }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
