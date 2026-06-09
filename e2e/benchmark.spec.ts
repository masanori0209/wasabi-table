import { expect, test } from '@playwright/test';

const BENCH_PATH = '/examples/npm-package/benchmark.html';

test.describe('Benchmark page', () => {
  test('runs benchmarks and shows measured results', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto(BENCH_PATH);
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });

    await page.locator('[data-testid="btn-run-bench"]').click();

    await expect(page.locator('[data-testid="bench-row-init-100x20"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-testid="bench-row-scroll-fps"]')).toBeVisible({ timeout: 90_000 });

    const initResult = page.locator('[data-testid="bench-row-init-100x20"] .bench-metric');
    await expect(initResult).not.toHaveText('…');
    await expect(initResult).toContainText(/ms|µs|s/);

    const fpsResult = page.locator('[data-testid="bench-row-scroll-fps"] .bench-metric');
    await expect(fpsResult).toContainText('FPS');

    await expect(page.locator('[data-testid="bench-ran-at"]')).not.toHaveText('—');
  });
});
