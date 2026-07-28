'use strict';

/**
 * S3 configuration module.
 *
 * Initializes and exports an S3Client and bucket name when STORAGE_PROVIDER is 's3'.
 * When the provider is not 's3', exports null — the app can still run
 * using local storage without AWS credentials.
 */

const REQUIRED_ENV_VARS = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
];

/**
 * Validate that all required AWS environment variables are present.
 * Returns an array of missing variable names (empty if all present).
 */
function getMissingVars() {
  return REQUIRED_ENV_VARS.filter((key) => !process.env[key] || !process.env[key].trim());
}

let s3Client = null;
const bucket = process.env.AWS_S3_BUCKET || null;

const storageProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

if (storageProvider === 's3') {
  const missing = getMissingVars();

  if (missing.length > 0) {
    console.error(
      `[S3 Config] STORAGE_PROVIDER is "s3" but the following required environment variables are missing or empty: ${missing.join(', ')}. ` +
      'S3 uploads will fail until these are configured.'
    );
  } else {
    const { S3Client } = require('@aws-sdk/client-s3');

    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
      },
    });
  }
}

module.exports = {
  s3Client,
  bucket,
};
