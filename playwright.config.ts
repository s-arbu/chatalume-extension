import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const authStatePath = 'playwright/.auth/storageState.json';
const browserChannel = process.env.PLAYWRIGHT_CHANNEL === 'chrome' ? 'chrome' : undefined;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  timeout: 30_000,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    headless: true,
    launchOptions: {
      channel: browserChannel
    },
    storageState: existsSync(authStatePath) ? authStatePath : undefined,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure'
  }
});
