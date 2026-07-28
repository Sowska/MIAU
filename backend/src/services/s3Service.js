'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Internal config holder. Defaults to the real config module but can be
 * overridden for testing via `_setConfig()`.
 */
let _config = null;

function _loadConfig() {
  if (!_config) {
    _config = require('../config/s3');
  }
  return _config;
}

/**
 * Override the S3 config (for testing only).
 * @param {object} config - { s3Client, bucket }
 */
function _setConfig(config) {
  _config = config;
}

/**
 * Construct the public URL for an S3 object.
 * @param {string} key - The S3 object key
 * @returns {string} The public URL
 */
function getS3Url(key) {
  const region = process.env.AWS_REGION || '';
  const { bucket } = _loadConfig();
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Upload a file to S3 under the `markers/` prefix.
 * @param {object} file - Multer file object (buffer or path, originalname, mimetype)
 * @returns {Promise<string>} The public URL of the uploaded object
 */
async function uploadToS3(file) {
  const { s3Client, bucket } = _loadConfig();

  if (!s3Client) {
    throw new Error('S3 client is not configured. Check AWS environment variables.');
  }

  if (!file || !file.originalname) {
    throw new Error('Invalid file: missing required file properties.');
  }

  const { PutObjectCommand } = require('@aws-sdk/client-s3');

  const ext = path.extname(file.originalname).toLowerCase();
  const key = `markers/${crypto.randomUUID()}${ext}`;

  let body;
  if (file.buffer) {
    body = file.buffer;
  } else if (file.path) {
    body = fs.readFileSync(file.path);
  } else {
    throw new Error('Invalid file: must contain either buffer or path.');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: file.mimetype,
  });

  try {
    await s3Client.send(command);
  } catch (err) {
    throw new Error(`S3 upload failed: ${err.message}`);
  }

  return getS3Url(key);
}

/**
 * Delete an object from S3.
 * @param {string} key - The S3 object key to delete
 * @returns {Promise<void>}
 */
async function deleteFromS3(key) {
  const { s3Client, bucket } = _loadConfig();

  if (!s3Client) {
    throw new Error('S3 client is not configured. Check AWS environment variables.');
  }

  if (!key) {
    throw new Error('Invalid key: a non-empty key is required.');
  }

  const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    await s3Client.send(command);
  } catch (err) {
    throw new Error(`S3 delete failed: ${err.message}`);
  }
}

/**
 * Simple extension-to-MIME-type map for common image formats.
 */
const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

/**
 * Upload a file from a local file path to S3.
 * Reusable by scripts (e.g., migrateImagesToS3) and application code alike.
 *
 * @param {string} filePath - Absolute or relative path to a local file
 * @param {object} [options]
 * @param {string} [options.prefix='markers/'] - S3 key prefix
 * @returns {Promise<string>} The public URL of the uploaded object
 */
async function uploadFileFromPath(filePath, { prefix = 'markers/' } = {}) {
  if (!filePath) {
    throw new Error('filePath is required.');
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimetype = MIME_MAP[ext] || 'application/octet-stream';

  const { s3Client, bucket } = _loadConfig();

  if (!s3Client) {
    throw new Error('S3 client is not configured. Check AWS environment variables.');
  }

  const { PutObjectCommand } = require('@aws-sdk/client-s3');

  const key = `${prefix}${crypto.randomUUID()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  });

  try {
    await s3Client.send(command);
  } catch (err) {
    throw new Error(`S3 upload failed: ${err.message}`);
  }

  return getS3Url(key);
}

module.exports = {
  uploadToS3,
  uploadFileFromPath,
  deleteFromS3,
  getS3Url,
  _setConfig,
};
