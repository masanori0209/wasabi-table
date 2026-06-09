const STORAGE_KEY = 'wasabi-demo-locale';

export const messages = {
  en: {
    'meta.title': 'WasabiTable — Live Demo',
    'brand.eyebrow': 'HIGH-PERFORMANCE DATA GRID // WASM + CANVAS',
    'header.subtitle': 'High-performance Excel-like table component',
    'install.lead': 'High-performance grid library for TypeScript and JavaScript',
    'formula.placeholder': 'Enter cell value...',
    'label.rows': 'Rows',
    'label.cols': 'Cols',
    'label.colWidth': 'Col width',
    'label.rowHeight': 'Row height',
    'label.theme': 'Theme',
    'btn.updateConfig': 'Apply config',
    'btn.loadSample': 'Load sample data',
    'btn.clearFilters': 'Clear all filters',
    'btn.filterSortTest': 'Filter & sort test',
    'btn.customTheme': 'Create custom theme',
    'btn.resetTheme': 'Reset default',
    'hint.filterHeader': 'Click a column header to open sort/filter dialog',
    'tab.headers': 'Headers',
    'feature.wasm': 'Optimized performance with Rust + WebAssembly. Handles large datasets smoothly.',
    'feature.excel': 'Keyboard navigation, cell editing, and formula bar with an Excel-like feel.',
    'feature.ts': 'Full type safety and IntelliSense. Works with JavaScript and TypeScript.',
    'feature.themes': 'Customize appearance and behavior with themes and config options.',
    'feature.responsive': 'Runs in modern browsers with WebAssembly support.',
    'feature.lightweight': 'Minimal dependencies and a compact bundle footprint.',
    'kbd.arrows.html': '<strong>Arrow keys</strong>: Move selection',
    'kbd.enter.html': '<strong>Enter</strong>: Start editing / move down',
    'kbd.f2.html': '<strong>F2</strong>: Edit (keep value)',
    'kbd.tab.html': '<strong>Tab</strong>: Move right',
    'kbd.esc.html': '<strong>Escape</strong>: Cancel edit',
    'kbd.del.html': '<strong>Delete/Backspace</strong>: Clear cell',
    'kbd.copy.html': '<strong>Ctrl+C / Cmd+C</strong>: Copy',
    'kbd.cut.html': '<strong>Ctrl+X / Cmd+X</strong>: Cut',
    'kbd.paste.html': '<strong>Ctrl+V / Cmd+V</strong>: Paste',
    'kbd.undo.html': '<strong>Ctrl+Z / Cmd+Z</strong>: Undo',
    'kbd.redo.html': '<strong>Ctrl+Y / Cmd+Shift+Z</strong>: Redo',
    'kbd.selectAll.html': '<strong>Ctrl+A / Cmd+A</strong>: Select all',
    'kbd.jump.html': '<strong>Ctrl+Arrow / Cmd+Arrow</strong>: Jump to data edge (Excel-style)',
    'kbd.range.html': '<strong>Shift+Arrow</strong>: Extend range selection',
    'kbd.rangeJump.html': '<strong>Shift+Ctrl+Arrow / Shift+Cmd+Arrow</strong>: Extend selection to data edge',
    'ptr.click.html': '<strong>Click</strong>: Select cell',
    'ptr.drag.html': '<strong>Shift+click &amp; drag</strong>: Range selection',
    'ptr.wheel.html': '<strong>Wheel</strong>: Scroll',
    'ptr.dblclick.html': '<strong>Double-click</strong>: Start editing (planned)',
    'toast.sampleLoaded': 'Loaded 8 sample rows. Try filter & sort from column headers.',
    'toast.filterSort': 'Filter & sort applied: Development dept., name ascending ({filtered}/{total} rows)',
    'stats.init': 'Initializing...',
    'stats.format': 'Data {data} rows | Visible {visible} cells | Scroll ({x}, {y})',
    'stats.error': 'Init error: {msg}',
    'theme.custom': 'Custom',
    'nav.demo': 'Live Demo',
    'nav.bench': 'Benchmark',
    'lang.en': 'EN',
    'lang.ja': '日本語',
  },
  ja: {
    'meta.title': 'WasabiTable — ライブデモ',
    'brand.eyebrow': '高性能データグリッド // WASM + Canvas',
    'header.subtitle': '高性能 Excel 風テーブルコンポーネント',
    'install.lead': 'TypeScript / JavaScript 両対応の高性能グリッド・ライブラリ',
    'formula.placeholder': 'セルの内容を入力...',
    'label.rows': '行数',
    'label.cols': '列数',
    'label.colWidth': '列幅',
    'label.rowHeight': '行高',
    'label.theme': 'テーマ選択',
    'btn.updateConfig': '設定更新',
    'btn.loadSample': 'サンプルデータ読み込み',
    'btn.clearFilters': '全フィルタークリア',
    'btn.filterSortTest': 'フィルター・ソートテスト',
    'btn.customTheme': 'カスタムテーマ作成',
    'btn.resetTheme': 'デフォルトに戻す',
    'hint.filterHeader': '列ヘッダーをクリックすると、ソート・フィルターのダイアログが開きます',
    'tab.headers': 'ヘッダー設定',
    'feature.wasm': 'Rust + WebAssemblyによる最適化されたパフォーマンス。大規模データもスムーズに処理。',
    'feature.excel': 'キーボードナビゲーション、セル編集、数式バーなど、Excelライクな操作感。',
    'feature.ts': '完全な型安全性とIntelliSenseサポート。JavaScript/TypeScript両方で利用可能。',
    'feature.themes': '豊富な設定オプションで、デザインや動作を自由にカスタマイズ。',
    'feature.responsive': 'モダンブラウザ対応。WebAssemblyをサポートする環境で動作。',
    'feature.lightweight': '最小限の依存関係で、バンドルサイズを抑制。',
    'kbd.arrows.html': '<strong>矢印キー</strong>: セル移動',
    'kbd.enter.html': '<strong>Enter</strong>: 編集開始 / 下のセルに移動',
    'kbd.f2.html': '<strong>F2</strong>: 編集開始（既存値保持）',
    'kbd.tab.html': '<strong>Tab</strong>: 右のセルに移動',
    'kbd.esc.html': '<strong>Escape</strong>: 編集キャンセル',
    'kbd.del.html': '<strong>Delete/Backspace</strong>: セル内容削除',
    'kbd.copy.html': '<strong>Ctrl+C / Cmd+C</strong>: コピー',
    'kbd.cut.html': '<strong>Ctrl+X / Cmd+X</strong>: カット',
    'kbd.paste.html': '<strong>Ctrl+V / Cmd+V</strong>: ペースト',
    'kbd.undo.html': '<strong>Ctrl+Z / Cmd+Z</strong>: 元に戻す',
    'kbd.redo.html': '<strong>Ctrl+Y / Cmd+Shift+Z</strong>: やり直し',
    'kbd.selectAll.html': '<strong>Ctrl+A / Cmd+A</strong>: 全選択',
    'kbd.jump.html': '<strong>Ctrl+矢印キー / Cmd+矢印キー</strong>: データの端まで移動（Excel風）',
    'kbd.range.html': '<strong>Shift+矢印キー</strong>: 範囲選択',
    'kbd.rangeJump.html': '<strong>Shift+Ctrl+矢印キー / Shift+Cmd+矢印キー</strong>: データの端まで範囲選択',
    'ptr.click.html': '<strong>クリック</strong>: セル選択',
    'ptr.drag.html': '<strong>Shift+クリック&amp;ドラッグ</strong>: 範囲選択',
    'ptr.wheel.html': '<strong>ホイール</strong>: スクロール',
    'ptr.dblclick.html': '<strong>ダブルクリック</strong>: 編集開始（予定）',
    'toast.sampleLoaded': 'サンプルデータ 8件を読み込みました。列ヘッダーからフィルター・ソートを試せます。',
    'toast.filterSort': 'フィルター・ソート適用: 開発部で絞り込み、氏名昇順（{filtered}/{total}行）',
    'stats.init': '初期化中...',
    'stats.format': 'データ {data} 件 | 表示 {visible} セル | スクロール ({x}, {y})',
    'stats.error': '初期化エラー: {msg}',
    'theme.custom': 'カスタム',
    'nav.demo': 'ライブデモ',
    'nav.bench': 'ベンチマーク',
    'lang.en': 'EN',
    'lang.ja': '日本語',
  },
};

