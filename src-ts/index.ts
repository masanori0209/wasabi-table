import init, { WasabiTable as WasmWasabiTable } from '../pkg/wasabi_table.js';

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

// リスナー機能をエクスポート
export { NinjaTableListeners } from './listeners';
export type { ListenerOptions, UIElements, EventCallbacks } from './listeners';
export { 
  createUIElements, 
  exportTableToCSV, 
  clearTable, 
  loadSampleData, 
  debounce, 
  parseCellReference, 
  isKeyboardShortcut 
} from './utils';

/**
 * WasabiTableとリスナーを簡単に初期化する関数
 */
export async function createWasabiTableWithListeners(
  canvas: HTMLCanvasElement,
  config: Partial<TableConfig> = {},
  uiConfig: {
    cellReferenceSelector: string;
    formulaInputSelector: string;
    statsElementSelector?: string;
    validationErrorSelector?: string;
    validationSuccessSelector?: string;
  },
  listenerOptions?: any,
  callbacks?: any
): Promise<{ table: WasabiTable; listeners: any }> {
  // 遅延インポートで循環インポートを回避
  const { createUIElements } = await import('./utils');
  const { NinjaTableListeners } = await import('./listeners');
  
  const table = await WasabiTable.create(canvas, config);
  const uiElements = createUIElements(uiConfig);
  const listeners = new NinjaTableListeners(table, uiElements, listenerOptions, callbacks);
  return { table, listeners };
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
interface ExtendedWasmWasabiTable extends WasmWasabiTable {
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
  cancel_editing(): void;
  start_range_selection(row: number, col: number): void;
  update_range_selection(row: number, col: number): void;
  end_range_selection(): void;
  clear_selection(): void;
  copy_selection(): string;
  paste_from_clipboard(tsvData: string): void;
  get_selection_info(): string;
  handle_mouse_drag(canvasX: number, canvasY: number, isDragging: boolean): void;
  pixel_to_cell(x: number, y: number): string | undefined;
  select_cell_by_position(row: number, col: number): string | undefined;
  update_canvas_size(width: number, height: number): void;
}

/**
 * WasabiTable - 高性能なExcel風テーブルコンポーネント
 * 
 * @example
 * ```typescript
 * import { WasabiTable } from 'wasabi-table';
 * 
 * const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
 * const table = await WasabiTable.create(canvas, {
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
export class WasabiTable {
  private wasmTable: ExtendedWasmWasabiTable;
  private config: TableConfig;
  private eventHandlers: EventHandlers = {};
  private isInitialized = false;
  private tooltipElement: HTMLElement | null = null;
  private canvas: HTMLCanvasElement;
  private isComposing = false; // IME入力状態を管理

  // スクロールバー関連の要素
  private scrollContainer: HTMLElement | null = null;
  private horizontalScrollbar: HTMLElement | null = null;
  private verticalScrollbar: HTMLElement | null = null;
  private horizontalThumb: HTMLElement | null = null;
  private verticalThumb: HTMLElement | null = null;
  
  // Canvasリサイズ監視用
  private resizeObserver: ResizeObserver | null = null;

  private constructor(
    wasmTable: ExtendedWasmWasabiTable,
    config: TableConfig,
    canvas: HTMLCanvasElement
  ) {
    this.wasmTable = wasmTable;
    this.config = config;
    this.canvas = canvas;
    
    // キャンバスをフォーカス可能にする
    this.canvas.tabIndex = 0;
    this.canvas.style.outline = 'none'; // フォーカス時のアウトラインを非表示
    
    this.setupEventHandlers();
    this.createTooltipElement();
    this.setupScrollbars();
    this.setupResizeObserver();
    
    // 初期フォーカスを設定
    setTimeout(() => {
      this.canvas.focus();
    }, 100);
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
  ): Promise<WasabiTable> {
    // WebAssemblyモジュールを初期化
    await init();

    const finalConfig: TableConfig = { ...DEFAULT_CONFIG, ...config };
    const wasmTable = new WasmWasabiTable(canvas, JSON.stringify(finalConfig)) as ExtendedWasmWasabiTable;
    
    const table = new WasabiTable(wasmTable, finalConfig, canvas);
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
    // レンダリング後にスクロールバーを更新
    this.updateScrollbars();
  }

  /**
   * セルを選択
   * 
   * @param row - 行インデックス
   * @param col - 列インデックス
   * @param autoScroll - 自動スクロールを有効にするかどうか（デフォルト: true）
   */
  public selectCell(row: number, col: number, autoScroll: boolean = true): void {
    this.ensureInitialized();
    console.log('🎯 [DEBUG] selectCell called with row:', row, 'col:', col, 'autoScroll:', autoScroll);
    
    // 直接行・列番号でセルを選択する方法を使用
    // 座標計算に依存せず、Rust側のselect_cell_by_positionメソッドを使用
    const result = this.wasmTable.select_cell_by_position(row, col);
    console.log('🎯 [DEBUG] selectCell result:', result);
    
    // 結果を検証
    const selectedAfter = this.getSelectedCell();
    console.log('🎯 [DEBUG] Selected cell after operation:', selectedAfter);
    
    // 自動スクロールが有効な場合、選択されたセルが見えるようにスクロール
    if (autoScroll && selectedAfter) {
      this.scrollToSelectedCell();
    }
  }

  /**
   * 選択されたセルが画面に表示されるように自動スクロール
   * Excelのような動作を実現
   */
  public scrollToSelectedCell(): void {
    this.ensureInitialized();
    
    const selectedCell = this.getSelectedCell();
    if (!selectedCell) {
      console.log('🎯 [DEBUG] No selected cell to scroll to');
      return;
    }
    
    console.log('🎯 [DEBUG] scrollToSelectedCell called for cell:', selectedCell);
    
    // セルの画面位置を取得
    const cellPosition = this.getCellScreenPosition(selectedCell.row, selectedCell.col);
    console.log('🎯 [DEBUG] Current cell screen position:', cellPosition);
    
    // 現在のスクロール位置を取得
    const stats = this.getStats();
    const currentScrollX = stats.scrollX;
    const currentScrollY = stats.scrollY;
    console.log('🎯 [DEBUG] Current scroll position:', { scrollX: currentScrollX, scrollY: currentScrollY });
    
    // 表示領域の計算
    const headerHeight = this.config.header_height;
    const rowHeaderWidth = this.config.row_header_width;
    const scrollbarWidth = 17; // スクロールバーの幅
    const viewportWidth = this.canvas.width - rowHeaderWidth - scrollbarWidth;
    const viewportHeight = this.canvas.height - headerHeight - scrollbarWidth;
    
    console.log('🎯 [DEBUG] Viewport dimensions:', { 
      viewportWidth, 
      viewportHeight, 
      headerHeight, 
      rowHeaderWidth 
    });
    
    // セルの絶対位置を計算（スクロールを考慮しない位置）
    const absoluteCellX = cellPosition.x + currentScrollX;
    const absoluteCellY = cellPosition.y + currentScrollY;
    
    console.log('🎯 [DEBUG] Absolute cell position:', { 
      absoluteCellX, 
      absoluteCellY,
      cellWidth: cellPosition.width,
      cellHeight: cellPosition.height
    });
    
    // 必要なスクロール量を計算
    let newScrollX = currentScrollX;
    let newScrollY = currentScrollY;
    
    // 水平スクロールの調整
    const cellLeft = absoluteCellX - rowHeaderWidth;
    const cellRight = cellLeft + cellPosition.width;
    const viewportLeft = currentScrollX;
    const viewportRight = currentScrollX + viewportWidth;
    
    if (cellLeft < viewportLeft) {
      // セルが左側に隠れている場合
      newScrollX = cellLeft;
      console.log('🎯 [DEBUG] Cell is hidden on the left, scrolling to:', newScrollX);
    } else if (cellRight > viewportRight) {
      // セルが右側に隠れている場合
      newScrollX = cellRight - viewportWidth;
      console.log('🎯 [DEBUG] Cell is hidden on the right, scrolling to:', newScrollX);
    }
    
    // 垂直スクロールの調整
    const cellTop = absoluteCellY - headerHeight;
    const cellBottom = cellTop + cellPosition.height;
    const viewportTop = currentScrollY;
    const viewportBottom = currentScrollY + viewportHeight;
    
    if (cellTop < viewportTop) {
      // セルが上側に隠れている場合
      newScrollY = cellTop;
      console.log('🎯 [DEBUG] Cell is hidden on the top, scrolling to:', newScrollY);
    } else if (cellBottom > viewportBottom) {
      // セルが下側に隠れている場合
      newScrollY = cellBottom - viewportHeight;
      console.log('🎯 [DEBUG] Cell is hidden on the bottom, scrolling to:', newScrollY);
    }
    
    // スクロール範囲の制限
    const maxScrollX = this.calculateMaxScrollX();
    const maxScrollY = this.calculateMaxScrollY();
    newScrollX = Math.max(0, Math.min(newScrollX, maxScrollX));
    newScrollY = Math.max(0, Math.min(newScrollY, maxScrollY));
    
    console.log('🎯 [DEBUG] Final scroll position (after bounds check):', { 
      newScrollX, 
      newScrollY, 
      maxScrollX, 
      maxScrollY 
    });
    
    // スクロールが必要な場合のみ実行
    if (Math.abs(newScrollX - currentScrollX) > 0.1 || Math.abs(newScrollY - currentScrollY) > 0.1) {
      console.log('🎯 [DEBUG] Scrolling from', { currentScrollX, currentScrollY }, 'to', { newScrollX, newScrollY });
      
      // スクロール実行
      const deltaX = newScrollX - currentScrollX;
      const deltaY = newScrollY - currentScrollY;
      
      this.wasmTable.scroll(deltaX, deltaY);
      this.updateScrollbars();
      
      console.log('🎯 [DEBUG] Auto-scroll completed');
    } else {
      console.log('🎯 [DEBUG] Cell is already visible, no scroll needed');
    }
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
    // ResizeObserverを停止
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // ツールチップ要素を削除
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
      this.tooltipElement = null;
    }

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
    return `${WasabiTable.getColumnName(col)}${row + 1}`;
  }

  private setupEventHandlers(): void {
    let isDragging = false;
    let dragStartCell: { row: number; col: number } | null = null;
    let justFinishedDragging = false;
    let hasActuallyDragged = false; // 実際にマウスが移動したかを追跡
    
    // グローバルハンドラー関数を設定
    (window as any).handleTableClick = (x: number, y: number) => {
      this.wasmTable.handle_canvas_click(x, y);
      this.triggerCellSelectEvent();
    };

    (window as any).handleTableWheel = (deltaX: number, deltaY: number) => {
      this.wasmTable.handle_canvas_wheel(deltaX, deltaY);
      // スクロール時は吹き出しを一時的に非表示
      this.hideValidationTooltip();
      
      // スクロールバーの表示を更新
      this.updateScrollbars();
      
      // スクロール完了後に再表示
      setTimeout(() => {
        this.updateValidationTooltip();
      }, 150);
    };

    // handleTableKey関数は不要（Rustのkeydownリスナーを無効化したため）
    // 矢印キー以外のキーは直接handle_canvas_keydownを呼び出す

    // 基本的なマウスクリック
    this.canvas.addEventListener('click', (event) => {
      // 実際にドラッグした後のクリックイベントは無視
      if (justFinishedDragging) {
        console.log('🖱️ [DEBUG] Ignoring click event after actual drag');
        justFinishedDragging = false;
        return;
      }
      
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // キャンバスにフォーカスを設定
      console.log('🖱️ [DEBUG] Canvas clicked, setting focus');
      this.canvas.focus();
      console.log('🖱️ [DEBUG] Focus set, activeElement:', document.activeElement?.tagName);
      
      if (event.shiftKey) {
        // Shift+クリックで範囲選択（mousedownで既に処理済みの場合はスキップ）
        const cellPos = this.wasmTable.pixel_to_cell(x, y);
        if (cellPos) {
          const [row, col] = cellPos.split(':').map(Number);
          
          // 現在選択されているセルがある場合は、そこから範囲選択を開始
          const currentSelection = this.getSelectedCell();
          if (currentSelection && !this.getSelectionInfo()?.isRange) {
            this.startRangeSelection(currentSelection.row, currentSelection.col);
          }
          
          this.updateRangeSelection(row, col);
          this.render();
        }
      } else {
        // 通常のクリックでは範囲選択をクリアしてから単一セル選択
        this.clearSelection();
        const result = this.wasmTable.select_cell(x, y);
        if (result) {
          this.triggerCellSelectEvent();
        }
      }
    });

    // ダブルクリックで編集開始
    this.canvas.addEventListener('dblclick', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const cellPos = this.wasmTable.pixel_to_cell(x, y);
      if (cellPos) {
        const [row, col] = cellPos.split(':').map(Number);
        this.startEditing(row, col);
      }
    });

    // マウスドラッグによる範囲選択
    this.canvas.addEventListener('mousedown', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const cellPos = this.wasmTable.pixel_to_cell(x, y);
      if (cellPos) {
        const [row, col] = cellPos.split(':').map(Number);
        
        if (event.shiftKey) {
          // Shift+ドラッグで範囲選択を拡張
          const currentSelection = this.getSelectedCell();
          if (currentSelection && !this.getSelectionInfo()?.isRange) {
            this.startRangeSelection(currentSelection.row, currentSelection.col);
          }
          this.updateRangeSelection(row, col);
          hasActuallyDragged = true; // Shift+クリックは即座に範囲選択
        } else {
          // 通常のドラッグで新しい範囲選択を開始
          // 単一セル選択はmousemoveが発生してから行う（純粋なクリックと区別するため）
          dragStartCell = { row, col };
          hasActuallyDragged = false; // リセット
        }
        
        isDragging = true;
        event.preventDefault();
      }
    });

    this.canvas.addEventListener('mousemove', (event) => {
      if (isDragging) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const cellPos = this.wasmTable.pixel_to_cell(x, y);
        if (cellPos) {
          const [row, col] = cellPos.split(':').map(Number);
          
          // 実際にマウスが移動したことをマーク
          hasActuallyDragged = true;
          
          // ドラッグが開始されたが、まだ範囲選択が始まっていない場合
          if (dragStartCell && !this.getSelectionInfo()?.isRange) {
            this.startRangeSelection(dragStartCell.row, dragStartCell.col);
          }
          
          this.updateRangeSelection(row, col);
          this.render();
        }
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      if (isDragging) {
        // 実際にドラッグした場合のみ範囲選択を終了
        if (hasActuallyDragged) {
          this.endRangeSelection();
          justFinishedDragging = true;
          
          // 少し遅延してフラグをリセット（クリックイベントが先に処理されるように）
          setTimeout(() => {
            justFinishedDragging = false;
          }, 10);
        } else {
          // 単純なクリックの場合は範囲選択をクリア
          this.clearSelection();
        }
        
        isDragging = false;
        dragStartCell = null;
        hasActuallyDragged = false;
      }
    });

    // マウスがキャンバスから離れた場合
    this.canvas.addEventListener('mouseleave', () => {
      if (isDragging) {
        // 実際にドラッグした場合のみ範囲選択を終了
        if (hasActuallyDragged) {
          this.endRangeSelection();
          justFinishedDragging = true;
          
          // 少し遅延してフラグをリセット
          setTimeout(() => {
            justFinishedDragging = false;
          }, 10);
        } else {
          // 単純なクリックの場合は範囲選択をクリア
          this.clearSelection();
        }
        
        isDragging = false;
        dragStartCell = null;
        hasActuallyDragged = false;
      }
    });

    // 統一されたキーボードイベント処理
    document.addEventListener('keydown', (event) => {
      // 編集中の場合は通常のキーイベントを無視（編集フィールドが処理する）
      if (this.isEditing()) {
        console.log('📝 [DEBUG] Editing in progress, ignoring document keydown for key:', event.key);
        
        // 編集中のTabキーは特別に処理（ブラウザのデフォルト動作を完全に阻止）
        if (event.key === 'Tab') {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          console.log('🚫 [DEBUG] Tab key completely blocked during editing');
        }
        
        // 編集中の矢印キーは入力フィールド内でのカーソル移動として処理
        // ドキュメントレベルでは何もしない（入力フィールドが処理する）
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
          console.log('⬅️➡️ [DEBUG] Arrow key in editing mode - allowing input field to handle cursor movement');
          return; // 入力フィールドのデフォルト動作を許可
        }
        
        return;
      }

      // フォーカス状態の詳細デバッグ
      console.log('🔍 [DEBUG] Focus check - activeElement:', document.activeElement?.tagName, 'canvas:', this.canvas.tagName);
      console.log('🔍 [DEBUG] Focus match:', this.canvas === document.activeElement);
      
      // キャンバスがフォーカスされていない場合は無視
      if (this.canvas !== document.activeElement) {
        console.log('❌ [DEBUG] Canvas not focused, ignoring keydown');
        return;
      }

      if (this.isComposing) {
        console.log('🈴 [DEBUG] Ignoring keydown during IME composition');
        return;
      }

      console.log('🔑 [DEBUG] Key pressed:', event.key, 'Shift:', event.shiftKey);

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? event.metaKey : event.ctrlKey;

      // キーボードショートカット（Ctrl/Cmd + キー）
      if (this.handleKeyboardShortcut(event)) {
        event.preventDefault();
        return;
      }

      // 矢印キーの処理
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        if (event.shiftKey && cmdKey) {
          // Shift+Ctrl+矢印キーによる範囲選択（データの端まで）
          console.log('🔀🚀 [DEBUG] Handling Shift+Ctrl+Arrow:', event.key);
          this.handleShiftCtrlArrowKey(event.key);
        } else if (event.shiftKey) {
          // Shift+矢印キーによる範囲選択
          console.log('🔀 [DEBUG] Handling Shift+Arrow:', event.key);
          this.handleShiftArrowKey(event.key);
        } else {
          // 通常の矢印キーによるセル移動
          console.log('➡️ [DEBUG] Handling Arrow:', event.key);
          this.clearSelection(); // 範囲選択をクリア
          this.handleArrowKey(event.key);
        }
        event.preventDefault();
        return;
      }

      // Enterキーで編集開始
      if (event.key === 'Enter' && !this.isEditing()) {
        const selectedCell = this.getSelectedCell();
        if (selectedCell) {
          console.log('📝 [DEBUG] Starting edit with Enter');
          this.startEditing(selectedCell.row, selectedCell.col);
          event.preventDefault();
          return;
        }
      }

      // Tabキーで右のセルに移動（編集中でない場合）
      if (event.key === 'Tab' && !this.isEditing()) {
        const selectedCell = this.getSelectedCell();
        if (selectedCell) {
          const newCol = Math.min(this.config.col_count - 1, selectedCell.col + 1);
          console.log('➡️ [DEBUG] Tab navigation from', selectedCell, 'to', { row: selectedCell.row, col: newCol });
          this.selectCell(selectedCell.row, newCol);
          this.render();
          event.preventDefault();
          return;
        }
      }

      // 矢印キー以外のキーは従来のハンドラーに委譲（矢印キーは完全にTypeScriptで処理）
      // ただし、Rustのkeydownリスナーを無効化したため、直接Rustのメソッドを呼び出す
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab'].includes(event.key)) {
        console.log('🔄 [DEBUG] Delegating key to Rust handler:', event.key);
        try {
          this.wasmTable.handle_canvas_keydown(event.key);
          this.triggerCellSelectEvent();
        } catch (error) {
          console.warn('Failed to handle key in Rust:', error);
        }
      }
    });

    // IME状態を監視
    document.addEventListener('compositionstart', () => {
      this.isComposing = true;
      console.log('🈴 [DEBUG] IME composition started');
    });

    document.addEventListener('compositionend', () => {
      this.isComposing = false;
      console.log('🈴 [DEBUG] IME composition ended');
    });

    // 編集中のキーイベントハンドラー（改善版）
    (window as any).handleEditingEnter = () => {
      console.log('📝 [DEBUG] Handling editing Enter');
      try {
        this.wasmTable.handle_editing_enter();
        // レンダリングはRust側で実行されるため削除
        // キャンバスにフォーカスを確実に戻す
        setTimeout(() => {
          this.canvas.focus();
          console.log('🎯 [DEBUG] Focus returned to canvas after Enter');
        }, 10);
        this.triggerCellSelectEvent();
      } catch (error) {
        console.error('Error handling editing Enter:', error);
      }
    };

    (window as any).handleEditingTab = () => {
      console.log('➡️ [DEBUG] Handling editing Tab');
      try {
        this.wasmTable.handle_editing_tab();
        // レンダリングはRust側で実行されるため削除
        // キャンバスにフォーカスを確実に戻す
        setTimeout(() => {
          this.canvas.focus();
          console.log('🎯 [DEBUG] Focus returned to canvas after Tab');
        }, 10);
        this.triggerCellSelectEvent();
      } catch (error) {
        console.error('Error handling editing Tab:', error);
      }
    };

    (window as any).handleEditingEscape = () => {
      console.log('❌ [DEBUG] Handling editing Escape');
      try {
        // handle_editing_escapeを呼び出す（cancel_editingではなく）
        this.wasmTable.handle_editing_escape();
        // レンダリングはRust側で実行されるため削除
        // キャンバスにフォーカスを確実に戻す
        setTimeout(() => {
          this.canvas.focus();
          console.log('🎯 [DEBUG] Focus returned to canvas after Escape');
        }, 10);
        this.triggerCellSelectEvent();
      } catch (error) {
        console.error('Error handling editing Escape:', error);
      }
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

  /**
   * スクロールバーのHTML構造を作成
   */
  private setupScrollbars(): void {
    // 既存のキャンバスの親要素を取得
    const parent = this.canvas.parentElement;
    if (!parent) return;

    // スクロールコンテナを作成
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.cssText = `
      position: relative;
      width: ${this.canvas.width}px;
      height: ${this.canvas.height}px;
      overflow: hidden;
    `;

    // キャンバスをコンテナに移動
    parent.insertBefore(this.scrollContainer, this.canvas);
    this.scrollContainer.appendChild(this.canvas);

    // 水平スクロールバーを作成
    this.horizontalScrollbar = document.createElement('div');
    this.horizontalScrollbar.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 17px;
      height: 17px;
      background-color: #f0f0f0;
      border-top: 1px solid #ccc;
      overflow: hidden;
    `;

    this.horizontalThumb = document.createElement('div');
    this.horizontalThumb.style.cssText = `
      position: absolute;
      top: 2px;
      left: 0;
      height: 13px;
      background-color: #c0c0c0;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    
    this.horizontalThumb.addEventListener('mouseenter', () => {
      this.horizontalThumb!.style.backgroundColor = '#a0a0a0';
    });
    
    this.horizontalThumb.addEventListener('mouseleave', () => {
      this.horizontalThumb!.style.backgroundColor = '#c0c0c0';
    });

    this.horizontalScrollbar.appendChild(this.horizontalThumb);

    // 垂直スクロールバーを作成
    this.verticalScrollbar = document.createElement('div');
    this.verticalScrollbar.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      bottom: 17px;
      width: 17px;
      background-color: #f0f0f0;
      border-left: 1px solid #ccc;
      overflow: hidden;
    `;

    this.verticalThumb = document.createElement('div');
    this.verticalThumb.style.cssText = `
      position: absolute;
      left: 2px;
      top: 0;
      width: 13px;
      background-color: #c0c0c0;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    
    this.verticalThumb.addEventListener('mouseenter', () => {
      this.verticalThumb!.style.backgroundColor = '#a0a0a0';
    });
    
    this.verticalThumb.addEventListener('mouseleave', () => {
      this.verticalThumb!.style.backgroundColor = '#c0c0c0';
    });

    this.verticalScrollbar.appendChild(this.verticalThumb);

    // コンテナにスクロールバーを追加
    this.scrollContainer.appendChild(this.horizontalScrollbar);
    this.scrollContainer.appendChild(this.verticalScrollbar);

    // スクロールバーのイベントリスナーを設定
    this.setupScrollbarEvents();
  }

  /**
   * スクロールバーのイベントリスナーを設定
   */
  private setupScrollbarEvents(): void {
    if (!this.horizontalScrollbar || !this.verticalScrollbar || 
        !this.horizontalThumb || !this.verticalThumb) return;

    // 水平スクロールバーのクリックイベント
    this.horizontalScrollbar.addEventListener('click', (e) => {
      if (e.target === this.horizontalThumb) return;
      
      const rect = this.horizontalScrollbar!.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const scrollbarWidth = rect.width;
      const scrollRatio = clickX / scrollbarWidth;
      
      // 最大スクロール値を取得してスクロール位置を計算
      const stats = this.getStats();
      const maxScrollX = this.calculateMaxScrollX();
      const targetScrollX = maxScrollX * scrollRatio;
      
      this.scrollTo(targetScrollX, stats.scrollY);
    });

    // 垂直スクロールバーのクリックイベント
    this.verticalScrollbar.addEventListener('click', (e) => {
      if (e.target === this.verticalThumb) return;
      
      const rect = this.verticalScrollbar!.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const scrollbarHeight = rect.height;
      const scrollRatio = clickY / scrollbarHeight;
      
      // 最大スクロール値を取得してスクロール位置を計算
      const stats = this.getStats();
      const maxScrollY = this.calculateMaxScrollY();
      const targetScrollY = maxScrollY * scrollRatio;
      
      this.scrollTo(stats.scrollX, targetScrollY);
    });

    // 水平スクロールサムのドラッグ
    this.setupThumbDrag(this.horizontalThumb, 'horizontal');
    
    // 垂直スクロールサムのドラッグ
    this.setupThumbDrag(this.verticalThumb, 'vertical');
  }

  /**
   * スクロールサムのドラッグ機能を設定
   */
  private setupThumbDrag(thumb: HTMLElement, direction: 'horizontal' | 'vertical'): void {
    let isDragging = false;
    let startPos = 0;
    let startScroll = 0;

    thumb.addEventListener('mousedown', (e) => {
      isDragging = true;
      startPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const stats = this.getStats();
      startScroll = direction === 'horizontal' ? stats.scrollX : stats.scrollY;
      
      e.preventDefault();
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos;
      
      if (direction === 'horizontal') {
        const scrollbarWidth = this.horizontalScrollbar!.offsetWidth;
        const maxScrollX = this.calculateMaxScrollX();
        const scrollRatio = delta / scrollbarWidth;
        const newScrollX = Math.max(0, Math.min(maxScrollX, startScroll + maxScrollX * scrollRatio));
        
        const stats = this.getStats();
        this.scrollTo(newScrollX, stats.scrollY);
      } else {
        const scrollbarHeight = this.verticalScrollbar!.offsetHeight;
        const maxScrollY = this.calculateMaxScrollY();
        const scrollRatio = delta / scrollbarHeight;
        const newScrollY = Math.max(0, Math.min(maxScrollY, startScroll + maxScrollY * scrollRatio));
        
        const stats = this.getStats();
        this.scrollTo(stats.scrollX, newScrollY);
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = '';
      }
    });
  }

  /**
   * 指定位置にスクロール
   */
  private scrollTo(x: number, y: number): void {
    if (!this.wasmTable) return;
    
    const stats = this.getStats();
    const deltaX = x - stats.scrollX;
    const deltaY = y - stats.scrollY;
    
    this.wasmTable.handle_canvas_wheel(deltaX, deltaY);
    this.updateScrollbars();
  }

  /**
   * スクロールバーの表示を更新
   */
  private updateScrollbars(): void {
    if (!this.horizontalScrollbar || !this.verticalScrollbar || 
        !this.horizontalThumb || !this.verticalThumb) return;

    const stats = this.getStats();
    const maxScrollX = this.calculateMaxScrollX();
    const maxScrollY = this.calculateMaxScrollY();

    // 水平スクロールバーの更新
    const scrollbarWidth = this.horizontalScrollbar.offsetWidth;
    const contentWidth = maxScrollX + this.canvas.width;
    const thumbWidth = Math.max(20, (this.canvas.width / contentWidth) * scrollbarWidth);
    const thumbLeft = maxScrollX > 0 ? (stats.scrollX / maxScrollX) * (scrollbarWidth - thumbWidth) : 0;

    this.horizontalThumb.style.width = `${thumbWidth}px`;
    this.horizontalThumb.style.left = `${thumbLeft}px`;
    this.horizontalScrollbar.style.display = maxScrollX > 0 ? 'block' : 'none';

    // 垂直スクロールバーの更新
    const scrollbarHeight = this.verticalScrollbar.offsetHeight;
    const contentHeight = maxScrollY + this.canvas.height;
    const thumbHeight = Math.max(20, (this.canvas.height / contentHeight) * scrollbarHeight);
    const thumbTop = maxScrollY > 0 ? (stats.scrollY / maxScrollY) * (scrollbarHeight - thumbHeight) : 0;

    this.verticalThumb.style.height = `${thumbHeight}px`;
    this.verticalThumb.style.top = `${thumbTop}px`;
    this.verticalScrollbar.style.display = maxScrollY > 0 ? 'block' : 'none';
  }

  /**
   * Canvasのサイズを更新
   */
  public updateCanvasSize(width?: number, height?: number): void {
    console.log('🔧 [DEBUG] updateCanvasSize called with:', { width, height });
    
    let actualWidth: number;
    let actualHeight: number;

    if (width !== undefined && height !== undefined) {
      // 明示的なサイズが指定された場合
      actualWidth = width;
      actualHeight = height;
      console.log('🔧 [DEBUG] Using explicit size:', { actualWidth, actualHeight });
    } else {
      // 親要素のサイズに合わせる
      const parent = this.canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        actualWidth = Math.floor(rect.width);
        actualHeight = Math.floor(rect.height);
        console.log('🔧 [DEBUG] Using parent size:', { actualWidth, actualHeight, parentRect: rect });
      } else {
        console.warn('🔧 [DEBUG] No parent element found, using current canvas size');
        actualWidth = this.canvas.width;
        actualHeight = this.canvas.height;
      }
    }

    // Canvas要素のサイズを更新
    const oldWidth = this.canvas.width;
    const oldHeight = this.canvas.height;
    
    this.canvas.width = actualWidth;
    this.canvas.height = actualHeight;
    this.canvas.style.width = `${actualWidth}px`;
    this.canvas.style.height = `${actualHeight}px`;
    
    console.log('🔧 [DEBUG] Canvas size updated:', { 
      oldSize: { width: oldWidth, height: oldHeight },
      newSize: { width: actualWidth, height: actualHeight }
    });

    // スクロールコンテナのサイズも更新
    if (this.scrollContainer) {
      this.scrollContainer.style.width = `${actualWidth}px`;
      this.scrollContainer.style.height = `${actualHeight}px`;
      
      // スクロールバーのサイズも明示的に更新
      if (this.horizontalScrollbar) {
        const scrollbarWidth = Math.max(0, actualWidth - 17);
        this.horizontalScrollbar.style.width = `${scrollbarWidth}px`;
        console.log('🔧 [DEBUG] Horizontal scrollbar width updated:', scrollbarWidth);
      }
      if (this.verticalScrollbar) {
        const scrollbarHeight = Math.max(0, actualHeight - 17);
        this.verticalScrollbar.style.height = `${scrollbarHeight}px`;
        console.log('🔧 [DEBUG] Vertical scrollbar height updated:', scrollbarHeight);
      }
      
      console.log('🔧 [DEBUG] Scroll container size updated:', { width: actualWidth, height: actualHeight });
    }

        // Rust側のキャンバスサイズも更新（新しいメソッドを使用）
    if (this.wasmTable) {
      try {
        // 新しいupdate_canvas_sizeメソッドを使用
        this.wasmTable.update_canvas_size(actualWidth, actualHeight);
        console.log('🔧 [DEBUG] WASM canvas size updated via update_canvas_size:', { width: actualWidth, height: actualHeight });
      } catch (error) {
        console.error('🔧 [DEBUG] Error updating WASM canvas size:', error);
        
        // フォールバック: 直接プロパティを更新
        try {
          if ('canvas_width' in this.wasmTable && 'canvas_height' in this.wasmTable) {
            (this.wasmTable as any).canvas_width = actualWidth;
            (this.wasmTable as any).canvas_height = actualHeight;
            console.log('🔧 [DEBUG] WASM canvas size updated via direct property access:', { width: actualWidth, height: actualHeight });
          }
        } catch (fallbackError) {
          console.error('🔧 [DEBUG] Fallback canvas size update also failed:', fallbackError);
        }
      }
    }

    // スクロールバーとテーブルを再描画
    console.log('🔧 [DEBUG] Updating scrollbars and rendering...');
    this.updateScrollbars();
    this.render();
    
    console.log('🔧 [DEBUG] updateCanvasSize completed');
  }

  /**
   * Canvasリサイズイベントハンドラー
   */
  public handleCanvasResize(): void {
    this.updateCanvasSize();
  }

  /**
   * 最大水平スクロール値を計算
   */
  private calculateMaxScrollX(): number {
    if (!this.wasmTable) return 0;
    
    const config = this.getConfig();
    let totalWidth = 0;
    
    // カスタム列ヘッダーがある場合はその幅を使用
    try {
      const headers = this.getColumnHeadersAsArray();
      if (headers.length > 0) {
        for (const header of headers) {
          totalWidth += header.width;
        }
      } else {
        // デフォルト幅を使用
        for (let col = 0; col < config.col_count; col++) {
          totalWidth += config.default_col_width;
        }
      }
    } catch {
      // エラーの場合はデフォルト幅を使用
      for (let col = 0; col < config.col_count; col++) {
        totalWidth += config.default_col_width;
      }
    }
    
    const visibleWidth = this.canvas.width - (config.row_header_width || 50);
    return Math.max(0, totalWidth - visibleWidth + 50);
  }

  /**
   * 最大垂直スクロール値を計算
   */
  private calculateMaxScrollY(): number {
    if (!this.wasmTable) return 0;
    
    const config = this.getConfig();
    const totalHeight = config.row_count * config.default_row_height;
    const scrollbarHeight = 17; // スクロールバーの高さ
    const visibleHeight = this.canvas.height - (config.header_height || 30) - scrollbarHeight;
    const margin = 10; // 余白
    
    return Math.max(0, totalHeight - visibleHeight + margin);
  }

  /**
   * 範囲選択を開始
   */
  public startRangeSelection(row: number, col: number): void {
    this.ensureInitialized();
    this.wasmTable.start_range_selection(row, col);
  }

  /**
   * 範囲選択を更新
   */
  public updateRangeSelection(row: number, col: number): void {
    this.ensureInitialized();
    this.wasmTable.update_range_selection(row, col);
  }

  /**
   * 範囲選択を終了
   */
  public endRangeSelection(): void {
    this.ensureInitialized();
    this.wasmTable.end_range_selection();
  }

  /**
   * 選択をクリア
   */
  public clearSelection(): void {
    this.ensureInitialized();
    this.wasmTable.clear_selection();
  }

  /**
   * 選択範囲をコピー
   */
  public copySelection(): string {
    this.ensureInitialized();
    return this.wasmTable.copy_selection();
  }

  /**
   * クリップボードからペースト
   */
  public pasteFromClipboard(tsvData: string): void {
    this.ensureInitialized();
    this.wasmTable.paste_from_clipboard(tsvData);
  }

  /**
   * 選択情報を取得
   */
  public getSelectionInfo(): any {
    this.ensureInitialized();
    const info = this.wasmTable.get_selection_info();
    return JSON.parse(info);
  }

  /**
   * マウスドラッグを処理
   */
  public handleMouseDrag(canvasX: number, canvasY: number, isDragging: boolean): void {
    this.ensureInitialized();
    this.wasmTable.handle_mouse_drag(canvasX, canvasY, isDragging);
  }

  /**
   * キーボードショートカットを処理
   */
  public handleKeyboardShortcut(event: KeyboardEvent): boolean {
    if (!this.wasmTable) return false;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? event.metaKey : event.ctrlKey;

    if (cmdKey) {
      switch (event.key.toLowerCase()) {
        case 'c':
          // Ctrl+C / Cmd+C でコピー
          event.preventDefault();
          this.handleCopy();
          return true;

        case 'v':
          // Ctrl+V / Cmd+V でペースト
          event.preventDefault();
          this.handlePaste();
          return true;

        case 'x':
          // Ctrl+X / Cmd+X でカット
          event.preventDefault();
          this.handleCut();
          return true;

        case 'a':
          // Ctrl+A / Cmd+A で全選択
          event.preventDefault();
          this.handleSelectAll();
          return true;

        case 'arrowup':
        case 'arrowdown':
        case 'arrowleft':
        case 'arrowright':
          // Shift+Ctrl+Arrow の場合は、矢印キー処理部分で処理するためここでは処理しない
          if (event.shiftKey) {
            return false;
          }
          // Ctrl+Arrow / Cmd+Arrow でExcel風の端まで移動
          event.preventDefault();
          this.handleCtrlArrowNavigation(event.key);
          return true;
      }
    }

    return false;
  }

  /**
   * コピー処理
   */
  private async handleCopy(): Promise<void> {
    try {
      // 選択状態をデバッグ
      const selectionInfo = this.getSelectionInfo();
      console.log('📋 [DEBUG] Selection info before copy:', selectionInfo);
      
      const copiedData = this.copySelection();
      console.log('📋 [DEBUG] Copied data:', copiedData);
      console.log('📋 [DEBUG] Copied data length:', copiedData.length);
      console.log('📋 [DEBUG] Copied data lines:', copiedData.split('\n').length);
      
      if (copiedData) {
        // モダンブラウザのClipboard APIを使用
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(copiedData);
          console.log('✅ [DEBUG] Data copied to clipboard using Clipboard API');
        } else {
          // フォールバック: 古いブラウザ対応
          this.fallbackCopyToClipboard(copiedData);
        }
        
        // コピー成功の視覚的フィードバック（オプション）
        this.showCopyFeedback();
      }
    } catch (error) {
      console.error('❌ [DEBUG] Copy failed:', error);
      // エラー時はフォールバックを試行
      try {
        const copiedData = this.copySelection();
        if (copiedData) {
          this.fallbackCopyToClipboard(copiedData);
        }
      } catch (fallbackError) {
        console.error('❌ [DEBUG] Fallback copy also failed:', fallbackError);
      }
    }
  }

  /**
   * ペースト処理
   */
  private async handlePaste(): Promise<void> {
    try {
      let pasteData = '';
      
      // モダンブラウザのClipboard APIを使用
      if (navigator.clipboard && navigator.clipboard.readText) {
        pasteData = await navigator.clipboard.readText();
        console.log('📋 [DEBUG] Pasted data from Clipboard API:', pasteData);
      } else {
        // フォールバック: 古いブラウザ対応
        pasteData = this.fallbackReadFromClipboard();
        console.log('📋 [DEBUG] Pasted data from fallback:', pasteData);
      }
      
      if (pasteData) {
        // 選択範囲の開始位置を取得
        const selectedCell = this.getSelectedCell();
        const selectionInfo = this.getSelectionInfo();
        
        console.log('📋 [DEBUG] Paste target - Selected cell:', selectedCell, 'Selection info:', selectionInfo);
        
        // データをペースト
        this.pasteFromClipboard(pasteData);
        
        // レンダリングを更新
        this.render();
        
        // ペーストイベントを通知
        if (this.eventHandlers.onCellChange && selectedCell) {
          // 簡単な通知（実際には複数セルが変更される可能性がある）
          this.eventHandlers.onCellChange(selectedCell, '', pasteData);
        }
        
        console.log('✅ [DEBUG] Paste completed successfully');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Paste failed:', error);
    }
  }

  /**
   * カット処理（コピー + 削除）
   */
  private async handleCut(): Promise<void> {
    try {
      // まずコピー
      await this.handleCopy();
      
      // 選択範囲のデータを削除
      const selectionInfo = this.getSelectionInfo();
      if (selectionInfo && selectionInfo.hasSelection) {
        if (selectionInfo.isRange) {
          // 範囲選択の場合
          for (let row = selectionInfo.start_row; row <= selectionInfo.end_row; row++) {
            for (let col = selectionInfo.start_col; col <= selectionInfo.end_col; col++) {
              this.setCellValue(row, col, '');
            }
          }
        } else {
          // 単一セル選択の場合
          this.setCellValue(selectionInfo.row, selectionInfo.col, '');
        }
        
        this.render();
        console.log('✅ [DEBUG] Cut completed successfully');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Cut failed:', error);
    }
  }

  /**
   * 全選択処理
   */
  private handleSelectAll(): void {
    try {
      const config = this.getConfig();
      this.startRangeSelection(0, 0);
      this.updateRangeSelection(config.row_count - 1, config.col_count - 1);
      this.endRangeSelection();
      this.render();
      console.log('✅ [DEBUG] Select all completed');
    } catch (error) {
      console.error('❌ [DEBUG] Select all failed:', error);
    }
  }

  /**
   * フォールバック: 古いブラウザでのコピー
   */
  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        console.log('✅ [DEBUG] Fallback copy successful');
      } else {
        console.error('❌ [DEBUG] Fallback copy failed');
      }
    } catch (err) {
      console.error('❌ [DEBUG] Fallback copy error:', err);
    } finally {
      document.body.removeChild(textArea);
    }
  }

  /**
   * フォールバック: 古いブラウザでのペースト（制限あり）
   */
  private fallbackReadFromClipboard(): string {
    // 古いブラウザでは自動的にクリップボードから読み取ることはできない
    // ユーザーに手動でペーストを促すか、他の方法を検討する必要がある
    console.warn('⚠️ [DEBUG] Clipboard read not supported in this browser');
    return '';
  }

  /**
   * コピー成功の視覚的フィードバック
   */
  private showCopyFeedback(): void {
    // 簡単な視覚的フィードバック（オプション）
    const selectedCell = this.getSelectedCell();
    if (selectedCell) {
      const cellPosition = this.getCellScreenPosition(selectedCell.row, selectedCell.col);
      
      // 一時的な「コピー済み」メッセージを表示
      const feedback = document.createElement('div');
      feedback.textContent = 'コピーしました';
      feedback.style.cssText = `
        position: fixed;
        left: ${cellPosition.x}px;
        top: ${cellPosition.y - 30}px;
        background: #28a745;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        pointer-events: none;
        animation: fadeInOut 1.5s ease-in-out;
      `;
      
      // CSS アニメーションを追加
      if (!document.getElementById('copy-feedback-style')) {
        const style = document.createElement('style');
        style.id = 'copy-feedback-style';
        style.textContent = `
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(10px); }
            20% { opacity: 1; transform: translateY(0); }
            80% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(feedback);
      
      // 1.5秒後に削除
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 1500);
    }
  }

  /**
   * Shift+矢印キーによる範囲選択を処理
   */
  private handleShiftArrowKey(key: string): void {
    console.log('🔀 [DEBUG] handleShiftArrowKey called with:', key);
    
    const selectedCell = this.getSelectedCell();
    console.log('🔀 [DEBUG] Current selected cell for range:', selectedCell);
    
    if (!selectedCell) {
      console.log('❌ [DEBUG] No selected cell for range selection, starting from (0,0)');
      this.selectCell(0, 0, true);
      this.startRangeSelection(0, 0);
      return;
    }

    // 範囲選択が始まっていない場合は開始
    const selectionInfo = this.getSelectionInfo();
    console.log('🔀 [DEBUG] Current selection info:', selectionInfo);
    
    if (!selectionInfo || !selectionInfo.isRange) {
      console.log('🔀 [DEBUG] Starting new range selection from current cell');
      this.startRangeSelection(selectedCell.row, selectedCell.col);
    }

    // 現在の選択セル位置から移動
    let newRow = selectedCell.row;
    let newCol = selectedCell.col;

    switch (key) {
      case 'ArrowUp':
        newRow = Math.max(0, selectedCell.row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(this.config.row_count - 1, selectedCell.row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, selectedCell.col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(this.config.col_count - 1, selectedCell.col + 1);
        break;
    }

    console.log('🔀 [DEBUG] Range selection extending from', selectedCell, 'to', { row: newRow, col: newCol });

    // 範囲選択を更新（終端位置を移動）
    this.updateRangeSelection(newRow, newCol);
    
    // 新しい終端セルが見えるように自動スクロール
    // まず現在のselected_cellを更新してからスクロール
    this.wasmTable.select_cell_by_position(newRow, newCol);
    this.scrollToSelectedCell();
    
    this.render();
    
    // 更新後の選択情報を確認
    const updatedSelection = this.getSelectionInfo();
    console.log('🔀 [DEBUG] Updated selection info:', updatedSelection);
  }

  /**
   * Shift+Ctrl+矢印キーによる範囲選択（データの端まで）を処理
   */
  private handleShiftCtrlArrowKey(key: string): void {
    console.log('🔀🚀 [DEBUG] handleShiftCtrlArrowKey called with:', key);
    
    const selectedCell = this.getSelectedCell();
    if (!selectedCell) {
      console.log('❌ [DEBUG] No selected cell for Shift+Ctrl+Arrow navigation');
      return;
    }

    // 範囲選択が始まっていない場合は開始
    const selectionInfo = this.getSelectionInfo();
    if (!selectionInfo || !selectionInfo.isRange) {
      console.log('🔀🚀 [DEBUG] Starting new range selection from current cell');
      this.startRangeSelection(selectedCell.row, selectedCell.col);
    }

    let newRow = selectedCell.row;
    let newCol = selectedCell.col;

    switch (key) {
      case 'ArrowUp':
        newRow = this.findDataEdge(selectedCell.row, selectedCell.col, 'up');
        break;
      case 'ArrowDown':
        newRow = this.findDataEdge(selectedCell.row, selectedCell.col, 'down');
        break;
      case 'ArrowLeft':
        newCol = this.findDataEdge(selectedCell.row, selectedCell.col, 'left');
        break;
      case 'ArrowRight':
        newCol = this.findDataEdge(selectedCell.row, selectedCell.col, 'right');
        break;
    }

    console.log('🔀🚀 [DEBUG] Shift+Ctrl+Arrow extending range from', selectedCell, 'to', { row: newRow, col: newCol });

    // 範囲選択を更新（終端位置を移動）
    this.updateRangeSelection(newRow, newCol);
    this.render();
    
    // 更新後の選択情報を確認
    const updatedSelection = this.getSelectionInfo();
    console.log('🔀🚀 [DEBUG] Updated selection info:', updatedSelection);
  }

  /**
   * 通常の矢印キーによるセル移動を処理
   */
  private handleArrowKey(key: string): void {
    console.log('🎯 [DEBUG] handleArrowKey called with:', key);
    
    const selectedCell = this.getSelectedCell();
    console.log('🎯 [DEBUG] Current selected cell:', selectedCell);
    
    // デバッグ: 現在のスクロール位置を記録
    const stats = this.getStats();
    console.log('🎯 [DEBUG] Current scroll position:', { scrollX: stats.scrollX, scrollY: stats.scrollY });
    
    if (!selectedCell) {
      console.log('❌ [DEBUG] No selected cell found, defaulting to (0,0)');
      // 選択セルがない場合は(0,0)を選択してから移動
      this.selectCell(0, 0, true);
      this.render();
      return;
    }

    let newRow = selectedCell.row;
    let newCol = selectedCell.col;

    switch (key) {
      case 'ArrowUp':
        newRow = Math.max(0, selectedCell.row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(this.config.row_count - 1, selectedCell.row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, selectedCell.col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(this.config.col_count - 1, selectedCell.col + 1);
        break;
    }

    console.log('🎯 [DEBUG] Moving from', selectedCell, 'to', { row: newRow, col: newCol });

    // デバッグ: セル移動前後の座標を詳しく記録
    const beforePosition = this.getCellScreenPosition(selectedCell.row, selectedCell.col);
    console.log('🎯 [DEBUG] Before move - cell screen position:', beforePosition);
    
    // 新しいセルを選択（自動スクロール有効）
    this.selectCell(newRow, newCol, true);
    
    // デバッグ: 移動後の座標を記録
    const afterPosition = this.getCellScreenPosition(newRow, newCol);
    console.log('🎯 [DEBUG] After move - cell screen position:', afterPosition);
    
    // デバッグ: pixel_to_cellで逆変換テスト
    const centerX = afterPosition.centerX;
    const centerY = afterPosition.centerY;
    console.log('🎯 [DEBUG] Testing pixel_to_cell with center coordinates:', { centerX, centerY });
    
    const pixelToCell = this.wasmTable.pixel_to_cell(centerX, centerY);
    console.log('🎯 [DEBUG] pixel_to_cell result:', pixelToCell);
    
    this.render();
    
    console.log('🎯 [DEBUG] Arrow key movement completed');
  }

  /**
   * Ctrl+矢印キーによるExcel風の端まで移動を処理
   */
  private handleCtrlArrowNavigation(key: string): void {
    console.log('🚀 [DEBUG] handleCtrlArrowNavigation called with:', key);
    
    const selectedCell = this.getSelectedCell();
    if (!selectedCell) {
      console.log('❌ [DEBUG] No selected cell found for Ctrl+Arrow navigation');
      return;
    }

    let newRow = selectedCell.row;
    let newCol = selectedCell.col;

    switch (key.toLowerCase()) {
      case 'arrowup':
        newRow = this.findDataEdge(selectedCell.row, selectedCell.col, 'up');
        break;
      case 'arrowdown':
        newRow = this.findDataEdge(selectedCell.row, selectedCell.col, 'down');
        break;
      case 'arrowleft':
        newCol = this.findDataEdge(selectedCell.row, selectedCell.col, 'left');
        break;
      case 'arrowright':
        newCol = this.findDataEdge(selectedCell.row, selectedCell.col, 'right');
        break;
    }

    console.log('🚀 [DEBUG] Ctrl+Arrow moving from', selectedCell, 'to', { row: newRow, col: newCol });

    // 新しいセルを選択（自動スクロール有効）
    this.selectCell(newRow, newCol, true);
    this.render();
    
    console.log('🚀 [DEBUG] Ctrl+Arrow navigation completed');
  }

  /**
   * データの端を見つける（Excel風の動作）
   */
  private findDataEdge(currentRow: number, currentCol: number, direction: 'up' | 'down' | 'left' | 'right'): number {
    const currentValue = this.getCellValue(currentRow, currentCol);
    const isCurrentEmpty = !currentValue || currentValue.trim() === '';

    switch (direction) {
      case 'up':
        if (isCurrentEmpty) {
          // 現在のセルが空の場合、上方向の最初の非空セルを探す
          for (let row = currentRow - 1; row >= 0; row--) {
            const value = this.getCellValue(row, currentCol);
            if (value && value.trim() !== '') {
              return row;
            }
          }
          return 0; // 非空セルが見つからない場合は最上行
        } else {
          // 現在のセルに値がある場合、連続するデータの最上端を探す
          let lastNonEmptyRow = currentRow;
          for (let row = currentRow - 1; row >= 0; row--) {
            const value = this.getCellValue(row, currentCol);
            if (value && value.trim() !== '') {
              lastNonEmptyRow = row;
            } else {
              break;
            }
          }
          return lastNonEmptyRow;
        }

      case 'down':
        if (isCurrentEmpty) {
          // 現在のセルが空の場合、下方向の最初の非空セルを探す
          for (let row = currentRow + 1; row < this.config.row_count; row++) {
            const value = this.getCellValue(row, currentCol);
            if (value && value.trim() !== '') {
              return row;
            }
          }
          return this.config.row_count - 1; // 非空セルが見つからない場合は最下行
        } else {
          // 現在のセルに値がある場合、連続するデータの最下端を探す
          let lastNonEmptyRow = currentRow;
          for (let row = currentRow + 1; row < this.config.row_count; row++) {
            const value = this.getCellValue(row, currentCol);
            if (value && value.trim() !== '') {
              lastNonEmptyRow = row;
            } else {
              break;
            }
          }
          return lastNonEmptyRow;
        }

      case 'left':
        if (isCurrentEmpty) {
          // 現在のセルが空の場合、左方向の最初の非空セルを探す
          for (let col = currentCol - 1; col >= 0; col--) {
            const value = this.getCellValue(currentRow, col);
            if (value && value.trim() !== '') {
              return col;
            }
          }
          return 0; // 非空セルが見つからない場合は最左列
        } else {
          // 現在のセルに値がある場合、連続するデータの最左端を探す
          let lastNonEmptyCol = currentCol;
          for (let col = currentCol - 1; col >= 0; col--) {
            const value = this.getCellValue(currentRow, col);
            if (value && value.trim() !== '') {
              lastNonEmptyCol = col;
            } else {
              break;
            }
          }
          return lastNonEmptyCol;
        }

      case 'right':
        if (isCurrentEmpty) {
          // 現在のセルが空の場合、右方向の最初の非空セルを探す
          for (let col = currentCol + 1; col < this.config.col_count; col++) {
            const value = this.getCellValue(currentRow, col);
            if (value && value.trim() !== '') {
              return col;
            }
          }
          return this.config.col_count - 1; // 非空セルが見つからない場合は最右列
        } else {
          // 現在のセルに値がある場合、連続するデータの最右端を探す
          let lastNonEmptyCol = currentCol;
          for (let col = currentCol + 1; col < this.config.col_count; col++) {
            const value = this.getCellValue(currentRow, col);
            if (value && value.trim() !== '') {
              lastNonEmptyCol = col;
            } else {
              break;
            }
          }
          return lastNonEmptyCol;
        }

      default:
        return direction === 'up' || direction === 'down' ? currentRow : currentCol;
    }
  }

  /**
   * グローバルTabキーキャプチャを設定
   */
  private setupGlobalTabCapture(): void {
    // 編集中のTabキーを確実に阻止するためのキャプチャリスナー
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab' && this.isEditing()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log('🚫 [DEBUG] Global Tab key capture - editing mode');
      }
    }, true); // キャプチャフェーズで実行
  }

  // Canvasリサイズ監視用
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Canvasの親要素（コンテナ）のサイズ変更を監視
        const target = entry.target as HTMLElement;
        if (target === this.canvas.parentElement) {
          const { width, height } = entry.contentRect;
          
          // デバッグログ
          console.log('🔧 [DEBUG] ResizeObserver: Container resized:', { width, height, target: target.className });
          
          // updateCanvasSizeメソッドを使用して統一的に処理
          this.updateCanvasSize(Math.floor(width), Math.floor(height));
        }
      }
    });
    
    // Canvasの親要素を監視
    const parentElement = this.canvas.parentElement;
    if (parentElement) {
      this.resizeObserver.observe(parentElement);
      console.log('🔧 [DEBUG] ResizeObserver setup completed for:', parentElement.className);
    } else {
      console.warn('🔧 [DEBUG] No parent element found for ResizeObserver');
    }
  }
} 