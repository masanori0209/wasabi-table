/**
 * テーマの色設定
 */
export interface ThemeColors {
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
    /** 範囲選択色（オプション） */
    range_selection_color?: string;
    /** エラーセル色（オプション） */
    error_cell_color?: string;
    /** 編集セル色（オプション） */
    editing_cell_color?: string;
}
/**
 * 事前定義されたテーマ
 */
export type PredefinedTheme = 'light' | 'dark';
/**
 * 事前定義されたテーマ定義
 */
export declare const PREDEFINED_THEMES: Record<PredefinedTheme, ThemeColors>;
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
 * MenuFieldの選択肢設定
 */
export interface MenuFieldOption {
    /** 表示値 */
    label: string;
    /** 内部値 */
    value: string;
    /** 無効化フラグ */
    disabled?: boolean;
}
/**
 * MenuFieldの設定（KeyValueまたはリスト形式）
 */
export interface MenuFieldConfig {
    /** 選択肢（KeyValue形式またはリスト形式） */
    options: MenuFieldOption[] | string[];
    /** 検索可能フラグ */
    searchable?: boolean;
    /** プレースホルダーテキスト */
    placeholder?: string;
    /** 最大表示項目数 */
    maxDisplayItems?: number;
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
    /** MenuField設定（新しい設定） */
    menu_config?: MenuFieldConfig;
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
export { NinjaTableListeners } from './listeners';
export type { ListenerOptions, UIElements, EventCallbacks } from './listeners';
export { createUIElements, exportTableToCSV, clearTable, loadSampleData, debounce, parseCellReference, isKeyboardShortcut } from './utils';
/**
 * WasabiTableとリスナーを簡単に初期化する関数
 */
export declare function createWasabiTableWithListeners(canvas: HTMLCanvasElement, config: Partial<TableConfig> | undefined, uiConfig: {
    cellReferenceSelector: string;
    formulaInputSelector: string;
    statsElementSelector?: string;
    validationErrorSelector?: string;
    validationSuccessSelector?: string;
}, listenerOptions?: any, callbacks?: any): Promise<{
    table: WasabiTable;
    listeners: any;
}>;
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
    absolute_x: number;
    absolute_y: number;
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
export declare class WasabiTable {
    private wasmTable;
    private config;
    private eventHandlers;
    private isInitialized;
    private tooltipElement;
    private canvas;
    private isComposing;
    private scrollContainer;
    private horizontalScrollbar;
    private verticalScrollbar;
    private horizontalThumb;
    private verticalThumb;
    private resizeObserver;
    private selectBoxElement;
    private currentMenuFieldCell;
    private menuFieldOptions;
    private constructor();
    /**
     * NinjaTableインスタンスを作成
     *
     * @param canvas - レンダリング対象のCanvasElement
     * @param config - テーブル設定（オプション）
     * @returns NinjaTableインスタンス
     */
    static create(canvas: HTMLCanvasElement, config?: Partial<TableConfig>): Promise<WasabiTable>;
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
     * @param autoScroll - 自動スクロールを有効にするかどうか（デフォルト: true）
     */
    selectCell(row: number, col: number, autoScroll?: boolean): void;
    /**
     * 選択されたセルが画面に表示されるように自動スクロール
     * Excelのような動作を実現
     */
    scrollToSelectedCell(): void;
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
    /**
     * スクロールバーのHTML構造を作成
     */
    private setupScrollbars;
    /**
     * スクロールバーのイベントリスナーを設定
     */
    private setupScrollbarEvents;
    /**
     * スクロールサムのドラッグ機能を設定
     */
    private setupThumbDrag;
    /**
     * 指定位置にスクロール
     */
    private scrollTo;
    /**
     * スクロールバーの表示を更新
     */
    private updateScrollbars;
    /**
     * Canvasのサイズを更新
     */
    updateCanvasSize(width?: number, height?: number): void;
    /**
     * Canvasリサイズイベントハンドラー
     */
    handleCanvasResize(): void;
    /**
     * 最大水平スクロール値を計算
     */
    private calculateMaxScrollX;
    /**
     * 最大垂直スクロール値を計算
     */
    private calculateMaxScrollY;
    /**
     * 範囲選択を開始
     */
    startRangeSelection(row: number, col: number): void;
    /**
     * 範囲選択を更新
     */
    updateRangeSelection(row: number, col: number): void;
    /**
     * 範囲選択を終了
     */
    endRangeSelection(): void;
    /**
     * 選択をクリア
     */
    clearSelection(): void;
    /**
     * 選択範囲をコピー
     */
    copySelection(): string;
    /**
     * クリップボードからペースト
     */
    pasteFromClipboard(tsvData: string): void;
    /**
     * 選択情報を取得
     */
    getSelectionInfo(): any;
    /**
     * マウスドラッグを処理
     */
    handleMouseDrag(canvasX: number, canvasY: number, isDragging: boolean): void;
    /**
     * キーボードショートカットを処理
     */
    handleKeyboardShortcut(event: KeyboardEvent): boolean;
    /**
     * コピー処理
     */
    private handleCopy;
    /**
     * ペースト処理
     */
    private handlePaste;
    /**
     * カット処理（コピー + 削除）
     */
    private handleCut;
    /**
     * 全選択処理
     */
    private handleSelectAll;
    /**
     * フォールバック: 古いブラウザでのコピー
     */
    private fallbackCopyToClipboard;
    /**
     * フォールバック: 古いブラウザでのペースト（制限あり）
     */
    private fallbackReadFromClipboard;
    /**
     * コピー成功の視覚的フィードバック
     */
    private showCopyFeedback;
    /**
     * Shift+矢印キーによる範囲選択を処理
     */
    private handleShiftArrowKey;
    /**
     * Shift+Ctrl+矢印キーによる範囲選択（データの端まで）を処理
     */
    private handleShiftCtrlArrowKey;
    /**
     * 通常の矢印キーによるセル移動を処理
     */
    private handleArrowKey;
    /**
     * Ctrl+矢印キーによるExcel風の端まで移動を処理
     */
    private handleCtrlArrowNavigation;
    /**
     * データの端を見つける（Excel風の動作）
     */
    private findDataEdge;
    /**
     * グローバルTabキーキャプチャを設定
     */
    private setupGlobalTabCapture;
    private setupResizeObserver;
    /**
     * MenuFieldの選択肢を設定
     */
    setMenuFieldOptions(columnName: string, config: MenuFieldConfig): void;
    /**
     * MenuFieldの選択肢を取得
     */
    getMenuFieldOptions(columnName: string): MenuFieldConfig | undefined;
    /**
     * MenuFieldセルのSelectBoxを表示
     */
    showMenuFieldSelectBox(row: number, col: number): void;
    /**
     * MenuFieldのSelectBoxを非表示
     */
    hideMenuFieldSelectBox(): void;
    /**
     * SelectBox要素を作成
     */
    private createSelectBoxElement;
    /**
     * SelectBoxのキーボードナビゲーション設定
     */
    private setupSelectBoxKeyboardNavigation;
    /**
     * オプションをハイライト
     */
    private highlightOption;
    /**
     * オプションのハイライトをクリア
     */
    private clearOptionHighlight;
    /**
     * SelectBoxの値を設定
     */
    private setSelectBoxValue;
    /**
     * SelectBoxオプションをフィルタリング
     */
    private filterSelectBoxOptions;
    /**
     * MenuFieldオプションを選択
     */
    private selectMenuFieldOption;
    /**
     * SelectBoxのキーダウンハンドラー
     */
    private handleSelectBoxKeydown;
    /**
     * 外部クリック処理
     */
    private handleOutsideClick;
    /**
     * CheckFieldの値を切り替え
     */
    toggleCheckField(row: number, col: number): void;
    /**
     * CheckFieldの値がチェック状態かどうかを判定
     */
    private isCheckFieldChecked;
    /**
     * CheckFieldの値を正規化
     */
    normalizeCheckFieldValue(value: string): string;
    /**
     * テーマを適用
     */
    applyTheme(theme: PredefinedTheme | ThemeColors): void;
    /**
     * カスタムテーマを作成するヘルパー関数
     */
    static createCustomTheme(baseTheme: PredefinedTheme, overrides: Partial<ThemeColors>): ThemeColors;
    /**
     * 利用可能なテーマ一覧を取得
     */
    static getAvailableThemes(): PredefinedTheme[];
}
