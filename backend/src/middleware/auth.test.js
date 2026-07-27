'use strict';

/**
 * Unit tests for the JWT authentication middleware.
 *
 * Validates: Requirements 3.9, 9.6, 10.2
 *
 * Tests cover: no token, malformed token, expired token, wrong secret, valid token.
 */

const jwt = require('jsonwebtoken');
const { authenticate } = require('./auth');

const TEST_SECRET = 'test-jwt-secret-for-unit-tests';

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

afterAll(() => {
  delete process.env.JWT_SECRET;
});

function createMockReq(authHeader) {
  return {
    headers: {
      authorization: authHeader,
    },
  };
}

function createMockRes() {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

describe('authenticate middleware', () => {
  it('should return 401 when no Authorization header is present', () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = () => {};

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when Authorization header does not start with Bearer', () => {
    const req = createMockReq('Basic some-token');
    const res = createMockRes();
    const next = () => {};

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when Bearer token is empty', () => {
    const req = createMockReq('Bearer ');
    const res = createMockRes();
    const next = () => {};

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 with "Invalid token" for a malformed token', () => {
    const req = createMockReq('Bearer not-a-valid-jwt');
    const res = createMockRes();
    const next = () => {};

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid token');
  });

  it('should return 401 with "Token expired" for an expired token', () => {
    const expiredToken = jwt.sign(
      { userId: '123', username: 'testuser', email: 'test@example.com' },
      TEST_SECRET,
      { expiresIn: '-1s' }
    );
    const req = createMockReq(`Bearer ${expiredToken}`);
    const res = createMockRes();
    const next = () => {};

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Token expired');
  });

  it('should return 401 when token is signed with wrong secret', () => {
    const wrongSecretToken = jwt.sign(
      { userId: '123', username: 'testuser', email: 'test@example.com' },
      'wrong-secret',
      { expiresIn: '7d' }
    );
    const req = createMockReq(`Bearer ${wrongSecretToken}`);
    const res = createMockRes();
    const next = () => {};

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid token');
  });

  it('should attach decoded payload to req.user and call next on valid token', () => {
    const payload = { userId: 'abc123', username: 'testuser', email: 'test@example.com' };
    const validToken = jwt.sign(payload, TEST_SECRET, { expiresIn: '7d' });
    const req = createMockReq(`Bearer ${validToken}`);
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    authenticate(req, res, next);

    expect(nextCalled).toBe(true);
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe('abc123');
    expect(req.user.username).toBe('testuser');
    expect(req.user.email).toBe('test@example.com');
  });

  it('should not call next on invalid token', () => {
    const req = createMockReq('Bearer invalid-token');
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    authenticate(req, res, next);

    expect(nextCalled).toBe(false);
  });
});
