'use strict';

const path = require('path');
const os = require('os');
const fsp = require('fs/promises');

// vi.mock must be hoisted — define mockSend inside the factory
vi.mock('@aws-sdk/client-s3', () => {
  const mockSend = vi.fn().mockResolvedValue({});
  return {
    S3Client: vi.fn(() => ({ send: mockSend })),
    PutObjectCommand: vi.fn((params) => params),
    _mockSend: mockSend,
  };
});

const { S3Client, PutObjectCommand, _mockSend } = require('@aws-sdk/client-s3');
const { buildS3Key, buildS3Url, uploadToS3Migration } = require('./uploadToS3Migration');

describe('buildS3Key', () => {
  it('strips leading dot from extension and returns correct key', () => {
    expect(buildS3Key('mural-del-sol', '.jpg')).toBe('markers/marker-mural-del-sol.jpg');
  });

  it('handles extension without leading dot', () => {
    expect(buildS3Key('graffiti-wall', 'png')).toBe('markers/marker-graffiti-wall.png');
  });

  it('handles numeric record IDs', () => {
    expect(buildS3Key('42', '.webp')).toBe('markers/marker-42.webp');
  });

  it('handles complex record IDs with hyphens', () => {
    expect(buildS3Key('arte-urbano-centro-1', '.jpeg')).toBe('markers/marker-arte-urbano-centro-1.jpeg');
  });
});

describe('buildS3Url', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.AWS_S3_BUCKET = 'miau-images';
    process.env.AWS_REGION = 'eu-west-1';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('constructs correct public URL from env vars and key', () => {
    const url = buildS3Url('markers/marker-test-id.jpg');
    expect(url).toBe('https://miau-images.s3.eu-west-1.amazonaws.com/markers/marker-test-id.jpg');
  });

  it('works with different bucket and region', () => {
    process.env.AWS_S3_BUCKET = 'other-bucket';
    process.env.AWS_REGION = 'us-east-1';
    const url = buildS3Url('markers/marker-123.png');
    expect(url).toBe('https://other-bucket.s3.us-east-1.amazonaws.com/markers/marker-123.png');
  });
});

describe('uploadToS3Migration', () => {
  const originalEnv = process.env;
  let tempDir;
  let tempFile;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
    process.env.AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
    process.env.AWS_S3_BUCKET = 'test-bucket';

    tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'upload-test-'));
    tempFile = path.join(tempDir, 'test-image.jpg');
    await fsp.writeFile(tempFile, Buffer.from('fake image content'));

    _mockSend.mockClear();
    _mockSend.mockResolvedValue({});
    S3Client.mockClear();
    PutObjectCommand.mockClear();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fsp.rm(tempDir, { recursive: true, force: true });
  });

  it('returns success with URL on successful upload', async () => {
    const result = await uploadToS3Migration(tempFile, 'my-mural', '.jpg');

    expect(result.success).toBe(true);
    expect(result.url).toBe('https://test-bucket.s3.us-east-1.amazonaws.com/markers/marker-my-mural.jpg');
  });

  it('creates S3Client with correct config from env vars', async () => {
    await uploadToS3Migration(tempFile, 'test', '.png');

    expect(S3Client).toHaveBeenCalledWith({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      },
    });
  });

  it('sends PutObjectCommand with correct parameters', async () => {
    await uploadToS3Migration(tempFile, 'mural-test', '.png');

    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'markers/marker-mural-test.png',
      Body: expect.any(Buffer),
      ContentType: 'image/png',
    });
  });

  it('calls send on the S3 client', async () => {
    await uploadToS3Migration(tempFile, 'send-test', '.jpg');

    expect(_mockSend).toHaveBeenCalledTimes(1);
  });

  it('returns error on S3 failure', async () => {
    _mockSend.mockRejectedValueOnce(new Error('Access Denied'));

    const result = await uploadToS3Migration(tempFile, 'fail-test', '.jpg');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Access Denied');
    expect(result.url).toBeUndefined();
  });

  it('returns error when file does not exist', async () => {
    const result = await uploadToS3Migration('/nonexistent/path.jpg', 'no-file', '.jpg');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('sets correct content type for jpeg extension', async () => {
    await uploadToS3Migration(tempFile, 'ct-test', '.jpeg');

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ ContentType: 'image/jpeg' })
    );
  });

  it('sets correct content type for webp extension', async () => {
    await uploadToS3Migration(tempFile, 'webp-test', '.webp');

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ ContentType: 'image/webp' })
    );
  });

  it('falls back to application/octet-stream for unknown extensions', async () => {
    await uploadToS3Migration(tempFile, 'unknown-test', '.xyz');

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ ContentType: 'application/octet-stream' })
    );
  });
});
