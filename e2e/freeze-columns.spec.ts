import { expect, test } from '@playwright/test';

test.describe('Freeze columns', () => {
  test('first column stays visible after horizontal scroll', async ({ page }) => {
    await page.goto('/examples/npm-package/benchmark.html');
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });

    const result = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');

      const wrap = document.createElement('div');
      wrap.style.width = '300px';
      wrap.style.height = '160px';
      document.body.appendChild(wrap);

      const canvas = document.createElement('canvas');
      canvas.style.width = '300px';
      canvas.style.height = '160px';
      canvas.width = 300;
      canvas.height = 160;
      wrap.appendChild(canvas);

      const table = await WasabiTable.create(canvas, {
        row_count: 3,
        col_count: 8,
        row_header_width: 40,
        header_height: 28,
        default_row_height: 24,
        default_col_width: 100,
        freeze_cols: 1,
      });

      table.setCellValue(0, 0, 'FROZEN');
      table.setCellValue(0, 7, 'FAR');
      table.render();

      canvas.dispatchEvent(
        new WheelEvent('wheel', {
          deltaX: 400,
          deltaY: 0,
          bubbles: true,
          cancelable: true,
        })
      );
      table.render();

      const posFrozen = table.getCellScreenPosition(0, 0);
      const posFar = table.getCellScreenPosition(0, 7);
      const scrollX = table.getStats().scrollX;

      table.dispose();
      wrap.remove();
      return { frozenX: posFrozen.x, farX: posFar.x, scrollX };
    });

    expect(result.frozenX).toBeGreaterThanOrEqual(40);
    expect(result.frozenX).toBeLessThan(200);
  });
});
