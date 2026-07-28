'use strict';

const fs = require('fs');

/**
 * Build the S3 key for a given record.
 * @param {string} recordId - Unique record identifier
 * @param {string} extension - File extension (e.g., '.jpg', '.png')
 * @returns {string} S3 key in format `markers/marker-<recordId>.<ext>`
 */
function buildS3Key(recordId, extension) {
  const ext = extension.startsWith('.') ? extension.slice(1) : extension;
  return `markers/marker-${recordId}.${ext}`;
}

/**
 * Build the public S3 URL from a key.
 * @param {string} key - S3 object key
 * @returns {string} Public URL
 */
function buildS3Url(key) {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Map file extension to MIME content type.
 * @param {string} extension - File extension (e.g., '.jpg', '.png')
 * @returns {string} MIME type
 */
function getContentType(extension) {
  const ext = extension.startsWith('.') ? extension.slice(1).toLowerCase() : extension.toLowerCase();
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Create an S3 client configured from environment variables.
 * @returns {object} S3Client instance
 */
function createS3Client() {
  const { S3Client } = require('@aws-sdk/client-s3');
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
    },
  });
}

/**
 * Upload a file to S3 with a deterministic key.
 * @param {string} filePath - Local path to the optimized image
 * @param {string} recordId - Unique identifier for the artwork record
 * @param {string} extension - File extension (e.g., '.jpg', '.png')
 * @param {object} [options] - Optional overrides for testing
 * @param {object} [options.s3Client] - Pre-configured S3 client (skips client creation)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
async function uploadToS3Migration(filePath, recordId, extension, options = {}) {
  try {
    const s3Client = options.s3Client || createS3Client();

    const fileBody = fs.readFileSync(filePath);
    const key = buildS3Key(recordId, extension);
    const contentType = getContentType(extension);

    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileBody,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const url = buildS3Url(key);
    return { success: true, url };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { buildS3Key, buildS3Url, uploadToS3Migration, getContentType };
