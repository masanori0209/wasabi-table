import { expect, test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const DEMO_PATH = '/examples/npm-package/index.html';
const SCREENSHOT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots');

test.describe('Demo page visual snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_PATH);
    await page.waitForSelector('[data-testid="wasabi-canvas"]', { timeout: 30_000 });
    await page.waitForFunction(() => (window as Window & { __wasabiTable?: unknown }).__wasabiTable != null, null, {
      timeout: 15_000,
    });
    await page.waitForTimeout(500);
  });

  test('capture demo page for design review', async ({ page }) => {
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('A1');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'demo-full-page.png'),
      fullPage: true,
    });

    await page.locator('[data-testid="demo-live-section"]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'demo-live-section.png'),
    });

    await page.locator('[data-testid="demo-header"]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'demo-header.png'),
    });
  });
});
