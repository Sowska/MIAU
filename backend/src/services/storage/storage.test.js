'use strict';

const fs = require('fs');
const path = require('path');

const ImageStorage = require('./ImageStorage');
const LocalStorage = require('./LocalStorage');
const { createStorageProvider } = require('./index');

describe('ImageStorage (interface)', () => {
  it('throws when store() is called directly', async () => {
    const storage = new ImageStorage();
    await expect(storage.store({})).rejects.toThrow('store() must be implemented');
  });

  it('throws when delete() is called directly', async () => {
    const storage = new ImageStorage();
    await expect(storage.delete('key')).rejects.toThrow('delete() must be implemented');
  });

  it('throws when getUrl() is called directly', () => {
    const storage = new ImageStorage();
    expect(() => storage.getUrl('key')).toThrow('getUrl() must be implemented');
  });
});

describe('LocalStorage', () => {
  const testDir = path.join(process.cwd(), 'uploads-test');
  let localStorage;

  beforeEach(() => {
    localStorage = new LocalStorage(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('creates the upload directory if it does not exist', () => {
    const dir = path.join(process.cwd(), 'uploads-creation-test');
    new LocalStorage(dir);
    expect(fs.existsSync(dir)).toBe(true);
    fs.rmSync(dir, { recursive: true });
  });

  it('stores a file from buffer and returns a relative path', async () => {
    const file = {
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    };

    const result = await localStorage.store(file);

    expect(result).toMatch(/^uploads\/.+\.jpg$/);
    const filename = path.basename(result);
    expect(fs.existsSync(path.join(testDir, filename))).toBe(true);
  });

  it('stores a file from disk path (rename)', async () => {
    const tmpFile = path.join(testDir, 'tmp-upload');
    fs.writeFileSync(tmpFile, 'disk-data');

    const file = {
      originalname: 'mural.png',
      mimetype: 'image/png',
      path: tmpFile,
    };

    const result = await localStorage.store(file);

    expect(result).toMatch(/^uploads\/.+\.png$/);
    expect(fs.existsSync(tmpFile)).toBe(false);
  });

  it('deletes a stored file', async () => {
    const file = {
      originalname: 'art.webp',
      mimetype: 'image/webp',
      buffer: Buffer.from('webp-data'),
    };

    const key = await localStorage.store(file);
    const filename = path.basename(key);
    const fullPath = path.join(testDir, filename);

    expect(fs.existsSync(fullPath)).toBe(true);

    await localStorage.delete(key);
    // After deletion, file should be gone
    expect(fs.existsSync(fullPath)).toBe(false);
  });

  it('delete does not throw for non-existent file', async () => {
    await expect(localStorage.delete('uploads/nonexistent.jpg')).resolves.toBeUndefined();
  });

  it('getUrl returns the key as-is for local files', () => {
    const url = localStorage.getUrl('uploads/abc123.jpg');
    expect(url).toBe('uploads/abc123.jpg');
  });
});

describe('createStorageProvider', () => {
  const originalEnv = process.env.STORAGE_PROVIDER;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.STORAGE_PROVIDER;
    } else {
      process.env.STORAGE_PROVIDER = originalEnv;
    }
  });

  it('returns LocalStorage when STORAGE_PROVIDER is not set', () => {
    delete process.env.STORAGE_PROVIDER;
    const provider = createStorageProvider();
    expect(provider).toBeInstanceOf(LocalStorage);
  });

  it('returns LocalStorage when STORAGE_PROVIDER is "local"', () => {
    process.env.STORAGE_PROVIDER = 'local';
    const provider = createStorageProvider();
    expect(provider).toBeInstanceOf(LocalStorage);
  });

  it('returns S3Storage when STORAGE_PROVIDER is "s3"', () => {
    process.env.STORAGE_PROVIDER = 's3';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'test-bucket';
    const S3Storage = require('./S3Storage');
    const provider = createStorageProvider();
    expect(provider).toBeInstanceOf(S3Storage);
  });
});
