'use strict';

/**
 * Global Express error handler middleware.
 * Returns consistent JSON error responses:
 * - 400 for CastError (invalid ObjectId)
 * - 401 for JWT errors (malformed/expired token)
 * - 500 for all other unhandled errors
 */
function errorHandler(err, req, res, next) {
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
