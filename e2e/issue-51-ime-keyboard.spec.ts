import { expect, test } from '@playwright/test';

const DEMO_PATH = '/examples/npm-package/index.html';

type SelectedCell = { row: number; col: number };

async function focusCell(
  page: import('@playwright/test').Page,
  row = 0,
  col = 0
) {
  await page.evaluate(
    ({ row, col }) => {
      const table = (window as Window & {
        __wasabiTable?: {
          focusCanvas: () => void;
          selectCell: (row: number, col: number) => void;
        };
      }).__wasabiTable;
      if (!table) throw new Error('table not ready');
      table.selectCell(row, col);
      table.focusCanvas();
    },
    { row, col }
  );
}

async function startInlineEditing(
  page: import('@playwright/test').Page,
  row = 0,
  col = 0
) {
  await focusCell(page, row, col);
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-wasabi-editing="true"]')).toBeFocused();
}

async function getSelectedCell(
  page: import('@playwright/test').Page
): Promise<SelectedCell | undefined> {
  return page.evaluate(() => {
    const table = (window as Window & {
      __wasabiTable?: { getSelectedCell: () => SelectedCell | undefined };
    }).__wasabiTable;
    return table?.getSelectedCell();
  });
}

async function getCellValue(
  page: import('@playwright/test').Page,
  row: number,
  col: number
): Promise<string> {
  return page.evaluate(
    ({ row, col }) => {
      const table = (window as Window & {
        __wasabiTable?: { getCellValue: (row: number, col: number) => string };
      }).__wasabiTable;
      return table?.getCellValue(row, col) ?? '';
    },
    { row, col }
  );
}

