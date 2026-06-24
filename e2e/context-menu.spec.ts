import { expect, test, type Page } from '@playwright/test';

type TestTableWindow = Window & {
  __contextMenuTable?: {
    dispose: () => void;
    render: () => void;
    selectCell: (row: number, col: number) => void;
    setCellValue: (row: number, col: number, value: string) => void;
    getCellValue: (row: number, col: number) => string | undefined;
    getCellScreenPosition: (row: number, col: number) => { centerX: number; centerY: number };
    startRangeSelection: (row: number, col: number) => void;
    updateRangeSelection: (row: number, col: number) => void;
    endRangeSelection: () => void;
    getSelectionInfo: () => { hasSelection: boolean; isRange: boolean; cell_count: number };
    undo: () => boolean;
  };
  __contextMenuResult?: unknown;
};

async function mountContextMenuTable(page: Page, options?: { customOnly?: boolean }) {
  await page.goto('/examples/npm-package/benchmark.html');
  await page.waitForSelector('[data-testid="bench-canvas"]', { timeout: 30_000 });
  await page.evaluate(async ({ customOnly }) => {
    const existing = (window as TestTableWindow).__contextMenuTable;
    existing?.dispose();
    document.getElementById('context-menu-e2e-root')?.remove();

    const { WasabiTable } = await import('../../dist/index.js');
    const root = document.createElement('div');
    root.id = 'context-menu-e2e-root';
    root.style.width = '520px';
    root.style.height = '240px';
    document.body.appendChild(root);

    const canvas = document.createElement('canvas');
    canvas.setAttribute('data-testid', 'context-menu-canvas');
    canvas.width = 520;
    canvas.height = 240;
    canvas.style.width = '520px';
    canvas.style.height = '240px';
    root.appendChild(canvas);

    const table = await WasabiTable.create(canvas, {
      row_count: 20,
      col_count: 8,
      default_row_height: 25,
      header_height: 30,
      row_header_width: 50,
      contextMenu: customOnly
        ? {
            builtInActions: false,
            actions: [
              {
                id: 'inspect-cell',
                label: 'Inspect cell',
                run: (context) => {
                  (window as TestTableWindow).__contextMenuResult = {
                    reference: context.cell.reference,
                    value: context.cell.value,
                    selectionCells: context.selection.cell_count,
                    recordsMode: context.recordsMode,
                  };
                },
              },
            ],
          }
        : undefined,
    });

    table.setCellValue(0, 0, 'Alpha');
    table.setCellValue(0, 1, 'Beta');
    table.setCellValue(1, 0, 'Gamma');
    table.setCellValue(1, 1, 'Delta');
    table.render();
    table.selectCell(0, 0);
    (window as TestTableWindow).__contextMenuTable = table;
  }, options ?? {});
}

async function rightClickCell(page: Page, row: number, col: number) {
  const position = await page.evaluate(({ row, col }) => {
    const table = (window as TestTableWindow).__contextMenuTable!;
    const pos = table.getCellScreenPosition(row, col);
    return { x: pos.centerX, y: pos.centerY };
  }, { row, col });
  await page.locator('[data-testid="context-menu-canvas"]').click({
    button: 'right',
    position,
  });
}

async function getCellValue(page: Page, row: number, col: number): Promise<string> {
  return page.evaluate(({ row, col }) => {
    return (window as TestTableWindow).__contextMenuTable?.getCellValue(row, col) ?? '';
  }, { row, col });
}

test.describe('Cell context menu', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('opens on right click, closes with Escape, and copies the selected cell', async ({ page }) => {
    await mountContextMenuTable(page);
    await rightClickCell(page, 0, 0);
    await expect(page.locator('.wasabi-context-menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.wasabi-context-menu')).toHaveCount(0);

    await rightClickCell(page, 0, 0);
    await page.getByRole('menuitem', { name: 'Copy' }).click();
    await expect(page.locator('.wasabi-context-menu')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Alpha\r\n');
  });

  test('cuts the current range and keeps the operation undoable', async ({ page }) => {
    await mountContextMenuTable(page);
    await page.evaluate(() => {
      const table = (window as TestTableWindow).__contextMenuTable!;
      table.startRangeSelection(0, 0);
      table.updateRangeSelection(1, 1);
      table.endRangeSelection();
      table.render();
    });

    await rightClickCell(page, 1, 1);
    const selection = await page.evaluate(() => {
      return (window as TestTableWindow).__contextMenuTable!.getSelectionInfo();
    });
    expect(selection.isRange).toBe(true);
    expect(selection.cell_count).toBe(4);

    await page.getByRole('menuitem', { name: 'Cut' }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Alpha\tBeta\r\nGamma\tDelta\r\n');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('');
    await expect.poll(() => getCellValue(page, 1, 1)).toBe('');

    const undone = await page.evaluate(() => {
      return (window as TestTableWindow).__contextMenuTable!.undo();
    });
    expect(undone).toBe(true);
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('Alpha');
    await expect.poll(() => getCellValue(page, 1, 1)).toBe('Delta');
  });

  test('supports paste special actions from the built-in menu', async ({ page }) => {
    await mountContextMenuTable(page);
    await page.evaluate(() => {
      const table = (window as TestTableWindow).__contextMenuTable!;
      table.selectCell(3, 0);
      table.render();
      return navigator.clipboard.writeText('A\tB\r\nC\tD\r\n');
    });

    await rightClickCell(page, 3, 0);
    await page.getByRole('menuitem', { name: 'Paste transposed' }).click();
    await expect.poll(() => getCellValue(page, 3, 0)).toBe('A');
    await expect.poll(() => getCellValue(page, 3, 1)).toBe('C');
    await expect.poll(() => getCellValue(page, 4, 0)).toBe('B');
    await expect.poll(() => getCellValue(page, 4, 1)).toBe('D');

    await page.evaluate(() => {
      const table = (window as TestTableWindow).__contextMenuTable!;
      table.setCellValue(6, 1, 'Keep');
      table.selectCell(6, 0);
      table.render();
      return navigator.clipboard.writeText('X\t\r\nY\tZ\r\n');
    });

    await rightClickCell(page, 6, 0);
    await page.getByRole('menuitem', { name: 'Paste skip empty' }).click();
    await expect.poll(() => getCellValue(page, 6, 0)).toBe('X');
    await expect.poll(() => getCellValue(page, 6, 1)).toBe('Keep');
    await expect.poll(() => getCellValue(page, 7, 0)).toBe('Y');
    await expect.poll(() => getCellValue(page, 7, 1)).toBe('Z');
  });

  test('lets library users replace the menu with custom actions', async ({ page }) => {
    await mountContextMenuTable(page, { customOnly: true });
    await rightClickCell(page, 0, 1);
    await expect(page.getByRole('menuitem', { name: 'Copy' })).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'Inspect cell' }).click();

    await expect.poll(() => {
      return page.evaluate(() => (window as TestTableWindow).__contextMenuResult);
    }).toEqual({
      reference: 'B1',
      value: 'Beta',
      selectionCells: 1,
      recordsMode: false,
    });
  });
});
