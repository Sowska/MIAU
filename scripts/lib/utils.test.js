'use strict';

const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { extractExtension, getRecordId, validateAwsEnv, safeDelete } = require('./utils');

describe('extractExtension', () => {
  it('extracts .jpg from a JPEG URL', () => {
    expect(extractExtension('https://example.com/images/photo.jpg')).toBe('.jpg');
  });

  it('extracts .png from a PNG URL', () => {
    expect(extractExtension('https://example.com/images/art.png')).toBe('.png');
  });

  it('extracts extension ignoring query strings', () => {
    expect(extractExtension('https://example.com/photo.png?w=800&h=600')).toBe('.png');
  });

  it('extracts extension with uppercase normalized to lowercase', () => {
    expect(extractExtension('https://example.com/photo.JPG')).toBe('.jpg');
  });

  it('defaults to .jpg when no extension is present', () => {
    expect(extractExtension('https://example.com/images/photo')).toBe('.jpg');
  });

  it('defaults to .jpg for invalid URLs', () => {
    expect(extractExtension('not-a-url')).toBe('.jpg');
  });

  it('defaults to .jpg for empty string', () => {
    expect(extractExtension('')).toBe('.jpg');
  });

  it('extracts .webp extension', () => {
    expect(extractExtension('https://cdn.example.com/art/mural.webp')).toBe('.webp');
  });
});

describe('getRecordId', () => {
  it('generates slug from record title', () => {
    expect(getRecordId({ title: 'Mural del Sol' }, 0)).toBe('mural-del-sol');
  });

  it('falls back to index when title is missing', () => {
    expect(getRecordId({}, 5)).toBe('5');
  });

  it('falls back to index when title is null', () => {
    expect(getRecordId({ title: null }, 3)).toBe('3');
  });

  it('falls back to index when title is empty string', () => {
    expect(getRecordId({ title: '' }, 7)).toBe('7');
  });

  it('falls back to index when title is only whitespace', () => {
    expect(getRecordId({ title: '   ' }, 2)).toBe('2');
  });

  it('handles special characters in title', () => {
    expect(getRecordId({ title: '¡Arte Urbano! @Centro #1' }, 0)).toBe('arte-urbano-centro-1');
  });

  it('is stable across multiple calls', () => {
    const record = { title: 'Graffiti Wall' };
    const first = getRecordId(record, 0);
    const second = getRecordId(record, 0);
    expect(first).toBe(second);
  });

  it('falls back to index when record is null', () => {
    expect(getRecordId(null, 4)).toBe('4');
  });
});

describe('validateAwsEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns valid when all env vars are set', () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
    process.env.AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
    process.env.AWS_S3_BUCKET = 'my-bucket';

    const result = validateAwsEnv();
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('returns invalid with missing vars listed', () => {
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_S3_BUCKET;

    const result = validateAwsEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('AWS_REGION');
    expect(result.missing).toContain('AWS_ACCESS_KEY_ID');
    expect(result.missing).toContain('AWS_SECRET_ACCESS_KEY');
    expect(result.missing).toContain('AWS_S3_BUCKET');
  });

  it('treats empty string as missing', () => {
    process.env.AWS_REGION = '';
    process.env.AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
    process.env.AWS_SECRET_ACCESS_KEY = 'secret';
    process.env.AWS_S3_BUCKET = 'bucket';

    const result = validateAwsEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(['AWS_REGION']);
  });

  it('treats whitespace-only as missing', () => {
    process.env.AWS_REGION = '   ';
    process.env.AWS_ACCESS_KEY_ID = 'key';
    process.env.AWS_SECRET_ACCESS_KEY = 'secret';
    process.env.AWS_S3_BUCKET = 'bucket';

    const result = validateAwsEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(['AWS_REGION']);
  });
});

describe('safeDelete', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'utils-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('deletes an existing file', async () => {
    const filePath = path.join(tempDir, 'test-file.txt');
    await fs.writeFile(filePath, 'content');

    await safeDelete(filePath);

    await expect(fs.access(filePath)).rejects.toThrow();
  });

  it('does not throw for non-existent file', async () => {
    const filePath = path.join(tempDir, 'does-not-exist.txt');
    await expect(safeDelete(filePath)).resolves.toBeUndefined();
  });

  it('rethrows non-ENOENT errors', async () => {
    // Attempt to delete a directory (which fails with EPERM/EISDIR, not ENOENT)
    const dirPath = path.join(tempDir, 'subdir');
    await fs.mkdir(dirPath);

    await expect(safeDelete(dirPath)).rejects.toThrow();
  });
});
