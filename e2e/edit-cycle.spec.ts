import { expect, test } from '@playwright/test';

const DEMO_PATH = '/examples/npm-package/index.html';

async function focusCanvas(page: import('@playwright/test').Page) {
  const canvas = page.locator('[data-testid="wasabi-canvas"]');
  await canvas.click({ position: { x: 110, y: 44 } });
  await canvas.focus();
}

test.describe('Edit cycle stress', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_PATH);
    await page.waitForSelector('[data-testid="wasabi-canvas"]', { timeout: 30_000 });
    await page.waitForFunction(() => (window as Window & { __wasabiTable?: unknown }).__wasabiTable != null, null, {
      timeout: 15_000,
    });
  });

  test('repeated enter-edit-enter-arrow cycle stays consistent', async ({ page }) => {
    await focusCanvas(page);

    const positions: string[] = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Enter');
      await page.waitForFunction(
        () => document.querySelectorAll('[data-wasabi-editing="true"]').length === 1,
        null,
        { timeout: 3000 }
      );
      await page.keyboard.type(`v${i}`);
      await page.keyboard.press('Enter');
      await page.waitForFunction(
        () => document.querySelectorAll('[data-wasabi-editing="true"]').length === 0,
        null,
        { timeout: 3000 }
      );
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      const ref = await page.locator('[data-testid="cell-reference"]').textContent();
      positions.push(ref ?? '');
      const orphanInputs = await page.evaluate(
        () => document.querySelectorAll('[data-wasabi-editing="true"]').length
      );
      expect(orphanInputs).toBe(0);
    }

    expect(new Set(positions).size).toBeGreaterThan(1);
    await expect(page.locator('[data-testid="cell-reference"]')).not.toHaveText('A1');
  });

  test('arrow during inline edit commits value and moves selection', async ({ page }) => {
    await focusCanvas(page);
    await page.keyboard.press('Enter');
    await page.keyboard.type('hello');
    await page.keyboard.press('ArrowRight');

    const editingCount = await page.evaluate(
      () => document.querySelectorAll('[data-wasabi-editing="true"]').length
    );
    expect(editingCount).toBe(0);

    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText('B1');
    const value = await page.evaluate(() => {
      const table = (window as { __wasabiTable?: { getCellValue: (r: number, c: number) => string } })
        .__wasabiTable;
      return table?.getCellValue(0, 0) ?? '';
    });
    expect(value).toBe('hello');
  });

  test('canvas keeps focus after repeated edit cycles', async ({ page }) => {
    await focusCanvas(page);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Enter');
      await page.keyboard.type('x');
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowRight');
    }

    const active = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="wasabi-canvas"]');
      return document.activeElement === canvas;
    });
    expect(active).toBe(true);

    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => document.querySelectorAll('[data-wasabi-editing="true"]').length === 1,
      null,
      { timeout: 3000 }
    );
  });
});
