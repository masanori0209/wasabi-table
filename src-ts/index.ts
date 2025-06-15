import init, { NinjaTable as WasmNinjaTable } from '../pkg/ninja_table.js';

/**
 * テーブル設定のインターface
 */
export interface TableConfig {
  /** 行数 */
  row_count: number;
  /** 列数 */
  col_count: number;
  /** デフォルト列幅 */
  default_col_width: number;
  /** デフォルト行高 */
  default_row_height: number;
  /** ヘッダー高 */
  header_height: number;
  /** 行ヘッダー幅 */
  row_header_width: number;
  /** フォントファミリー */
  font_family: string;
  /** フォントサイズ */
  font_size: number;
  /** フォントスタイル */
  font_style: string;
  /** フォント太さ */
  font_weight: string;
  /** 背景色 */
  background_color: string;
  /** テキスト色 */
  text_color: string;
  /** グリッド色 */
  grid_color: string;
  /** ヘッダー背景色 */
  header_background_color: string;
  /** 選択セル色 */
  selected_cell_color: string;
  /** グリッド表示フラグ */
  show_grid: boolean;
  /** 列ヘッダー設定 */
  column_headers: ColumnHeader[];
}

/**
 * セルデータのインターface
 */
export interface CellData {
  /** セルの値 */
  value: string;
  /** 行インデックス */
  row: number;
  /** 列インデックス */
  col: number;
}

/**
 * セル位置のインターface
 */
export interface CellPosition {
  /** 行インデックス */
  row: number;
  /** 列インデックス */
  col: number;
}

/**
 * テーブル統計情報のインターface
 */
export interface TableStats {
  /** 総セル数 */
  totalCells: number;
  /** 表示セル数 */
  visibleCells: number;
  /** データセル数 */
  dataCells: number;
  /** 水平スクロール位置 */
  scrollX: number;
  /** 垂直スクロール位置 */
  scrollY: number;
  /** 表示行範囲 */
  visibleRows: {
    start: number;
    end: number;
  };
  /** 表示列範囲 */
  visibleCols: {
    start: number;
    end: number;
  };
}

/**
 * イベントハンドラーの型定義
 */
export interface EventHandlers {
  /** セル選択時のコールバック */
  onCellSelect?: (position: CellPosition) => void;
  /** セル編集開始時のコールバック */
  onEditStart?: (position: CellPosition, value: string) => void;
  /** セル編集終了時のコールバック */
  onEditEnd?: (position: CellPosition, value: string) => void;
  /** セル値変更時のコールバック */
  onCellChange?: (position: CellPosition, oldValue: string, newValue: string) => void;
}

/**
 * デフォルトのテーブル設定
 */
export const DEFAULT_CONFIG: TableConfig = {
  row_count: 100,
  col_count: 26,
  default_col_width: 100,
  default_row_height: 25,
  header_height: 30,
  row_header_width: 50,
  font_family: "Arial, sans-serif",
  font_size: 12,
  font_style: "normal",
  font_weight: "normal",
  background_color: "#ffffff",
  text_color: "#000000",
  grid_color: "#cccccc",
  header_background_color: "#f0f0f0",
  selected_cell_color: "#3498db",
  show_grid: true,
  column_headers: []
};

/**
 * フィールドタイプの列挙型
 */
export enum FieldType {
  CharField = "CharField",
  EmailField = "EmailField", 
  TextareaField = "TextareaField",
  IntegerField = "IntegerField",
  DecimalField = "DecimalField",
  DecimalWithNullField = "DecimalWithNullField",
  DateField = "DateField",
  TimeField = "TimeField",
  CheckField = "CheckField",
  BooleanField = "BooleanField",
  ButtonField = "ButtonField",
  MenuField = "MenuField"
}

/**
 * 列ヘッダー設定のインターface
 */
