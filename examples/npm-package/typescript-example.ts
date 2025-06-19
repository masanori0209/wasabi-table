// このファイルは TypeScript での使用例を示すサンプルコードです（統合版）
// 実際の使用時は 'wasabi-table' パッケージをインストールしてください: npm install wasabi-table

// import { 
//   createWasabiTableWithListeners,
//   WasabiTable, 
//   WasabiTableListeners,
//   TableConfig, 
//   CellPosition, 
//   EventHandlers, 
//   CellData 
// } from 'wasabi-table';

/**
 * TypeScript での WasabiTable 使用例（統合版）
 * 
 * このファイルは、TypeScriptプロジェクトでWasabiTableを使用する方法を示しています。
 * リスナー機能が統合され、完全な型安全性とIntelliSenseサポートが提供されます。
 */

// 型定義（実際のパッケージから import されます）
interface TableConfig {
  row_count: number;
  col_count: number;
  default_col_width: number;
  default_row_height: number;
  header_height?: number;
  font_family?: string;
  font_size?: number;
  font_style?: string;
  background_color?: string;
  text_color?: string;
  grid_color?: string;
  header_background_color?: string;
  selected_cell_color?: string;
  show_grid?: boolean;
}

interface CellPosition {
  row: number;
  col: number;
}

interface EventHandlers {
  onCellSelect?: (position: CellPosition) => void;
  onEditStart?: (position: CellPosition, value: string) => void;
  onEditEnd?: (position: CellPosition, value: string) => void;
  onCellChange?: (position: CellPosition, oldValue: string, newValue: string) => void;
}

interface CellData {
  row: number;
  col: number;
  value: string;
}

// WasabiTable クラスの型定義（実際のパッケージから import されます）
declare class WasabiTable {
  static create(canvas: HTMLCanvasElement, config: Partial<TableConfig>): Promise<WasabiTable>;
  static getCellReference(row: number, col: number): string;
  
  setEventHandlers(handlers: EventHandlers): void;
  render(): void;
  setCellValue(row: number, col: number, value: string): void;
  getCellValue(row: number, col: number): string | undefined;
  setBatchData(data: CellData[]): void;
  getConfig(): TableConfig;
  getStats(): any;
  getSelectedCell(): CellPosition | null;
  selectCell(row: number, col: number): void;
  dispose(): void;
}

// カスタム設定の型定義
interface CustomTableConfig extends Partial<TableConfig> {
  theme?: 'light' | 'dark' | 'excel';
}

// アプリケーションクラス
class SpreadsheetApplication {
  private table: WasabiTable | null = null;
  private canvas: HTMLCanvasElement;
  private config: CustomTableConfig;

