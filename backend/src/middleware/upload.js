'use strict';

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Multer disk storage configuration.
 * Files are saved in backend/uploads/ with a UUID-based filename.
 */
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename(_req, _file, cb) {
    const ext = path.extname(_file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

/**
 * File filter — only allow image MIME types.
 */
function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, png, webp, gif) are allowed'), false);
  }
}

/**
 * Configured multer instance for single-file image uploads.
 */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = upload;
