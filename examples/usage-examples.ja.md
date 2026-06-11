# WasabiTable 使用例

[English](./usage-examples.md)

## インストール

```bash
npm install wasabi-table
```

## JavaScript での使用例

### `createWasabiTableWithListeners` による初期化（推奨）

```javascript
import { createWasabiTableWithListeners } from 'wasabi-table';

// 数式バー・統計表示と連携する初期化
async function initTable() {
  const canvas = document.getElementById('myCanvas');
  
  // テーブルとリスナーを同時に作成
  const { table, listeners } = await createWasabiTableWithListeners(
    canvas,
    {
      row_count: 50,
      col_count: 10,
      default_col_width: 120,
      default_row_height: 30
    },
    {
      cellReferenceSelector: '#cellReference',
      formulaInputSelector: '#formulaInput',
      statsElementSelector: '#stats'
    }
  );

  // セルに値を設定
  table.setCellValue(0, 0, 'Hello');
  table.setCellValue(0, 1, 'World');
  table.setCellValue(1, 0, '数値');
  table.setCellValue(1, 1, '123.45');

  // 複数のセルを一括設定
  const data = [
    { row: 2, col: 0, value: 'バッチ' },
    { row: 2, col: 1, value: 'データ' },
    { row: 3, col: 0, value: '設定' },
    { row: 3, col: 1, value: '例' }
  ];
  table.setBatchData(data);

  // イベントハンドラーを設定
  table.setEventHandlers({
    onCellSelect: (position) => {
      console.log(`セル選択: ${WasabiTable.getCellReference(position.row, position.col)}`);
      console.log(`値: ${table.getCellValue(position.row, position.col) || '(空)'}`);
    },
    onCellChange: (position, oldValue, newValue) => {
      console.log(`セル変更: ${WasabiTable.getCellReference(position.row, position.col)}`);
      console.log(`${oldValue} → ${newValue}`);
    }
  });

  // テーブルをレンダリング
  table.render();

  // 統計情報を表示
  const stats = table.getStats();
  console.log('統計情報:', stats);
}

initTable().catch(console.error);
```

## TypeScript での使用例

```typescript
import { 
  createWasabiTableWithListeners,
  WasabiTable, 
  WasabiTableListeners,
  TableConfig, 
  CellPosition, 
  EventHandlers 
} from 'wasabi-table';

class SpreadsheetApp {
  private table: WasabiTable | null = null;
  private listeners: WasabiTableListeners | null = null;
  private canvas: HTMLCanvasElement;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    this.canvas = canvas;
  }

  async initialize(): Promise<void> {
    const config: Partial<TableConfig> = {
      row_count: 100,
      col_count: 26,
      default_col_width: 100,
      default_row_height: 25,
      font_family: 'Arial, sans-serif',
      font_size: 12
    };

    // createWasabiTableWithListeners で初期化
    const { table, listeners } = await createWasabiTableWithListeners(
      this.canvas,
      config,
      {
        cellReferenceSelector: '#cellReference',
        formulaInputSelector: '#formulaInput',
        statsElementSelector: '#stats'
      },
      {
        enableValidation: true,
        enableIMESupport: true
      }
    );

    this.table = table;
    this.listeners = listeners;

    const eventHandlers: EventHandlers = {
      onCellSelect: this.handleCellSelect.bind(this),
      onEditStart: this.handleEditStart.bind(this),
      onEditEnd: this.handleEditEnd.bind(this),
      onCellChange: this.handleCellChange.bind(this)
    };

    this.table.setEventHandlers(eventHandlers);
    this.table.render();
  }

  private handleCellSelect(position: CellPosition): void {
    const cellRef = WasabiTable.getCellReference(position.row, position.col);
    const value = this.table?.getCellValue(position.row, position.col);
    
    console.log(`選択セル: ${cellRef}, 値: ${value || '(空)'}`);
    
    // 数式バーを更新
    this.updateFormulaBar(cellRef, value || '');
  }

  private handleEditStart(position: CellPosition, value: string): void {
    console.log(`編集開始: ${WasabiTable.getCellReference(position.row, position.col)}`);
  }

  private handleEditEnd(position: CellPosition, value: string): void {
    console.log(`編集終了: ${WasabiTable.getCellReference(position.row, position.col)} = ${value}`);
  }

  private handleCellChange(position: CellPosition, oldValue: string, newValue: string): void {
    console.log(`セル変更: ${WasabiTable.getCellReference(position.row, position.col)}`);
    console.log(`変更: "${oldValue}" → "${newValue}"`);
  }

  private updateFormulaBar(cellRef: string, value: string): void {
    const cellRefElement = document.getElementById('cellReference');
    const formulaInput = document.getElementById('formulaInput') as HTMLInputElement;
    
    if (cellRefElement) cellRefElement.textContent = cellRef;
    if (formulaInput) formulaInput.value = value;
  }

  public loadSampleData(): void {
    if (!this.table) return;

    // ヘッダー行
    const headers = ['名前', '年齢', '職業', '給与', '部署'];
    headers.forEach((header, col) => {
      this.table!.setCellValue(0, col, header);
    });

    // サンプルデータ
    const sampleData = [
      ['田中太郎', '28', 'エンジニア', '500000', '開発部'],
      ['佐藤花子', '32', 'デザイナー', '450000', 'デザイン部'],
      ['鈴木一郎', '45', 'マネージャー', '700000', '営業部'],
      ['高橋美咲', '26', 'マーケター', '400000', 'マーケティング部']
    ];

    sampleData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        this.table!.setCellValue(rowIndex + 1, colIndex, cell);
      });
    });

    this.table.render();
  }

  public exportToCSV(): string {
    if (!this.table) return '';

    const config = this.table.getConfig();
    const rows: string[] = [];

    for (let row = 0; row < config.row_count; row++) {
      const cells: string[] = [];
      let hasData = false;

      for (let col = 0; col < config.col_count; col++) {
        const value = this.table.getCellValue(row, col) || '';
        cells.push(`"${value.replace(/"/g, '""')}"`);
        if (value) hasData = true;
      }

      if (hasData) {
        rows.push(cells.join(','));
      } else if (rows.length > 0) {
        // 空行だが、前に行がある場合は追加
        rows.push(cells.join(','));
      }
    }

    return rows.join('\n');
  }

  public dispose(): void {
    if (this.table) {
      this.table.dispose();
      this.table = null;
    }
  }
}

