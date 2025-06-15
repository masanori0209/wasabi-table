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
 * 入力検証エラーのインターface
 */
export interface ValidationError {
  /** フィールド名 */
  field_name: string;
  /** エラーメッセージ */
  message: string;
  /** エラータイプ */
  error_type: string;
}

/**
 * 検証結果のインターface
 */
export interface ValidationResult {
  /** 検証が成功したかどうか */
  isValid: boolean;
  /** エラー情報（検証失敗時のみ） */
  error?: ValidationError;
}

/**
 * セルの画面位置情報
 */
export interface CellScreenPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

// WasmNinjaTableの型を拡張
interface ExtendedWasmNinjaTable extends WasmNinjaTable {
  set_cell_data(row: number, col: number, value: string): void;
  get_cell_data(row: number, col: number): string | undefined;
  get_selected_cell(): string | undefined;
  get_cell_screen_position(row: number, col: number): string;
  get_selected_cell_screen_position(): string | undefined;
  get_selected_cell_validation_error(): string | undefined;
  set_column_headers(headers_json: string): void;
  get_column_headers(): string;
  get_cell_validation_error(row: number, col: number): string | undefined;
  handle_editing_enter(): void;
  handle_editing_tab(): void;
  handle_editing_escape(): void;
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
  private wasmTable: ExtendedWasmNinjaTable;
  private config: TableConfig;
  private eventHandlers: EventHandlers = {};
  private isInitialized = false;
  private tooltipElement: HTMLElement | null = null;
  private canvas: HTMLCanvasElement;
  private isComposing = false; // IME入力状態を管理

