'use strict';

const { uploadToS3, uploadFileFromPath, deleteFromS3, getS3Url, _setConfig } = require('./s3Service');
const fs = require('fs');
const path = require('path');

const mockSend = vi.fn().mockResolvedValue({});

process.env.AWS_REGION = 'us-east-1';

describe('s3Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({});
    _setConfig({
      s3Client: { send: mockSend },
      bucket: 'test-bucket',
    });
  });

  describe('getS3Url', () => {
    it('constructs the correct public URL for a given key', () => {
      const url = getS3Url('markers/abc.png');
      expect(url).toBe('https://test-bucket.s3.us-east-1.amazonaws.com/markers/abc.png');
    });
  });

  describe('uploadToS3', () => {
    it('uploads a file with buffer and returns a URL with markers/ prefix', async () => {
      const file = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake image data'),
      };

      const url = await uploadToS3(file);

      expect(url).toMatch(/^https:\/\/test-bucket\.s3\.us-east-1\.amazonaws\.com\/markers\/.+\.jpg$/);
      expect(mockSend).toHaveBeenCalledTimes(1);

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Bucket).toBe('test-bucket');
      expect(command.input.Key).toMatch(/^markers\/.+\.jpg$/);
      expect(command.input.Body).toEqual(file.buffer);
      expect(command.input.ContentType).toBe('image/jpeg');
    });

    it('lowercases the file extension', async () => {
      const file = {
        originalname: 'mural.PNG',
        mimetype: 'image/png',
        buffer: Buffer.from('data'),
      };

      const url = await uploadToS3(file);

      expect(url).toMatch(/\.png$/);
    });

    it('throws when s3Client is not configured', async () => {
      _setConfig({ s3Client: null, bucket: null });

      const file = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('data'),
      };

      await expect(uploadToS3(file)).rejects.toThrow(
        'S3 client is not configured. Check AWS environment variables.'
      );
    });

    it('throws when file is null', async () => {
      await expect(uploadToS3(null)).rejects.toThrow('Invalid file');
    });

    it('throws when file has no originalname', async () => {
      await expect(uploadToS3({ buffer: Buffer.from('x') })).rejects.toThrow(
        'Invalid file: missing required file properties.'
      );
    });

    it('throws when file has neither buffer nor path', async () => {
      const file = { originalname: 'test.jpg', mimetype: 'image/jpeg' };
      await expect(uploadToS3(file)).rejects.toThrow(
        'Invalid file: must contain either buffer or path.'
      );
    });

    it('wraps S3 errors with a meaningful message', async () => {
      mockSend.mockRejectedValueOnce(new Error('Access Denied'));

      const file = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('data'),
      };

      await expect(uploadToS3(file)).rejects.toThrow('S3 upload failed: Access Denied');
    });
  });

  describe('deleteFromS3', () => {
    it('sends a DeleteObjectCommand with the correct key', async () => {
      await deleteFromS3('markers/some-key.jpg');

      expect(mockSend).toHaveBeenCalledTimes(1);

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Bucket).toBe('test-bucket');
      expect(command.input.Key).toBe('markers/some-key.jpg');
    });

    it('throws when key is empty', async () => {
      await expect(deleteFromS3('')).rejects.toThrow('Invalid key');
    });

    it('throws when s3Client is not configured', async () => {
      _setConfig({ s3Client: null, bucket: null });
      await expect(deleteFromS3('markers/key.jpg')).rejects.toThrow(
        'S3 client is not configured.'
      );
    });

    it('wraps S3 errors with a meaningful message', async () => {
      mockSend.mockRejectedValueOnce(new Error('NoSuchKey'));

      await expect(deleteFromS3('markers/bad.jpg')).rejects.toThrow(
        'S3 delete failed: NoSuchKey'
      );
    });
  });

  describe('uploadFileFromPath', () => {
    let readFileSyncSpy;

    beforeEach(() => {
      readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('file content'));
    });

    afterEach(() => {
      readFileSyncSpy.mockRestore();
    });

    it('reads the file from disk and uploads to S3 with correct MIME type', async () => {
      const filePath = '/images/mural.png';

      const url = await uploadFileFromPath(filePath);

      expect(readFileSyncSpy).toHaveBeenCalledWith(filePath);
      expect(url).toMatch(/^https:\/\/test-bucket\.s3\.us-east-1\.amazonaws\.com\/markers\/.+\.png$/);
      expect(mockSend).toHaveBeenCalledTimes(1);

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Bucket).toBe('test-bucket');
      expect(command.input.Key).toMatch(/^markers\/.+\.png$/);
      expect(command.input.Body).toEqual(Buffer.from('file content'));
      expect(command.input.ContentType).toBe('image/png');
    });

    it('uses the provided prefix option', async () => {
      const url = await uploadFileFromPath('/images/art.jpg', { prefix: 'migrated/' });

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Key).toMatch(/^migrated\/.+\.jpg$/);
      expect(url).toMatch(/migrated\//);
    });

    it('defaults to markers/ prefix when no options provided', async () => {
      await uploadFileFromPath('/images/art.jpeg');

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Key).toMatch(/^markers\/.+\.jpeg$/);
    });

    it('maps .jpg to image/jpeg', async () => {
      await uploadFileFromPath('/images/photo.jpg');
      const command = mockSend.mock.calls[0][0];
      expect(command.input.ContentType).toBe('image/jpeg');
    });

    it('maps .webp to image/webp', async () => {
      await uploadFileFromPath('/images/photo.webp');
      const command = mockSend.mock.calls[0][0];
      expect(command.input.ContentType).toBe('image/webp');
    });

    it('maps .gif to image/gif', async () => {
      await uploadFileFromPath('/images/anim.gif');
      const command = mockSend.mock.calls[0][0];
      expect(command.input.ContentType).toBe('image/gif');
    });

    it('falls back to application/octet-stream for unknown extensions', async () => {
      await uploadFileFromPath('/files/data.bmp');
      const command = mockSend.mock.calls[0][0];
      expect(command.input.ContentType).toBe('application/octet-stream');
    });

    it('throws when filePath is not provided', async () => {
      await expect(uploadFileFromPath('')).rejects.toThrow('filePath is required.');
      await expect(uploadFileFromPath(null)).rejects.toThrow('filePath is required.');
    });

    it('throws when s3Client is not configured', async () => {
      _setConfig({ s3Client: null, bucket: null });
      await expect(uploadFileFromPath('/images/test.png')).rejects.toThrow(
        'S3 client is not configured.'
      );
    });

    it('wraps S3 errors with a meaningful message', async () => {
      mockSend.mockRejectedValueOnce(new Error('Network timeout'));
      await expect(uploadFileFromPath('/images/test.png')).rejects.toThrow(
        'S3 upload failed: Network timeout'
      );
    });
  });
});
