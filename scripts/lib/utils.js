'use strict';

const fs = require('fs/promises');
const path = require('path');

/**
 * Extract file extension from a URL.
 * Falls back to '.jpg' if extension cannot be determined.
 * @param {string} url - Image URL
 * @returns {string} Extension including dot (e.g., '.jpg')
 */
function extractExtension(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const ext = path.extname(pathname).toLowerCase();
    if (ext && /^\.[a-z0-9]+$/.test(ext)) {
      return ext;
    }
    return '.jpg';
  } catch {
    return '.jpg';
  }
}

/**
 * Generate a stable unique identifier from the record.
 * Uses the record's title as a slug if available, otherwise falls back to array index.
 * @param {object} record - The artwork record
 * @param {number} index - Array index of the record
 * @returns {string} A stable unique identifier
 */
function getRecordId(record, index) {
  if (record && record.title && typeof record.title === 'string' && record.title.trim()) {
    const slug = record.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (slug) {
      return slug;
    }
  }
  return String(index);
}

/**
 * Validate that required AWS environment variables are set.
 * @returns {{valid: boolean, missing: string[]}}
 */
function validateAwsEnv() {
  const required = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET'
  ];
  const missing = required.filter(
    (key) => !process.env[key] || process.env[key].trim() === ''
  );
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Safely delete a file, ignoring errors if it doesn't exist.
 * @param {string} filePath - Path to the file to delete
 * @returns {Promise<void>}
 */
async function safeDelete(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

module.exports = {
  extractExtension,
  getRecordId,
  validateAwsEnv,
  safeDelete
};