  constructor(canvasId: string, config: CustomTableConfig = {}) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    
    this.canvas = canvas;
    this.config = this.applyTheme(config);
  }

  /**
   * テーマを適用した設定を生成
   */
  private applyTheme(config: CustomTableConfig): CustomTableConfig {
    const baseConfig: Partial<TableConfig> = {
      row_count: 100,
      col_count: 26,
      default_col_width: 120,
      default_row_height: 28,
      header_height: 32,
      font_family: 'Arial, sans-serif',
      font_size: 12,
      show_grid: true
    };

    // テーマ別の設定
    const themeConfigs = {
      light: {
        background_color: '#ffffff',
        text_color: '#000000',
        grid_color: '#e0e0e0',
        header_background_color: '#f5f5f5',
        selected_cell_color: '#3498db'
      },
      dark: {
        background_color: '#2d3748',
        text_color: '#e2e8f0',
        grid_color: '#4a5568',
        header_background_color: '#1a202c',
        selected_cell_color: '#667eea'
      },
      excel: {
        background_color: '#ffffff',
        text_color: '#000000',
        grid_color: '#d0d7de',
        header_background_color: '#f6f8fa',
        selected_cell_color: '#0969da'
      }
    };

    const theme = config.theme || 'light';
    return {
      ...baseConfig,
      ...themeConfigs[theme],
      ...config
    };
  }

  /**
   * テーブルを初期化
   */
  async initialize(): Promise<void> {
    try {
      this.table = await WasabiTable.create(this.canvas, this.config);
      
      // イベントハンドラーを設定
      const eventHandlers: EventHandlers = {
        onCellSelect: this.handleCellSelect.bind(this),
        onEditStart: this.handleEditStart.bind(this),
        onEditEnd: this.handleEditEnd.bind(this),
        onCellChange: this.handleCellChange.bind(this)
      };

      this.table.setEventHandlers(eventHandlers);
      this.table.render();

      console.log('✅ SpreadsheetApplication initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SpreadsheetApplication:', error);
      throw error;
    }
  }

  /**
   * セル選択時のハンドラー
   */
  private handleCellSelect(position: CellPosition): void {
    const cellRef = WasabiTable.getCellReference(position.row, position.col);
    const value = this.table?.getCellValue(position.row, position.col);
    
    console.log(`📍 Cell selected: ${cellRef}`, { position, value });
    
    // 数式バーを更新
    this.updateFormulaBar(cellRef, value || '');
    
    // カスタムイベントを発火
    this.dispatchCustomEvent('cellSelect', { position, cellRef, value });
  }

  /**
   * 編集開始時のハンドラー
   */
  private handleEditStart(position: CellPosition, value: string): void {
    const cellRef = WasabiTable.getCellReference(position.row, position.col);
    console.log(`✏️ Edit started: ${cellRef} = "${value}"`);
    
    this.dispatchCustomEvent('editStart', { position, cellRef, value });
  }

  /**
   * 編集終了時のハンドラー
   */
  private handleEditEnd(position: CellPosition, value: string): void {
    const cellRef = WasabiTable.getCellReference(position.row, position.col);
    console.log(`✅ Edit ended: ${cellRef} = "${value}"`);
    
    this.dispatchCustomEvent('editEnd', { position, cellRef, value });
  }

  /**
   * セル値変更時のハンドラー
   */
  private handleCellChange(position: CellPosition, oldValue: string, newValue: string): void {
    const cellRef = WasabiTable.getCellReference(position.row, position.col);
    console.log(`🔄 Cell changed: ${cellRef}`, { oldValue, newValue });
    
    this.dispatchCustomEvent('cellChange', { position, cellRef, oldValue, newValue });
  }

  /**
   * 数式バーを更新
   */
  private updateFormulaBar(cellRef: string, value: string): void {
    const cellRefElement = document.getElementById('cellReference');
    const formulaInput = document.getElementById('formulaInput') as HTMLInputElement;
    
    if (cellRefElement) cellRefElement.textContent = cellRef;
    if (formulaInput) formulaInput.value = value;
  }

  /**
   * カスタムイベントを発火
   */
  private dispatchCustomEvent(eventType: string, detail: any): void {
    const event = new CustomEvent(`wasabi-table-${eventType}`, { detail });
    this.canvas.dispatchEvent(event);
  }

  /**
   * サンプルデータを読み込み
   */
  loadSampleData(): void {
    if (!this.table) {
      throw new Error('Table not initialized');
    }

    // ヘッダー行
    const headers = ['ID', '名前', '年齢', '職業', '給与', '部署', 'メール', '入社日', '評価', 'スキル'];
    headers.forEach((header, col) => {
      this.table!.setCellValue(0, col, header);
    });

    // サンプルデータ
    const employees = [
      { id: 1, name: '田中太郎', age: 28, job: 'エンジニア', salary: 500000, dept: '開発部', email: 'tanaka@example.com', joinDate: '2020-04-01', rating: 'A', skills: 'TypeScript,React' },
      { id: 2, name: '佐藤花子', age: 32, job: 'デザイナー', salary: 450000, dept: 'デザイン部', email: 'sato@example.com', joinDate: '2019-07-15', rating: 'B', skills: 'Figma,Photoshop' },
      { id: 3, name: '鈴木一郎', age: 45, job: 'マネージャー', salary: 700000, dept: '営業部', email: 'suzuki@example.com', joinDate: '2015-01-10', rating: 'A', skills: 'Management,Sales' },
      { id: 4, name: '高橋美咲', age: 26, job: 'マーケター', salary: 400000, dept: 'マーケティング部', email: 'takahashi@example.com', joinDate: '2021-09-01', rating: 'B', skills: 'Analytics,SEO' },
      { id: 5, name: '山田健太', age: 35, job: 'エンジニア', salary: 550000, dept: '開発部', email: 'yamada@example.com', joinDate: '2018-03-20', rating: 'A', skills: 'Python,AWS' }
    ];

    employees.forEach((employee, rowIndex) => {
      const row = rowIndex + 1;
      this.table!.setCellValue(row, 0, employee.id.toString());
      this.table!.setCellValue(row, 1, employee.name);
      this.table!.setCellValue(row, 2, employee.age.toString());
      this.table!.setCellValue(row, 3, employee.job);
      this.table!.setCellValue(row, 4, `¥${employee.salary.toLocaleString()}`);
      this.table!.setCellValue(row, 5, employee.dept);
      this.table!.setCellValue(row, 6, employee.email);
      this.table!.setCellValue(row, 7, employee.joinDate);
      this.table!.setCellValue(row, 8, employee.rating);
      this.table!.setCellValue(row, 9, employee.skills);
    });

    // 統計行
    const statsRow = employees.length + 2;
    this.table.setCellValue(statsRow, 0, '統計');
    this.table.setCellValue(statsRow, 1, '平均年齢');
    this.table.setCellValue(statsRow, 2, (employees.reduce((sum, emp) => sum + emp.age, 0) / employees.length).toFixed(1));
    this.table.setCellValue(statsRow, 3, '平均給与');
    this.table.setCellValue(statsRow, 4, `¥${Math.round(employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length).toLocaleString()}`);

    this.table.render();
  }

  /**
   * バッチデータを設定
   */
  setBatchData(data: CellData[]): void {
    if (!this.table) {
      throw new Error('Table not initialized');
    }

    this.table.setBatchData(data);
    this.table.render();
  }

  /**
   * CSVデータをエクスポート
   */
  exportToCSV(): string {
    if (!this.table) {
      throw new Error('Table not initialized');
    }

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
        break; // 空行で終了
      }
    }

    return rows.join('\n');
  }

  /**
   * CSVファイルをダウンロード
   */
  downloadCSV(filename: string = 'wasabi-table-export.csv'): void {
    const csvContent = this.exportToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  /**
   * テーブルをクリア
   */
  clearTable(): void {
    if (!this.table) {
      throw new Error('Table not initialized');
    }

    const config = this.table.getConfig();
    for (let row = 0; row < config.row_count; row++) {
      for (let col = 0; col < config.col_count; col++) {
        this.table.setCellValue(row, col, '');
      }
    }
    this.table.render();
  }

  /**
   * 統計情報を取得
   */
  getStats() {
    if (!this.table) {
      throw new Error('Table not initialized');
    }

    return this.table.getStats();
  }

  /**
   * リソースを解放
   */
  dispose(): void {
    if (this.table) {
      this.table.dispose();
      this.table = null;
    }
  }

  /**
   * テーブルインスタンスを取得（高度な操作用）
   */
  getTable(): WasabiTable | null {
    return this.table;
  }
}

