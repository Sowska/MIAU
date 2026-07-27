'use strict';

const LocalStorage = require('./LocalStorage');
const S3Storage = require('./S3Storage');

/**
 * Factory function that returns the configured storage provider
 * based on the STORAGE_PROVIDER environment variable.
 *
 * Defaults to 'local' when not set.
 *
 * @returns {import('./ImageStorage')} A storage provider instance
 */
function createStorageProvider() {
  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

  switch (provider) {
    case 's3':
      return new S3Storage();
    case 'local':
    default:
      return new LocalStorage();
  }
}

module.exports = {
  createStorageProvider,
  LocalStorage,
  S3Storage,
};
