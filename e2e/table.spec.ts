import { expect, test } from '@playwright/test';

const DEMO_PATH = '/examples/npm-package/index.html?lang=ja';

async function getDataCellCount(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const table = (window as Window & { __wasabiTable?: { getStats: () => { dataCells: number } } }).__wasabiTable;
    return table?.getStats()?.dataCells ?? 0;
  });
}

async function clickFirstCell(page: import('@playwright/test').Page) {
  const canvas = page.locator('[data-testid="wasabi-canvas"]');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await canvas.click({ position: { x: 110, y: 44 } });
}

async function setCellViaFormulaBar(
  page: import('@playwright/test').Page,
  value: string
) {
  await page.locator('#formulaInput').fill(value);
  await page.locator('#formulaInput').press('Enter');
}

async function focusCanvas(page: import('@playwright/test').Page) {
  const canvas = page.locator('[data-testid="wasabi-canvas"]');
  await canvas.click({ position: { x: 110, y: 44 } });
  await canvas.focus();
}

async function cellCenterFromApi(
  page: import('@playwright/test').Page,
  row: number,
  col: number
): Promise<{ x: number; y: number }> {
  return page.evaluate(
    ({ r, c }) => {
      const table = (window as {
        __wasabiTable?: { getCellScreenPosition: (row: number, col: number) => { centerX: number; centerY: number } };
      }).__wasabiTable;
      const pos = table!.getCellScreenPosition(r, c);
      return { x: pos.centerX, y: pos.centerY };
    },
    { r: row, c: col }
  );
}

async function clickCell(
  page: import('@playwright/test').Page,
  row: number,
  col: number
) {
  const canvas = page.locator('[data-testid="wasabi-canvas"]');
  const { x, y } = await cellCenterFromApi(page, row, col);
  await canvas.click({ position: { x, y } });
  await canvas.focus();
}

async function dragSelectRange(
  page: import('@playwright/test').Page,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
) {
  const canvas = page.locator('[data-testid="wasabi-canvas"]');
  const start = await cellCenterFromApi(page, startRow, startCol);
  const end = await cellCenterFromApi(page, endRow, endCol);
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  // 録画でカーソル軌跡を見せる
  await page.mouse.move(box!.x + start.x, box!.y + start.y);
  for (let i = 1; i <= 10; i++) {
    const x = start.x + ((end.x - start.x) * i) / 10;
    const y = start.y + ((end.y - start.y) * i) / 10;
    await page.mouse.move(box!.x + x, box!.y + y);
  }

  await page.evaluate(
    ({ sr, sc, er, ec }) => {
      const canvas = document.querySelector('[data-testid="wasabi-canvas"]') as HTMLCanvasElement | null;
      const table = (window as { __wasabiTable?: { getCellScreenPosition: (row: number, col: number) => { centerX: number; centerY: number } } })
        .__wasabiTable;
      if (!canvas || !table) throw new Error('canvas or table not ready');
      const from = table.getCellScreenPosition(sr, sc);
      const to = table.getCellScreenPosition(er, ec);
      const rect = canvas.getBoundingClientRect();
      const fire = (type: string, x: number, y: number, buttons = 0) => {
        canvas.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + x,
            clientY: rect.top + y,
            button: 0,
            buttons,
          })
        );
      };
      fire('mousedown', from.centerX, from.centerY, 1);
      for (let i = 1; i <= 8; i++) {
        const x = from.centerX + ((to.centerX - from.centerX) * i) / 8;
        const y = from.centerY + ((to.centerY - from.centerY) * i) / 8;
        fire('mousemove', x, y, 1);
      }
      fire('mouseup', to.centerX, to.centerY, 0);
    },
    { sr: startRow, sc: startCol, er: endRow, ec: endCol }
  );
  await canvas.focus();
}

async function getCellValue(
  page: import('@playwright/test').Page,
  row: number,
  col: number
): Promise<string> {
  return page.evaluate(
    ({ r, c }) => {
      const table = (window as { __wasabiTable?: { getCellValue: (row: number, col: number) => string } })
        .__wasabiTable;
      return table?.getCellValue(r, c) ?? '';
    },
    { r: row, c: col }
  );
}

