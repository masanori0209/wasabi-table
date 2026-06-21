import { expect, test } from '@playwright/test';

test.describe('Issue 42 dialog and listener cleanup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/npm-package/benchmark.html');
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });
  });

  test('disposing after opening a header dialog removes the dialog and delayed document listener', async ({ page }) => {
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
      document.body.appendChild(wrap);

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 160;
      canvas.style.width = '320px';
      canvas.style.height = '160px';
      wrap.appendChild(canvas);

      const table = await WasabiTable.create(canvas, {
        row_count: 4,
        col_count: 2,
        row_header_width: 40,
        header_height: 28,
        column_headers: [
          {
            name: 'a',
            display_name: 'A',
            width: 100,
            required: false,
            order: 0,
            is_visible: true,
            field_type: 'CharField',
          },
          {
            name: 'b',
            display_name: 'B',
            width: 100,
            required: false,
            order: 1,
            is_visible: true,
            field_type: 'CharField',
          },
        ],
      });

      table.showHeaderDialog(0);
      const dialogVisibleBeforeDispose = document.querySelector('.wasabi-header-dialog') != null;

      table.dispose();
      wrap.remove();
      await new Promise((resolve) => setTimeout(resolve, 180));

      const dialogVisibleAfterDispose = document.querySelector('.wasabi-header-dialog') != null;
      document.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 20));

      return { dialogVisibleBeforeDispose, dialogVisibleAfterDispose };
    });

    expect(result.dialogVisibleBeforeDispose).toBe(true);
    expect(result.dialogVisibleAfterDispose).toBe(false);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('WasabiTableListeners cleanup aborts owned listeners and restores triggerRender owner', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { WasabiTable, WasabiTableListeners } = await import('../../dist/index.js');

      const createElements = async () => {
        const wrap = document.createElement('div');
        document.body.appendChild(wrap);

        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 160;
        canvas.style.width = '320px';
        canvas.style.height = '160px';
        wrap.appendChild(canvas);

        const formulaInput = document.createElement('input');
        const cellReference = document.createElement('div');
        const statsElement = document.createElement('div');
        const validationError = document.createElement('div');
        const validationSuccess = document.createElement('div');
        wrap.append(formulaInput, cellReference, statsElement, validationError, validationSuccess);

        const table = await WasabiTable.create(canvas, {
          row_count: 4,
          col_count: 2,
          row_header_width: 40,
          header_height: 28,
        });

        let renderCount = 0;
        const originalRender = table.render.bind(table);
        table.render = () => {
          renderCount += 1;
          originalRender();
        };

        return {
          wrap,
          table,
          ui: { formulaInput, cellReference, statsElement, validationError, validationSuccess },
          getRenderCount: () => renderCount,
        };
      };

      const first = await createElements();
      const second = await createElements();

      const compositionSignals: AbortSignal[] = [];
      const originalAdd = document.addEventListener.bind(document);
      document.addEventListener = function (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
      ) {
        if (
          (type === 'compositionstart' || type === 'compositionend') &&
          typeof options === 'object' &&
          options.signal
        ) {
          compositionSignals.push(options.signal);
        }
        return originalAdd(type, listener, options);
      };

      try {
        const firstListeners = new WasabiTableListeners(first.table, first.ui);
        const secondListeners = new WasabiTableListeners(second.table, second.ui);

        (window as { triggerRender?: () => void }).triggerRender?.();
        const afterSecondOwner = {
          first: first.getRenderCount(),
          second: second.getRenderCount(),
        };

        secondListeners.destroy();
        (window as { triggerRender?: () => void }).triggerRender?.();
        const afterRestoredFirstOwner = {
          first: first.getRenderCount(),
          second: second.getRenderCount(),
        };

        firstListeners.destroy();
        const triggerRemoved = typeof (window as { triggerRender?: () => void }).triggerRender !== 'function';
        const allCompositionSignalsAborted = compositionSignals.length === 4
          && compositionSignals.every((signal) => signal.aborted);

        first.table.dispose();
        second.table.dispose();
        first.wrap.remove();
        second.wrap.remove();

        return {
          afterSecondOwner,
          afterRestoredFirstOwner,
          triggerRemoved,
          allCompositionSignalsAborted,
          compositionSignalCount: compositionSignals.length,
        };
      } finally {
        document.addEventListener = originalAdd;
      }
    });

    expect(result.afterSecondOwner).toEqual({ first: 0, second: 1 });
    expect(result.afterRestoredFirstOwner).toEqual({ first: 1, second: 1 });
    expect(result.triggerRemoved).toBe(true);
    expect(result.compositionSignalCount).toBe(4);
    expect(result.allCompositionSignalsAborted).toBe(true);
  });
});
