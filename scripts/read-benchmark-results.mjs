import { chromium } from 'playwright';

const url = 'http://localhost:8501/examples/npm-package/benchmark.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('[data-testid=btn-run-bench]');
await page.waitForFunction(() => {
  const el = document.querySelector('[data-testid=bench-row-scroll-fps] .bench-metric');
  return el?.textContent?.includes('FPS');
}, { timeout: 120000 });

const rows = await page.$$eval('[data-testid^=bench-row-]', (trs) =>
  trs.map((tr) => ({
    id: tr.getAttribute('data-testid')?.replace('bench-row-', '') ?? '',
    label: tr.querySelector('td')?.textContent?.trim() ?? '',
    result: tr.querySelector('.bench-metric')?.textContent?.trim() ?? '',
    detail: tr.querySelectorAll('td')[2]?.textContent?.trim() ?? '',
  }))
);

console.log(JSON.stringify(rows, null, 2));
await browser.close();
