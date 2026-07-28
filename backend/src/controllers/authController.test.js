'use strict';

/**
 * Unit tests for authController — register and login handlers.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4
 *
 * Uses vi.spyOn to mock User model static methods and bcryptjs functions.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { register, login } = require('./authController');

const TEST_SECRET = 'test-jwt-secret-for-auth-controller';

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
  process.env.JWT_EXPIRES_IN = '7d';
});

afterAll(() => {
  delete process.env.JWT_SECRET;
  delete process.env.JWT_EXPIRES_IN;
});

function createMockReq(body) {
  return { body };
}

function createMockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('authController — register', () => {
  let findOneSpy;
  let createSpy;
  let hashSpy;

  beforeEach(() => {
    findOneSpy = vi.spyOn(User, 'findOne');
    createSpy = vi.spyOn(User, 'create');
    hashSpy = vi.spyOn(bcrypt, 'hash');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 409 when email already exists', async () => {
    findOneSpy.mockResolvedValueOnce({ email: 'existing@test.com' });
    const req = createMockReq({ username: 'newuser', email: 'existing@test.com', password: 'pass123' });
    const res = createMockRes();
    const next = vi.fn();

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email already in use' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 409 when username already exists', async () => {
    findOneSpy.mockResolvedValueOnce(null); // email check — not found
    findOneSpy.mockResolvedValueOnce({ username: 'existinguser' }); // username check
    const req = createMockReq({ username: 'existinguser', email: 'new@test.com', password: 'pass123' });
    const res = createMockRes();
    const next = vi.fn();

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Username already in use' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should hash password with 12 rounds and return 201 with token and user object', async () => {
    findOneSpy.mockResolvedValueOnce(null); // email check
    findOneSpy.mockResolvedValueOnce(null); // username check
    hashSpy.mockResolvedValueOnce('hashed_password');
    createSpy.mockResolvedValueOnce({
      _id: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashed_password',
    });

    const req = createMockReq({ username: 'testuser', email: 'test@example.com', password: 'mypassword' });
    const res = createMockRes();
    const next = vi.fn();

    await register(req, res, next);

    expect(hashSpy).toHaveBeenCalledWith('mypassword', 12);
    expect(createSpy).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashed_password',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody).toHaveProperty('token');
    expect(responseBody.user).toEqual({ _id: 'user123', username: 'testuser', email: 'test@example.com' });

    // Verify token payload
    const decoded = jwt.verify(responseBody.token, TEST_SECRET);
    expect(decoded.userId).toBe('user123');
    expect(decoded.username).toBe('testuser');
    expect(decoded.email).toBe('test@example.com');
  });

  it('should call next(err) when an unexpected error occurs', async () => {
    const dbError = new Error('DB connection failed');
    findOneSpy.mockRejectedValueOnce(dbError);

    const req = createMockReq({ username: 'user', email: 'u@t.com', password: 'p' });
    const res = createMockRes();
    const next = vi.fn();

    await register(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});

describe('authController — login', () => {
  let findOneSpy;
  let compareSpy;

  beforeEach(() => {
    findOneSpy = vi.spyOn(User, 'findOne');
    compareSpy = vi.spyOn(bcrypt, 'compare');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 when email does not exist', async () => {
    findOneSpy.mockResolvedValueOnce(null);

    const req = createMockReq({ email: 'nonexistent@test.com', password: 'pass123' });
    const res = createMockRes();
    const next = vi.fn();

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when password does not match', async () => {
    findOneSpy.mockResolvedValueOnce({
      _id: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      password: 'stored_hash',
    });
    compareSpy.mockResolvedValueOnce(false);

    const req = createMockReq({ email: 'test@example.com', password: 'wrongpassword' });
    const res = createMockRes();
    const next = vi.fn();

    await login(req, res, next);

    expect(compareSpy).toHaveBeenCalledWith('wrongpassword', 'stored_hash');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 200 with token and user object on valid credentials', async () => {
    findOneSpy.mockResolvedValueOnce({
      _id: 'user456',
      username: 'loggeduser',
      email: 'logged@example.com',
      password: 'stored_hash',
    });
    compareSpy.mockResolvedValueOnce(true);

    const req = createMockReq({ email: 'logged@example.com', password: 'correctpassword' });
    const res = createMockRes();
    const next = vi.fn();

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody).toHaveProperty('token');
    expect(responseBody.user).toEqual({ _id: 'user456', username: 'loggeduser', email: 'logged@example.com' });

    // Verify token payload
    const decoded = jwt.verify(responseBody.token, TEST_SECRET);
    expect(decoded.userId).toBe('user456');
    expect(decoded.username).toBe('loggeduser');
    expect(decoded.email).toBe('logged@example.com');
  });

  it('should call next(err) when an unexpected error occurs', async () => {
    const dbError = new Error('DB timeout');
    findOneSpy.mockRejectedValueOnce(dbError);

    const req = createMockReq({ email: 'u@t.com', password: 'p' });
    const res = createMockRes();
    const next = vi.fn();

    await login(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});
