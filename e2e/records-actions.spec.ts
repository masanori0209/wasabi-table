import { expect, test } from '@playwright/test';

const BENCH_PATH = '/examples/npm-package/benchmark.html';

type ActionResult = Record<string, unknown>;

async function runRecordsActions(page: import('@playwright/test').Page, script: string): Promise<ActionResult> {
  return page.evaluate(async (body) => {
    const { WasabiTable } = await import('../../dist/index.js');
    const canvas = document.getElementById('benchCanvas') as HTMLCanvasElement | null;
    if (!canvas) throw new Error('benchCanvas not found');

    const baseRecords = () => [
      { personid: 1, fname: 'Alice', lname: 'Smith', email: 'a@x.com', check: false },
      { personid: 2, fname: 'Bob', lname: 'Jones', email: 'b@x.com', check: true },
      { personid: 3, fname: 'Carol', lname: 'Lee', email: 'c@x.com', check: false },
    ];

    const columns = [
      { field: 'personid', width: 80 },
      { field: 'fname', width: 120 },
      { field: 'lname', width: 120 },
      { field: 'email', width: 160 },
      { field: 'check', width: 60 },
    ];

    const fn = new Function(
      'WasabiTable',
      'canvas',
      'baseRecords',
      'columns',
      `return (async () => { ${body} })();`
    ) as (
      wt: typeof WasabiTable,
      c: HTMLCanvasElement,
      br: () => unknown[],
      cols: unknown[]
    ) => Promise<ActionResult>;

    return fn(WasabiTable, canvas, baseRecords, columns);
  }, script);
}

