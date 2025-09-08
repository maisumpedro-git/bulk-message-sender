const path = require('path');
const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: { environment: 'jsdom' },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
