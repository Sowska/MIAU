'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');
const { downloadImage } = require('./downloadImage');

const TEST_DIR = path.join(__dirname, '__test_tmp__');
const TEST_FILE = path.join(TEST_DIR, 'test-image.jpg');

describe('downloadImage', () => {
  let server;
  let serverPort;

  beforeEach(() => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (server) {
      server.close();
      server = null;
    }
    // Clean up test files
    try {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  function startServer(handler) {
    return new Promise((resolve) => {
      server = http.createServer(handler);
      server.listen(0, '127.0.0.1', () => {
        serverPort = server.address().port;
        resolve();
      });
    });
  }

  it('should download a file successfully on 200 response', async () => {
    const imageData = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]); // JPEG magic bytes

    await startServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(imageData);
    });

    const result = await downloadImage(
      `http://127.0.0.1:${serverPort}/image.jpg`,
      TEST_FILE,
      { maxRetries: 0, baseDelay: 10 }
    );

    expect(result).toEqual({ success: true });
    expect(fs.existsSync(TEST_FILE)).toBe(true);
    expect(fs.readFileSync(TEST_FILE)).toEqual(imageData);
  });

  it('should return failure on non-2xx status after exhausting retries', async () => {
    await startServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    });

    const result = await downloadImage(
      `http://127.0.0.1:${serverPort}/image.jpg`,
      TEST_FILE,
      { maxRetries: 2, baseDelay: 10 }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('HTTP 500');
  });

  it('should retry on failure with exponential backoff', async () => {
    let requestCount = 0;
    const imageData = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG magic bytes

    await startServer((req, res) => {
      requestCount++;
      if (requestCount < 3) {
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('Service Unavailable');
      } else {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(imageData);
      }
    });

    const result = await downloadImage(
      `http://127.0.0.1:${serverPort}/image.png`,
      TEST_FILE,
      { maxRetries: 3, baseDelay: 10 }
    );

    expect(result).toEqual({ success: true });
    expect(requestCount).toBe(3);
    expect(fs.readFileSync(TEST_FILE)).toEqual(imageData);
  });

  it('should make exactly maxRetries + 1 total attempts before giving up', async () => {
    let requestCount = 0;

    await startServer((req, res) => {
      requestCount++;
      res.writeHead(500);
      res.end('Error');
    });

    const result = await downloadImage(
      `http://127.0.0.1:${serverPort}/image.jpg`,
      TEST_FILE,
      { maxRetries: 3, baseDelay: 10 }
    );

    expect(result.success).toBe(false);
    expect(requestCount).toBe(4); // 1 initial + 3 retries
  });

  it('should follow redirects', async () => {
    const imageData = Buffer.from([0xFF, 0xD8, 0xFF]);
    let requestCount = 0;

    await startServer((req, res) => {
      requestCount++;
      if (req.url === '/redirect') {
        res.writeHead(302, { Location: '/final-image.jpg' });
        res.end();
      } else {
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(imageData);
      }
    });

    const result = await downloadImage(
      `http://127.0.0.1:${serverPort}/redirect`,
      TEST_FILE,
      { maxRetries: 0, baseDelay: 10 }
    );

    expect(result).toEqual({ success: true });
    expect(fs.readFileSync(TEST_FILE)).toEqual(imageData);
  });

  it('should fail on too many redirects', async () => {
    await startServer((req, res) => {
      res.writeHead(302, { Location: '/loop' });
      res.end();
    });

    const result = await downloadImage(
      `http://127.0.0.1:${serverPort}/loop`,
      TEST_FILE,
      { maxRetries: 0, baseDelay: 10, maxRedirects: 3 }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Too many redirects');
  });

  it('should handle network errors gracefully', async () => {
    // Use a port that is not listening
    const result = await downloadImage(
      'http://127.0.0.1:1/image.jpg',
      TEST_FILE,
      { maxRetries: 0, baseDelay: 10, timeout: 1000 }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should handle timeout', async () => {
    await startServer((req, res) => {
      // Never respond - let the timeout trigger
    });

    const result = await downloadImage(
      `http://127.0.0.1:${serverPort}/image.jpg`,
      TEST_FILE,
      { maxRetries: 0, baseDelay: 10, timeout: 100 }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });

  it('should clean up partial files on failure', async () => {
    await startServer((req, res) => {
      res.writeHead(500);
      res.end('Error');
    });

    await downloadImage(
      `http://127.0.0.1:${serverPort}/image.jpg`,
      TEST_FILE,
      { maxRetries: 0, baseDelay: 10 }
    );

    expect(fs.existsSync(TEST_FILE)).toBe(false);
  });
});
