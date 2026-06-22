const STORAGE_KEY = 'wasabi-benchmark-locale';

export const messages = {
  en: {
    'meta.title': 'WasabiTable — Performance Benchmark',
    'brand.eyebrow': 'PERFORMANCE BENCHMARK // WASM + CANVAS',
    'header.subtitle': 'Live measurements from your browser',
    'nav.demo': 'Live Demo',
    'nav.guide': 'Developer Guide',
    'nav.bench': 'Benchmark',
    'status.idle': 'Ready',
    'status.running': 'Running…',
    'status.done': 'Complete',
    'btn.run': 'Run benchmarks',
    'btn.rerun': 'Run again',
    'env.browser': 'Browser',
    'env.dpr': 'Device pixel ratio',
    'env.memory': 'JS heap (Chrome)',
    'env.version': 'Package version',
    'env.ranAt': 'Last run',
    'col.test': 'Test',
    'col.result': 'Result',
    'col.detail': 'Detail',
    'section.env': 'Environment',
    'section.results': 'Results',
    'section.live': 'Live grid (scroll test)',
    'footnote':
      'Results vary by device, browser, and load. Sparse init tests use an empty grid. Records init (1M×5) uses a reference records array (viewport sync only, no full WASM copy). Standard scroll FPS uses 1,000×20. Memory is shown only when performance.memory is available (Chromium).',
    'test.init': 'Init + first render ({rows}×{cols})',
    'test.recordsInit': 'Records init + render ({rows}×{cols})',
    'test.recordsScroll': 'Records scroll FPS ({rows} rows)',
    'test.fill': 'Fill {count} cells',
    'test.render': 'Render ×{count}',
    'test.selectAll': 'Select all ({rows}×{cols})',
    'test.copy': 'Copy selection (TSV bytes)',
    'test.scroll': 'Scroll FPS (2s wheel)',
    'detail.init': 'create() {init} + render() {render}',
    'detail.recordsInit':
      'create() {create} + render() {render} · {records} records · {mode}',
    'detail.recordsMode': 'JS reference (viewport sync only)',
    'detail.fill': '{rate} cells/s',
    'detail.render': '{rate} renders/s, avg {avg}',
    'detail.copy': '{bytes} bytes in {ms}',
    'detail.scroll': '~{fps} FPS ({frames} frames / 2s)',
    'lang.en': 'EN',
    'lang.ja': '日本語',
  },
  ja: {
    'meta.title': 'WasabiTable — パフォーマンスベンチマーク',
    'brand.eyebrow': 'PERFORMANCE BENCHMARK // WASM + CANVAS',
    'header.subtitle': 'お使いのブラウザで実測した数値',
    'nav.demo': 'ライブデモ',
    'nav.guide': '開発者ガイド',
    'nav.bench': 'ベンチマーク',
    'status.idle': '待機中',
    'status.running': '計測中…',
    'status.done': '完了',
    'btn.run': 'ベンチマーク実行',
    'btn.rerun': '再実行',
    'env.browser': 'ブラウザ',
    'env.dpr': 'デバイスピクセル比',
    'env.memory': 'JS ヒープ (Chrome)',
    'env.version': 'パッケージ版',
    'env.ranAt': '最終実行',
    'col.test': 'テスト',
    'col.result': '結果',
    'col.detail': '詳細',
    'section.env': '実行環境',
    'section.results': '計測結果',
    'section.live': 'ライブグリッド（スクロールテスト）',
    'footnote':
      '結果は端末・ブラウザ・負荷により変動します。スパース初期化は空グリッドです。Records 初期化（100万×5）は参照型 records 配列（表示行のみ WASM 同期）です。通常スクロール FPS は 1,000×20。メモリは performance.memory が使える Chromium のみ表示します。',
    'test.init': '初期化 + 初回描画 ({rows}×{cols})',
    'test.recordsInit': 'Records 初期化 + 描画 ({rows}×{cols})',
    'test.recordsScroll': 'Records スクロール FPS ({rows} 行)',
    'test.fill': '{count} セル書き込み',
    'test.render': '描画 ×{count}',
    'test.selectAll': '全選択 ({rows}×{cols})',
    'test.copy': '選択範囲コピー (TSV)',
    'test.scroll': 'スクロール FPS (2s ホイール)',
    'detail.init': 'create() {init} + render() {render}',
    'detail.recordsInit':
      'create() {create} + render() {render} · {records} records · {mode}',
    'detail.recordsMode': 'JS 参照（表示行のみ WASM 同期）',
    'detail.fill': '{rate} cells/s',
    'detail.render': '{rate} renders/s, 平均 {avg}',
    'detail.copy': '{bytes} bytes / {ms}',
    'detail.scroll': '約 {fps} FPS ({frames} frames / 2s)',
    'lang.en': 'EN',
    'lang.ja': '日本語',
  },
};

let activeLocale = 'en';

export function resolveLocale(requested) {
  if (requested === 'en' || requested === 'ja') return requested;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'ja') return stored;
  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export function getLocale() {
  return activeLocale;
}

export function t(key, vars = {}) {
  const table = messages[activeLocale] || messages.en;
  let text = table[key] ?? messages.en[key] ?? key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

export function applyLocale(locale) {
  activeLocale = resolveLocale(locale);
  localStorage.setItem(STORAGE_KEY, activeLocale);
  document.documentElement.lang = activeLocale;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });

  const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
  if (titleKey) document.title = t(titleKey);

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    const lang = btn.getAttribute('data-lang');
    btn.classList.toggle('is-active', lang === activeLocale);
    btn.setAttribute('aria-pressed', lang === activeLocale ? 'true' : 'false');
  });

  window.dispatchEvent(new CustomEvent('wasabi-bench-locale-change'));
}

export function initLocaleSwitcher() {
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => applyLocale(btn.getAttribute('data-lang')));
  });
}

export function initI18n() {
  const params = new URLSearchParams(window.location.search);
  applyLocale(params.get('lang') || resolveLocale());
  initLocaleSwitcher();
}
