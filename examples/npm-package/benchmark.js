import { WasabiTable } from '../../dist/index.js';
import { getLocale, t } from './benchmark-i18n.js';

const PACKAGE_VERSION = '0.1.3';
const GRID_SIZES = [
  { rows: 100, cols: 20 },
  { rows: 1000, cols: 20 },
  { rows: 5000, cols: 20 },
  { rows: 10000, cols: 20 },
];

const RETRO_THEME = () =>
  WasabiTable.createCustomTheme('dark', {
    background_color: '#0a100c',
    text_color: '#b8f070',
    grid_color: '#2a4030',
    header_background_color: '#141f19',
    selected_cell_color: '#7cb342',
    range_selection_color: 'rgba(124, 179, 66, 0.28)',
    editing_cell_color: '#9fda6c',
  });

export function formatMs(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatRate(count, ms) {
  if (ms <= 0) return '—';
  return `${Math.round(count / (ms / 1000)).toLocaleString(getLocale() === 'ja' ? 'ja-JP' : 'en-US')}/s`;
}

function shortUserAgent() {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return ua.match(/Chrome\/[\d.]+/)?.[0] ?? ua.slice(0, 48);
  if (ua.includes('Firefox/')) return ua.match(/Firefox\/[\d.]+/)?.[0] ?? ua.slice(0, 48);
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return ua.match(/Version\/[\d.]+/)?.[0] ?? 'Safari';
  return ua.slice(0, 56);
}

export function collectEnvironment() {
  const memory = performance.memory;
  return {
    browser: shortUserAgent(),
    dpr: String(window.devicePixelRatio || 1),
    memory: memory
      ? `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} / ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0)} MB`
      : '—',
    version: PACKAGE_VERSION,
    ranAt: '—',
  };
}

function setupCanvas(canvas) {
  const container = canvas.parentElement;
  const width = (container?.clientWidth ?? 800) - 4;
  const height = 320;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (ctx && dpr !== 1) ctx.scale(dpr, dpr);
  return { width, height };
}

function selectAllSheet(table) {
  const cfg = table.getConfig();
  table.startRangeSelection(0, 0);
  table.updateRangeSelection(cfg.row_count - 1, cfg.col_count - 1);
  table.endRangeSelection();
  table.render();
}

async function createSizedTable(canvas, rows, cols) {
  const size = setupCanvas(canvas);
  const initStart = performance.now();
  const table = await WasabiTable.create(canvas, {
    row_count: rows,
    col_count: cols,
    default_col_width: 100,
    default_row_height: 25,
  });
  table.applyTheme(RETRO_THEME());
  const initMs = performance.now() - initStart;

  const renderStart = performance.now();
  table.render();
  const renderMs = performance.now() - renderStart;

  if (size.width && size.height) {
    table.updateCanvasSize(size.width, size.height);
    table.render();
  }

  return { table, initMs, renderMs };
}

async function measureScrollFps(canvas, table) {
  const durationMs = 2000;
  let frames = 0;
  const start = performance.now();

  const frameLoop = () => {
    frames += 1;
    if (performance.now() - start < durationMs) requestAnimationFrame(frameLoop);
  };
  requestAnimationFrame(frameLoop);

  const wheelInterval = window.setInterval(() => {
    canvas.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 120, deltaX: 0, bubbles: true, cancelable: true })
    );
  }, 16);

  await new Promise((resolve) => window.setTimeout(resolve, durationMs + 50));
  window.clearInterval(wheelInterval);

  const elapsed = (performance.now() - start) / 1000;
  const fps = frames / elapsed;
  const stats = table.getStats();
  return { fps, frames, scrollY: Math.round(stats.scrollY) };
}

/**
 * @param {{ onProgress?: (ratio: number) => void, onRow?: (row: object) => void }} hooks
 */