// 使用例
const app = new SpreadsheetApp('myCanvas');
app.initialize().then(() => {
  app.loadSampleData();
  console.log('スプレッドシートアプリが初期化されました');
}).catch(console.error);
```

## HTML例

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WasabiTable Example</title>
    <style>
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .formula-bar {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            gap: 10px;
        }
        .cell-reference {
            padding: 5px 10px;
            border: 1px solid #ccc;
            background: #f5f5f5;
            min-width: 60px;
            text-align: center;
        }
        .formula-input {
            flex: 1;
            padding: 5px;
            border: 1px solid #ccc;
        }
        #myCanvas {
            border: 1px solid #ddd;
            cursor: crosshair;
        }
        .controls {
            margin-top: 10px;
        }
        .controls button {
            margin-right: 10px;
            padding: 5px 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>WasabiTable Example</h1>
        
        <div class="formula-bar">
            <div id="cellReference" class="cell-reference">A1</div>
            <input type="text" id="formulaInput" class="formula-input" placeholder="セルの内容...">
        </div>
        
        <canvas id="myCanvas" width="1000" height="600"></canvas>
        
        <div class="controls">
            <button onclick="loadSampleData()">サンプルデータ読み込み</button>
            <button onclick="exportCSV()">CSV出力</button>
            <button onclick="clearTable()">クリア</button>
        </div>
        
        <div id="stats"></div>
    </div>

    <script type="module">
        import { WasabiTable } from 'wasabi-table';
        
        let table = null;
        
        async function init() {
            const canvas = document.getElementById('myCanvas');
            table = await WasabiTable.create(canvas);
            
            table.setEventHandlers({
                onCellSelect: (position) => {
                    const cellRef = WasabiTable.getCellReference(position.row, position.col);
                    const value = table.getCellValue(position.row, position.col) || '';
                    
                    document.getElementById('cellReference').textContent = cellRef;
                    document.getElementById('formulaInput').value = value;
                }
            });
            
            table.render();
        }
        
        window.loadSampleData = () => {
            if (!table) return;
            
            // サンプルデータを設定
            const data = [];
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 5; col++) {
                    data.push({
                        row,
                        col,
                        value: `${WasabiTable.getColumnName(col)}${row + 1}`
                    });
                }
            }
            
            table.setBatchData(data);
            table.render();
        };
        
        window.exportCSV = () => {
            if (!table) return;
            
            // CSV出力の実装
            console.log('CSV出力機能は実装中です');
        };
        
        window.clearTable = () => {
            if (!table) return;
            
            // テーブルをクリア
            const config = table.getConfig();
            for (let row = 0; row < config.row_count; row++) {
                for (let col = 0; col < config.col_count; col++) {
                    table.setCellValue(row, col, '');
                }
            }
            table.render();
        };
        
        init().catch(console.error);
    </script>
</body>
</html>
```

## 主な機能

- ✅ **高性能レンダリング**: WebAssembly + Canvas による高速描画
- ✅ **Excel風操作**: キーボードナビゲーション、セル編集
- ✅ **TypeScript対応**: 完全な型安全性
- ✅ **イベントハンドリング**: セル選択、編集、変更イベント
- ✅ **バッチ操作**: 複数セルの一括設定
- ✅ **統計情報**: パフォーマンス監視
- ✅ **メモリ効率**: 必要に応じたリソース管理

## ブラウザ対応

- Chrome 80+
- Firefox 79+
- Safari 14+
- Edge 80+

WebAssemblyをサポートするモダンブラウザで動作します。