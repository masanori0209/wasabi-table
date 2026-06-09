import type { CellData, CellPosition, CellScreenPosition, ColumnHeader, CreateWasabiTableUIConfig, EventCallbacks, EventHandlers, FilterCondition, FilterResult, ListenerOptions, MenuFieldConfig, PredefinedTheme, SelectionInfo, SortCondition, TableConfig, TableStats, ThemeColors, ValidationError, ValidationResult } from './types';
export type { CellData, CellPosition, CellScreenPosition, ColumnHeader, CreateWasabiTableUIConfig, EventCallbacks, EventHandlers, FilterCondition, FilterOperator, FilterResult, ListenerOptions, MenuFieldConfig, MenuFieldOption, PredefinedTheme, SelectionInfo, SortCondition, TableConfig, TableStats, ThemeColors, UIElements, ValidationError, ValidationResult, } from './types';
export { DEFAULT_CONFIG, FieldType, HEADER_FILTER_CONTROL_WIDTH, PREDEFINED_THEMES, getCellReference, getColumnName, } from './types';
export { getSelectionReference } from './types';
export { WasabiTableListeners } from './listeners';
export { createUIElements, exportTableToCSV, clearTable, loadSampleData, debounce, parseCellReference, isKeyboardShortcut, } from './utils';
export { applyFilters as applyFilterSort, createFilterSortState, getFilterResult as buildFilterResult, passesFilter, sortRows as sortRowsByCondition, } from './filter-sort';
/**
 * WasabiTableとリスナーを簡単に初期化する関数
 */
export declare function createWasabiTableWithListeners(canvas: HTMLCanvasElement, config: Partial<TableConfig> | undefined, uiConfig: CreateWasabiTableUIConfig, listenerOptions?: ListenerOptions, callbacks?: EventCallbacks): Promise<{
    table: WasabiTable;
    listeners: import('./listeners').WasabiTableListeners;
}>;
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
    private filterSortState;
    private keyboardShortcutsEnabled;
    private activeTheme;
    private undoStack;
    private applyingHistory;
    private constructor();
    /**
     * WasabiTableインスタンスを作成
     *
     * @param canvas - レンダリング対象のCanvasElement
     * @param config - テーブル設定（オプション）
     * @returns WasabiTableインスタンス
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
    setCellValue(row: number, col: number, value: string, options?: {
        recordUndo?: boolean;
    }): void;
    canUndo(): boolean;
    canRedo(): boolean;
    undo(): boolean;
    redo(): boolean;
    private notifyUser;
    private applyHistoryChanges;
    private pushUndoChanges;
    private parseCellPosition;
    private recordInlineEditUndoIfChanged;
    private recordInlineEditUndoBeforeClickCommit;
    private collectRangeChanges;
    private parseTsv;
    private getPasteStartPosition;
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
     * キャンバスにフォーカスを戻す
     */
    focusCanvas(): void;
    /**
     * 矢印キーで選択セルを移動（数式バーからの操作にも使用）
     */
    navigateSelectedCell(key: string): void;
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
    private getFormulaInputElement;
    private isTableNavigationTarget;
    private refocusEditingInputIfNeeded;
    private syncActiveFormulaBarValue;
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
     * 列全体を選択
     */
    selectColumn(col: number): void;
    /**
     * 行全体を選択
     */
    selectRow(row: number): void;
    /**
     * シート全体を選択
     */
    selectAll(): void;
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
    getSelectionInfo(): SelectionInfo;
    /**
     * マウスドラッグを処理
     */
    handleMouseDrag(canvasX: number, canvasY: number, isDragging: boolean): void;
    /**
     * キーボードショートカットを処理
     */
    setKeyboardShortcutsEnabled(enabled: boolean): void;
    isKeyboardShortcutsEnabled(): boolean;
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
     * 印刷可能な文字かどうかを判定
     */
    private isPrintableCharacterKey;
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
    getActiveTheme(): PredefinedTheme;
    private updateScrollbarAppearance;
    /**
     * カスタムテーマを作成するヘルパー関数
     */
    static createCustomTheme(baseTheme: PredefinedTheme, overrides: Partial<ThemeColors>): ThemeColors;
    /**
     * 利用可能なテーマ一覧を取得
     */
    static getAvailableThemes(): PredefinedTheme[];
    /**
     * フィルター条件を追加
     */
    addFilterCondition(condition: FilterCondition): void;
    /**
     * フィルター条件を削除
     */
    removeFilterCondition(columnIndex: number): void;
    /**
     * 全フィルターをクリア
     */
    clearAllFilters(): void;
    /**
     * ソート条件を設定
     */
    setSortCondition(condition: SortCondition | null): void;
    /**
     * フィルター・ソートを適用
     */
    private applyFilters;
    private headerDialogController;
    private getHeaderDialogController;
    /**
     * 統合ヘッダーダイアログを表示
     */
    showHeaderDialog(columnIndex: number): void;
    /**
     * フィルターダイアログを表示（後方互換性のため）
     */
    showFilterDialog(columnIndex: number): void;
    /**
     * ヘッダーの位置を取得
     */
    private getHeaderPosition;
    /**
     * フィルター状態を取得
     */
    getFilterState(): {
        conditions: FilterCondition[];
        sortCondition: SortCondition | null;
        isFiltered: boolean;
    };
    /**
     * フィルター結果を取得
     */
    getFilterResult(): FilterResult;
    /**
     * 列ヘッダー内のクリックゾーン（E2E・テスト用、canvas 座標）
     */
    getColumnHeaderZones(columnIndex: number): {
        select: {
            x: number;
            y: number;
        };
        filter: {
            x: number;
            y: number;
        };
        width: number;
        hasFilterControl: boolean;
    } | null;
    /**
     * 行ヘッダー内のクリックゾーン（canvas 座標）
     */
    getRowHeaderZone(dataRow: number): {
        x: number;
        y: number;
    } | null;
    /**
     * 左上角（全選択）のクリックゾーン（canvas 座標）
     */
    getSelectAllCornerZone(): {
        x: number;
        y: number;
    };
    private getColumnWidthAt;
    private getColumnHeaderLayout;
    private isColumnFilterControlClick;
    /**
     * X座標から列インデックスを取得
     */
    private getColumnIndexFromX;
    /**
     * Y座標からデータ行インデックスを取得
     */
    private getRowIndexFromY;
    /**
     * ヘッダークリック処理
     */
    private handleHeaderClick;
    /**
     * ヘッダーソート処理
     */
    private handleHeaderSort;
    /**
     * ヘッダーボタンを削除
     */
    removeHeaderButtons(): void;
    /**
     * ヘッダーボタンの位置を更新
     */
    updateHeaderButtonPositions(): void;
}
