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
});
