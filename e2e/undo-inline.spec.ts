import { expect, test } from '@playwright/test';

const DEMO_PATH = '/examples/npm-package/index.html';

async function focusCanvas(page: import('@playwright/test').Page) {
  const canvas = page.locator('[data-testid="wasabi-canvas"]');
  await canvas.click({ position: { x: 110, y: 44 } });
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

async function inlineEditCell(
  page: import('@playwright/test').Page,
  value: string
) {
  await page.keyboard.press('Enter');
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
}

test.describe('Undo/redo with inline editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_PATH);
    await page.waitForSelector('[data-testid="wasabi-canvas"]', { timeout: 30_000 });
    await page.waitForFunction(() => (window as Window & { __wasabiTable?: unknown }).__wasabiTable != null, null, {
      timeout: 15_000,
    });
    await focusCanvas(page);
  });

  test('inline edit can be undone and redone', async ({ page }) => {
    await inlineEditCell(page, 'InlineUndo');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('InlineUndo');

    await focusCanvas(page);
    await page.keyboard.press('ControlOrMeta+Z');
    await expect(page.locator('[data-testid="wasabi-toast"].toast-info')).toContainText('変更を元に戻しました（1件）');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('');

    await focusCanvas(page);
    await page.keyboard.press('ControlOrMeta+Shift+Z');
    await expect(page.locator('[data-testid="wasabi-toast"].toast-redo').last()).toContainText('やり直しました（1件）');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('InlineUndo');
  });

  test('inline edit committed by arrow key can be undone', async ({ page }) => {
    await page.keyboard.press('Enter');
    await page.keyboard.type('ArrowCommit');
    await page.keyboard.press('ArrowRight');

    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('B1');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('ArrowCommit');

    await focusCanvas(page);
    await page.keyboard.press('ControlOrMeta+Z');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('');
    await expect(page.locator('#formulaInput')).toHaveValue('');
  });

  test('repeated inline edit cycle supports undo for each commit', async ({ page }) => {
    await inlineEditCell(page, 'first');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('first');

    await focusCanvas(page);
    await page.keyboard.press('ArrowRight');
    await inlineEditCell(page, 'second');
    await expect.poll(() => getCellValue(page, 0, 1)).toBe('second');

    await focusCanvas(page);
    await page.keyboard.press('ControlOrMeta+Z');
    await expect.poll(() => getCellValue(page, 0, 1)).toBe('');

    await focusCanvas(page);
    await page.keyboard.press('ControlOrMeta+Z');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('');
  });

  test('clicking another cell while editing records undo', async ({ page }) => {
    await page.keyboard.press('Enter');
    await page.keyboard.type('ClickAway');

    const canvas = page.locator('[data-testid="wasabi-canvas"]');
    await canvas.click({ position: { x: 210, y: 44 } });
    await canvas.focus();

    await expect.poll(() => getCellValue(page, 0, 0)).toBe('ClickAway');
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('B1');

    await page.keyboard.press('ControlOrMeta+Z');
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('');
  });

  test('escape cancel does not create undo history', async ({ page }) => {
    await page.keyboard.press('Enter');
    await page.keyboard.type('ShouldCancel');
    await page.keyboard.press('Escape');

    const canUndo = await page.evaluate(() => {
      const table = (window as { __wasabiTable?: { canUndo: () => boolean } }).__wasabiTable;
      return table?.canUndo?.() ?? false;
    });
    expect(canUndo).toBe(false);
    await expect.poll(() => getCellValue(page, 0, 0)).toBe('');
  });
});
