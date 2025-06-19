/**
 * 共通の型定義とユーティリティ関数
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
export interface CellData {
    /** セルの値 */
    value: string;
    /** 行インデックス */
    row: number;
    /** 列インデックス */
    col: number;
}
export interface CellPosition {
    /** 行インデックス */
    row: number;
    /** 列インデックス */
    col: number;
}
export interface ValidationError {
    /** フィールド名 */
    field_name: string;
    /** エラーメッセージ */
    message: string;
    /** エラータイプ */
    error_type: string;
}
export interface ValidationResult {
    /** 検証が成功したかどうか */
    isValid: boolean;
    /** エラー情報（検証失敗時のみ） */
    error?: ValidationError;
}
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
 * 列名を生成（A, B, C, ..., Z, AA, AB, ...）
 */
export declare function getColumnName(col: number): string;
/**
 * セル参照文字列を生成（例: A1, B2, AA10）
 */
export declare function getCellReference(row: number, col: number): string;
/**
 * WasabiTableのインターフェース（循環インポートを避けるため）
 */
export interface IWasabiTable {
    getSelectedCell(): CellPosition | undefined;
    setCellValue(row: number, col: number, value: string): void;
    setCellValueWithValidation(row: number, col: number, value: string): ValidationResult;
    validateCellValue(row: number, col: number, value: string): ValidationError[];
    getConfig(): TableConfig;
    render(): void;
    selectCell(row: number, col: number): void;
    setEventHandlers(handlers: any): void;
    getCellValue(row: number, col: number): string | undefined;
    getSelectedCellValidationError(): string | undefined;
    getStats(): any;
}
