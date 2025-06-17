// コード例ローダー
class CodeExampleLoader {
  constructor() {
    this.examples = {
      javascript: {
        title: 'JavaScript での使用例（統合版）',
        file: './code-examples/javascript.js',
        language: 'javascript'
      },
      typescript: {
        title: 'TypeScript での使用例（統合版）',
        file: './code-examples/typescript.ts',
        language: 'typescript'
      },
      react: {
        title: 'React での使用例（統合版）',
        file: './code-examples/react.jsx',
        language: 'javascript'
      },
      headers: {
        title: '列ヘッダー設定',
        content: this.getHeadersContent(),
        language: 'javascript'
      }
    };
  }

  async loadCodeExample(exampleName) {
    const example = this.examples[exampleName];
    if (!example) {
      console.error(`Code example '${exampleName}' not found`);
      return null;
    }

    try {
      let code;
      if (example.file) {
        const response = await fetch(example.file);
        if (!response.ok) {
          throw new Error(`Failed to load ${example.file}: ${response.status}`);
        }
        code = await response.text();
      } else {
        code = example.content;
      }

      return {
        title: example.title,
        code: code,
        language: example.language
      };
    } catch (error) {
      console.error(`Error loading code example '${exampleName}':`, error);
      return null;
    }
  }

  async loadAllExamples() {
    const results = {};
    for (const [name, example] of Object.entries(this.examples)) {
      results[name] = await this.loadCodeExample(name);
    }
    return results;
  }

  // ヘッダー設定の内容（静的コンテンツ）
  getHeadersContent() {
    return `// 列ヘッダー設定例
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

// ヘッダー設定を適用
table.setColumnHeaders(JSON.stringify(columnHeaders));`;
  }

  // HTMLにコード例を挿入
  renderCodeExample(containerId, codeData) {
    const container = document.getElementById(containerId);
    if (!container || !codeData) return;

    container.innerHTML = `
      <div class="code-section">
        <h3>${codeData.title}</h3>
        <pre><code class="language-${codeData.language}">${this.escapeHtml(codeData.code)}</code></pre>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 全てのコード例をロードして表示
  async initializeAllExamples() {
    const examples = await this.loadAllExamples();
    
    Object.entries(examples).forEach(([name, codeData]) => {
      this.renderCodeExample(name, codeData);
    });

    console.log('✅ All code examples loaded successfully');
  }
}

// グローバルに公開
window.CodeExampleLoader = CodeExampleLoader; 