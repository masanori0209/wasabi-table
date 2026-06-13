import { WasabiTable } from '../../dist/index.js';
import { generateSampleRecords, SAMPLE_RECORD_COLUMNS } from './benchmark-data.js';
import { getLocale, t } from './benchmark-i18n.js';

const PACKAGE_VERSION = '0.1.4';
const GRID_SIZES = [
  { rows: 100, cols: 20 },
  { rows: 1000, cols: 20 },
  { rows: 5000, cols: 20 },
  { rows: 10000, cols: 20 },
  { rows: 1_000_000, cols: 20 },
];

function formatCount(n) {
  return n.toLocaleString(getLocale() === 'ja' ? 'ja-JP' : 'en-US');
}

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
  const totalSteps = GRID_SIZES.length + 7;
  let step = 0;

  const progress = (ratio) => hooks.onProgress?.(ratio);
  const emit = (row) => {
    const existing = results.findIndex((r) => r.id === row.id);
    if (existing >= 0) results[existing] = row;
    else results.push(row);
    hooks.onRow?.(row);
  };

  let lastInitTable = null;

  for (const { rows, cols } of GRID_SIZES) {
    if (lastInitTable) {
      lastInitTable.dispose();
      lastInitTable = null;
    }

    const id = `init-${rows}x${cols}`;
    const sizeLabel = { rows: formatCount(rows), cols };
    emit({ id, status: 'running', label: t('test.init', sizeLabel), result: '…', detail: '' });
    const { table, initMs, renderMs } = await createSizedTable(canvas, rows, cols);
    lastInitTable = table;
    const total = initMs + renderMs;
    emit({
      id,
      status: 'pass',
      label: t('test.init', sizeLabel),
      result: formatMs(total),
      detail: t('detail.init', { init: formatMs(initMs), render: formatMs(renderMs) }),
      ms: total,
    });
    step += 1;
    progress(step / totalSteps);
    await new Promise((r) => requestAnimationFrame(r));
  }

  if (lastInitTable) {
    lastInitTable.dispose();
    lastInitTable = null;
  }

  const { table: benchTable } = await createSizedTable(canvas, 1000, 20);

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
    progress(step / totalSteps);
  }

  // Records reference init (1M rows)
  {
    const rows = 1_000_000;
    const cols = SAMPLE_RECORD_COLUMNS.length;
    const id = `init-records-${rows}x${cols}`;
    const sizeLabel = { rows: formatCount(rows), cols };
    emit({
      id,
      status: 'running',
      label: t('test.recordsInit', sizeLabel),
      result: '…',
      detail: '',
    });

    let recordsTable = null;
    try {
      const records = generateSampleRecords(rows);
      const createStart = performance.now();
      recordsTable = await WasabiTable.create(canvas, {
        dataSource: { records, columns: SAMPLE_RECORD_COLUMNS },
        default_col_width: 100,
        default_row_height: 25,
      });
      recordsTable.applyTheme(RETRO_THEME());
      const createMs = performance.now() - createStart;

      const renderStart = performance.now();
      recordsTable.render();
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      const renderMs = performance.now() - renderStart;
      const total = createMs + renderMs;

      emit({
        id,
        status: 'pass',
        label: t('test.recordsInit', sizeLabel),
        result: formatMs(total),
        detail: t('detail.recordsInit', {
          create: formatMs(createMs),
          render: formatMs(renderMs),
          records: formatCount(rows),
          mode: t('detail.recordsMode'),
        }),
        ms: total,
      });
      step += 1;
      progress(step / totalSteps);

      const scrollId = `scroll-fps-records-${rows}`;
      emit({
        id: scrollId,
        status: 'running',
        label: t('test.recordsScroll', sizeLabel),
        result: '…',
        detail: '',
      });
      recordsTable.selectCell(0, 0);
      recordsTable.render();
      const { fps, frames, scrollY } = await measureScrollFps(canvas, recordsTable);
      emit({
        id: scrollId,
        status: 'pass',
        label: t('test.recordsScroll', sizeLabel),
        result: `${fps.toFixed(1)} FPS`,
        detail: t('detail.scroll', { fps: fps.toFixed(1), frames }) + ` · scrollY=${scrollY}`,
        ms: null,
      });
      step += 1;
      progress(step / totalSteps);
    } finally {
      recordsTable?.dispose();
    }
  }

  progress(1);

  // 計測後にライブグリッドを初期状態へ復元（スクロール位置・DOM をリセット）
  benchTable.dispose();
  const { table: liveTable } = await createSizedTable(canvas, 1000, 20);
  liveTable.selectCell(0, 0);
  liveTable.render();

  return results;
}
