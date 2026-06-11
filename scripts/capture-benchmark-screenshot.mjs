import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = 'http://localhost:8501/examples/npm-package/benchmark.html';
const outPath = 'e2e/screenshots/benchmark-full-page.png';

await mkdir('e2e/screenshots', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('[data-testid=btn-run-bench]');
await page.waitForSelector('[data-testid=bench-row-scroll-fps] .bench-metric', {
  timeout: 120000,
});
await page.waitForFunction(() => {
  const el = document.querySelector('[data-testid=bench-row-scroll-fps] .bench-metric');
  return el?.textContent?.includes('FPS');
});
await page.waitForTimeout(800);
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(`saved ${outPath}`);
