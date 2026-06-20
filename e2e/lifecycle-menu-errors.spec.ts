import { expect, test } from '@playwright/test';

test.describe('Lifecycle and MenuField error regressions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/npm-package/benchmark.html');
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });
  });

  test('scroll followed by immediate dispose does not touch freed table state', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        consoleErrors.push(message.text());
      }
    });

    const result = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');

      const wrap = document.createElement('div');
      wrap.style.width = '640px';
      wrap.style.height = '260px';
      document.body.appendChild(wrap);

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 260;
      canvas.style.width = '640px';
      canvas.style.height = '260px';
      wrap.appendChild(canvas);

      const table = await WasabiTable.create(canvas, {
        row_count: 100,
        col_count: 3,
        default_row_height: 25,
        header_height: 30,
        row_header_width: 50,
      });
      table.render();
      table.selectCell(0, 0);

      canvas.dispatchEvent(
        new WheelEvent('wheel', {
          deltaY: 500,
          bubbles: true,
          cancelable: true,
        })
      );
      table.dispose();
      wrap.remove();
      await new Promise((resolve) => setTimeout(resolve, 300));

      return { disposed: true };
    });

    expect(result.disposed).toBe(true);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('MenuField open and close does not leak document keydown listeners', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');

      const wrap = document.createElement('div');
      wrap.style.width = '640px';
      wrap.style.height = '260px';
      document.body.appendChild(wrap);

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 260;
      canvas.style.width = '640px';
      canvas.style.height = '260px';
      wrap.appendChild(canvas);

      const table = await WasabiTable.create(canvas, {
        row_count: 20,
        col_count: 2,
        default_row_height: 25,
        header_height: 30,
        row_header_width: 50,
        column_headers: [
          {
            name: 'status',
            display_name: 'Status',
            width: 140,
            required: false,
            order: 0,
            is_visible: true,
            field_type: 'MenuField',
            choices: ['Open', 'Closed'],
          },
          {
            name: 'name',
            display_name: 'Name',
            width: 140,
            required: false,
            order: 1,
            is_visible: true,
            field_type: 'CharField',
          },
        ],
      });
      table.render();

      const originalAdd = document.addEventListener.bind(document);
      const originalRemove = document.removeEventListener.bind(document);
      const activeKeydownCallbacks = new Set<EventListenerOrEventListenerObject>();

      document.addEventListener = function (
        type: string,
        callback: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
      ): void {
        if (type === 'keydown') activeKeydownCallbacks.add(callback);
        return originalAdd(type, callback, options);
      };
      document.removeEventListener = function (
        type: string,
        callback: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions
      ): void {
        if (type === 'keydown') activeKeydownCallbacks.delete(callback);
        return originalRemove(type, callback, options);
      };

      try {
        for (let i = 0; i < 3; i += 1) {
          table.showMenuFieldSelectBox(0, 0);
          await new Promise((resolve) => setTimeout(resolve, 20));
          table.hideMenuFieldSelectBox();
        }
        return { leakedKeydownAfterHide: activeKeydownCallbacks.size };
      } finally {
        document.addEventListener = originalAdd;
        document.removeEventListener = originalRemove;
        table.dispose();
        wrap.remove();
      }
    });

    expect(result.leakedKeydownAfterHide).toBe(0);
  });

  test('MenuField onCellChange reports the previous and selected values', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');

      const wrap = document.createElement('div');
      wrap.style.width = '640px';
      wrap.style.height = '260px';
      document.body.appendChild(wrap);

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 260;
      canvas.style.width = '640px';
      canvas.style.height = '260px';
      wrap.appendChild(canvas);

      const table = await WasabiTable.create(canvas, {
        row_count: 20,
        col_count: 2,
        default_row_height: 25,
        header_height: 30,
        row_header_width: 50,
        column_headers: [
          {
            name: 'status',
            display_name: 'Status',
            width: 140,
            required: false,
            order: 0,
            is_visible: true,
            field_type: 'MenuField',
            choices: ['Open', 'Closed'],
          },
          {
            name: 'name',
            display_name: 'Name',
            width: 140,
            required: false,
            order: 1,
            is_visible: true,
            field_type: 'CharField',
          },
        ],
      });
      table.render();
      table.setCellValue(0, 0, 'Open');

      const calls: { position: { row: number; col: number }; oldValue: string; newValue: string }[] = [];
      table.setEventHandlers({
        onCellChange: (position, oldValue, newValue) => {
          calls.push({ position, oldValue, newValue });
        },
      });

      table.showMenuFieldSelectBox(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 80));
      const closedOption = Array.from(wrap.querySelectorAll('.wasabi-menu-option')).find(
        (option) => (option as HTMLElement).dataset.value === 'Closed'
      ) as HTMLElement | undefined;
      closedOption?.click();
      await new Promise((resolve) => setTimeout(resolve, 80));

      const value = table.getCellValue(0, 0) ?? '';
      table.dispose();
      wrap.remove();

      return { value, calls };
    });

    expect(result.value).toBe('Closed');
    expect(result.calls).toEqual([
      {
        position: { row: 0, col: 0 },
        oldValue: 'Open',
        newValue: 'Closed',
      },
    ]);
  });
});
