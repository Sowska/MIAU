'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ImageStorage = require('./ImageStorage');

/**
 * LocalStorage — Stores images on the local filesystem in backend/uploads/.
 * Files are saved with a UUID-based filename to avoid collisions.
 */
class LocalStorage extends ImageStorage {
  constructor(uploadDir) {
    super();
    this.uploadDir = uploadDir || path.join(process.cwd(), 'uploads');

    // Ensure the upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Store a file to the local uploads directory.
   * @param {object} file - Multer file object (with buffer, originalname, mimetype)
   * @returns {Promise<string>} Relative path e.g. "uploads/abc123.jpg"
   */
  async store(file) {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${crypto.randomUUID()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    // If multer already wrote the file to disk (diskStorage), the file.path exists.
    // If using memoryStorage, we write from the buffer.
    if (file.path) {
      // File already on disk from multer diskStorage — rename to our target
      fs.renameSync(file.path, filepath);
    } else if (file.buffer) {
      fs.writeFileSync(filepath, file.buffer);
    }

    return `uploads/${filename}`;
  }

  /**
   * Delete a file from the local filesystem.
   * @param {string} key - Relative path e.g. "uploads/abc123.jpg"
   * @returns {Promise<void>}
   */
  async delete(key) {
    const filename = path.basename(key);
    const filepath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  /**
   * Get the relative URL for a locally stored file.
   * Express serves uploads/ as static, so the key itself is the path.
   * @param {string} key - Relative path e.g. "uploads/abc123.jpg"
   * @returns {string}
   */
  getUrl(key) {
    return key;
  }
}

module.exports = LocalStorage;