// 使用例
export async function createSpreadsheetApp(): Promise<SpreadsheetApplication> {
  const app = new SpreadsheetApplication('myCanvas', {
    theme: 'excel',
    row_count: 50,
    col_count: 20,
    default_col_width: 140,
    default_row_height: 30
  });

  await app.initialize();
  return app;
}

// DOM読み込み完了後の初期化例
export function initializeOnDOMReady(): void {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const app = await createSpreadsheetApp();
      
      // カスタムイベントリスナーを設定
      const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
      
      canvas.addEventListener('wasabi-table-cellSelect', (event: CustomEvent) => {
        console.log('Custom cell select event:', event.detail);
      });

      canvas.addEventListener('wasabi-table-cellChange', (event: CustomEvent) => {
        console.log('Custom cell change event:', event.detail);
      });

      // サンプルデータを読み込み
      app.loadSampleData();

      // グローバルに公開（デバッグ用）
      (window as any).spreadsheetApp = app;
      
      console.log('🚀 Spreadsheet application ready!');
    } catch (error) {
      console.error('Failed to initialize spreadsheet application:', error);
    }
  });
}

// React Hook の例（React をインストールして使用してください: npm install react @types/react）
/*
import React from 'react';

export function useWasabiTable(canvasRef: React.RefObject<HTMLCanvasElement>, config?: CustomTableConfig) {
  const [table, setTable] = React.useState<WasabiTable | null>(null);
  const [selectedCell, setSelectedCell] = React.useState<CellPosition | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initTable = async () => {
      if (!canvasRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        const wasabiTable = await WasabiTable.create(canvasRef.current, config || {});
        
        wasabiTable.setEventHandlers({
          onCellSelect: (position: CellPosition) => {
            setSelectedCell(position);
          }
        });

        wasabiTable.render();
        setTable(wasabiTable);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    initTable();

    return () => {
      if (table) {
        table.dispose();
      }
    };
  }, [canvasRef, config]);

  return {
    table,
    selectedCell,
    isLoading,
    error,
    setCellValue: (row: number, col: number, value: string) => {
      table?.setCellValue(row, col, value);
      table?.render();
    },
    getCellValue: (row: number, col: number) => table?.getCellValue(row, col),
    render: () => table?.render()
  };
}
*/

export default SpreadsheetApplication; 