const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 15000,
  use: { baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'block' },
  webServer: {
    command: 'node tests/servidor.js',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: false
  }
});
