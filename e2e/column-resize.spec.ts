import { expect, test } from '@playwright/test';

test.describe('Column resize', () => {
  test('setColumnWidth updates WASM column width', async ({ page }) => {
    await page.goto('/examples/npm-package/index.html?lang=ja');
    await page.waitForSelector('[data-testid="wasabi-canvas"]', { timeout: 30_000 });

    const result = await page.evaluate(async () => {
      const table = (window as Window & {
        __wasabiTable?: {
          getColumnWidth: (col: number) => number;
          setColumnWidth: (col: number, width: number) => void;
        };
      }).__wasabiTable;
      if (!table) throw new Error('table not exposed');

      const before = table.getColumnWidth(0);
      table.setColumnWidth(0, 160);
      const after = table.getColumnWidth(0);
      return { before, after };
    });

    expect(result.after).toBe(160);
    expect(result.before).not.toBe(160);
  });

  test('dragging header edge resizes column', async ({ page }) => {
    await page.goto('/examples/npm-package/benchmark.html');
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });

    const result = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');

      const wrap = document.createElement('div');
      wrap.style.width = '640px';
      wrap.style.height = '320px';
      document.body.appendChild(wrap);

      const canvas = document.createElement('canvas');
      canvas.style.width = '640px';
      canvas.style.height = '320px';
      canvas.tabIndex = 0;
      wrap.appendChild(canvas);

      const table = await WasabiTable.create(canvas, {
        row_count: 5,
        col_count: 3,
        row_header_width: 50,
        header_height: 30,
        default_col_width: 100,
        column_headers: [
          {
            name: 'a',
            display_name: 'Col A',
            width: 100,
            required: false,
            order: 0,
            is_visible: true,
            field_type: 'CharField',
          },
          {
            name: 'b',
            display_name: 'Col B',
            width: 100,
            required: false,
            order: 1,
            is_visible: true,
            field_type: 'CharField',
          },
        ],
      });

      const before = table.getColumnWidth(0);
      const rightEdge = 50 + 100;
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

      fire('mousedown', rightEdge - 2, 15);
      fire('mousemove', rightEdge + 40, 15);
      fire('mouseup', rightEdge + 40, 15);

      const after = table.getColumnWidth(0);
      table.dispose();
      wrap.remove();
      return { before, after };
    });

    expect(result.after).toBeGreaterThan(result.before);
    expect(result.after).toBeGreaterThanOrEqual(130);
  });
});
