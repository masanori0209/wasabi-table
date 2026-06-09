import { expect, test } from '@playwright/test';

test.describe('Records data source', () => {
  test('edits write back to records and undo restores value', async ({ page }) => {
    await page.goto('/examples/npm-package/benchmark.html');
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });

    const result = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');
      const canvas = document.getElementById('benchCanvas');
      const records = [
        { personid: 1, fname: 'Alice', lname: 'Smith', email: 'a@x.com', check: false },
        { personid: 2, fname: 'Bob', lname: 'Jones', email: 'b@x.com', check: true },
      ];
      const table = await WasabiTable.create(canvas, {
        dataSource: {
          records,
          columns: [
            { field: 'personid', width: 80 },
            { field: 'fname', width: 120 },
            { field: 'lname', width: 120 },
            { field: 'email', width: 160 },
            { field: 'check', width: 60 },
          ],
        },
        default_row_height: 25,
        default_col_width: 100,
      });

      table.setCellValue(0, 1, 'Alicia', { recordUndo: false });
      const afterEdit = table.getRecords()[0].fname;
      table.setCellValue(0, 1, 'Alice', { recordUndo: false });
      const afterManualUndo = table.getRecords()[0].fname;

      table.setCellValue(1, 2, 'Lee', { recordUndo: true });
      const edited = table.getRecords()[1].lname;
      const undone = table.undo();
      const afterUndo = table.getRecords()[1].lname;

      table.dispose();
      return { afterEdit, afterManualUndo, edited, undone, afterUndo };
    });

    expect(result.afterEdit).toBe('Alicia');
    expect(result.afterManualUndo).toBe('Alice');
    expect(result.edited).toBe('Lee');
    expect(result.undone).toBe(true);
    expect(result.afterUndo).toBe('Jones');
  });
});
