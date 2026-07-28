'use strict';

const path = require('path');
const os = require('os');
const fsp = require('fs/promises');
const { buildS3Key, buildS3Url, uploadToS3Migration, getContentType } = require('./uploadToS3Migration');

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

describe('getContentType', () => {
  it('returns image/jpeg for .jpg', () => {
    expect(getContentType('.jpg')).toBe('image/jpeg');
  });

  it('returns image/jpeg for .jpeg', () => {
    expect(getContentType('.jpeg')).toBe('image/jpeg');
  });

  it('returns image/png for .png', () => {
    expect(getContentType('.png')).toBe('image/png');
  });

  it('returns image/webp for .webp', () => {
    expect(getContentType('.webp')).toBe('image/webp');
  });

  it('returns image/gif for .gif', () => {
    expect(getContentType('.gif')).toBe('image/gif');
  });

  it('returns application/octet-stream for unknown extension', () => {
    expect(getContentType('.xyz')).toBe('application/octet-stream');
  });

  it('handles extensions without leading dot', () => {
    expect(getContentType('png')).toBe('image/png');
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
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fsp.rm(tempDir, { recursive: true, force: true });
  });

  function createMockS3Client(sendResult = {}) {
    const sendFn = vi.fn().mockResolvedValue(sendResult);
    return { send: sendFn };
  }

  it('returns success with URL on successful upload', async () => {
    const mockClient = createMockS3Client();
    const result = await uploadToS3Migration(tempFile, 'my-mural', '.jpg', { s3Client: mockClient });

    expect(result.success).toBe(true);
    expect(result.url).toBe('https://test-bucket.s3.us-east-1.amazonaws.com/markers/marker-my-mural.jpg');
  });

  it('calls send on the S3 client with correct command params', async () => {
    const mockClient = createMockS3Client();
    await uploadToS3Migration(tempFile, 'mural-test', '.png', { s3Client: mockClient });

    expect(mockClient.send).toHaveBeenCalledTimes(1);
    const command = mockClient.send.mock.calls[0][0];
    expect(command.input.Bucket).toBe('test-bucket');
    expect(command.input.Key).toBe('markers/marker-mural-test.png');
    expect(command.input.ContentType).toBe('image/png');
    expect(command.input.Body).toBeInstanceOf(Buffer);
  });

  it('returns error on S3 failure', async () => {
    const mockClient = { send: vi.fn().mockRejectedValue(new Error('Access Denied')) };
    const result = await uploadToS3Migration(tempFile, 'fail-test', '.jpg', { s3Client: mockClient });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Access Denied');
    expect(result.url).toBeUndefined();
  });

  it('returns error when file does not exist', async () => {
    const mockClient = createMockS3Client();
    const result = await uploadToS3Migration('/nonexistent/path.jpg', 'no-file', '.jpg', { s3Client: mockClient });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('sets correct content type for jpeg extension', async () => {
    const mockClient = createMockS3Client();
    await uploadToS3Migration(tempFile, 'ct-test', '.jpeg', { s3Client: mockClient });

    const command = mockClient.send.mock.calls[0][0];
    expect(command.input.ContentType).toBe('image/jpeg');
  });

  it('sets correct content type for webp extension', async () => {
    const mockClient = createMockS3Client();
    await uploadToS3Migration(tempFile, 'webp-test', '.webp', { s3Client: mockClient });

    const command = mockClient.send.mock.calls[0][0];
    expect(command.input.ContentType).toBe('image/webp');
  });

  it('falls back to application/octet-stream for unknown extensions', async () => {
    const mockClient = createMockS3Client();
    await uploadToS3Migration(tempFile, 'unknown-test', '.xyz', { s3Client: mockClient });

    const command = mockClient.send.mock.calls[0][0];
    expect(command.input.ContentType).toBe('application/octet-stream');
  });

  it('reads the file content as Buffer', async () => {
    const mockClient = createMockS3Client();
    await uploadToS3Migration(tempFile, 'buffer-test', '.jpg', { s3Client: mockClient });

    const command = mockClient.send.mock.calls[0][0];
    expect(command.input.Body.toString()).toBe('fake image content');
  });
});
