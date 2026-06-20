import { expect, test } from '@playwright/test';

test.describe('Issue 29 lifecycle, editing, and frozen header coverage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/npm-package/benchmark.html');
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });
  });

  test('disposing during scrollbar thumb drag does not leave document drag handlers active', async ({ page }) => {
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
      wrap.style.width = '420px';
      wrap.style.height = '220px';
      document.body.appendChild(wrap);

      const canvas = document.createElement('canvas');
      canvas.width = 420;
      canvas.height = 220;
      canvas.style.width = '420px';
      canvas.style.height = '220px';
      wrap.appendChild(canvas);

      const table = await WasabiTable.create(canvas, {
        row_count: 200,
        col_count: 8,
        default_row_height: 25,
        header_height: 30,
        row_header_width: 50,
      });
      table.render();

      await new Promise((resolve) => requestAnimationFrame(resolve));
      const scrollContainer = canvas.parentElement!;
      const verticalThumb = scrollContainer.children[2].firstElementChild as HTMLElement;
      const rect = verticalThumb.getBoundingClientRect();
      verticalThumb.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        })
      );

      table.dispose();
      document.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2 + 40,
        })
      );
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      wrap.remove();
      await new Promise((resolve) => setTimeout(resolve, 80));

      return { disposed: true };
    });

    expect(result.disposed).toBe(true);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('editing Enter is routed to the table that owns the active editing input', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');

      const wrap = document.createElement('div');
      document.body.appendChild(wrap);

      const canvasA = document.createElement('canvas');
      canvasA.width = 320;
      canvasA.height = 160;
      canvasA.style.width = '320px';
      canvasA.style.height = '160px';
      wrap.appendChild(canvasA);

      const canvasB = document.createElement('canvas');
      canvasB.width = 320;
      canvasB.height = 160;
      canvasB.style.width = '320px';
      canvasB.style.height = '160px';
      wrap.appendChild(canvasB);

      const tableA = await WasabiTable.create(canvasA, {
        row_count: 10,
        col_count: 3,
        default_row_height: 25,
        header_height: 30,
        row_header_width: 50,
      });
      const tableB = await WasabiTable.create(canvasB, {
        row_count: 10,
        col_count: 3,
        default_row_height: 25,
        header_height: 30,
        row_header_width: 50,
      });
      tableA.render();
      tableB.render();

      tableA.startEditing(0, 0);
      const input = document.querySelector('[data-wasabi-editing="true"]') as HTMLInputElement | null;
      if (!input) throw new Error('editing input not found');
      input.value = 'First table';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 80));

      const tableAValue = tableA.getCellValue(0, 0) ?? '';
      const tableBValue = tableB.getCellValue(0, 0) ?? '';
      const tableAEditing = tableA.isEditing();

      tableA.dispose();
      tableB.dispose();
      wrap.remove();

      return { tableAValue, tableBValue, tableAEditing };
    });

    expect(result.tableAValue).toBe('First table');
    expect(result.tableBValue).toBe('');
    expect(result.tableAEditing).toBe(false);
  });

  test('frozen column header select, filter, and resize work after horizontal scroll', async ({ page }) => {
    const setup = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');

      const wrap = document.createElement('div');
      wrap.dataset.testid = 'issue29-frozen-wrap';
      wrap.style.width = '360px';
      wrap.style.height = '220px';
      document.body.appendChild(wrap);

      const canvas = document.createElement('canvas');
      canvas.dataset.testid = 'issue29-frozen-canvas';
      canvas.width = 360;
      canvas.height = 220;
      canvas.style.width = '360px';
      canvas.style.height = '220px';
      wrap.appendChild(canvas);

      const headers = Array.from({ length: 8 }, (_, index) => ({
        name: `col_${index}`,
        display_name: `Col ${index + 1}`,
        width: 100,
        required: false,
        order: index,
        is_visible: true,
        field_type: 'CharField',
      }));

      const table = await WasabiTable.create(canvas, {
        row_count: 20,
        col_count: 8,
        default_row_height: 25,
        default_col_width: 100,
        header_height: 30,
        row_header_width: 50,
        freeze_cols: 1,
        column_headers: headers,
      });
      (window as any).__issue29FrozenTable = table;
      table.render();

      canvas.dispatchEvent(
        new WheelEvent('wheel', {
          deltaX: 360,
          deltaY: 0,
          bubbles: true,
          cancelable: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 80));

      const scrolled = table.getStats().scrollX > 0;
      const frozenBefore = table.getColumnHeaderZones(0)!;

      return {
        scrolled,
        zones: frozenBefore,
      };
    });

    expect(setup.scrolled).toBe(true);

    const canvas = page.getByTestId('issue29-frozen-canvas');
    await canvas.click({ position: setup.zones.select });

    const selectedColumn = await page.evaluate(() => {
      return (window as any).__issue29FrozenTable.getSelectionInfo();
    });
    expect(selectedColumn).toMatchObject({
      isRange: true,
      start_col: 0,
      end_col: 0,
    });

    await canvas.click({ position: setup.zones.filter });
    await expect(page.locator('.wasabi-header-dialog')).toBeVisible();
    await page.locator('.wasabi-header-dialog').evaluate((element) => element.remove());

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const resizeX = setup.zones.filter.x + 14;
    const resizeY = setup.zones.select.y;
    await page.mouse.move(box!.x + resizeX, box!.y + resizeY);
    await page.mouse.down();
    await page.mouse.move(box!.x + resizeX + 32, box!.y + resizeY);
    await page.mouse.up();

    const result = await page.evaluate(() => {
      const table = (window as any).__issue29FrozenTable;
      const after = table.getColumnHeaderZones(0)!;
      table.dispose();
      document.querySelector('[data-testid="issue29-frozen-wrap"]')?.remove();
      delete (window as any).__issue29FrozenTable;

      return { afterWidth: after.width };
    });
    expect(result.afterWidth).toBeGreaterThan(setup.zones.width);
  });
});
