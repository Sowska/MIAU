'use strict';

/**
 * S3 Connectivity Validation Script
 *
 * Uploads a temporary test file to the configured S3 bucket, prints
 * the uploaded object URL and bucket info, then removes the object.
 *
 * Usage: node backend/scripts/testS3Upload.js
 *
 * Exits with code 1 on any failure.
 */

// Load environment variables from backend/.env
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

// Force S3 storage provider so the config module initializes the client
process.env.STORAGE_PROVIDER = 's3';

const { uploadToS3, deleteFromS3 } = require('../src/services/s3Service');

async function main() {
  console.log('=== S3 Connectivity Test ===\n');

  // 1. Create a small fake file (simulates a Multer file object)
  const testContent = `MIAU S3 connectivity test — ${new Date().toISOString()}`;
  const fakeFile = {
    buffer: Buffer.from(testContent, 'utf-8'),
    originalname: 'miau-s3-test.txt',
    mimetype: 'text/plain',
  };

  // 2. Upload the test file
  console.log('Uploading test file to S3...');
  const url = await uploadToS3(fakeFile);
  console.log(`Upload successful!`);
  console.log(`  URL:    ${url}`);
  console.log(`  Bucket: ${process.env.AWS_S3_BUCKET}`);
  console.log(`  Region: ${process.env.AWS_REGION}\n`);

  // 3. Extract the object key from the URL (everything after the bucket host)
  const key = url.split('.amazonaws.com/')[1];
  if (!key) {
    throw new Error(`Could not extract object key from URL: ${url}`);
  }

  // 4. Clean up — delete the temporary object
  console.log(`Deleting test object (key: ${key})...`);
  await deleteFromS3(key);
  console.log('Cleanup complete — test object removed.\n');

  console.log('=== S3 connectivity validated successfully ===');
}

main().catch((err) => {
  console.error('\n[ERROR] S3 validation failed:\n');
  console.error(err.message || err);
  process.exit(1);
});
