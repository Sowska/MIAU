'use strict';

const upload = require('./upload');

describe('upload middleware', () => {
  it('exports a multer instance with single() method', () => {
    expect(upload).toBeDefined();
    expect(typeof upload.single).toBe('function');
  });

  it('has a 5 MB file size limit', () => {
    expect(upload.limits).toBeDefined();
    expect(upload.limits.fileSize).toBe(5 * 1024 * 1024);
  });

  it('fileFilter accepts image/jpeg', () => {
    return new Promise((resolve) => {
      const file = { mimetype: 'image/jpeg' };
      upload.fileFilter(null, file, (err, accepted) => {
        expect(err).toBeNull();
        expect(accepted).toBe(true);
        resolve();
      });
    });
  });

  it('fileFilter accepts image/png', () => {
    return new Promise((resolve) => {
      const file = { mimetype: 'image/png' };
      upload.fileFilter(null, file, (err, accepted) => {
        expect(err).toBeNull();
        expect(accepted).toBe(true);
        resolve();
      });
    });
  });

  it('fileFilter accepts image/webp', () => {
    return new Promise((resolve) => {
      const file = { mimetype: 'image/webp' };
      upload.fileFilter(null, file, (err, accepted) => {
        expect(err).toBeNull();
        expect(accepted).toBe(true);
        resolve();
      });
    });
  });

  it('fileFilter accepts image/gif', () => {
    return new Promise((resolve) => {
      const file = { mimetype: 'image/gif' };
      upload.fileFilter(null, file, (err, accepted) => {
        expect(err).toBeNull();
        expect(accepted).toBe(true);
        resolve();
      });
    });
  });

  it('fileFilter rejects non-image MIME types', () => {
    return new Promise((resolve) => {
      const file = { mimetype: 'application/pdf' };
      upload.fileFilter(null, file, (err, accepted) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toMatch(/only image files/i);
        expect(accepted).toBe(false);
        resolve();
      });
    });
  });

  it('fileFilter rejects text/plain', () => {
    return new Promise((resolve) => {
      const file = { mimetype: 'text/plain' };
      upload.fileFilter(null, file, (err, accepted) => {
        expect(err).toBeInstanceOf(Error);
        expect(accepted).toBe(false);
        resolve();
      });
    });
  });
});
