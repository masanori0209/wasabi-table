import { initI18n } from './guide-i18n.js';
import javascriptCode from './code-examples/javascript.js?raw';
import typescriptCode from './code-examples/typescript.ts?raw';
import reactCode from './code-examples/react.jsx?raw';

const HEADERS_CODE = `// 列ヘッダー設定例
const columnHeaders = [
  {
    name: "employee_id",
    display_name: "社員ID",
    width: 80,
    required: true,
    order: 0,
    is_visible: true,
    field_type: "IntegerField",
    min_number: 1000,
    max_number: 9999
  },
  {
    name: "department",
    display_name: "部署",
    width: 120,
    required: true,
    order: 1,
    is_visible: true,
    field_type: "MenuField",
    choices: ["開発部", "営業部", "総務部", "人事部"]
  },
  {
    name: "salary",
    display_name: "月給",
    width: 100,
    required: false,
    order: 2,
    is_visible: true,
    field_type: "DecimalField",
    max_digits: 8,
    decimal_places: 0
  }
];

table.setColumnHeaders(JSON.stringify(columnHeaders));`;

const EXAMPLES = {
  javascript: { title: 'JavaScript', code: javascriptCode, language: 'javascript' },
  typescript: { title: 'TypeScript', code: typescriptCode, language: 'typescript' },
  react: { title: 'React', code: reactCode, language: 'javascript' },
  headers: { title: 'Column headers', code: HEADERS_CODE, language: 'javascript' },
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderExample(containerId, { title, code, language }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="code-section">
      <h3>${escapeHtml(title)}</h3>
      <pre><code class="language-${language}">${escapeHtml(code)}</code></pre>
    </div>
  `;
}

function showTab(name) {
  document.querySelectorAll('.tab[data-tab]').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === name);
  });
  document.querySelectorAll('.tab-content').forEach((panel) => {
    panel.classList.toggle('active', panel.id === name);
  });
}

export function initGuide() {
  initI18n();

  document.querySelectorAll('.tab[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => showTab(tab.dataset.tab));
  });

  for (const [name, example] of Object.entries(EXAMPLES)) {
    renderExample(name, example);
  }
}

initGuide();
