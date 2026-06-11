import { expect, test } from '@playwright/test';

const DEMO_PATH = '/examples/npm-package/index.html?lang=ja';

async function waitForTable(page: import('@playwright/test').Page) {
  await page.goto(DEMO_PATH);
  await page.waitForSelector('[data-testid="wasabi-canvas"]', { timeout: 30_000 });
  await page.waitForFunction(() => (window as Window & { __wasabiTable?: unknown }).__wasabiTable != null, null, {
    timeout: 15_000,
  });
}

async function loadSample(page: import('@playwright/test').Page) {
  await page.locator('[data-testid="btn-load-sample"]').click();
  await page.waitForTimeout(1500);
}

test.describe('Sample data bounds after load', () => {
  test('grid dimensions and out-of-range columns', async ({ page }) => {
    await waitForTable(page);
    await loadSample(page);

    const result = await page.evaluate(() => {
      const table = (window as {
        __wasabiTable?: {
          getConfig: () => { row_count: number; col_count: number };
          getCellValue: (r: number, c: number) => string | undefined;
          setCellValue: (r: number, c: number, v: string) => void;
          getStats: () => { dataCells: number };
        };
      }).__wasabiTable!;

      const config = table.getConfig();
      let setCol10Error: string | null = null;
      try {
        table.setCellValue(0, 10, 'should-fail');
      } catch (e) {
        setCol10Error = (e as Error).message;
      }

      return {
        row_count: config.row_count,
        col_count: config.col_count,
        col9: table.getCellValue(0, 9),
        col10Value: table.getCellValue(0, 10),
        col10AfterSet: table.getCellValue(0, 10),
        setCol10Error,
        dataCells: table.getStats().dataCells,
      };
    });

    expect(result.row_count).toBe(15);
    expect(result.col_count).toBe(10);
    expect(result.col9).toBe('true');
    expect(result.col10Value ?? '').toBe('');
    expect(result.col10AfterSet ?? '').toBe('');
    expect(result.dataCells).toBe(82); // 8 rows × 10 cols + 2 stats cells
  });

  test('rows outside sample fill are empty but editable', async ({ page }) => {
    await waitForTable(page);
    await loadSample(page);

    const before = await page.evaluate(() => {
      const table = (window as {
        __wasabiTable?: {
          getCellValue: (r: number, c: number) => string | undefined;
          setCellValue: (r: number, c: number, v: string) => void;
        };
      }).__wasabiTable!;

      return {
        row8col0: table.getCellValue(8, 0) ?? '',
        row9col0: table.getCellValue(9, 0) ?? '',
        row10col0: table.getCellValue(10, 0) ?? '',
        row10col1: table.getCellValue(10, 1) ?? '',
        row10col2: table.getCellValue(10, 2) ?? '',
        row11col0: table.getCellValue(11, 0) ?? '',
        row14col9: table.getCellValue(14, 9) ?? '',
      };
    });

    expect(before.row8col0).toBe('');
    expect(before.row9col0).toBe('');
    expect(before.row10col0).toBe('');
    expect(before.row10col1).toContain('統計');
    expect(before.row10col2).toBe('');
    expect(before.row11col0).toBe('');
    expect(before.row14col9).toBe('');

    const afterEdit = await page.evaluate(() => {
      const table = (window as {
        __wasabiTable?: {
          getCellValue: (r: number, c: number) => string | undefined;
          setCellValue: (r: number, c: number, v: string) => void;
          getStats: () => { dataCells: number };
        };
      }).__wasabiTable!;

      table.setCellValue(11, 0, 'ExtraRow');
      table.setCellValue(8, 3, 'GapFill');
      return {
        row11: table.getCellValue(11, 0),
        row8col3: table.getCellValue(8, 3),
        dataCells: table.getStats().dataCells,
      };
    });

    expect(afterEdit.row11).toBe('ExtraRow');
    expect(afterEdit.row8col3).toBe('GapFill');
    expect(afterEdit.dataCells).toBe(84);
  });

  test('prior data outside sample dimensions is cleared', async ({ page }) => {
    await waitForTable(page);

    await page.evaluate(() => {
      const table = (window as {
        __wasabiTable?: { setCellValue: (r: number, c: number, v: string) => void };
      }).__wasabiTable!;
      table.setCellValue(0, 0, 'PriorA1');
      table.setCellValue(12, 0, 'PriorRow13');
      table.setCellValue(3, 15, 'PriorCol16');
      table.setCellValue(20, 0, 'PriorRow21');
    });

    await loadSample(page);

    const result = await page.evaluate(() => {
      const table = (window as {
        __wasabiTable?: {
          getConfig: () => { row_count: number; col_count: number };
          getCellValue: (r: number, c: number) => string | undefined;
        };
      }).__wasabiTable!;

      const config = table.getConfig();
      return {
        a1: table.getCellValue(0, 0),
        row12: table.getCellValue(12, 0) ?? '',
        row20: table.getCellValue(20, 0),
        col15: table.getCellValue(3, 15),
        col_count: config.col_count,
        row_count: config.row_count,
      };
    });

    expect(result.a1).toBe('1001');
    expect(result.row12).toBe('');
    expect(result.row20 ?? '').toBe('');
    expect(result.col15 ?? '').toBe('');
    expect(result.col_count).toBe(10);
    expect(result.row_count).toBe(15);
  });

  test('re-init does not leave duplicate canvas listeners (ghost grid)', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = EventTarget.prototype.addEventListener;
      (window as Window & { __activeListeners?: Record<string, number> }).__activeListeners = {
        click: 0,
        mousedown: 0,
        wheel: 0,
      };
      EventTarget.prototype.addEventListener = function (type, listener, options) {
        const counts = (window as Window & { __activeListeners?: Record<string, number> }).__activeListeners;
        if (this instanceof HTMLCanvasElement && this.id === 'myCanvas' && counts && type in counts) {
          counts[type as string] += 1;
          const signal = options && typeof options === 'object' ? options.signal : undefined;
          if (signal) {
            signal.addEventListener('abort', () => {
              counts[type as string] -= 1;
            });
          }
        }
        return orig.call(this, type, listener, options);
      };
    });

    await waitForTable(page);
    await loadSample(page);

    const counts = await page.evaluate(() => {
      return (window as Window & { __activeListeners?: Record<string, number> }).__activeListeners;
    });

    expect(counts?.click).toBe(1);
    expect(counts?.mousedown).toBe(1);
    expect(counts?.wheel).toBe(1);

    const box = await page.locator('[data-testid="wasabi-canvas"]').boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width - 50, box!.y + 100);
    await page.waitForTimeout(300);

    const afterClick = await page.evaluate(() => {
      const table = (window as {
        __wasabiTable?: {
          getCellValue: (r: number, c: number) => string | undefined;
          getStats: () => { dataCells: number };
        };
      }).__wasabiTable!;
      return {
        a1: table.getCellValue(0, 0),
        name: table.getCellValue(0, 1),
        dataCells: table.getStats().dataCells,
      };
    });

    expect(afterClick.a1).toBe('1001');
    expect(afterClick.name).toBe('田中太郎');
    expect(afterClick.dataCells).toBe(82);
  });
});