export async function runBenchmarkSuite(hooks = {}) {
  const canvas = document.getElementById('benchCanvas');
  if (!canvas) throw new Error('benchCanvas not found');

  const results = [];
  const totalSteps = GRID_SIZES.length + 5;
  let step = 0;

  const progress = (ratio) => hooks.onProgress?.(ratio);
  const emit = (row) => {
    const existing = results.findIndex((r) => r.id === row.id);
    if (existing >= 0) results[existing] = row;
    else results.push(row);
    hooks.onRow?.(row);
  };

  let scrollTable = null;

  for (const { rows, cols } of GRID_SIZES) {
    const id = `init-${rows}x${cols}`;
    emit({ id, status: 'running', label: t('test.init', { rows, cols }), result: '…', detail: '' });
    const { table, initMs, renderMs } = await createSizedTable(canvas, rows, cols);
    const total = initMs + renderMs;
    emit({
      id,
      status: 'pass',
      label: t('test.init', { rows, cols }),
      result: formatMs(total),
      detail: t('detail.init', { init: formatMs(initMs), render: formatMs(renderMs) }),
      ms: total,
    });
    if (rows === 1000) scrollTable = table;
    step += 1;
    progress(step / totalSteps);
    await new Promise((r) => requestAnimationFrame(r));
  }

  const benchTable = scrollTable ?? (await createSizedTable(canvas, 1000, 20)).table;

  // Fill cells
  {
    const id = 'fill-cells';
    const count = 5000;
    emit({ id, status: 'running', label: t('test.fill', { count }), result: '…', detail: '' });
    const fillStart = performance.now();
    for (let i = 0; i < count; i += 1) {
      const row = i % benchTable.getConfig().row_count;
      const col = i % benchTable.getConfig().col_count;
      benchTable.setCellValue(row, col, `v${i}`, { recordUndo: false });
    }
    benchTable.render();
    const fillMs = performance.now() - fillStart;
    emit({
      id,
      status: 'pass',
      label: t('test.fill', { count }),
      result: formatMs(fillMs),
      detail: t('detail.fill', { rate: formatRate(count, fillMs) }),
      ms: fillMs,
    });
    step += 1;
    progress(step / totalSteps);
  }

  // Render loop
  {
    const id = 'render-loop';
    const count = 60;
    emit({ id, status: 'running', label: t('test.render', { count }), result: '…', detail: '' });
    const renderStart = performance.now();
    for (let i = 0; i < count; i += 1) benchTable.render();
    const renderMs = performance.now() - renderStart;
    emit({
      id,
      status: 'pass',
      label: t('test.render', { count }),
      result: formatMs(renderMs),
      detail: t('detail.render', {
        rate: formatRate(count, renderMs),
        avg: formatMs(renderMs / count),
      }),
      ms: renderMs,
    });
    step += 1;
    progress(step / totalSteps);
  }

  // Select all
  {
    const id = 'select-all';
    const cfg = benchTable.getConfig();
    emit({
      id,
      status: 'running',
      label: t('test.selectAll', { rows: cfg.row_count, cols: cfg.col_count }),
      result: '…',
      detail: '',
    });
    const selectStart = performance.now();
    selectAllSheet(benchTable);
    const selectMs = performance.now() - selectStart;
    emit({
      id,
      status: 'pass',
      label: t('test.selectAll', { rows: cfg.row_count, cols: cfg.col_count }),
      result: formatMs(selectMs),
      detail: benchTable.getSelectionInfo().cell_count?.toLocaleString() ?? '—',
      ms: selectMs,
    });
    step += 1;
    progress(step / totalSteps);
  }

  // Copy selection
  {
    const id = 'copy-selection';
    emit({ id, status: 'running', label: t('test.copy'), result: '…', detail: '' });
    const copyStart = performance.now();
    const tsv = benchTable.copySelection();
    const copyMs = performance.now() - copyStart;
    emit({
      id,
      status: 'pass',
      label: t('test.copy'),
      result: formatMs(copyMs),
      detail: t('detail.copy', { bytes: tsv.length.toLocaleString(), ms: formatMs(copyMs) }),
      ms: copyMs,
    });
    step += 1;
    progress(step / totalSteps);
  }

  // Scroll FPS
  {
    const id = 'scroll-fps';
    emit({ id, status: 'running', label: t('test.scroll'), result: '…', detail: '' });
    benchTable.selectCell(0, 0);
    benchTable.render();
    const { fps, frames, scrollY } = await measureScrollFps(canvas, benchTable);
    emit({
      id,
      status: 'pass',
      label: t('test.scroll'),
      result: `${fps.toFixed(1)} FPS`,
      detail: t('detail.scroll', { fps: fps.toFixed(1), frames }),
      ms: null,
      extra: `scrollY=${scrollY}`,
    });
    step += 1;
    progress(1);
  }

  return results;
}