export interface ColumnHeader {
  /** プロパティ名（内部識別用） */
  name: string;
  /** 表示名（ヘッダーに表示される名前） */
  display_name: string;
  /** 列の幅（ピクセル） */
  width: number;
  /** 必須入力項目かどうか */
  required: boolean;
  /** 表示順序 */
  order: number;
  /** 表示/非表示フラグ */
  is_visible: boolean;
  /** フィールドタイプ */
  field_type: FieldType | string;
  /** 最大文字数（文字列フィールド用） */
  max_length?: number;
  /** 整数桁数（数値フィールド用） */
  max_digits?: number;
  /** 小数点桁数（小数フィールド用） */
  decimal_places?: number;
  /** 最小値（数値フィールド用） */
  min_number?: number;
  /** 最大値（数値フィールド用） */
  max_number?: number;
  /** 選択肢（メニューフィールド用） */
  choices?: string[];
}

/**
 * NinjaTable - 高性能なExcel風テーブルコンポーネント
 * 
 * @example
 * ```typescript
 * import { NinjaTable } from 'ninja-table';
 * 
 * const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
 * const table = await NinjaTable.create(canvas, {
 *   row_count: 50,
 *   col_count: 10
 * });
 * 
 * // セルに値を設定
 * table.setCellValue(0, 0, 'Hello World');
 * 
 * // テーブルをレンダリング
 * table.render();
 * ```
 */
export class NinjaTable {
  private wasmTable: WasmNinjaTable;
  private config: TableConfig;
  private eventHandlers: EventHandlers = {};
  private isInitialized = false;

  private constructor(
    wasmTable: WasmNinjaTable,
    config: TableConfig
  ) {
    this.wasmTable = wasmTable;
    this.config = config;
    this.setupEventHandlers();
  }

  /**
   * NinjaTableインスタンスを作成
   * 
   * @param canvas - レンダリング対象のCanvasElement
   * @param config - テーブル設定（オプション）
   * @returns NinjaTableインスタンス
   */
  public static async create(
    canvas: HTMLCanvasElement,
    config: Partial<TableConfig> = {}
  ): Promise<NinjaTable> {
    // WebAssemblyモジュールを初期化
    await init();

    const finalConfig: TableConfig = { ...DEFAULT_CONFIG, ...config };
    const wasmTable = new WasmNinjaTable(canvas, JSON.stringify(finalConfig));
    
    const table = new NinjaTable(wasmTable, finalConfig);
    table.isInitialized = true;
    
    return table;
  }

