import { expect, test } from '@playwright/test';

test.describe('Floating cell UI during scroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/npm-package/benchmark.html');
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });
  });

  test('MenuField select box closes when the grid scrolls', async ({ page }) => {
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

      table.setCellValue(0, 0, 'Open');
      table.showMenuFieldSelectBox(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 80));
      const opened = wrap.querySelector('.wasabi-menu-field-selectbox') != null;

      canvas.dispatchEvent(
        new WheelEvent('wheel', {
          deltaY: 500,
          bubbles: true,
          cancelable: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      const stillOpen = wrap.querySelector('.wasabi-menu-field-selectbox') != null;
      const scrollY = table.getStats().scrollY;
      table.dispose();
      wrap.remove();
      return { opened, stillOpen, scrollY };
    });

    expect(result.opened).toBe(true);
    expect(result.scrollY).toBeGreaterThan(0);
    expect(result.stillOpen).toBe(false);
  });

  test('inline edit remains tied to the original cell after grid scroll', async ({ page }) => {
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

      table.selectCell(0, 0);
      table.startEditing(0, 0);
      const input = document.querySelector('[data-wasabi-editing="true"]') as HTMLInputElement | null;
      if (!input) throw new Error('editing input not found');
      input.value = 'ScrollEdit';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      canvas.dispatchEvent(
        new WheelEvent('wheel', {
          deltaY: 500,
          bubbles: true,
          cancelable: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      const scrolled = table.getStats().scrollY > 0;
      const editingAfterScroll = table.isEditing();

      table.finishEditing();
      const afterFinish = table.getCellValue(0, 0) ?? '';
      const canUndo = table.canUndo();
      table.undo();
      const afterUndo = table.getCellValue(0, 0) ?? '';

      table.dispose();
      wrap.remove();
      return { scrolled, editingAfterScroll, afterFinish, canUndo, afterUndo };
    });

    expect(result.scrolled).toBe(true);
    expect(result.editingAfterScroll).toBe(true);
    expect(result.afterFinish).toBe('ScrollEdit');
    expect(result.canUndo).toBe(true);
    expect(result.afterUndo).toBe('');
  });

  test('validation tooltip does not remain attached to an off-screen cell after scroll', async ({ page }) => {
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
        col_count: 2,
        default_row_height: 25,
        header_height: 30,
        row_header_width: 50,
        column_headers: [
          {
            name: 'required_name',
            display_name: 'Required Name',
            width: 160,
            required: true,
            order: 0,
            is_visible: true,
            field_type: 'CharField',
          },
          {
            name: 'note',
            display_name: 'Note',
            width: 160,
            required: false,
            order: 1,
            is_visible: true,
            field_type: 'CharField',
          },
        ],
      });

      table.setCellValueWithValidation(0, 0, '');
      const cell = table.getCellScreenPosition(0, 0);
      const rect = canvas.getBoundingClientRect();
      canvas.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + cell.centerX,
          clientY: rect.top + cell.centerY,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 120));

      const tooltip = wrap.querySelector('.wasabi-table-tooltip') as HTMLElement | null;
      const opened = tooltip?.style.display === 'block';

      canvas.dispatchEvent(
        new WheelEvent('wheel', {
          deltaY: 800,
          bubbles: true,
          cancelable: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 260));

      const hiddenAfterScroll = tooltip?.style.display === 'none';
      const scrollY = table.getStats().scrollY;
      table.dispose();
      wrap.remove();
      return { opened, hiddenAfterScroll, scrollY };
    });

    expect(result.opened).toBe(true);
    expect(result.scrollY).toBeGreaterThan(0);
    expect(result.hiddenAfterScroll).toBe(true);
  });
});