  private constructor(
    wasmTable: ExtendedWasmNinjaTable,
    config: TableConfig,
    canvas: HTMLCanvasElement
  ) {
    this.wasmTable = wasmTable;
    this.config = config;
    this.canvas = canvas;
    this.setupEventHandlers();
    this.createTooltipElement();
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
    const wasmTable = new WasmNinjaTable(canvas, JSON.stringify(finalConfig)) as ExtendedWasmNinjaTable;
    
    const table = new NinjaTable(wasmTable, finalConfig, canvas);
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
   * セルの値を設定
   * 
   * @param row 行番号（0から開始）
   * @param col 列番号（0から開始）
   * @param value 設定する値
   */
  public setCellValue(row: number, col: number, value: string): void {
    this.ensureInitialized();
    this.wasmTable.set_cell_data(row, col, value);
    
    // 値変更後に検証エラーを更新
    setTimeout(() => {
      this.updateValidationTooltip();
    }, 100);
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
   * 編集状態かどうかを確認
   * 
   * @returns 編集中の場合true
   */
  public isEditing(): boolean {
    this.ensureInitialized();
    return this.wasmTable.is_editing();
  }

  /**
   * 編集を完了
   */
  public finishEditing(): void {
    this.ensureInitialized();
    this.wasmTable.finish_editing();
    
    // 編集完了後に検証エラーを更新
    setTimeout(() => {
      this.updateValidationTooltip();
    }, 100);
  }

  /**
   * 編集をキャンセル
   */
  public cancelEditing(): void {
    this.ensureInitialized();
    this.wasmTable.cancel_editing();
    
    // 編集キャンセル後に検証エラーを更新
    setTimeout(() => {
      this.updateValidationTooltip();
    }, 100);
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
   * セルの値を検証
   * 
   * @param row 行番号（0から開始）- 現在は使用されていません
   * @param col 列番号（0から開始）
   * @param value 検証する値
   * @returns 検証エラーの配列（エラーがない場合は空配列）
   */
  public validateCellValue(_row: number, col: number, value: string): ValidationError[] {
    this.ensureInitialized();
    try {
      // 基底クラスのメソッドは(col, value)の形式なので、rowは使用せずcolとvalueのみ渡す
      const resultJson = this.wasmTable.validate_cell_value(col, value);
      if (resultJson && resultJson.trim() !== '') {
        return JSON.parse(resultJson);
      }
      return [];
    } catch (error) {
      console.warn('Validation failed:', error);
      return [];
    }
  }

  /**
   * 検証付きでセルの値を設定
   * 
   * @param row 行番号（0から開始）
   * @param col 列番号（0から開始）
   * @param value 設定する値
   * @returns 検証結果
   */
  public setCellValueWithValidation(row: number, col: number, value: string): ValidationResult {
    const validationErrors = this.validateCellValue(row, col, value);
    
    // 検証結果に関わらず値は設定する（警告は表示される）
    this.setCellValue(row, col, value);
    
    if (validationErrors.length === 0) {
      return { isValid: true };
    } else {
      return { isValid: false, error: validationErrors[0] };
    }
  }

  /**
   * 選択されたセルの検証エラーメッセージを取得
   * 
   * @returns エラーメッセージ（エラーがない場合はundefined）
   */
  public getSelectedCellValidationError(): string | undefined {
    this.ensureInitialized();
    return this.wasmTable.get_selected_cell_validation_error();
  }

  /**
   * 指定されたセルの検証エラー情報を取得
   * 
   * @param row - 行インデックス
   * @param col - 列インデックス
   * @returns 検証エラー情報（エラーがない場合はundefined）
   */
  public getCellValidationError(row: number, col: number): ValidationError | undefined {
    this.ensureInitialized();
    const errorJson = this.wasmTable.get_cell_validation_error(row, col);
    return errorJson ? JSON.parse(errorJson) : undefined;
  }

  /**
   * 指定されたセルの画面上の位置を取得
   * 
   * @param row - 行インデックス
   * @param col - 列インデックス
   * @returns セルの画面位置情報
   */
  public getCellScreenPosition(row: number, col: number): CellScreenPosition {
    this.ensureInitialized();
    const positionJson = this.wasmTable.get_cell_screen_position(row, col);
    return JSON.parse(positionJson);
  }

  /**
   * 選択されたセルの画面上の位置を取得
   * 
   * @returns 選択セルの画面位置情報（選択されていない場合はundefined）
   */
  public getSelectedCellScreenPosition(): CellScreenPosition | undefined {
    this.ensureInitialized();
    const positionJson = this.wasmTable.get_selected_cell_screen_position();
    return positionJson && positionJson.trim() !== '' ? JSON.parse(positionJson) : undefined;
  }

  /**
   * 検証エラー吹き出しを表示
   */
  private showValidationTooltip(message: string, cellPosition: CellPosition): void {
    if (!this.tooltipElement || !message) {
      this.hideValidationTooltip();
      return;
    }

    try {
      // 正確なセル位置を取得
      const cellScreenPos = this.getCellScreenPosition(cellPosition.row, cellPosition.col);
      const canvasRect = this.canvas.getBoundingClientRect();
      
      // fixed positioningを使用して正確な位置を計算
      const absoluteX = canvasRect.left + cellScreenPos.centerX;
      const absoluteY = canvasRect.top + cellScreenPos.y;
      
      // 吹き出しの内容を設定
      this.tooltipElement.innerHTML = `
        <div style="position: relative;">
          <div style="background: #dc3545; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; max-width: 250px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
            ${message}
          </div>
          <div style="position: absolute; top: 100%; left: 20px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #dc3545;"></div>
        </div>
      `;
      
      // 位置を設定
      const tooltipWidth = 250;
      const tooltipHeight = 60;
      
      // 水平位置の調整（画面端を考慮）
      let tooltipX = absoluteX - tooltipWidth / 2;
      tooltipX = Math.max(10, Math.min(window.innerWidth - tooltipWidth - 10, tooltipX));
      
      // 垂直位置の調整（画面上端を考慮）
      let tooltipY = absoluteY - tooltipHeight - 10;
      let isBelow = false;
      
      if (tooltipY < 10) {
        // 上に表示できない場合はセルの下に表示
        tooltipY = absoluteY + cellScreenPos.height + 10;
        isBelow = true;
      }
      
      // 矢印の位置を調整
      const arrowOffset = Math.max(20, Math.min(tooltipWidth - 20, absoluteX - tooltipX));
      
      if (isBelow) {
        // セルの下に表示する場合は矢印を上向きに
        this.tooltipElement.innerHTML = `
          <div style="position: relative;">
            <div style="position: absolute; bottom: 100%; left: ${arrowOffset}px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 6px solid #dc3545;"></div>
            <div style="background: #dc3545; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; max-width: 250px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
              ${message}
            </div>
          </div>
        `;
      } else {
        // セルの上に表示する場合は矢印を下向きに
        this.tooltipElement.innerHTML = `
          <div style="position: relative;">
            <div style="background: #dc3545; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; max-width: 250px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
              ${message}
            </div>
            <div style="position: absolute; top: 100%; left: ${arrowOffset}px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #dc3545;"></div>
          </div>
        `;
      }
      
      this.tooltipElement.style.left = tooltipX + 'px';
      this.tooltipElement.style.top = tooltipY + 'px';
      this.tooltipElement.style.display = 'block';
      
    } catch (error) {
      console.warn('Failed to show validation tooltip:', error);
      this.hideValidationTooltip();
    }
  }

  /**
   * 検証エラー吹き出しを非表示
   */
  private hideValidationTooltip(): void {
    if (this.tooltipElement) {
      this.tooltipElement.style.display = 'none';
    }
  }

  /**
   * 選択されたセルの検証エラーを確認して吹き出しを表示
   */
  private updateValidationTooltip(): void {
    try {
      const selectedCell = this.getSelectedCell();
      if (selectedCell && typeof this.wasmTable.get_selected_cell_validation_error === 'function') {
        const validationErrorMessage = this.wasmTable.get_selected_cell_validation_error();
        if (validationErrorMessage && validationErrorMessage.trim() !== '') {
          // 少し遅延させて正確な位置を取得
          setTimeout(() => {
            this.showValidationTooltip(validationErrorMessage, selectedCell);
          }, 50);
        } else {
          this.hideValidationTooltip();
        }
      } else {
        this.hideValidationTooltip();
      }
    } catch (error) {
      console.warn('Failed to update validation tooltip:', error);
      this.hideValidationTooltip();
    }
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
      // スクロール時は吹き出しを一時的に非表示
      this.hideValidationTooltip();
      
      // スクロール完了後に再表示
      setTimeout(() => {
        this.updateValidationTooltip();
      }, 150);
    };

    (window as any).handleTableKey = (key: string) => {
      // IME入力中（日本語変換中）の場合はEnterとTabの処理をスキップ
      if (this.isComposing && (key === 'Enter' || key === 'Tab')) {
        console.log('🈴 [DEBUG] Skipping key during IME composition:', key);
        return;
      }
      
      this.wasmTable.handle_canvas_keydown(key);
      this.triggerCellSelectEvent();
    };

    // IME状態を監視
    document.addEventListener('compositionstart', () => {
      this.isComposing = true;
      console.log('🈴 [DEBUG] IME composition started');
    });

    document.addEventListener('compositionend', () => {
      this.isComposing = false;
      console.log('🈴 [DEBUG] IME composition ended');
    });

    // 編集中のキーイベントハンドラー
    (window as any).handleEditingEnter = () => {
      this.wasmTable.handle_editing_enter();
      this.triggerCellSelectEvent();
    };

    (window as any).handleEditingTab = () => {
      this.wasmTable.handle_editing_tab();
      this.triggerCellSelectEvent();
    };

    (window as any).handleEditingEscape = () => {
      this.wasmTable.handle_editing_escape();
      this.triggerCellSelectEvent();
    };
  }

  private triggerCellSelectEvent(): void {
    // 検証エラー吹き出しを更新
    this.updateValidationTooltip();
    
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

  private createTooltipElement(): void {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'ninja-table-tooltip';
    this.tooltipElement.style.position = 'fixed';
    this.tooltipElement.style.zIndex = '1000';
    this.tooltipElement.style.padding = '8px';
    this.tooltipElement.style.backgroundColor = '#333';
    this.tooltipElement.style.color = '#fff';
    this.tooltipElement.style.borderRadius = '4px';
    this.tooltipElement.style.pointerEvents = 'none';
    this.canvas.parentNode?.appendChild(this.tooltipElement);
  }
} 