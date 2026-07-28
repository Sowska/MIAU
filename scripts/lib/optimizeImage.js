'use strict';

const sharp = require('sharp');

/**
 * Optimize an image file for web usage using Sharp.
 * - Auto-rotates based on EXIF orientation
 * - Resizes to max width (no enlargement)
 * - JPEG: quality 85 with mozjpeg
 * - PNG: compression level 8, preserves alpha
 * - Other formats: output as JPEG with quality 85
 *
 * @param {string} inputPath - Path to the downloaded image
 * @param {string} outputPath - Path to write the optimized image
 * @param {object} [options]
 * @param {number} [options.maxWidth=1600] - Maximum width in pixels
 * @param {number} [options.jpegQuality=85] - JPEG compression quality
 * @returns {Promise<{width: number, height: number, format: string}>}
 */
async function optimizeImage(inputPath, outputPath, options = {}) {
  const { maxWidth = 1600, jpegQuality = 85 } = options;

  // Read input metadata to determine format
  const metadata = await sharp(inputPath).metadata();
  const inputFormat = metadata.format; // e.g. 'jpeg', 'png', 'webp'

  // Build the processing pipeline
  let pipeline = sharp(inputPath)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize({ width: maxWidth, withoutEnlargement: true });

  // Apply format-specific output settings
  if (inputFormat === 'png') {
    pipeline = pipeline.png({ compressionLevel: 8 });
  } else if (inputFormat === 'jpeg' || inputFormat === 'jpg') {
    pipeline = pipeline.jpeg({ quality: jpegQuality, mozjpeg: true });
  } else {
    // Other formats: output as JPEG
    pipeline = pipeline.jpeg({ quality: jpegQuality, mozjpeg: true });
  }

  // Write optimized image to output path
  await pipeline.toFile(outputPath);

  // Read output metadata for return value
  const outputMetadata = await sharp(outputPath).metadata();

  return {
    width: outputMetadata.width,
    height: outputMetadata.height,
    format: outputMetadata.format
  };
}

module.exports = { optimizeImage };
