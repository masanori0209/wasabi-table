import { expect, test } from '@playwright/test';

const DEMO_PATH = '/examples/npm-package/index.html?lang=ja';

async function waitForTable(page: import('@playwright/test').Page) {
  await page.waitForSelector('[data-testid="wasabi-canvas"]', { timeout: 30_000 });
  await page.waitForFunction(() => (window as Window & { __wasabiTable?: unknown }).__wasabiTable != null, null, {
    timeout: 15_000,
  });
}

async function loadSampleData(page: import('@playwright/test').Page) {
  await page.locator('[data-testid="btn-load-sample"]').click();
  await page.waitForTimeout(1200);
}

async function clickCanvasPoint(
  page: import('@playwright/test').Page,
  x: number,
  y: number
) {
  const canvas = page.locator('[data-testid="wasabi-canvas"]');
  await canvas.click({ position: { x, y } });
}

async function getCornerPoint(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const table = (window as { __wasabiTable?: { getSelectAllCornerZone: () => { x: number; y: number } } })
      .__wasabiTable;
    return table!.getSelectAllCornerZone();
  });
}

async function getColumnZones(page: import('@playwright/test').Page, col: number) {
  return page.evaluate((columnIndex) => {
    const table = (window as {
      __wasabiTable?: {
        getColumnHeaderZones: (col: number) => {
          select: { x: number; y: number };
          filter: { x: number; y: number };
          hasFilterControl: boolean;
        } | null;
      };
    }).__wasabiTable;
    return table!.getColumnHeaderZones(columnIndex);
  }, col);
}

async function getRowHeaderPoint(page: import('@playwright/test').Page, row: number) {
  return page.evaluate((dataRow) => {
    const table = (window as {
      __wasabiTable?: { getRowHeaderZone: (row: number) => { x: number; y: number } | null };
    }).__wasabiTable;
    return table!.getRowHeaderZone(dataRow);
  }, row);
}

test.describe('Header row/column/all selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForTable(page);
  });

  test('corner click selects entire sheet', async ({ page }) => {
    const corner = await getCornerPoint(page);
    await clickCanvasPoint(page, corner.x, corner.y);

    const config = await page.evaluate(() => {
      const table = (window as { __wasabiTable?: { getConfig: () => { row_count: number; col_count: number } } })
        .__wasabiTable;
      return table!.getConfig();
    });

    const lastCol = String.fromCharCode(65 + Math.min(config.col_count, 26) - 1);
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText(
      `A1:${lastCol}${config.row_count}`
    );
  });

  test('Ctrl+A selects entire sheet', async ({ page }) => {
    const canvas = page.locator('[data-testid="wasabi-canvas"]');
    await canvas.click({ position: { x: 110, y: 44 } });
    await canvas.focus();
    await page.keyboard.press('ControlOrMeta+A');

    const config = await page.evaluate(() => {
      const table = (window as { __wasabiTable?: { getConfig: () => { row_count: number; col_count: number } } })
        .__wasabiTable;
      return table!.getConfig();
    });

    const lastCol = String.fromCharCode(65 + Math.min(config.col_count, 26) - 1);
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText(
      `A1:${lastCol}${config.row_count}`
    );
  });

  test('row header click selects full row', async ({ page }) => {
    const rowPoint = await getRowHeaderPoint(page, 2);
    expect(rowPoint).not.toBeNull();
    await clickCanvasPoint(page, rowPoint!.x, rowPoint!.y);

    const config = await page.evaluate(() => {
      const table = (window as { __wasabiTable?: { getConfig: () => { col_count: number } } }).__wasabiTable;
      return table!.getConfig();
    });
    const lastCol = String.fromCharCode(65 + Math.min(config.col_count, 26) - 1);
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText(`A3:${lastCol}3`);
  });

  test('column header body click selects full column', async ({ page }) => {
    await loadSampleData(page);

    const zones = await getColumnZones(page, 1);
    expect(zones).not.toBeNull();
    await clickCanvasPoint(page, zones!.select.x, zones!.select.y);

    const config = await page.evaluate(() => {
      const table = (window as { __wasabiTable?: { getConfig: () => { row_count: number } } }).__wasabiTable;
      return table!.getConfig();
    });
    await expect(page.locator('[data-testid="cell-reference"]')).toHaveText(`B1:B${config.row_count}`);
  });

  test('column filter control opens dialog without selecting column', async ({ page }) => {
    await loadSampleData(page);

    const zones = await getColumnZones(page, 5);
    expect(zones?.hasFilterControl).toBe(true);
    await clickCanvasPoint(page, zones!.filter.x, zones!.filter.y);

    await expect(page.locator('.wasabi-header-dialog')).toBeVisible();
    await expect(page.locator('[data-testid="cell-reference"]')).not.toHaveText(/B1:B/);
  });

  test('column select works after closing filter dialog', async ({ page }) => {
    await loadSampleData(page);

    const zones = await getColumnZones(page, 1);
    await clickCanvasPoint(page, zones!.select.x, zones!.select.y);
    await expect(page.locator('[data-testid="cell-reference"]')).toContainText('B1:B');

    await clickCanvasPoint(page, zones!.filter.x, zones!.filter.y);
    await expect(page.locator('.wasabi-header-dialog')).toBeVisible();

    await page.getByRole('button', { name: 'ソートをクリア' }).click();
    await expect(page.locator('.wasabi-header-dialog')).toHaveCount(0);

    await clickCanvasPoint(page, zones!.select.x, zones!.select.y);
    await expect(page.locator('[data-testid="cell-reference"]')).toContainText('B1:B');
  });
});