export function resolveLocale(requested) {
  if (requested === 'en' || requested === 'ja') return requested;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'ja') return stored;
  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

let activeLocale = 'en';

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

export function formatStats(stats) {
  return t('stats.format', {
    data: stats.dataCells,
    visible: stats.visibleCells,
    x: Math.round(stats.scrollX),
    y: Math.round(stats.scrollY),
  });
}

export function applyLocale(locale) {
  activeLocale = resolveLocale(locale);
  localStorage.setItem(STORAGE_KEY, activeLocale);
  document.documentElement.lang = activeLocale;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && 'placeholder' in el) el.placeholder = t(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.title = t(key);
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (key) el.innerHTML = t(key);
  });

  const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
  if (titleKey) document.title = t(titleKey);

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    const lang = btn.getAttribute('data-lang');
    btn.classList.toggle('is-active', lang === activeLocale);
    btn.setAttribute('aria-pressed', lang === activeLocale ? 'true' : 'false');
  });

  window.dispatchEvent(new CustomEvent('wasabi-locale-change', { detail: { locale: activeLocale } }));
}

export function initLocaleSwitcher() {
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyLocale(btn.getAttribute('data-lang'));
    });
  });
}

export function initI18n() {
  const params = new URLSearchParams(window.location.search);
  applyLocale(params.get('lang') || resolveLocale());
  initLocaleSwitcher();
}