test.describe('WasabiTable demo', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(DEMO_PATH);
    await page.waitForSelector('[data-testid="wasabi-canvas"]', { timeout: 30_000 });
    await page.waitForFunction(() => (window as Window & { __wasabiTable?: unknown }).__wasabiTable != null, null, {
      timeout: 15_000,
    });
  });

  test('canvas and formula bar are rendered', async ({ page }) => {
    await expect(page.locator('[data-testid="wasabi-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('A1');
    await expect(page.locator('#formulaInput')).toBeVisible();
  });

  test('clicking a cell keeps A1 selected', async ({ page }) => {
    await clickFirstCell(page);
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('A1');
  });

  test('formula bar input updates cell value', async ({ page }) => {
    await clickFirstCell(page);
    await setCellViaFormulaBar(page, 'Hello Wasabi');
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('A2');
    await expect.poll(() => getDataCellCount(page)).toBe(1);
  });

  test('sample data load button works', async ({ page }) => {
    await page.locator('[data-testid="btn-load-sample"]').click();
    await expect.poll(() => getDataCellCount(page), { timeout: 15_000 }).toBeGreaterThan(10);
  });

  test('keyboard navigation moves selection', async ({ page }) => {
    await clickFirstCell(page);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('B1');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('B2');
  });

  test('Tab key moves to next column', async ({ page }) => {
    await clickFirstCell(page);
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('B1');
  });

  test('theme can be switched to dark', async ({ page }) => {
    await page.locator('#themeSelect').selectOption('dark');
    await expect(page.locator('#themeSelect')).toHaveValue('dark');
    await expect(page.locator('[data-testid="wasabi-canvas"]')).toBeVisible();
  });

  test.describe('Clipboard and history', () => {
    test.describe.configure({ mode: 'serial' });

    test('copy via keyboard shortcut', async ({ page }) => {
      await clickFirstCell(page);
      await setCellViaFormulaBar(page, 'CopyMe');
      await clickFirstCell(page);
      await expect(page.locator('#formulaInput')).toHaveValue('CopyMe');
      await page.keyboard.press('ControlOrMeta+C');
      await expect
        .poll(async () => page.evaluate(() => navigator.clipboard.readText()))
        .toBe('CopyMe');
    });

    test('paste via keyboard shortcut', async ({ page }) => {
    await clickFirstCell(page);
    await page.evaluate(() => navigator.clipboard.writeText('PastedValue'));
    await page.keyboard.press('ControlOrMeta+V');
    await expect(page.locator('#formulaInput')).toHaveValue('PastedValue');
    await expect.poll(() => getDataCellCount(page)).toBe(1);
    });

    test('rectangular range copy and paste', async ({ page }) => {
      await focusCanvas(page);
      await page.evaluate(() => navigator.clipboard.writeText('Alpha\tBeta\nGamma\tDelta'));
      await page.keyboard.press('ControlOrMeta+V');
      await expect.poll(() => getCellValue(page, 0, 0)).toBe('Alpha');
      await expect.poll(() => getCellValue(page, 0, 1)).toBe('Beta');
      await expect.poll(() => getCellValue(page, 1, 0)).toBe('Gamma');
      await expect.poll(() => getCellValue(page, 1, 1)).toBe('Delta');

      await focusCanvas(page);
      await page.keyboard.press('Shift+ArrowRight');
      await page.keyboard.press('Shift+ArrowDown');
      await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('A1:B2');

      await page.keyboard.press('ControlOrMeta+C');
      await expect
        .poll(async () => page.evaluate(() => navigator.clipboard.readText()))
        .toBe('Alpha\tBeta\nGamma\tDelta');

      await focusCanvas(page);
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('ArrowRight');
      }
      await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('D1');

      await page.keyboard.press('ControlOrMeta+V');
      await expect.poll(() => getCellValue(page, 0, 3)).toBe('Alpha');
      await expect.poll(() => getCellValue(page, 0, 4)).toBe('Beta');
      await expect.poll(() => getCellValue(page, 1, 3)).toBe('Gamma');
      await expect.poll(() => getCellValue(page, 1, 4)).toBe('Delta');
    });

    test('undo restores pasted range', async ({ page }) => {
      await focusCanvas(page);
      await setCellViaFormulaBar(page, 'keep');
      await clickCell(page, 0, 1);
      await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('B1');
      await page.evaluate(() => navigator.clipboard.writeText('paste1\tpaste2'));
      await page.keyboard.press('ControlOrMeta+V');
      await expect.poll(() => getCellValue(page, 0, 1)).toBe('paste1');

      await focusCanvas(page);
      await page.keyboard.press('ControlOrMeta+Z');
      await expect.poll(() => getCellValue(page, 0, 1)).toBe('');
      await expect.poll(() => getCellValue(page, 0, 0)).toBe('keep');
    });

    test('cut clears selection and undo restores', async ({ page }) => {
      await focusCanvas(page);
      await setCellViaFormulaBar(page, 'CutTarget');
      await focusCanvas(page);
      await expect(page.locator('#formulaInput')).toHaveValue('CutTarget');

      await focusCanvas(page);
      await page.keyboard.press('ControlOrMeta+X');
      await expect(page.locator('#formulaInput')).toHaveValue('');
      await expect
        .poll(async () => page.evaluate(() => navigator.clipboard.readText()))
        .toBe('CutTarget');

      await focusCanvas(page);
      await page.keyboard.press('ControlOrMeta+Z');
      await expect.poll(() => getCellValue(page, 0, 0)).toBe('CutTarget');
    });
  });

  test('shift+arrow extends range selection', async ({ page }) => {
    await focusCanvas(page);
    await page.keyboard.press('Shift+ArrowRight');
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('A1:B1');
  });

  test('shift+arrow builds rectangular range selection', async ({ page }) => {
    await focusCanvas(page);
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowDown');
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('A1:C2');
  });

  test('mouse drag selects rectangular range', async ({ page }) => {
    await dragSelectRange(page, 0, 0, 1, 2);
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('A1:C2');
  });

  test('undo shows toast notification', async ({ page }) => {
    await focusCanvas(page);
    await setCellViaFormulaBar(page, 'ToastUndo');
    await focusCanvas(page);
    await page.keyboard.press('ControlOrMeta+Z');
    await expect(page.locator('[data-testid="wasabi-toast"].toast-info')).toContainText('変更を元に戻しました（1件）');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('');
  });

  test('redo shows toast notification', async ({ page }) => {
    await focusCanvas(page);
    await setCellViaFormulaBar(page, 'ToastRedo');
    await focusCanvas(page);
    await page.keyboard.press('ControlOrMeta+Z');
    await focusCanvas(page);
    await page.keyboard.press('ControlOrMeta+Shift+Z');
    await expect(page.locator('[data-testid="wasabi-toast"].toast-redo').last()).toContainText('やり直しました（1件）');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('ToastRedo');
  });

  test('undo and redo cell edits', async ({ page }) => {
    await focusCanvas(page);
    await setCellViaFormulaBar(page, 'UndoMe');
    await focusCanvas(page);
    await expect(page.locator('#formulaInput')).toHaveValue('UndoMe');

    await focusCanvas(page);
    await page.keyboard.press('ControlOrMeta+Z');
    await expect(page.locator('#formulaInput')).toHaveValue('');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('');

    await focusCanvas(page);
    await page.keyboard.press('ControlOrMeta+Shift+Z');
    await expect(page.locator('#formulaInput')).toHaveValue('UndoMe');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('UndoMe');
  });

  test('wheel scroll updates scroll position in stats', async ({ page }) => {
    await clickFirstCell(page);
    const statsBefore = await page.locator('#stats').textContent();
    const canvas = page.locator('[data-testid="wasabi-canvas"]');
    await canvas.hover();
    await page.mouse.wheel(0, 200);
    await expect(page.locator('#stats')).not.toHaveText(statsBefore ?? '');
  });

  test('filter and sort test button runs after sample data load', async ({ page }) => {
    await page.locator('[data-testid="btn-load-sample"]').click();
    await expect.poll(() => getDataCellCount(page), { timeout: 15_000 }).toBeGreaterThan(10);

    await page.locator('[data-testid="btn-filter-sort-test"]').click();
    await expect(page.locator('[data-testid="wasabi-canvas"]')).toBeVisible();
  });

  test('clear all filters button works after filter test', async ({ page }) => {
    await page.locator('[data-testid="btn-load-sample"]').click();
    await expect.poll(() => getDataCellCount(page), { timeout: 15_000 }).toBeGreaterThan(10);

    await page.locator('[data-testid="btn-filter-sort-test"]').click();
    await page.locator('[data-testid="btn-clear-filters"]').click();
    await expect(page.locator('[data-testid="wasabi-canvas"]')).toBeVisible();
  });
});
