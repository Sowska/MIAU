'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Download an image from a URL to a local file path.
 * Handles HTTP and HTTPS protocols, follows redirects (up to 5),
 * and retries on failure with exponential backoff.
 *
 * @param {string} url - The image URL to download
 * @param {string} destPath - Local file path to save the downloaded image
 * @param {object} [options]
 * @param {number} [options.maxRetries=3] - Maximum retry attempts
 * @param {number} [options.baseDelay=1000] - Base delay in ms for exponential backoff
 * @param {number} [options.timeout=30000] - Request timeout in ms
 * @param {number} [options.maxRedirects=5] - Maximum number of redirects to follow
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function downloadImage(url, destPath, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    timeout = 30000,
    maxRedirects = 5
  } = options;

  let lastError = '';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await performDownload(url, destPath, { timeout, maxRedirects });
      return { success: true };
    } catch (err) {
      lastError = err.message || String(err);

      // Clean up any partial file on failure
      try {
        fs.unlinkSync(destPath);
      } catch {
        // Ignore cleanup errors
      }

      // If we haven't exhausted retries, wait with exponential backoff
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  return { success: false, error: lastError };
}

/**
 * Perform a single download attempt.
 * @param {string} url - URL to download
 * @param {string} destPath - Destination file path
 * @param {object} options - Download options
 * @param {number} options.timeout - Request timeout in ms
 * @param {number} options.maxRedirects - Max redirects to follow
 * @returns {Promise<void>}
 */
function performDownload(url, destPath, options) {
  return new Promise((resolve, reject) => {
    const { timeout, maxRedirects } = options;
    let redirectCount = 0;

    function makeRequest(requestUrl) {
      const parsedUrl = new URL(requestUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.get(requestUrl, { timeout }, (res) => {
        const statusCode = res.statusCode;

        // Handle redirects
        if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
          redirectCount++;
          if (redirectCount > maxRedirects) {
            res.resume();
            reject(new Error(`Too many redirects (max ${maxRedirects})`));
            return;
          }
          res.resume();
          const redirectUrl = new URL(res.headers.location, requestUrl).href;
          makeRequest(redirectUrl);
          return;
        }

        // Check for non-2xx status codes
        if (statusCode < 200 || statusCode >= 300) {
          res.resume();
          reject(new Error(`HTTP ${statusCode}: Failed to download`));
          return;
        }

        // Ensure destination directory exists
        const dir = path.dirname(destPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Stream response to file
        const fileStream = fs.createWriteStream(destPath);

        fileStream.on('error', (err) => {
          res.destroy();
          reject(new Error(`File write error: ${err.message}`));
        });

        fileStream.on('finish', () => {
          resolve();
        });

        res.pipe(fileStream);
      });

      req.on('error', (err) => {
        reject(new Error(`Network error: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timed out after ${timeout}ms`));
      });
    }

    makeRequest(url);
  });
}

module.exports = { downloadImage };