  /**
   * イベントハンドラーを設定
   */
  public setEventHandlers(handlers: EventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * セルに値を設定
   * 
   * @param row - 行インデックス
   * @param col - 列インデックス
   * @param value - 設定する値
   */
  public setCellValue(row: number, col: number, value: string): void {
    this.ensureInitialized();
    this.wasmTable.set_cell_data(row, col, value);
  }

  /**
   * セルの値を取得
   * 
   * @param row - 行インデックス
   * @param col - 列インデックス
   * @returns セルの値（存在しない場合はundefined）
   */
  public getCellValue(row: number, col: number): string | undefined {
    this.ensureInitialized();
    return this.wasmTable.get_cell_data(row, col) || undefined;
  }

  /**
   * 複数のセルデータを一括設定
   * 
   * @param data - セルデータの配列
   */
  public setBatchData(data: CellData[]): void {
    this.ensureInitialized();
    const jsonData = JSON.stringify(data.map(cell => ({
      value: cell.value,
      row: cell.row,
      col: cell.col,
      width: this.config.default_col_width,
      height: this.config.default_row_height,
      background_color: null,
      text_color: null,
      font_style: null,
      font_weight: null,
      text_decoration: null,
      format: null
    })));
    this.wasmTable.set_batch_data(jsonData);
  }

  /**
   * テーブルをレンダリング
   */
  public render(): void {
    this.ensureInitialized();
    this.wasmTable.render();
  }

  /**
   * セルを選択
   * 
   * @param row - 行インデックス
   * @param col - 列インデックス
   */
  public selectCell(row: number, col: number): void {
    this.ensureInitialized();
    const x = col * this.config.default_col_width;
    const y = row * this.config.default_row_height + this.config.header_height;
    this.wasmTable.select_cell(x, y);
  }

  /**
   * 現在選択されているセルの位置を取得
   * 
   * @returns 選択セルの位置（選択されていない場合はundefined）
   */
  public getSelectedCell(): CellPosition | undefined {
    this.ensureInitialized();
    const selected = this.wasmTable.get_selected_cell();
    if (!selected) return undefined;
    
    const [row, col] = selected.split(':').map(Number);
    return { row, col };
  }

  /**
   * 編集を開始
   * 
   * @param row - 行インデックス
   * @param col - 列インデックス
   */
  public startEditing(row: number, col: number): void {
    this.ensureInitialized();
    this.wasmTable.start_editing(row, col);
  }

  /**
   * 編集中かどうかを取得
   * 
   * @returns 編集中の場合true
   */
  public isEditing(): boolean {
    this.ensureInitialized();
    return this.wasmTable.is_editing();
  }

  /**
   * テーブル統計情報を取得
   * 
   * @returns 統計情報
   */
  public getStats(): TableStats {
    this.ensureInitialized();
    return JSON.parse(this.wasmTable.get_stats());
  }

  /**
   * テーブル設定を取得
   * 
   * @returns 現在の設定
   */
  public getConfig(): TableConfig {
    return { ...this.config };
  }

  /**
   * 列ヘッダー設定を適用
   * 
   * @param headers - 列ヘッダー設定の配列（JSON文字列またはオブジェクト配列）
   */
  public setColumnHeaders(headers: string | ColumnHeader[]): void {
    this.ensureInitialized();
    const headersJson = typeof headers === 'string' ? headers : JSON.stringify(headers);
    this.wasmTable.set_column_headers(headersJson);
  }

  /**
   * 列ヘッダー設定を取得
   * 
   * @returns 列ヘッダー設定のJSON文字列
   */
  public getColumnHeaders(): string {
    this.ensureInitialized();
    return this.wasmTable.get_column_headers();
  }

  /**
   * 列ヘッダー設定をオブジェクト配列として取得
   * 
   * @returns 列ヘッダー設定のオブジェクト配列
   */
  public getColumnHeadersAsArray(): ColumnHeader[] {
    const headersJson = this.getColumnHeaders();
    return JSON.parse(headersJson);
  }

  /**
   * リソースを解放
   */
  public dispose(): void {
    if (this.wasmTable) {
      this.wasmTable.free();
    }
    this.isInitialized = false;
  }

  /**
   * 列名を生成（A, B, C, ..., Z, AA, AB, ...）
   * 
   * @param col - 列インデックス
   * @returns 列名
   */
  public static getColumnName(col: number): string {
    let result = '';
    let n = col;
    
    while (true) {
      result = String.fromCharCode(65 + (n % 26)) + result;
      if (n < 26) {
        break;
      }
      n = Math.floor(n / 26) - 1;
    }
    
    return result;
  }

  /**
   * セル参照文字列を生成（例: A1, B2, AA10）
   * 
   * @param row - 行インデックス
   * @param col - 列インデックス
   * @returns セル参照文字列
   */
  public static getCellReference(row: number, col: number): string {
    return `${NinjaTable.getColumnName(col)}${row + 1}`;
  }

  private setupEventHandlers(): void {
    // グローバルハンドラー関数を設定
    (window as any).handleTableClick = (x: number, y: number) => {
      this.wasmTable.handle_canvas_click(x, y);
      this.triggerCellSelectEvent();
    };

    (window as any).handleTableWheel = (deltaX: number, deltaY: number) => {
      this.wasmTable.handle_canvas_wheel(deltaX, deltaY);
    };

    (window as any).handleTableKey = (key: string) => {
      this.wasmTable.handle_canvas_keydown(key);
      this.triggerCellSelectEvent();
    };
  }

  private triggerCellSelectEvent(): void {
    if (this.eventHandlers.onCellSelect) {
      const selected = this.getSelectedCell();
      if (selected) {
        this.eventHandlers.onCellSelect(selected);
      }
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('NinjaTable is not initialized. Use NinjaTable.create() to create an instance.');
    }
  }
} 