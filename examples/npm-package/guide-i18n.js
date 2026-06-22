const STORAGE_KEY = 'wasabi-guide-locale';

export const messages = {
  en: {
    'meta.title': 'WasabiTable — Developer Guide',
    'brand.eyebrow': 'LIBRARY GUIDE // WASM + CANVAS',
    'header.subtitle': 'How to use wasabi-table in your app',
    'nav.demo': 'Live Demo',
    'nav.guide': 'Developer Guide',
    'nav.bench': 'Benchmark',
    'lang.en': 'EN',
    'lang.ja': '日本語',

    'intro.lead':
      'Practical guide for npm users — install, integrate, and see what the library can do. For architecture and release policy, see the GitHub repo.',
    'intro.demoLink': 'Try the live demo →',
    'intro.npm': 'npm install wasabi-table',

    'tier.title': 'Three integration tiers',
    'tier.lead': 'Start minimal and add depth only when you need it.',
    'tier1.tag': 'Tier 1',
    'tier1.name': 'Minimal grid (~30s)',
    'tier1.desc': 'Canvas + create + setCellValue + render. Good for prototypes and embedded grids.',
    'tier2.tag': 'Tier 2',
    'tier2.name': 'App screens',
    'tier2.desc': 'Column schema, validation, formula bar via createWasabiTableWithListeners, themes, events.',
    'tier3.tag': 'Tier 3',
    'tier3.name': 'Large data',
    'tier3.desc': 'records dataSource, filter/sort, column resize, freeze columns, row selection.',

    'quick.title': 'Quick start',
    'quick.html': 'HTML minimum',
    'quick.htmlNote': 'You need a <canvas> and a bundler or native ES modules. Node.js alone is not supported (WASM + Canvas required).',

    'cap.title': 'What you can use',
    'cap.lead': 'Feature checklist — all available from npm as of v1.x.',
    'cap.cat.core': 'Core',
    'cap.cat.edit': 'Editing & clipboard',
    'cap.cat.schema': 'Schema & validation',
    'cap.cat.data': 'Large data',
    'cap.cat.ui': 'UI & layout',
    'cap.cat.export': 'Export & lifecycle',

    'cap.core1': 'WasabiTable.create(canvas, options)',
    'cap.core2': 'createWasabiTableWithListeners — formula bar, stats, validation UI',
    'cap.core3': 'setCellValue / getCellValue / setBatchData',
    'cap.core4': 'setEventHandlers — onCellSelect, onCellChange, onEditStart/End',
    'cap.core5': 'Keyboard navigation (arrows, Tab, Enter, F2, Ctrl+Arrow jump)',
    'cap.core6': 'Range selection (Shift+arrows, Shift+drag)',
    'cap.core7': 'Themes: light / dark / createCustomTheme',

    'cap.edit1': 'Inline cell editing with IME support',
    'cap.edit2': 'Copy / cut / paste (Excel-compatible TSV)',
    'cap.edit3': 'Undo / redo (Ctrl+Z / Ctrl+Y)',
    'cap.edit4': 'Select all (Ctrl+A)',

    'cap.schema1': 'setColumnHeaders — CharField, EmailField, IntegerField, DecimalField, DateField, TimeField, BooleanField, MenuField',
    'cap.schema2': 'validateCellValue / setCellValueWithValidation',
    'cap.schema3': 'Column header dialog — sort & filter (when headers are set)',

    'cap.data1': 'dataSource: { columns, records } for sparse large datasets',
    'cap.data2': 'addFilterCondition / setSortCondition / clearAllFilters',
    'cap.data3': 'Viewport sync — WASM renders visible cells only',

    'cap.ui1': 'Column resize (drag header edge)',
    'cap.ui2': 'freeze_cols — pin left data columns',
    'cap.ui3': 'Row selection (row header click)',
    'cap.ui4': 'Touch scroll & tap (mobile)',
    'cap.ui5': 'Conditional formatting (per-cell JSON)',

    'cap.export1': 'exportTableToCSV(table, filename)',
    'cap.export2': 'table.dispose() / listeners.destroy() — cleanup for SPA',

    'code.title': 'Code examples',
    'code.lead': 'Same snippets as the live demo — pick your stack.',
    'tab.js': 'JavaScript',
    'tab.ts': 'TypeScript',
    'tab.react': 'React',
    'tab.headers': 'Column headers',

    'react.title': 'React & SPA notes',
    'react.1': 'Initialize in useEffect; call listeners.destroy() and table.dispose() on unmount.',
    'react.2': 'Strict Mode double-mount: always destroy the previous instance before creating a new one.',
    'react.3': 'Resize: call table.updateCanvasSize(w, h) when the container changes.',
    'react.4': 'See react-example.tsx in the repo for a full component.',

    'fields.title': 'Field types (column headers)',
    'fields.lead': 'Pass field_type in setColumnHeaders JSON. Validation runs on edit and via setCellValueWithValidation.',
    'fields.char': 'CharField — max_length, min_length, pattern',
    'fields.email': 'EmailField — email format',
    'fields.int': 'IntegerField — min_number, max_number',
    'fields.dec': 'DecimalField — max_digits, decimal_places',
    'fields.date': 'DateField — valid calendar dates only',
    'fields.time': 'TimeField — HH:MM format',
    'fields.bool': 'BooleanField — true/false',
    'fields.menu': 'MenuField — choices array (dropdown on edit)',

    'browser.title': 'Browser requirements',
    'browser.text':
      'Chrome 80+, Firefox 79+, Safari 14+, Edge 80+. ES modules + WebAssembly + Canvas. Does not run in Node.js without a browser environment.',
  },
  ja: {
    'meta.title': 'WasabiTable — 開発者ガイド',
    'brand.eyebrow': 'ライブラリガイド // WASM + Canvas',
    'header.subtitle': 'wasabi-table をアプリに組み込む方法',
    'nav.demo': 'ライブデモ',
    'nav.guide': '開発者ガイド',
    'nav.bench': 'ベンチマーク',
    'lang.en': 'EN',
    'lang.ja': '日本語',

    'intro.lead':
      'npm 利用者向けの実践ガイドです。インストール・組み込み・できることをまとめています。アーキテクチャやリリース方針は GitHub リポジトリを参照してください。',
    'intro.demoLink': 'ライブデモで試す →',
    'intro.npm': 'npm install wasabi-table',

    'tier.title': '3 段階の組み込みレベル',
    'tier.lead': '最小構成から始め、必要になったら機能を足していけます。',
    'tier1.tag': 'Tier 1',
    'tier1.name': '最小グリッド（約30秒）',
    'tier1.desc': 'Canvas + create + setCellValue + render。プロトタイプや埋め込み向け。',
    'tier2.tag': 'Tier 2',
    'tier2.name': '業務画面',
    'tier2.desc': '列スキーマ、検証、createWasabiTableWithListeners による数式バー、テーマ、イベント。',
    'tier3.tag': 'Tier 3',
    'tier3.name': '大規模データ',
    'tier3.desc': 'records dataSource、フィルター/ソート、列リサイズ、列固定、行選択。',

    'quick.title': 'クイックスタート',
    'quick.html': 'HTML 最小構成',
    'quick.htmlNote': '<canvas> とバンドラー（または ES modules）が必要です。Node.js 単体では動きません（WASM + Canvas 必須）。',

    'cap.title': 'このライブラリでできること',
    'cap.lead': '機能チェックリスト — npm v1.x で利用可能なもの。',
    'cap.cat.core': 'コア',
    'cap.cat.edit': '編集・クリップボード',
    'cap.cat.schema': 'スキーマ・検証',
    'cap.cat.data': '大規模データ',
    'cap.cat.ui': 'UI・レイアウト',
    'cap.cat.export': 'エクスポート・ライフサイクル',

    'cap.core1': 'WasabiTable.create(canvas, options)',
    'cap.core2': 'createWasabiTableWithListeners — 数式バー、統計、検証 UI',
    'cap.core3': 'setCellValue / getCellValue / setBatchData',
    'cap.core4': 'setEventHandlers — onCellSelect, onCellChange, onEditStart/End',
    'cap.core5': 'キーボード操作（矢印、Tab、Enter、F2、Ctrl+矢印でジャンプ）',
    'cap.core6': '範囲選択（Shift+矢印、Shift+ドラッグ）',
    'cap.core7': 'テーマ: light / dark / createCustomTheme',

    'cap.edit1': 'インライン編集（IME 対応）',
    'cap.edit2': 'コピー / カット / ペースト（Excel 互換 TSV）',
    'cap.edit3': '元に戻す / やり直し（Ctrl+Z / Ctrl+Y）',
    'cap.edit4': '全選択（Ctrl+A）',

    'cap.schema1': 'setColumnHeaders — CharField, EmailField, IntegerField, DecimalField, DateField, TimeField, BooleanField, MenuField',
    'cap.schema2': 'validateCellValue / setCellValueWithValidation',
    'cap.schema3': '列ヘッダーダイアログ — ソート・フィルター（ヘッダー設定時）',

    'cap.data1': 'dataSource: { columns, records } でスパースな大規模データ',
    'cap.data2': 'addFilterCondition / setSortCondition / clearAllFilters',
    'cap.data3': 'ビューポート同期 — 表示セルのみ WASM に反映',

    'cap.ui1': '列リサイズ（ヘッダー端ドラッグ）',
    'cap.ui2': 'freeze_cols — 左列の固定',
    'cap.ui3': '行選択（行ヘッダークリック）',
    'cap.ui4': 'タッチスクロール・タップ（モバイル）',
    'cap.ui5': '条件付き書式（セル単位 JSON）',

    'cap.export1': 'exportTableToCSV(table, filename)',
    'cap.export2': 'table.dispose() / listeners.destroy() — SPA のクリーンアップ',

    'code.title': 'コード例',
    'code.lead': 'ライブデモと同じサンプル — スタックを選んでください。',
    'tab.js': 'JavaScript',
    'tab.ts': 'TypeScript',
    'tab.react': 'React',
    'tab.headers': '列ヘッダー',

    'react.title': 'React / SPA の注意点',
    'react.1': 'useEffect で初期化。アンマウント時に listeners.destroy() と table.dispose() を呼ぶ。',
    'react.2': 'Strict Mode の二重マウント: 新インスタンス作成前に必ず前のインスタンスを破棄する。',
    'react.3': 'リサイズ: コンテナ変更時に table.updateCanvasSize(w, h) を呼ぶ。',
    'react.4': '完全なコンポーネント例はリポジトリの react-example.tsx を参照。',

    'fields.title': 'フィールドタイプ（列ヘッダー）',
    'fields.lead': 'setColumnHeaders の JSON で field_type を指定。編集時と setCellValueWithValidation で検証されます。',
    'fields.char': 'CharField — max_length, min_length, pattern',
    'fields.email': 'EmailField — メール形式',
    'fields.int': 'IntegerField — min_number, max_number',
    'fields.dec': 'DecimalField — max_digits, decimal_places',
    'fields.date': 'DateField — 暦上存在する日付のみ',
    'fields.time': 'TimeField — HH:MM 形式',
    'fields.bool': 'BooleanField — true/false',
    'fields.menu': 'MenuField — choices 配列（編集時ドロップダウン）',

    'browser.title': 'ブラウザ要件',
    'browser.text':
      'Chrome 80+, Firefox 79+, Safari 14+, Edge 80+。ES modules + WebAssembly + Canvas が必要。Node.js 単体では動作しません。',
  },
};

export function resolveLocale(requested) {
  if (requested === 'en' || requested === 'ja') return requested;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'ja') return stored;
  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

let activeLocale = 'en';

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
