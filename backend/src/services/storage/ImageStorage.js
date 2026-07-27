'use strict';

/**
 * ImageStorage — Abstract interface for image storage providers.
 *
 * All storage providers must extend this class and implement:
 * - store(file)   → returns the stored file path/key
 * - delete(key)   → removes the file
 * - getUrl(key)   → returns the public URL for the file
 */
class ImageStorage {
  /**
   * Store a file.
   * @param {object} file - Multer file object
   * @returns {Promise<string>} The relative path or key of the stored file
   */
  async store(file) {
    throw new Error('store() must be implemented by subclass');
  }

  /**
   * Delete a previously stored file.
   * @param {string} key - The file path or key returned by store()
   * @returns {Promise<void>}
   */
  async delete(key) {
    throw new Error('delete() must be implemented by subclass');
  }

  /**
   * Get the public URL for a stored file.
   * @param {string} key - The file path or key returned by store()
   * @returns {string} The URL to access the file
   */
  getUrl(key) {
    throw new Error('getUrl() must be implemented by subclass');
  }
}

module.exports = ImageStorage;
