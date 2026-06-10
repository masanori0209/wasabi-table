import { expect, test } from '@playwright/test';

test.describe('Touch support', () => {
  test('touchstart selects a cell', async ({ page }) => {
    await page.goto('/examples/npm-package/benchmark.html');
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });

    const result = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');

      const wrap = document.createElement('div');
      document.body.appendChild(wrap);
      const canvas = document.createElement('canvas');
      canvas.style.width = '400px';
      canvas.style.height = '160px';
      canvas.width = 400;
      canvas.height = 160;
      wrap.appendChild(canvas);

      const table = await WasabiTable.create(canvas, {
        row_count: 4,
        col_count: 3,
        row_header_width: 40,
        header_height: 28,
        default_row_height: 24,
        default_col_width: 80,
      });

      const rect = canvas.getBoundingClientRect();
      const touch = new Touch({
        identifier: 1,
        target: canvas,
        clientX: rect.left + 120,
        clientY: rect.top + 40,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1,
      });

      canvas.dispatchEvent(
        new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch],
        })
      );

      canvas.dispatchEvent(
        new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          touches: [],
          targetTouches: [],
          changedTouches: [touch],
        })
      );

      const selected = table.getSelectedCell();
      table.dispose();
      wrap.remove();
      return selected;
    });

    expect(result).not.toBeNull();
    expect(result?.row).toBeGreaterThanOrEqual(0);
    expect(result?.col).toBeGreaterThanOrEqual(0);
  });
});
