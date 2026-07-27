'use strict';

/**
 * Unit tests for the global error handler middleware.
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 */

const errorHandler = require('./errorHandler');

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler middleware', () => {
  it('returns 400 JSON for CastError with kind ObjectId', () => {
    const err = new Error('Cast to ObjectId failed');
    err.name = 'CastError';
    err.kind = 'ObjectId';

    const res = mockRes();
    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID format' });
  });

  it('returns 401 JSON for JsonWebTokenError', () => {
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';

    const res = mockRes();
    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  it('returns 401 JSON for TokenExpiredError', () => {
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';

    const res = mockRes();
    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  it('returns 500 JSON for generic unhandled errors', () => {
    const err = new Error('Something broke');
    const res = mockRes();

    vi.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(console.error).toHaveBeenCalledWith(err);

    console.error.mockRestore();
  });

  it('does not return 400 for CastError with non-ObjectId kind', () => {
    const err = new Error('Cast to Number failed');
    err.name = 'CastError';
    err.kind = 'Number';

    const res = mockRes();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });

    console.error.mockRestore();
  });

  it('always returns a JSON body with an error string field', () => {
    const errors = [
      (() => { const e = new Error(); e.name = 'CastError'; e.kind = 'ObjectId'; return e; })(),
      (() => { const e = new Error(); e.name = 'JsonWebTokenError'; return e; })(),
      (() => { const e = new Error(); e.name = 'TokenExpiredError'; return e; })(),
      new Error('random'),
    ];

    vi.spyOn(console, 'error').mockImplementation(() => {});

    for (const err of errors) {
      const res = mockRes();
      errorHandler(err, {}, res, () => {});
      const body = res.json.mock.calls[0][0];
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    }

    console.error.mockRestore();
  });
});
