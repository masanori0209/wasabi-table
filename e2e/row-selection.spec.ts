import { expect, test } from '@playwright/test';

test.describe('Row selection', () => {
  test('clicking row header selects entire row', async ({ page }) => {
    await page.goto('/examples/npm-package/benchmark.html');
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });

    const result = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');

      const wrap = document.createElement('div');
      wrap.style.width = '500px';
      wrap.style.height = '200px';
      document.body.appendChild(wrap);

      const canvas = document.createElement('canvas');
      canvas.style.width = '500px';
      canvas.style.height = '200px';
      canvas.width = 500;
      canvas.height = 200;
      wrap.appendChild(canvas);

      const table = await WasabiTable.create(canvas, {
        row_count: 5,
        col_count: 4,
        row_header_width: 50,
        header_height: 30,
        default_row_height: 25,
        default_col_width: 80,
      });

      table.setCellValue(2, 0, 'R2C0');
      table.render();

      const rect = canvas.getBoundingClientRect();
      const fire = (type: string, x: number, y: number) => {
        canvas.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + x,
            clientY: rect.top + y,
            button: 0,
            buttons: type === 'mousedown' ? 1 : 0,
          })
        );
      };

      fire('mousedown', 25, 30 + 25 * 2 + 12);
      fire('mouseup', 25, 30 + 25 * 2 + 12);

      const info = table.getSelectionInfo();
      table.dispose();
      wrap.remove();
      return info;
    });

    expect(result?.isRange).toBe(true);
    expect(result?.start_row).toBe(2);
    expect(result?.end_row).toBe(2);
    expect(result?.start_col).toBe(0);
    expect(result?.end_col).toBe(3);
  });
});
