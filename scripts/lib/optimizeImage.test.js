'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const sharp = require('sharp');
const { optimizeImage } = require('./optimizeImage');

// Helper to create a temporary directory for test fixtures
let tmpDir;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optimizeImage-test-'));
});

afterAll(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors on Windows (EBUSY from sharp file handles)
  }
});

describe('optimizeImage', () => {
  describe('JPEG images', () => {
    it('should output a JPEG with correct dimensions when input is smaller than maxWidth', async () => {
      const inputPath = path.join(tmpDir, 'small.jpg');
      const outputPath = path.join(tmpDir, 'small-opt.jpg');

      // Create a 800x600 JPEG test image
      await sharp({
        create: { width: 800, height: 600, channels: 3, background: { r: 255, g: 0, b: 0 } }
      }).jpeg().toFile(inputPath);

      const result = await optimizeImage(inputPath, outputPath);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.format).toBe('jpeg');
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should resize a JPEG wider than 1600px to 1600px preserving aspect ratio', async () => {
      const inputPath = path.join(tmpDir, 'wide.jpg');
      const outputPath = path.join(tmpDir, 'wide-opt.jpg');

      // Create a 3200x2400 JPEG test image
      await sharp({
        create: { width: 3200, height: 2400, channels: 3, background: { r: 0, g: 255, b: 0 } }
      }).jpeg().toFile(inputPath);

      const result = await optimizeImage(inputPath, outputPath);

      expect(result.width).toBe(1600);
      expect(result.height).toBe(1200); // 2400 * (1600/3200) = 1200
      expect(result.format).toBe('jpeg');
    });

    it('should respect a custom maxWidth option', async () => {
      const inputPath = path.join(tmpDir, 'custom.jpg');
      const outputPath = path.join(tmpDir, 'custom-opt.jpg');

      await sharp({
        create: { width: 2000, height: 1000, channels: 3, background: { r: 0, g: 0, b: 255 } }
      }).jpeg().toFile(inputPath);

      const result = await optimizeImage(inputPath, outputPath, { maxWidth: 1000 });

      expect(result.width).toBe(1000);
      expect(result.height).toBe(500);
      expect(result.format).toBe('jpeg');
    });
  });

  describe('PNG images', () => {
    it('should output a PNG preserving alpha channel', async () => {
      const inputPath = path.join(tmpDir, 'alpha.png');
      const outputPath = path.join(tmpDir, 'alpha-opt.png');

      // Create a 400x400 PNG with alpha channel
      await sharp({
        create: { width: 400, height: 400, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.5 } }
      }).png().toFile(inputPath);

      const result = await optimizeImage(inputPath, outputPath);

      expect(result.width).toBe(400);
      expect(result.height).toBe(400);
      expect(result.format).toBe('png');

      // Verify alpha is preserved by checking channels
      const meta = await sharp(outputPath).metadata();
      expect(meta.channels).toBe(4);
    });

    it('should resize a wide PNG without enlarging smaller ones', async () => {
      const inputPath = path.join(tmpDir, 'wide.png');
      const outputPath = path.join(tmpDir, 'wide-opt.png');

      await sharp({
        create: { width: 2000, height: 1000, channels: 4, background: { r: 255, g: 255, b: 0, alpha: 1 } }
      }).png().toFile(inputPath);

      const result = await optimizeImage(inputPath, outputPath);

      expect(result.width).toBe(1600);
      expect(result.height).toBe(800);
      expect(result.format).toBe('png');
    });
  });

  describe('other formats', () => {
    it('should convert non-JPEG/PNG formats to JPEG', async () => {
      const inputPath = path.join(tmpDir, 'test.webp');
      const outputPath = path.join(tmpDir, 'test-opt.webp');

      await sharp({
        create: { width: 500, height: 500, channels: 3, background: { r: 128, g: 128, b: 128 } }
      }).webp().toFile(inputPath);

      const result = await optimizeImage(inputPath, outputPath);

      expect(result.width).toBe(500);
      expect(result.height).toBe(500);
      expect(result.format).toBe('jpeg');
    });
  });

  describe('no enlargement', () => {
    it('should not enlarge an image smaller than maxWidth', async () => {
      const inputPath = path.join(tmpDir, 'tiny.jpg');
      const outputPath = path.join(tmpDir, 'tiny-opt.jpg');

      await sharp({
        create: { width: 200, height: 150, channels: 3, background: { r: 100, g: 100, b: 100 } }
      }).jpeg().toFile(inputPath);

      const result = await optimizeImage(inputPath, outputPath);

      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });
  });
});
