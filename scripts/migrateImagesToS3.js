'use strict';

const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const fs = require('fs');
const os = require('os');

const { downloadImage } = require('./lib/downloadImage');
const { optimizeImage } = require('./lib/optimizeImage');
const { uploadToS3Migration } = require('./lib/uploadToS3Migration');
const { extractExtension, getRecordId, validateAwsEnv, safeDelete } = require('./lib/utils');

const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Reads backend/seed-markers.js as text, extracts the `const markers = [...]`
 * array using bracket matching, replaces mongoose ObjectId calls with a
 * placeholder string, then evaluates the array to return plain JS objects.
 * @returns {Array<Object>} The markers array from seed-markers.js
 */
function loadMarkersFromSeed() {
  const seedPath = path.join(PROJECT_ROOT, 'backend', 'seed-markers.js');
  const source = fs.readFileSync(seedPath, 'utf-8');

  // Find where `const markers = [` starts
  const declStart = source.indexOf('const markers = [');
  if (declStart === -1) {
    throw new Error('Could not find "const markers = [" in seed-markers.js');
  }

  // Find the opening bracket of the array
  const arrayStart = source.indexOf('[', declStart);

  // Bracket-match to find the closing bracket
  let depth = 0;
  let arrayEnd = -1;
  for (let i = arrayStart; i < source.length; i++) {
    if (source[i] === '[') depth++;
    else if (source[i] === ']') {
      depth--;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }

  if (arrayEnd === -1) {
    throw new Error('Could not find matching closing bracket for markers array');
  }

  // Extract the array literal (including brackets)
  let arraySource = source.substring(arrayStart, arrayEnd + 1);

  // Replace `new mongoose.Types.ObjectId("...")` with a placeholder string
  arraySource = arraySource.replace(
    /new\s+mongoose\.Types\.ObjectId\(\s*["']([^"']*)["']\s*\)/g,
    '"000000000000000000000000"'
  );

  // Evaluate the array in a safe-ish way (no require/imports needed)
  // eslint-disable-next-line no-eval
  const records = eval('(' + arraySource + ')');
  return records;
}

/**
 * Main orchestrator. Reads input from seed-markers.js, processes records
 * sequentially, writes output dataset and migration report.
 * @param {Object} [options] - Optional overrides for testing
 * @param {Array} [options.records] - Pre-loaded records (skips seed file reading)
 * @returns {Promise<void>}
 */
async function main(options = {}) {
  const startTime = Date.now();

  // 1. Read input dataset from seed-markers.js
  let records;
  if (options.records) {
    records = options.records;
  } else {
    try {
      records = loadMarkersFromSeed();
    } catch (err) {
      console.error(`Error: Could not load markers from seed-markers.js — ${err.message}`);
      process.exit(1);
    }
  }

  console.log(`Loaded ${records.length} records from seed-markers.js`);

  // 2. Validate AWS environment variables
  const envCheck = validateAwsEnv();
  if (!envCheck.valid) {
    console.error(`Error: Missing required AWS environment variables: ${envCheck.missing.join(', ')}`);
    process.exit(1);
  }

  // 3. Initialize stats and URL cache
  const stats = {
    totalRecords: records.length,
    recordsWithImages: 0,
    successfulDownloads: 0,
    successfulUploads: 0,
    optimizedImages: 0,
    skippedRecords: 0,
    failedDownloads: 0,
    failedUploads: 0,
    duplicatedImages: 0,
  };

  const urlCache = new Map();
  const outputRecords = [];

  // 4. Process each record sequentially
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const outputRecord = { ...record };

    // 4a. Skip records without imagePath
    if (!record.imagePath || record.imagePath.trim() === '') {
      stats.skippedRecords++;
      outputRecords.push(outputRecord);
      continue;
    }

    stats.recordsWithImages++;
    const imageUrl = record.imagePath.trim();

    // 4b. Check URL cache for deduplication
    if (urlCache.has(imageUrl)) {
      outputRecord.imagePath = urlCache.get(imageUrl);
      stats.duplicatedImages++;
      outputRecords.push(outputRecord);
      continue;
    }

    // 4c. Process new image URL
    const recordId = getRecordId(record, i);
    const extension = extractExtension(imageUrl);
    const tempDownloadPath = path.join(os.tmpdir(), `miau-migrate-${recordId}${extension}`);
    const tempOptimizedPath = path.join(os.tmpdir(), `miau-migrate-${recordId}-optimized${extension}`);

    // Download
    const downloadResult = await downloadImage(imageUrl, tempDownloadPath);
    if (!downloadResult.success) {
      console.error(`[${i}] Download failed for "${record.title || i}": ${downloadResult.error}`);
      stats.failedDownloads++;
      outputRecords.push(outputRecord);
      await safeDelete(tempDownloadPath);
      continue;
    }
    stats.successfulDownloads++;

    // Optimize
    let optimizeSuccess = false;
    try {
      await optimizeImage(tempDownloadPath, tempOptimizedPath);
      optimizeSuccess = true;
      stats.optimizedImages++;
    } catch (err) {
      console.error(`[${i}] Optimization failed for "${record.title || i}": ${err.message}`);
      stats.failedUploads++;
      outputRecords.push(outputRecord);
      await safeDelete(tempDownloadPath);
      await safeDelete(tempOptimizedPath);
      continue;
    }

    // Upload
    const uploadResult = await uploadToS3Migration(tempOptimizedPath, recordId, extension);
    if (!uploadResult.success) {
      console.error(`[${i}] Upload failed for "${record.title || i}": ${uploadResult.error}`);
      stats.failedUploads++;
      outputRecords.push(outputRecord);
      await safeDelete(tempDownloadPath);
      await safeDelete(tempOptimizedPath);
      continue;
    }
    stats.successfulUploads++;

    // Success: cache URL, replace imagePath
    urlCache.set(imageUrl, uploadResult.url);
    outputRecord.imagePath = uploadResult.url;
    outputRecords.push(outputRecord);

    // Clean up temp files
    await safeDelete(tempDownloadPath);
    await safeDelete(tempOptimizedPath);
  }

  // 5. Write output dataset
  const outputPath = path.join(PROJECT_ROOT, 'dataset-s3.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputRecords, null, 2), 'utf-8');

  // 6. Write migration report
  const executionTimeMs = Date.now() - startTime;
  const report = {
    timestamp: new Date().toISOString(),
    totalRecords: stats.totalRecords,
    recordsWithImages: stats.recordsWithImages,
    successfulDownloads: stats.successfulDownloads,
    successfulUploads: stats.successfulUploads,
    optimizedImages: stats.optimizedImages,
    skippedRecords: stats.skippedRecords,
    failedDownloads: stats.failedDownloads,
    failedUploads: stats.failedUploads,
    duplicatedImages: stats.duplicatedImages,
    executionTimeMs,
  };

  const reportPath = path.join(__dirname, 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  // 7. Print summary
  console.log('\n=== Migration Summary ===');
  console.log(`Total records:        ${stats.totalRecords}`);
  console.log(`Records with images:  ${stats.recordsWithImages}`);
  console.log(`Successful downloads: ${stats.successfulDownloads}`);
  console.log(`Successful uploads:   ${stats.successfulUploads}`);
  console.log(`Optimized images:     ${stats.optimizedImages}`);
  console.log(`Skipped (no image):   ${stats.skippedRecords}`);
  console.log(`Failed downloads:     ${stats.failedDownloads}`);
  console.log(`Failed uploads:       ${stats.failedUploads}`);
  console.log(`Duplicated (cached):  ${stats.duplicatedImages}`);
  console.log(`Execution time:       ${executionTimeMs}ms`);
  console.log('========================\n');
}

// Only run main automatically when executed directly (not when required)
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main, loadMarkersFromSeed };
