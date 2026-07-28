const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    root: './scripts',
    globals: true,
    testTimeout: 30000,
  },
});
