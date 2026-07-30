'use strict';

/**
 * Uploads the MIAU app icon to S3 under markers/miau-icon.png
 * Pads the image to a square canvas (white background) so it renders
 * correctly as a browser favicon without distortion.
 *
 * Usage: node backend/scripts/uploadIcon.js <path-to-icon-file>
 *
 * Requires: npm install sharp (in backend)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
process.env.STORAGE_PROVIDER = 's3';

const path = require('path');
const fs = require('fs');

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node backend/scripts/uploadIcon.js <path-to-icon.png>');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('sharp is not installed. Run: npm install sharp');
    console.error('Falling back to raw upload (no square padding)...');
    sharp = null;
  }

  let buffer;
  if (sharp) {
    // Read image metadata to determine dimensions
    const metadata = await sharp(absolutePath).metadata();
    const size = Math.max(metadata.width, metadata.height);

    // Resize into a square canvas with white background
    buffer = await sharp(absolutePath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer();

    console.log(`Padded image to ${size}x${size} square`);
  } else {
    buffer = fs.readFileSync(absolutePath);
  }

  const { s3Client, bucket } = require('../src/config/s3');
  const { PutObjectCommand } = require('@aws-sdk/client-s3');

  const key = 'markers/miau-icon.png';

  console.log(`Uploading to s3://${bucket}/${key} ...`);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
    CacheControl: 'public, max-age=31536000',
  });

  await s3Client.send(command);

  const region = process.env.AWS_REGION || 'us-east-2';
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  console.log(`\nUpload successful!`);
  console.log(`URL: ${url}`);
}

main().catch((err) => {
  console.error('Upload failed:', err.message);
  process.exit(1);
});
