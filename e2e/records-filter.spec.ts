import { expect, test } from '@playwright/test';

test.describe('Records filter and sort', () => {
  test('filter and sort apply to records mode', async ({ page }) => {
    await page.goto('/examples/npm-package/benchmark.html');
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });

    const result = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');

      const wrap = document.createElement('div');
      wrap.style.width = '640px';
      wrap.style.height = '240px';
      document.body.appendChild(wrap);

      const canvas = document.createElement('canvas');
      canvas.style.width = '640px';
      canvas.style.height = '240px';
      canvas.width = 640;
      canvas.height = 240;
      wrap.appendChild(canvas);

      const records = [
        { id: 1, name: 'Alice', team: 'A' },
        { id: 2, name: 'Bob', team: 'B' },
        { id: 3, name: 'Carol', team: 'A' },
      ];

      const table = await WasabiTable.create(canvas, {
        dataSource: {
          records,
          columns: [
            { field: 'id', width: 60 },
            { field: 'name', width: 120 },
            { field: 'team', width: 80 },
          ],
        },
        default_row_height: 25,
        header_height: 30,
        row_header_width: 50,
      });

      table.addFilterCondition({
        columnIndex: 2,
        operator: 'equals',
        value: 'A',
        fieldType: 'CharField',
        isActive: true,
      });

      const filtered = table.getFilterResult();
      const filterState = table.getFilterState();

      table.setSortCondition({
        columnIndex: 0,
        direction: 'desc',
        fieldType: 'IntegerField',
      });

      const sortedState = table.getFilterState();

      table.dispose();
      wrap.remove();
      return {
        filteredCount: filtered.filteredCount,
        isFiltered: filterState.isFiltered,
        sortCol: sortedState.sortCondition?.columnIndex,
        sortDir: sortedState.sortCondition?.direction,
      };
    });

    expect(result.isFiltered).toBe(true);
    expect(result.filteredCount).toBe(2);
    expect(result.sortCol).toBe(0);
    expect(result.sortDir).toBe('desc');
  });

  test('records range operations only touch visible filtered rows', async ({ page }) => {
    await page.goto('/examples/npm-package/benchmark.html');
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });

    const copied = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');
      const canvas = document.querySelector('[data-testid="bench-canvas"]') as HTMLCanvasElement;

      const records = [
        { id: 1, name: 'Alice', team: 'A' },
        { id: 2, name: 'Bob', team: 'B' },
        { id: 3, name: 'Carol', team: 'A' },
      ];

      const table = await WasabiTable.create(canvas, {
        dataSource: {
          records,
          columns: [
            { field: 'id', width: 60 },
            { field: 'name', width: 120 },
            { field: 'team', width: 80 },
          ],
        },
        default_row_height: 25,
        header_height: 30,
        row_header_width: 50,
      });

      table.addFilterCondition({
        columnIndex: 2,
        operator: 'equals',
        value: 'A',
        fieldType: 'CharField',
        isActive: true,
      });
      table.startRangeSelection(0, 1);
      table.updateRangeSelection(2, 1);
      table.endRangeSelection();
      table.render();

      (window as Window & { __filteredRecordsTable?: typeof table }).__filteredRecordsTable = table;
      return table.copySelection();
    });

    expect(copied).toBe('Alice\r\nCarol\r\n');

    await page.locator('[data-testid="bench-canvas"]').focus();
    await page.keyboard.press('Delete');

    const afterDelete = await page.evaluate(() => {
      const table = (window as Window & {
        __filteredRecordsTable?: {
          getRecords: () => { name: string }[];
          dispose: () => void;
        };
      }).__filteredRecordsTable!;
      const records = table.getRecords();
      table.dispose();
      delete (window as Window & { __filteredRecordsTable?: unknown }).__filteredRecordsTable;
      return records.map((record) => record.name);
    });

    expect(afterDelete).toEqual(['', 'Bob', '']);
  });

  test('table range operations only touch visible filtered rows', async ({ page }) => {
    await page.goto('/examples/npm-package/benchmark.html');
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });

    const copied = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');
      const canvas = document.querySelector('[data-testid="bench-canvas"]') as HTMLCanvasElement;

      const table = await WasabiTable.create(canvas, {
        row_count: 3,
        col_count: 3,
        default_row_height: 25,
        header_height: 30,
        row_header_width: 50,
        column_headers: [
          {
            name: 'id',
            display_name: 'ID',
            width: 60,
            required: false,
            order: 0,
            is_visible: true,
            field_type: 'IntegerField',
          },
          {
            name: 'name',
            display_name: 'Name',
            width: 120,
            required: false,
            order: 1,
            is_visible: true,
            field_type: 'CharField',
          },
          {
            name: 'team',
            display_name: 'Team',
            width: 80,
            required: false,
            order: 2,
            is_visible: true,
            field_type: 'CharField',
          },
        ],
      });

      table.setBatchData([
        { row: 0, col: 0, value: '1' },
        { row: 0, col: 1, value: 'Alice' },
        { row: 0, col: 2, value: 'A' },
        { row: 1, col: 0, value: '2' },
        { row: 1, col: 1, value: 'Bob' },
        { row: 1, col: 2, value: 'B' },
        { row: 2, col: 0, value: '3' },
        { row: 2, col: 1, value: 'Carol' },
        { row: 2, col: 2, value: 'A' },
      ]);

      table.addFilterCondition({
        columnIndex: 2,
        operator: 'equals',
        value: 'A',
        fieldType: 'CharField',
        isActive: true,
      });
      table.startRangeSelection(0, 1);
      table.updateRangeSelection(2, 1);
      table.endRangeSelection();
      table.render();

      (window as Window & { __filteredTable?: typeof table }).__filteredTable = table;
      return table.copySelection();
    });

    expect(copied).toBe('Alice\r\nCarol\r\n');

    await page.locator('[data-testid="bench-canvas"]').focus();
    await page.keyboard.press('Delete');

    const afterDelete = await page.evaluate(() => {
      const table = (window as Window & {
        __filteredTable?: {
          getCellValue: (row: number, col: number) => string | undefined;
          dispose: () => void;
        };
      }).__filteredTable!;
      const values = [
        table.getCellValue(0, 1) ?? '',
        table.getCellValue(1, 1) ?? '',
        table.getCellValue(2, 1) ?? '',
      ];
      table.dispose();
      delete (window as Window & { __filteredTable?: unknown }).__filteredTable;
      return values;
    });

    expect(afterDelete).toEqual(['', 'Bob', '']);
  });
});
