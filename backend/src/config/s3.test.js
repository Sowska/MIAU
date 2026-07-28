'use strict';

describe('s3 config module', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('initializes s3Client when STORAGE_PROVIDER=s3 and all env vars are present', async () => {
    vi.stubEnv('STORAGE_PROVIDER', 's3');
    vi.stubEnv('AWS_REGION', 'us-east-1');
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'AKIAIOSFODNN7EXAMPLE');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
    vi.stubEnv('AWS_S3_BUCKET', 'my-test-bucket');

    const { s3Client, bucket } = await import('./s3.js');

    expect(s3Client).not.toBeNull();
    expect(s3Client).toBeDefined();
    expect(bucket).toBe('my-test-bucket');
  });

  it('sets s3Client to null and logs error when STORAGE_PROVIDER=s3 but env vars are missing', async () => {
    vi.stubEnv('STORAGE_PROVIDER', 's3');
    vi.stubEnv('AWS_REGION', 'us-east-1');
    vi.stubEnv('AWS_ACCESS_KEY_ID', '');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', '');
    vi.stubEnv('AWS_S3_BUCKET', '');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { s3Client } = await import('./s3.js');

    expect(s3Client).toBeNull();
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain('AWS_ACCESS_KEY_ID');
    expect(consoleSpy.mock.calls[0][0]).toContain('AWS_SECRET_ACCESS_KEY');
    expect(consoleSpy.mock.calls[0][0]).toContain('AWS_S3_BUCKET');

    consoleSpy.mockRestore();
  });

  it('sets s3Client to null without logging error when STORAGE_PROVIDER=local', async () => {
    vi.stubEnv('STORAGE_PROVIDER', 'local');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { s3Client } = await import('./s3.js');

    expect(s3Client).toBeNull();
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('defaults to local (s3Client null, no error) when STORAGE_PROVIDER is not set', async () => {
    vi.stubEnv('STORAGE_PROVIDER', '');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { s3Client } = await import('./s3.js');

    expect(s3Client).toBeNull();
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