test.describe('Issue 51 IME keyboard handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_PATH);
    await page.waitForSelector('[data-testid="wasabi-canvas"]', { timeout: 30_000 });
    await page.waitForFunction(
      () => (window as Window & { __wasabiTable?: unknown }).__wasabiTable != null,
      null,
      { timeout: 15_000 }
    );
    await expect(page.locator('[data-testid="wasabi-canvas"]')).toBeFocused();
  });

  test('inline editing ignores commit and cancel keys during IME composition', async ({ page }) => {
    await startInlineEditing(page);

    const results = await page.evaluate(() => {
      const input = document.querySelector(
        '[data-wasabi-editing="true"]'
      ) as HTMLInputElement | null;
      const table = (window as Window & {
        __wasabiTable?: {
          getSelectedCell: () => SelectedCell | undefined;
          isEditing: () => boolean;
        };
      }).__wasabiTable;
      if (!input || !table) throw new Error('editing input or table not ready');

      input.value = '日本語';
      input.dispatchEvent(
        new CompositionEvent('compositionstart', { bubbles: true, data: 'にほんご' })
      );

      return ['Enter', 'Tab', 'Escape'].map((key) => {
        const allowed = input.dispatchEvent(
          new KeyboardEvent('keydown', {
            key,
            code: key,
            bubbles: true,
            cancelable: true,
            isComposing: true,
            keyCode: 229,
          })
        );
        return {
          key,
          allowed,
          editing: table.isEditing(),
          selected: table.getSelectedCell(),
          inputStillMounted: input.isConnected,
        };
      });
    });

    expect(results).toEqual([
      { key: 'Enter', allowed: true, editing: true, selected: { row: 0, col: 0 }, inputStillMounted: true },
      { key: 'Tab', allowed: true, editing: true, selected: { row: 0, col: 0 }, inputStillMounted: true },
      { key: 'Escape', allowed: true, editing: true, selected: { row: 0, col: 0 }, inputStillMounted: true },
    ]);

    await page.locator('[data-wasabi-editing="true"]').evaluate((input) => {
      input.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: '日本語' })
      );
    });
    await page.keyboard.press('ArrowDown');

    expect(await getSelectedCell(page)).toEqual({ row: 1, col: 0 });
    expect(await getCellValue(page, 0, 0)).toBe('日本語');
    await expect(page.locator('[data-wasabi-editing="true"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="wasabi-canvas"]')).toBeFocused();
  });

  test('inline editing respects keyCode 229 when isComposing is false', async ({ page }) => {
    await startInlineEditing(page);

    const result = await page.locator('[data-wasabi-editing="true"]').evaluate((input) => {
      const allowed = input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          bubbles: true,
          cancelable: true,
          isComposing: false,
          keyCode: 229,
        })
      );
      return { allowed, connected: input.isConnected };
    });

    expect(result).toEqual({ allowed: true, connected: true });
    await expect(page.locator('[data-wasabi-editing="true"]')).toBeFocused();
    expect(await getSelectedCell(page)).toEqual({ row: 0, col: 0 });
  });

  test('formula bar ignores Enter and arrow navigation during IME composition', async ({ page }) => {
    const formulaInput = page.locator('#formulaInput');
    await formulaInput.focus();
    await formulaInput.fill('数式バー入力');

    const results = await formulaInput.evaluate((input) => {
      input.dispatchEvent(
        new CompositionEvent('compositionstart', { bubbles: true, data: 'すうしき' })
      );
      return ['Enter', 'ArrowDown'].map((key) => ({
        key,
        allowed: input.dispatchEvent(
          new KeyboardEvent('keydown', {
            key,
            code: key,
            bubbles: true,
            cancelable: true,
            isComposing: true,
            keyCode: 229,
          })
        ),
        focused: document.activeElement === input,
      }));
    });

    expect(results).toEqual([
      { key: 'Enter', allowed: true, focused: true },
      { key: 'ArrowDown', allowed: true, focused: true },
    ]);
    expect(await getSelectedCell(page)).toEqual({ row: 0, col: 0 });
    expect(await getCellValue(page, 0, 0)).toBe('');

    await formulaInput.evaluate((input) => {
      input.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: '数式バー入力' })
      );
    });
    await formulaInput.focus();
    await expect(formulaInput).toBeFocused();
    await formulaInput.press('Enter');

    expect(await getCellValue(page, 0, 0)).toBe('数式バー入力');
    expect(await getSelectedCell(page)).toEqual({ row: 1, col: 0 });
    await expect(page.locator('[data-wasabi-editing="true"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="wasabi-canvas"]')).toBeFocused();
  });

  test('formula bar Enter and arrows navigate exactly once', async ({ page }) => {
    const formulaInput = page.locator('#formulaInput');
    await formulaInput.focus();
    await formulaInput.fill('single-step');
    await formulaInput.press('Enter');

    expect(await getCellValue(page, 0, 0)).toBe('single-step');
    expect(await getSelectedCell(page)).toEqual({ row: 1, col: 0 });
    await expect(page.locator('[data-wasabi-editing="true"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="wasabi-canvas"]')).toBeFocused();

    await focusCell(page, 0, 0);
    await formulaInput.focus();
    await formulaInput.press('ArrowDown');

    expect(await getSelectedCell(page)).toEqual({ row: 1, col: 0 });
    await expect(page.locator('[data-testid="wasabi-canvas"]')).toBeFocused();
  });

  test('normal Enter, Tab, Escape, and arrow edit navigation remain unchanged', async ({ page }) => {
    await startInlineEditing(page);
    await page.keyboard.type('enter-value');
    await page.keyboard.press('Enter');
    expect(await getSelectedCell(page)).toEqual({ row: 1, col: 0 });
    expect(await getCellValue(page, 0, 0)).toBe('enter-value');

    await startInlineEditing(page, 1, 0);
    await page.keyboard.type('tab-value');
    await page.keyboard.press('Tab');
    expect(await getSelectedCell(page)).toEqual({ row: 1, col: 1 });
    expect(await getCellValue(page, 1, 0)).toBe('tab-value');

    await page.evaluate(() => {
      const table = (window as Window & {
        __wasabiTable?: { setCellValue: (row: number, col: number, value: string) => void };
      }).__wasabiTable;
      table?.setCellValue(1, 1, 'original');
    });
    await startInlineEditing(page, 1, 1);
    await page.keyboard.type('changed');
    await page.keyboard.press('Escape');
    expect(await getSelectedCell(page)).toEqual({ row: 1, col: 1 });
    expect(await getCellValue(page, 1, 1)).toBe('original');

    const arrowCases: Array<{ key: string; expected: SelectedCell }> = [
      { key: 'ArrowUp', expected: { row: 1, col: 2 } },
      { key: 'ArrowDown', expected: { row: 3, col: 2 } },
      { key: 'ArrowLeft', expected: { row: 2, col: 1 } },
      { key: 'ArrowRight', expected: { row: 2, col: 3 } },
    ];

    for (const { key, expected } of arrowCases) {
      await startInlineEditing(page, 2, 2);
      await page.keyboard.type(key);
      await page.keyboard.press(key);
      expect(await getSelectedCell(page)).toEqual(expected);
    }
  });
});
