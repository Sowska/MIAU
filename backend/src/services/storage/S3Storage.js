'use strict';

const path = require('path');
const crypto = require('crypto');
const ImageStorage = require('./ImageStorage');

/**
 * S3Storage — Stores images in Amazon S3.
 *
 * Required environment variables:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * - AWS_S3_BUCKET
 */
class S3Storage extends ImageStorage {
  constructor() {
    super();
    this.bucket = process.env.AWS_S3_BUCKET;
    this.region = process.env.AWS_REGION;
    this._client = null;
  }

  /**
   * Lazily initialize the S3 client so the app doesn't crash
   * when AWS credentials are not configured.
   */
  _getClient() {
    if (!this._client) {
      // eslint-disable-next-line global-require
      const { S3Client } = require('@aws-sdk/client-s3');
      this._client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    }
    return this._client;
  }

  /**
   * Upload a file to S3.
   * @param {object} file - Multer file object (with buffer or path, originalname, mimetype)
   * @returns {Promise<string>} The S3 object key
   */
  async store(file) {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const fs = require('fs');

    const ext = path.extname(file.originalname).toLowerCase();
    const key = `uploads/${crypto.randomUUID()}${ext}`;

    let body;
    if (file.buffer) {
      body = file.buffer;
    } else if (file.path) {
      body = fs.readFileSync(file.path);
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: file.mimetype,
    });

    await this._getClient().send(command);
    return key;
  }

  /**
   * Delete a file from S3.
   * @param {string} key - The S3 object key
   * @returns {Promise<void>}
   */
  async delete(key) {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this._getClient().send(command);
  }

  /**
   * Get the public URL for an S3 object.
   * @param {string} key - The S3 object key
   * @returns {string}
   */
  getUrl(key) {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

module.exports = S3Storage;