test.describe('Records mode action matrix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BENCH_PATH);
    await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });
  });

  test('set/get cell reflects in records array', async ({ page }) => {
    const result = await runRecordsActions(
      page,
      `
      const table = await WasabiTable.create(canvas, {
        dataSource: { records: baseRecords(), columns },
        default_row_height: 25,
        default_col_width: 100,
      });
      table.setCellValue(1, 1, 'Robert', { recordUndo: false });
      const viaApi = table.getCellValue(1, 1);
      const viaRecords = table.getRecords()[1].fname;
      table.dispose();
      return { viaApi, viaRecords, isRecordsMode: table.isRecordsMode() };
    `
    );
    expect(result.viaApi).toBe('Robert');
    expect(result.viaRecords).toBe('Robert');
    expect(result.isRecordsMode).toBe(true);
  });

  test('undo and redo restore records', async ({ page }) => {
    const result = await runRecordsActions(
      page,
      `
      const table = await WasabiTable.create(canvas, {
        dataSource: { records: baseRecords(), columns },
        default_row_height: 25,
      });
      table.setCellValue(0, 2, 'Brown');
      const edited = table.getRecords()[0].lname;
      table.undo();
      const undone = table.getRecords()[0].lname;
      table.redo();
      const redone = table.getRecords()[0].lname;
      table.dispose();
      return { edited, undone, redone };
    `
    );
    expect(result.edited).toBe('Brown');
    expect(result.undone).toBe('Smith');
    expect(result.redone).toBe('Brown');
  });

  test('copy and paste update records', async ({ page }) => {
    const result = await runRecordsActions(
      page,
      `
      const table = await WasabiTable.create(canvas, {
        dataSource: { records: baseRecords(), columns },
        default_row_height: 25,
      });
      table.startRangeSelection(0, 1);
      table.updateRangeSelection(1, 2);
      table.endRangeSelection();
      const copied = table.copySelection();
      table.selectCell(2, 1);
      table.pasteFromClipboard(copied);
      const r2fname = table.getRecords()[2].fname;
      const r2lname = table.getRecords()[2].lname;
      table.dispose();
      return { copied, r2fname, r2lname };
    `
    );
    expect(result.copied).toContain('Alice');
    expect(result.r2fname).toBe('Alice');
    expect(result.r2lname).toBe('Smith');
  });

  test('cut clears records and undo restores', async ({ page }) => {
    const result = await runRecordsActions(
      page,
      `
      const table = await WasabiTable.create(canvas, {
        dataSource: { records: baseRecords(), columns },
        default_row_height: 25,
      });
      table.selectCell(0, 1);
      const copied = table.copySelection();
      table.setCellValue(0, 1, '', { recordUndo: true });
      const cleared = table.getRecords()[0].fname;
      table.undo();
      const restored = table.getRecords()[0].fname;
      table.dispose();
      return { copied, cleared, restored };
    `
    );
    expect(result.copied).toBe('Alice');
    expect(result.cleared).toBe('');
    expect(result.restored).toBe('Alice');
  });

  test('range clear via selection uses records', async ({ page }) => {
    const result = await runRecordsActions(
      page,
      `
      const table = await WasabiTable.create(canvas, {
        dataSource: { records: baseRecords(), columns },
        default_row_height: 25,
      });
      table.startRangeSelection(0, 1);
      table.updateRangeSelection(1, 1);
      table.endRangeSelection();
      table.setCellValue(0, 1, '', { recordUndo: false });
      table.setCellValue(1, 1, '', { recordUndo: false });
      const r0 = table.getRecords()[0].fname;
      const r1 = table.getRecords()[1].fname;
      table.dispose();
      return { r0, r1 };
    `
    );
    expect(result.r0).toBe('');
    expect(result.r1).toBe('');
  });

  test('finishEditing commits overlay value to records', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');
      const canvas = document.getElementById('benchCanvas') as HTMLCanvasElement;
      const records = [
        { personid: 1, fname: 'Alice', lname: 'Smith', email: 'a@x.com', check: false },
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
      table.render();
      table.selectCell(0, 1);
      table.startEditing(0, 1);
      const input = document.querySelector('[data-wasabi-editing="true"]') as HTMLInputElement | null;
      if (!input) throw new Error('editing input not found');
      input.value = 'Alicia';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      table.finishEditing();
      const fname = table.getRecords()[0].fname;
      table.dispose();
      return { fname };
    });
    expect(result.fname).toBe('Alicia');
  });

  test('refresh picks up external records mutation', async ({ page }) => {
    const result = await runRecordsActions(
      page,
      `
      const records = baseRecords();
      const table = await WasabiTable.create(canvas, {
        dataSource: { records, columns },
        default_row_height: 25,
      });
      records[2].email = 'updated@x.com';
      table.refresh();
      const email = table.getCellValue(2, 3);
      table.dispose();
      return { email };
    `
    );
    expect(result.email).toBe('updated@x.com');
  });

  test('setRecords replaces data', async ({ page }) => {
    const result = await runRecordsActions(
      page,
      `
      const table = await WasabiTable.create(canvas, {
        dataSource: { records: baseRecords(), columns },
        default_row_height: 25,
      });
      table.setRecords([{ personid: 9, fname: 'Zed', lname: 'Only', email: 'z@x.com', check: false }]);
      const count = table.getRecords().length;
      const fname = table.getRecords()[0].fname;
      table.dispose();
      return { count, fname };
    `
    );
    expect(result.count).toBe(1);
    expect(result.fname).toBe('Zed');
  });

  test('setBatchData and setRowBatch throw in records mode', async ({ page }) => {
    const result = await runRecordsActions(
      page,
      `
      const table = await WasabiTable.create(canvas, {
        dataSource: { records: baseRecords(), columns },
        default_row_height: 25,
      });
      let batchErr = '';
      let rowErr = '';
      try { table.setBatchData([{ row: 0, col: 0, value: 'x' }]); } catch (e) { batchErr = e.message; }
      try { table.setRowBatch(0, [['a']]); } catch (e) { rowErr = e.message; }
      table.dispose();
      return { batchErr, rowErr };
    `
    );
    expect(result.batchErr).toContain('records mode');
    expect(result.rowErr).toContain('records mode');
  });

  test('toggleCheckField updates records', async ({ page }) => {
    const result = await runRecordsActions(
      page,
      `
      const table = await WasabiTable.create(canvas, {
        dataSource: { records: baseRecords(), columns },
        default_row_height: 25,
      });
      table.setColumnHeaders([
        { name: 'personid', display_name: 'ID', width: 80, required: false, order: 0, is_visible: true, field_type: 'IntegerField' },
        { name: 'fname', display_name: 'First', width: 120, required: false, order: 1, is_visible: true, field_type: 'CharField' },
        { name: 'lname', display_name: 'Last', width: 120, required: false, order: 2, is_visible: true, field_type: 'CharField' },
        { name: 'email', display_name: 'Email', width: 160, required: false, order: 3, is_visible: true, field_type: 'EmailField' },
        { name: 'check', display_name: '', width: 60, required: false, order: 4, is_visible: true, field_type: 'CheckField' },
      ]);
      table.toggleCheckField(0, 4);
      const check = table.getRecords()[0].check;
      table.dispose();
      return { check };
    `
    );
    expect(result.check).toBe('true');
  });
});

test.describe('Records mode keyboard', () => {
  test('Delete clears cell in records', async ({ page }) => {
    await page.goto(BENCH_PATH);
    await page.waitForSelector('[data-testid="bench-canvas"]');

    await page.evaluate(async () => {
      const { WasabiTable } = await import('../../dist/index.js');
      const canvas = document.getElementById('benchCanvas') as HTMLCanvasElement;
      const records = [{ personid: 1, fname: 'Keep', lname: 'Me', email: 'k@x.com', check: false }];
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
      (window as Window & { __recordsTable?: typeof table }).__recordsTable = table;
      table.render();
      table.selectCell(0, 1);
      table.render();
    });

    const canvas = page.locator('[data-testid="bench-canvas"]');
    await canvas.focus();
    await page.keyboard.press('Delete');

    const fname = await page.evaluate(() => {
      const table = (window as Window & { __recordsTable?: { getRecords: () => { fname: string }[]; dispose: () => void } })
        .__recordsTable;
      const value = table?.getRecords()[0].fname;
      table?.dispose();
      return value;
    });

    expect(fname).toBe('');
  });
});
