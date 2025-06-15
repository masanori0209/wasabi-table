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
export declare const DEFAULT_CONFIG: TableConfig;
/**
 * フィールドタイプの列挙型
 */
export declare enum FieldType {
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
export declare class NinjaTable {
    private wasmTable;
    private config;
    private eventHandlers;
    private isInitialized;
    private tooltipElement;
    private canvas;
    private isComposing;
    private constructor();
    /**
     * NinjaTableインスタンスを作成
     *
     * @param canvas - レンダリング対象のCanvasElement
     * @param config - テーブル設定（オプション）
     * @returns NinjaTableインスタンス
     */
    static create(canvas: HTMLCanvasElement, config?: Partial<TableConfig>): Promise<NinjaTable>;
    /**
     * イベントハンドラーを設定
     */
    setEventHandlers(handlers: EventHandlers): void;
    /**
     * セルの値を設定
     *
     * @param row 行番号（0から開始）
     * @param col 列番号（0から開始）
     * @param value 設定する値
     */
    setCellValue(row: number, col: number, value: string): void;
    /**
     * セルの値を取得
     *
     * @param row - 行インデックス
     * @param col - 列インデックス
     * @returns セルの値（存在しない場合はundefined）
     */
    getCellValue(row: number, col: number): string | undefined;
    /**
     * 複数のセルデータを一括設定
     *
     * @param data - セルデータの配列
     */
    setBatchData(data: CellData[]): void;
    /**
     * テーブルをレンダリング
     */
    render(): void;
    /**
     * セルを選択
     *
     * @param row - 行インデックス
     * @param col - 列インデックス
     */
    selectCell(row: number, col: number): void;
    /**
     * 現在選択されているセルの位置を取得
     *
     * @returns 選択セルの位置（選択されていない場合はundefined）
     */
    getSelectedCell(): CellPosition | undefined;
    /**
     * 編集を開始
     *
     * @param row - 行インデックス
     * @param col - 列インデックス
     */
    startEditing(row: number, col: number): void;
    /**
     * 編集状態かどうかを確認
     *
     * @returns 編集中の場合true
     */
    isEditing(): boolean;
    /**
     * 編集を完了
     */
    finishEditing(): void;
    /**
     * 編集をキャンセル
     */
    cancelEditing(): void;
    /**
     * テーブル統計情報を取得
     *
     * @returns 統計情報
     */
    getStats(): TableStats;
    /**
     * テーブル設定を取得
     *
     * @returns 現在の設定
     */
    getConfig(): TableConfig;
    /**
     * 列ヘッダー設定を適用
     *
     * @param headers - 列ヘッダー設定の配列（JSON文字列またはオブジェクト配列）
     */
    setColumnHeaders(headers: string | ColumnHeader[]): void;
    /**
     * 列ヘッダー設定を取得
     *
     * @returns 列ヘッダー設定のJSON文字列
     */
    getColumnHeaders(): string;
    /**
     * 列ヘッダー設定をオブジェクト配列として取得
     *
     * @returns 列ヘッダー設定のオブジェクト配列
     */
    getColumnHeadersAsArray(): ColumnHeader[];
    /**
     * セルの値を検証
     *
     * @param row 行番号（0から開始）- 現在は使用されていません
     * @param col 列番号（0から開始）
     * @param value 検証する値
     * @returns 検証エラーの配列（エラーがない場合は空配列）
     */
    validateCellValue(_row: number, col: number, value: string): ValidationError[];
    /**
     * 検証付きでセルの値を設定
     *
     * @param row 行番号（0から開始）
     * @param col 列番号（0から開始）
     * @param value 設定する値
     * @returns 検証結果
     */
    setCellValueWithValidation(row: number, col: number, value: string): ValidationResult;
    /**
     * 選択されたセルの検証エラーメッセージを取得
     *
     * @returns エラーメッセージ（エラーがない場合はundefined）
     */
    getSelectedCellValidationError(): string | undefined;
    /**
     * 指定されたセルの検証エラー情報を取得
     *
     * @param row - 行インデックス
     * @param col - 列インデックス
     * @returns 検証エラー情報（エラーがない場合はundefined）
     */
    getCellValidationError(row: number, col: number): ValidationError | undefined;
    /**
     * 指定されたセルの画面上の位置を取得
     *
     * @param row - 行インデックス
     * @param col - 列インデックス
     * @returns セルの画面位置情報
     */
    getCellScreenPosition(row: number, col: number): CellScreenPosition;
    /**
     * 選択されたセルの画面上の位置を取得
     *
     * @returns 選択セルの画面位置情報（選択されていない場合はundefined）
     */
    getSelectedCellScreenPosition(): CellScreenPosition | undefined;
    /**
     * 検証エラー吹き出しを表示
     */
    private showValidationTooltip;
    /**
     * 検証エラー吹き出しを非表示
     */
    private hideValidationTooltip;
    /**
     * 選択されたセルの検証エラーを確認して吹き出しを表示
     */
    private updateValidationTooltip;
    /**
     * リソースを解放
     */
    dispose(): void;
    /**
     * 列名を生成（A, B, C, ..., Z, AA, AB, ...）
     *
     * @param col - 列インデックス
     * @returns 列名
     */
    static getColumnName(col: number): string;
    /**
     * セル参照文字列を生成（例: A1, B2, AA10）
     *
     * @param row - 行インデックス
     * @param col - 列インデックス
     * @returns セル参照文字列
     */
    static getCellReference(row: number, col: number): string;
    private setupEventHandlers;
    private triggerCellSelectEvent;
    private ensureInitialized;
    private createTooltipElement;
}
//# sourceMappingURL=index.d.ts.map