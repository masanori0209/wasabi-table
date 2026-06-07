import init, { WasabiTable as WasmWasabiTable } from '../pkg/wasabi_table.js';
import { DEFAULT_CONFIG, FieldType, PREDEFINED_THEMES, getCellReference as cellReferenceFn, getColumnName as columnNameFn, } from './types.js';
export { DEFAULT_CONFIG, FieldType, PREDEFINED_THEMES, getCellReference, getColumnName, } from './types.js';
export { getSelectionReference } from './types.js';
// --- 型定義は types.ts に集約 ---
export { WasabiTableListeners } from './listeners.js';
export { createUIElements, exportTableToCSV, clearTable, loadSampleData, debounce, parseCellReference, isKeyboardShortcut, } from './utils.js';
import { applyFilters as runFilterSort, createFilterSortState, getFilterResult as buildFilterResult, } from './filter-sort.js';
import { HeaderDialogController } from './header-dialog.js';
import { UndoStack } from './undo-stack.js';
import { buildValidationTooltipContent } from './utils.js';
export { applyFilters as applyFilterSort, createFilterSortState, getFilterResult as buildFilterResult, passesFilter, sortRows as sortRowsByCondition, } from './filter-sort.js';
/**
 * WasabiTableとリスナーを簡単に初期化する関数
 */
export async function createWasabiTableWithListeners(canvas, config = {}, uiConfig, listenerOptions, callbacks) {
    const { createUIElements } = await import('./utils.js');
    const { WasabiTableListeners } = await import('./listeners.js');
    const table = await WasabiTable.create(canvas, config);
    const uiElements = createUIElements(uiConfig);
    const listeners = new WasabiTableListeners(table, uiElements, listenerOptions, callbacks);
    return { table, listeners };
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
    constructor(wasmTable, config, canvas) {
        this.eventHandlers = {};
        this.isInitialized = false;
        this.tooltipElement = null;
        this.isComposing = false; // IME入力状態を管理
        // スクロールバー関連
        this.scrollContainer = null;
        this.horizontalScrollbar = null;
        this.verticalScrollbar = null;
        this.horizontalThumb = null;
        this.verticalThumb = null;
        // リサイズ監視
        this.resizeObserver = null;
        // MenuField関連
        this.selectBoxElement = null;
        this.currentMenuFieldCell = null;
        this.menuFieldOptions = new Map();
        // フィルター・ソート関連
        this.filterSortState = createFilterSortState();
        this.keyboardShortcutsEnabled = true;
        this.activeTheme = 'light';
        this.undoStack = new UndoStack();
        this.applyingHistory = false;
        /**
         * SelectBoxのキーダウンハンドラー
         */
        this.handleSelectBoxKeydown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.hideMenuFieldSelectBox();
            }
        };
        this.headerDialogController = null;
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
     * WasabiTableインスタンスを作成
     *
     * @param canvas - レンダリング対象のCanvasElement
     * @param config - テーブル設定（オプション）
     * @returns WasabiTableインスタンス
     */
    static async create(canvas, config = {}) {
        // WebAssemblyモジュールを初期化
        await init();
        const finalConfig = { ...DEFAULT_CONFIG, ...config };
        const wasmTable = new WasmWasabiTable(canvas, JSON.stringify(finalConfig));
        const table = new WasabiTable(wasmTable, finalConfig, canvas);
        table.isInitialized = true;
        table.updateCanvasSize();
        return table;
    }
    /**
     * イベントハンドラーを設定
     */
    setEventHandlers(handlers) {
        this.eventHandlers = { ...this.eventHandlers, ...handlers };
    }
    /**
     * セルの値を設定
     *
     * @param row 行番号（0から開始）
     * @param col 列番号（0から開始）
     * @param value 設定する値
     */
    setCellValue(row, col, value, options) {
        var _a, _b;
        this.ensureInitialized();
        const recordUndo = (_a = options === null || options === void 0 ? void 0 : options.recordUndo) !== null && _a !== void 0 ? _a : true;
        if (recordUndo && !this.applyingHistory) {
            const oldValue = (_b = this.getCellValue(row, col)) !== null && _b !== void 0 ? _b : '';
            if (oldValue !== value) {
                this.undoStack.push({
                    changes: [{ row, col, oldValue, newValue: value }],
                });
            }
        }
        this.wasmTable.set_cell_data(row, col, value);
        setTimeout(() => {
            this.updateValidationTooltip();
        }, 100);
    }
    canUndo() {
        return this.undoStack.canUndo();
    }
    canRedo() {
        return this.undoStack.canRedo();
    }
    undo() {
        const batch = this.undoStack.popUndo();
        if (!batch)
            return false;
        this.applyHistoryChanges(batch.changes, false);
        this.undoStack.pushRedo(batch);
        this.notifyUser(`変更を元に戻しました（${batch.changes.length}件）`, 'info');
        return true;
    }
    redo() {
        const batch = this.undoStack.popRedo();
        if (!batch)
            return false;
        this.applyHistoryChanges(batch.changes, true);
        this.undoStack.pushUndo(batch);
        this.notifyUser(`やり直しました（${batch.changes.length}件）`, 'redo');
        return true;
    }
    notifyUser(message, type = 'info') {
        var _a, _b;
        (_b = (_a = this.eventHandlers).onNotification) === null || _b === void 0 ? void 0 : _b.call(_a, message, type);
    }
    applyHistoryChanges(changes, useNewValues) {
        this.applyingHistory = true;
        try {
            for (const change of changes) {
                const value = useNewValues ? change.newValue : change.oldValue;
                this.wasmTable.set_cell_data(change.row, change.col, value);
            }
            this.render();
            this.triggerCellSelectEvent();
            const triggerRender = window.triggerRender;
            if (typeof triggerRender === 'function') {
                triggerRender();
            }
        }
        finally {
            this.applyingHistory = false;
        }
    }
    pushUndoChanges(changes) {
        if (this.applyingHistory || changes.length === 0)
            return;
        this.undoStack.push({ changes });
    }
    collectRangeChanges(startRow, startCol, values) {
        var _a;
        const changes = [];
        for (let rowOffset = 0; rowOffset < values.length; rowOffset++) {
            for (let colOffset = 0; colOffset < values[rowOffset].length; colOffset++) {
                const row = startRow + rowOffset;
                const col = startCol + colOffset;
                if (row >= this.config.row_count || col >= this.config.col_count)
                    continue;
                const newValue = values[rowOffset][colOffset];
                const oldValue = (_a = this.getCellValue(row, col)) !== null && _a !== void 0 ? _a : '';
                if (oldValue !== newValue) {
                    changes.push({ row, col, oldValue, newValue });
                }
            }
        }
        return changes;
    }
    parseTsv(tsvData) {
        return tsvData
            .split('\n')
            .filter((row) => row.trim().length > 0)
            .map((row) => row.split('\t'));
    }
    getPasteStartPosition() {
        const selectionInfo = this.getSelectionInfo();
        if (selectionInfo.isRange &&
            selectionInfo.start_row !== undefined &&
            selectionInfo.start_col !== undefined) {
            return { row: selectionInfo.start_row, col: selectionInfo.start_col };
        }
        const selectedCell = this.getSelectedCell();
        if (selectedCell) {
            return { row: selectedCell.row, col: selectedCell.col };
        }
        return { row: 0, col: 0 };
    }
    /**
     * セルの値を取得
     *
     * @param row - 行インデックス
     * @param col - 列インデックス
     * @returns セルの値（存在しない場合はundefined）
     */
    getCellValue(row, col) {
        this.ensureInitialized();
        return this.wasmTable.get_cell_data(row, col) || undefined;
    }
    /**
     * 複数のセルデータを一括設定
     *
     * @param data - セルデータの配列
     */
    setBatchData(data) {
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
        if (!this.applyingHistory) {
            const changes = data
                .map((cell) => {
                var _a;
                return ({
                    row: cell.row,
                    col: cell.col,
                    oldValue: (_a = this.getCellValue(cell.row, cell.col)) !== null && _a !== void 0 ? _a : '',
                    newValue: cell.value,
                });
            })
                .filter((change) => change.oldValue !== change.newValue);
            this.pushUndoChanges(changes);
        }
        this.wasmTable.set_batch_data(jsonData);
    }
    /**
     * テーブルをレンダリング
     */
    render() {
        this.ensureInitialized();
        // レンダリング最適化: requestAnimationFrameを使用
        if ('requestAnimationFrame' in window) {
            requestAnimationFrame(() => {
                this.wasmTable.render();
                this.updateScrollbars();
            });
        }
        else {
            // フォールバック
            this.wasmTable.render();
            this.updateScrollbars();
        }
    }
    /**
     * セルを選択
     *
     * @param row - 行インデックス
     * @param col - 列インデックス
     * @param autoScroll - 自動スクロールを有効にするかどうか（デフォルト: true）
     */
    selectCell(row, col, autoScroll = true) {
        this.ensureInitialized();
        if (this.isEditing()) {
            this.finishEditing();
        }
        // 直接行・列番号でセルを選択する方法を使用
        // 座標計算に依存せず、Rust側のselect_cell_by_positionメソッドを使用
        const result = this.wasmTable.select_cell_by_position(row, col);
        // 結果を検証
        const selectedAfter = this.getSelectedCell();
        // 自動スクロールが有効な場合、選択されたセルが見えるようにスクロール
        if (autoScroll && selectedAfter) {
            this.scrollToSelectedCell();
        }
    }
    /**
     * 選択されたセルが画面に表示されるように自動スクロール
     * Excelのような動作を実現
     */
    scrollToSelectedCell() {
        this.ensureInitialized();
        const selectedCell = this.getSelectedCell();
        if (!selectedCell) {
            return;
        }
        // セルの画面位置を取得
        const cellPosition = this.getCellScreenPosition(selectedCell.row, selectedCell.col);
        // 現在のスクロール位置を取得
        const stats = this.getStats();
        const currentScrollX = stats.scrollX;
        const currentScrollY = stats.scrollY;
        // 表示領域の計算
        const headerHeight = this.config.header_height;
        const rowHeaderWidth = this.config.row_header_width;
        const scrollbarWidth = 17; // スクロールバーの幅
        // 論理ピクセルサイズを使用（CSSサイズ）
        const canvasDisplayWidth = parseFloat(this.canvas.style.width) || this.canvas.width;
        const canvasDisplayHeight = parseFloat(this.canvas.style.height) || this.canvas.height;
        const viewportWidth = canvasDisplayWidth - rowHeaderWidth - scrollbarWidth;
        const viewportHeight = canvasDisplayHeight - headerHeight - scrollbarWidth;
        // セルの絶対位置を取得（Rustから返される値を使用）
        const absoluteCellX = cellPosition.absolute_x;
        const absoluteCellY = cellPosition.absolute_y;
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
        }
        else if (cellRight > viewportRight) {
            // セルが右側に隠れている場合
            newScrollX = cellRight - viewportWidth;
        }
        // 垂直スクロールの調整
        const cellTop = absoluteCellY - headerHeight;
        const cellBottom = cellTop + cellPosition.height;
        const viewportTop = currentScrollY;
        const viewportBottom = currentScrollY + viewportHeight;
        if (cellTop < viewportTop) {
            // セルが上側に隠れている場合
            newScrollY = cellTop;
        }
        else if (cellBottom > viewportBottom) {
            // セルが下側に隠れている場合
            newScrollY = cellBottom - viewportHeight;
        }
        // スクロール範囲の制限
        const maxScrollX = this.calculateMaxScrollX();
        const maxScrollY = this.calculateMaxScrollY();
        newScrollX = Math.max(0, Math.min(newScrollX, maxScrollX));
        newScrollY = Math.max(0, Math.min(newScrollY, maxScrollY));
        // スクロールが必要な場合のみ実行
        if (Math.abs(newScrollX - currentScrollX) > 0.1 || Math.abs(newScrollY - currentScrollY) > 0.1) {
            // スクロール実行
            const deltaX = newScrollX - currentScrollX;
            const deltaY = newScrollY - currentScrollY;
            this.wasmTable.scroll(deltaX, deltaY);
            this.updateScrollbars();
        }
        else {
        }
    }
    /**
     * 現在選択されているセルの位置を取得
     *
     * @returns 選択セルの位置（選択されていない場合はundefined）
     */
    getSelectedCell() {
        this.ensureInitialized();
        const selected = this.wasmTable.get_selected_cell();
        if (!selected)
            return undefined;
        const [row, col] = selected.split(':').map(Number);
        return { row, col };
    }
    /**
     * 編集を開始
     *
     * @param row - 行インデックス
     * @param col - 列インデックス
     */
    startEditing(row, col) {
        this.ensureInitialized();
        // 特別なフィールドタイプの場合は編集の代わりに専用処理
        const columnHeaders = this.getColumnHeadersAsArray();
        if (col < columnHeaders.length) {
            const header = columnHeaders[col];
            if (header.field_type === FieldType.MenuField) {
                // MenuFieldの場合はSelectBoxを表示
                this.showMenuFieldSelectBox(row, col);
                return;
            }
            else if (header.field_type === FieldType.CheckField || header.field_type === FieldType.BooleanField) {
                // CheckFieldの場合はチェック状態を切り替え
                this.toggleCheckField(row, col);
                return;
            }
        }
        this.wasmTable.start_editing(row, col);
    }
    /**
     * 編集状態かどうかを確認
     *
     * @returns 編集中の場合true
     */
    isEditing() {
        this.ensureInitialized();
        return this.wasmTable.is_editing();
    }
    /**
     * 編集を完了
     */
    finishEditing() {
        this.ensureInitialized();
        this.wasmTable.finish_editing();
        this.focusCanvas();
        // 編集完了後に検証エラーを更新
        setTimeout(() => {
            this.updateValidationTooltip();
        }, 100);
    }
    /**
     * キャンバスにフォーカスを戻す
     */
    focusCanvas() {
        this.canvas.focus();
    }
    /**
     * 矢印キーで選択セルを移動（数式バーからの操作にも使用）
     */
    navigateSelectedCell(key) {
        this.ensureInitialized();
        if (this.isEditing()) {
            this.finishEditing();
        }
        this.syncActiveFormulaBarValue();
        this.clearSelection();
        this.handleArrowKey(key);
    }
    /**
     * 編集をキャンセル
     */
    cancelEditing() {
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
    getStats() {
        this.ensureInitialized();
        return JSON.parse(this.wasmTable.get_stats());
    }
    /**
     * テーブル設定を取得
     */
    getConfig() {
        this.ensureInitialized();
        return this.config;
    }
    /**
     * 列ヘッダー設定を適用
     *
     * @param headers - 列ヘッダー設定の配列（JSON文字列またはオブジェクト配列）
     */
    setColumnHeaders(headers) {
        this.ensureInitialized();
        const headersJson = typeof headers === 'string' ? headers : JSON.stringify(headers);
        this.wasmTable.set_column_headers(headersJson);
    }
    /**
     * 列ヘッダー設定を取得
     *
     * @returns 列ヘッダー設定のJSON文字列
     */
    getColumnHeaders() {
        this.ensureInitialized();
        return this.wasmTable.get_column_headers();
    }
    /**
     * 列ヘッダー設定をオブジェクト配列として取得
     *
     * @returns 列ヘッダー設定のオブジェクト配列
     */
    getColumnHeadersAsArray() {
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
    validateCellValue(_row, col, value) {
        this.ensureInitialized();
        try {
            // 基底クラスのメソッドは(col, value)の形式なので、rowは使用せずcolとvalueのみ渡す
            const resultJson = this.wasmTable.validate_cell_value(col, value);
            if (resultJson && resultJson.trim() !== '') {
                return JSON.parse(resultJson);
            }
            return [];
        }
        catch (error) {
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
    setCellValueWithValidation(row, col, value) {
        const validationErrors = this.validateCellValue(row, col, value);
        // 検証結果に関わらず値は設定する（警告は表示される）
        this.setCellValue(row, col, value);
        if (validationErrors.length === 0) {
            return { isValid: true };
        }
        else {
            return { isValid: false, error: validationErrors[0] };
        }
    }
    /**
     * 選択されたセルの検証エラーメッセージを取得
     *
     * @returns エラーメッセージ（エラーがない場合はundefined）
     */
    getSelectedCellValidationError() {
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
    getCellValidationError(row, col) {
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
    getCellScreenPosition(row, col) {
        this.ensureInitialized();
        const positionJson = this.wasmTable.get_cell_screen_position(row, col);
        return JSON.parse(positionJson);
    }
    /**
     * 選択されたセルの画面上の位置を取得
     *
     * @returns 選択セルの画面位置情報（選択されていない場合はundefined）
     */
    getSelectedCellScreenPosition() {
        this.ensureInitialized();
        const positionJson = this.wasmTable.get_selected_cell_screen_position();
        return positionJson && positionJson.trim() !== '' ? JSON.parse(positionJson) : undefined;
    }
    /**
     * 検証エラー吹き出しを表示
     */
    showValidationTooltip(message, cellPosition) {
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
            const tooltipContent = buildValidationTooltipContent(message, { isBelow, arrowOffset });
            this.tooltipElement.replaceChildren(tooltipContent);
            this.tooltipElement.style.left = tooltipX + 'px';
            this.tooltipElement.style.top = tooltipY + 'px';
            this.tooltipElement.style.display = 'block';
        }
        catch (error) {
            console.warn('Failed to show validation tooltip:', error);
            this.hideValidationTooltip();
        }
    }
    /**
     * 検証エラー吹き出しを非表示
     */
    hideValidationTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.style.display = 'none';
        }
    }
    /**
     * 選択されたセルの検証エラーを確認して吹き出しを表示
     */
    updateValidationTooltip() {
        try {
            const selectedCell = this.getSelectedCell();
            if (selectedCell && typeof this.wasmTable.get_selected_cell_validation_error === 'function') {
                const validationErrorMessage = this.wasmTable.get_selected_cell_validation_error();
                if (validationErrorMessage && validationErrorMessage.trim() !== '') {
                    // 少し遅延させて正確な位置を取得
                    setTimeout(() => {
                        this.showValidationTooltip(validationErrorMessage, selectedCell);
                    }, 50);
                }
                else {
                    this.hideValidationTooltip();
                }
            }
            else {
                this.hideValidationTooltip();
            }
        }
        catch (error) {
            console.warn('Failed to update validation tooltip:', error);
            this.hideValidationTooltip();
        }
    }
    /**
     * リソースを解放
     */
    dispose() {
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
        // MenuField SelectBoxを削除
        this.hideMenuFieldSelectBox();
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
    static getColumnName(col) {
        return columnNameFn(col);
    }
    /**
     * セル参照文字列を生成（例: A1, B2, AA10）
     *
     * @param row - 行インデックス
     * @param col - 列インデックス
     * @returns セル参照文字列
     */
    static getCellReference(row, col) {
        return cellReferenceFn(row, col);
    }
    setupEventHandlers() {
        let isDragging = false;
        let dragStartCell = null;
        let dragEndedAt = 0;
        let hasActuallyDragged = false; // 実際にマウスが移動したかを追跡
        const suppressClickAfterDragMs = 400;
        // handleTableKey関数は不要（Rustのkeydownリスナーを無効化したため）
        // 矢印キー以外のキーは直接handle_canvas_keydownを呼び出す
        // 基本的なマウスクリック
        this.canvas.addEventListener('click', (event) => {
            // ドラッグ直後に発火する click は範囲選択を壊すため無視
            if (Date.now() - dragEndedAt < suppressClickAfterDragMs) {
                return;
            }
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            // キャンバスにフォーカスを設定
            this.canvas.focus();
            if (event.shiftKey) {
                // Shift+クリックで範囲選択（mousedownでの処理を統合）
                const cellPos = this.wasmTable.pixel_to_cell(x, y);
                if (cellPos) {
                    const [row, col] = cellPos.split(':').map(Number);
                    // 現在選択されているセルがある場合は、そこから範囲選択を開始
                    const currentSelection = this.getSelectedCell();
                    const selectionInfo = this.getSelectionInfo();
                    if (currentSelection && !(selectionInfo === null || selectionInfo === void 0 ? void 0 : selectionInfo.isRange)) {
                        // 単一セル選択から範囲選択に移行
                        this.startRangeSelection(currentSelection.row, currentSelection.col);
                    }
                    else if (!currentSelection) {
                        // 何も選択されていない場合は、クリックしたセルから開始
                        this.startRangeSelection(row, col);
                    }
                    // 範囲選択を更新
                    this.updateRangeSelection(row, col);
                    this.endRangeSelection(); // 即座に範囲選択を確定
                    this.render();
                }
            }
            else {
                // 通常のクリックでは範囲選択をクリアしてから単一セル選択
                // Rustのhandle_canvas_clickで範囲選択クリアが処理されるため、clearSelectionは不要
                this.wasmTable.handle_canvas_click(x, y);
                this.triggerCellSelectEvent();
                const cellPos = this.wasmTable.pixel_to_cell(x, y);
                if (cellPos) {
                    const [row, col] = cellPos.split(':').map(Number);
                    const columnHeaders = this.getColumnHeadersAsArray();
                    if (col < columnHeaders.length) {
                        const header = columnHeaders[col];
                        if (header.field_type === FieldType.MenuField) {
                            this.showMenuFieldSelectBox(row, col);
                        }
                        else if (header.field_type === FieldType.CheckField || header.field_type === FieldType.BooleanField) {
                            this.toggleCheckField(row, col);
                        }
                    }
                }
            }
        });
        // ダブルクリックで編集開始（MenuFieldは除く）
        this.canvas.addEventListener('dblclick', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const cellPos = this.wasmTable.pixel_to_cell(x, y);
            if (cellPos) {
                const [row, col] = cellPos.split(':').map(Number);
                // MenuFieldの場合は編集を開始しない（SelectBoxを表示）
                const columnHeaders = this.getColumnHeadersAsArray();
                if (col < columnHeaders.length && columnHeaders[col].field_type === FieldType.MenuField) {
                    this.showMenuFieldSelectBox(row, col);
                    return;
                }
                this.startEditing(row, col);
            }
        });
        // マウスドラッグによる範囲選択
        const updateDragSelectionAt = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            const cellPos = this.wasmTable.pixel_to_cell(x, y);
            if (!cellPos)
                return;
            const [row, col] = cellPos.split(':').map(Number);
            if (!hasActuallyDragged && dragStartCell) {
                this.startRangeSelection(dragStartCell.row, dragStartCell.col);
                hasActuallyDragged = true;
            }
            this.updateRangeSelection(row, col);
            this.render();
        };
        const finishDragSelection = () => {
            if (!isDragging)
                return;
            document.removeEventListener('mousemove', onDocumentMouseMove);
            document.removeEventListener('mouseup', onDocumentMouseUp);
            if (hasActuallyDragged) {
                this.endRangeSelection();
                this.triggerCellSelectEvent();
                dragEndedAt = Date.now();
            }
            isDragging = false;
            dragStartCell = null;
            hasActuallyDragged = false;
        };
        const onDocumentMouseMove = (event) => {
            if (!isDragging)
                return;
            updateDragSelectionAt(event.clientX, event.clientY);
        };
        const onDocumentMouseUp = () => {
            finishDragSelection();
        };
        this.canvas.addEventListener('mousemove', (event) => {
            if (isDragging) {
                updateDragSelectionAt(event.clientX, event.clientY);
            }
        });
        this.canvas.addEventListener('mouseup', () => {
            finishDragSelection();
        });
        this.canvas.addEventListener('mousedown', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            if (y <= this.config.header_height && x > this.config.row_header_width) {
                const columnIndex = this.getColumnIndexFromX(x);
                if (columnIndex !== -1) {
                    this.handleHeaderClick(columnIndex, event);
                    return;
                }
            }
            const cellPos = this.wasmTable.pixel_to_cell(x, y);
            if (cellPos) {
                const [row, col] = cellPos.split(':').map(Number);
                if (event.shiftKey) {
                    isDragging = false;
                    hasActuallyDragged = false;
                }
                else {
                    dragStartCell = { row, col };
                    hasActuallyDragged = false;
                    isDragging = true;
                    document.addEventListener('mousemove', onDocumentMouseMove);
                    document.addEventListener('mouseup', onDocumentMouseUp);
                }
            }
        });
        this.canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.wasmTable.handle_canvas_wheel(event.deltaX, event.deltaY);
            this.hideValidationTooltip();
            this.updateScrollbars();
            const triggerRender = window.triggerRender;
            if (typeof triggerRender === 'function') {
                triggerRender();
            }
            else {
                this.render();
            }
            setTimeout(() => {
                this.updateValidationTooltip();
            }, 150);
        }, { passive: false });
        // 統一されたキーボードイベント処理
        document.addEventListener('keydown', (event) => {
            if (this.isComposing) {
                return;
            }
            // 編集中の処理
            if (this.isEditing()) {
                // 編集中のTabキーは特別に処理（ブラウザのデフォルト動作を完全に阻止）
                if (event.key === 'Tab') {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                }
                // Excel風: 矢印キーで編集を確定して隣のセルへ移動
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) && !event.shiftKey) {
                    event.preventDefault();
                    this.finishEditing();
                    this.syncActiveFormulaBarValue();
                    this.clearSelection();
                    this.handleArrowKey(event.key);
                    return;
                }
                // Delete/Backspaceキーの範囲選択対応
                if (event.key === 'Delete' || event.key === 'Backspace') {
                    const selectionInfo = this.getSelectionInfo();
                    if (selectionInfo && selectionInfo.isRange) {
                        this.wasmTable.handle_canvas_keydown(event.key);
                        this.render();
                        event.preventDefault();
                        return;
                    }
                }
                // フォーカスがオーバーレイから外れた場合は戻す（onCellSelect 等で奪われることがある）
                this.refocusEditingInputIfNeeded();
                return;
            }
            // キャンバス・数式バーからのテーブル操作のみ受け付ける
            if (!this.isTableNavigationTarget()) {
                return;
            }
            this.syncActiveFormulaBarValue();
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
                    this.handleShiftCtrlArrowKey(event.key);
                }
                else if (event.shiftKey) {
                    // Shift+矢印キーによる範囲選択
                    this.handleShiftArrowKey(event.key);
                }
                else {
                    // 通常の矢印キーによるセル移動
                    this.clearSelection(); // 範囲選択をクリア
                    this.handleArrowKey(event.key);
                }
                event.preventDefault();
                return;
            }
            // Enterキーで編集開始（数式バーは listeners 側で処理）
            if (event.key === 'Enter' && !this.isEditing() && document.activeElement !== this.getFormulaInputElement()) {
                const selectedCell = this.getSelectedCell();
                if (selectedCell) {
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
                    this.selectCell(selectedCell.row, newCol);
                    this.render();
                    this.triggerCellSelectEvent();
                    event.preventDefault();
                    return;
                }
            }
            // 印刷可能文字の範囲選択対応
            if (this.isPrintableCharacterKey(event.key)) {
                const selectionInfo = this.getSelectionInfo();
                if (selectionInfo && selectionInfo.isRange) {
                    // 範囲選択から編集開始（Rustで処理）
                    this.wasmTable.handle_canvas_keydown(event.key);
                    event.preventDefault();
                    return;
                }
            }
            // 矢印キー以外のキーは従来のハンドラーに委譲（矢印キーは完全にTypeScriptで処理）
            // ただし、Rustのkeydownリスナーを無効化したため、直接Rustのメソッドを呼び出す
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab'].includes(event.key)) {
                try {
                    this.wasmTable.handle_canvas_keydown(event.key);
                    this.triggerCellSelectEvent();
                }
                catch (error) {
                    console.warn('Failed to handle key in Rust:', error);
                }
            }
        });
        // IME状態を監視
        document.addEventListener('compositionstart', () => {
            this.isComposing = true;
        });
        document.addEventListener('compositionend', () => {
            this.isComposing = false;
        });
        // 編集中のキーイベントハンドラー（改善版）
        window.handleEditingEnter = () => {
            try {
                this.wasmTable.handle_editing_enter();
                this.focusCanvas();
                this.triggerCellSelectEvent();
            }
            catch (error) {
                console.error('Error handling editing Enter:', error);
            }
        };
        window.handleEditingTab = () => {
            try {
                this.wasmTable.handle_editing_tab();
                this.focusCanvas();
                this.triggerCellSelectEvent();
            }
            catch (error) {
                console.error('Error handling editing Tab:', error);
            }
        };
        window.handleEditingEscape = () => {
            try {
                this.wasmTable.handle_editing_escape();
                this.focusCanvas();
                this.triggerCellSelectEvent();
            }
            catch (error) {
                console.error('Error handling editing Escape:', error);
            }
        };
    }
    getFormulaInputElement() {
        return document.getElementById('formulaInput');
    }
    isTableNavigationTarget() {
        const active = document.activeElement;
        if (!active)
            return false;
        if (active === this.canvas)
            return true;
        if (active instanceof HTMLElement && active.dataset.wasabiEditing === 'true')
            return true;
        if (active === this.getFormulaInputElement())
            return true;
        return false;
    }
    refocusEditingInputIfNeeded() {
        const input = document.querySelector('[data-wasabi-editing="true"]');
        if (input && document.activeElement !== input) {
            input.focus();
        }
    }
    syncActiveFormulaBarValue() {
        const formulaInput = this.getFormulaInputElement();
        if (!formulaInput || document.activeElement !== formulaInput)
            return;
        const selectedCell = this.getSelectedCell();
        if (!selectedCell)
            return;
        this.setCellValue(selectedCell.row, selectedCell.col, formulaInput.value);
    }
    triggerCellSelectEvent() {
        // 検証エラー吹き出しを更新
        this.updateValidationTooltip();
        if (this.eventHandlers.onCellSelect) {
            const selected = this.getSelectedCell();
            if (selected) {
                this.eventHandlers.onCellSelect(selected);
            }
        }
    }
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('WasabiTable is not initialized. Use WasabiTable.create() to create an instance.');
        }
    }
    createTooltipElement() {
        var _a;
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'wasabi-table-tooltip';
        this.tooltipElement.style.position = 'fixed';
        this.tooltipElement.style.zIndex = '1000';
        this.tooltipElement.style.padding = '8px';
        this.tooltipElement.style.backgroundColor = '#333';
        this.tooltipElement.style.color = '#fff';
        this.tooltipElement.style.borderRadius = '4px';
        this.tooltipElement.style.pointerEvents = 'none';
        (_a = this.canvas.parentNode) === null || _a === void 0 ? void 0 : _a.appendChild(this.tooltipElement);
    }
    /**
     * スクロールバーのHTML構造を作成
     */
    setupScrollbars() {
        // 既存のキャンバスの親要素を取得
        const parent = this.canvas.parentElement;
        if (!parent)
            return;
        const displayWidth = this.canvas.clientWidth || this.canvas.getBoundingClientRect().width || this.canvas.width;
        const displayHeight = this.canvas.clientHeight || this.canvas.getBoundingClientRect().height || this.canvas.height;
        // スクロールコンテナを作成
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.style.cssText = `
      position: relative;
      width: ${displayWidth}px;
      height: ${displayHeight}px;
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
            this.horizontalThumb.style.backgroundColor = '#a0a0a0';
        });
        this.horizontalThumb.addEventListener('mouseleave', () => {
            this.horizontalThumb.style.backgroundColor = '#c0c0c0';
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
            this.verticalThumb.style.backgroundColor = '#a0a0a0';
        });
        this.verticalThumb.addEventListener('mouseleave', () => {
            this.verticalThumb.style.backgroundColor = '#c0c0c0';
        });
        this.verticalScrollbar.appendChild(this.verticalThumb);
        // コンテナにスクロールバーを追加
        this.scrollContainer.appendChild(this.horizontalScrollbar);
        this.scrollContainer.appendChild(this.verticalScrollbar);
        // スクロールバーのイベントリスナーを設定
        this.setupScrollbarEvents();
        this.updateScrollbarAppearance();
    }
    /**
     * スクロールバーのイベントリスナーを設定
     */
    setupScrollbarEvents() {
        if (!this.horizontalScrollbar || !this.verticalScrollbar ||
            !this.horizontalThumb || !this.verticalThumb)
            return;
        // 水平スクロールバーのクリックイベント
        this.horizontalScrollbar.addEventListener('click', (e) => {
            if (e.target === this.horizontalThumb)
                return;
            const rect = this.horizontalScrollbar.getBoundingClientRect();
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
            if (e.target === this.verticalThumb)
                return;
            const rect = this.verticalScrollbar.getBoundingClientRect();
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
    setupThumbDrag(thumb, direction) {
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
            if (!isDragging)
                return;
            const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
            const delta = currentPos - startPos;
            if (direction === 'horizontal') {
                const scrollbarWidth = this.horizontalScrollbar.offsetWidth;
                const maxScrollX = this.calculateMaxScrollX();
                const scrollRatio = delta / scrollbarWidth;
                const newScrollX = Math.max(0, Math.min(maxScrollX, startScroll + maxScrollX * scrollRatio));
                const stats = this.getStats();
                this.scrollTo(newScrollX, stats.scrollY);
            }
            else {
                const scrollbarHeight = this.verticalScrollbar.offsetHeight;
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
    scrollTo(x, y) {
        if (!this.wasmTable)
            return;
        const stats = this.getStats();
        const deltaX = x - stats.scrollX;
        const deltaY = y - stats.scrollY;
        // スムーズスクロール処理
        if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
            requestAnimationFrame(() => {
                this.wasmTable.handle_canvas_wheel(deltaX, deltaY);
                this.updateScrollbars();
            });
        }
    }
    /**
     * スクロールバーの表示を更新
     */
    updateScrollbars() {
        if (!this.horizontalScrollbar || !this.verticalScrollbar ||
            !this.horizontalThumb || !this.verticalThumb)
            return;
        // requestAnimationFrameを使用してスムーズに更新
        requestAnimationFrame(() => {
            const stats = this.getStats();
            const maxScrollX = this.calculateMaxScrollX();
            const maxScrollY = this.calculateMaxScrollY();
            // 水平スクロールバーの更新
            const scrollbarWidth = this.horizontalScrollbar.offsetWidth;
            const canvasDisplayWidth = parseFloat(this.canvas.style.width) || this.canvas.width;
            const contentWidth = maxScrollX + canvasDisplayWidth;
            const thumbWidth = Math.max(20, (canvasDisplayWidth / contentWidth) * scrollbarWidth);
            const thumbLeft = maxScrollX > 0 ? (stats.scrollX / maxScrollX) * (scrollbarWidth - thumbWidth) : 0;
            this.horizontalThumb.style.width = `${thumbWidth}px`;
            this.horizontalThumb.style.left = `${thumbLeft}px`;
            this.horizontalScrollbar.style.display = maxScrollX > 0 ? 'block' : 'none';
            // 垂直スクロールバーの更新
            const scrollbarHeight = this.verticalScrollbar.offsetHeight;
            const canvasDisplayHeight = parseFloat(this.canvas.style.height) || this.canvas.height;
            const contentHeight = maxScrollY + canvasDisplayHeight;
            const thumbHeight = Math.max(20, (canvasDisplayHeight / contentHeight) * scrollbarHeight);
            const thumbTop = maxScrollY > 0 ? (stats.scrollY / maxScrollY) * (scrollbarHeight - thumbHeight) : 0;
            this.verticalThumb.style.height = `${thumbHeight}px`;
            this.verticalThumb.style.top = `${thumbTop}px`;
            this.verticalScrollbar.style.display = maxScrollY > 0 ? 'block' : 'none';
        });
    }
    /**
     * Canvasのサイズを更新
     */
    updateCanvasSize(width, height) {
        let actualWidth;
        let actualHeight;
        if (width !== undefined && height !== undefined) {
            // 明示的なサイズが指定された場合
            actualWidth = width;
            actualHeight = height;
        }
        else {
            // 親要素のサイズに合わせる
            const parent = this.canvas.parentElement;
            if (parent) {
                const rect = parent.getBoundingClientRect();
                actualWidth = Math.floor(rect.width);
                actualHeight = Math.floor(rect.height);
            }
            else {
                actualWidth = this.canvas.width;
                actualHeight = this.canvas.height;
            }
        }
        // Canvas要素のサイズを更新（高解像度ディスプレイ対応）
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        // devicePixelRatioを取得（高解像度ディスプレイ対応）
        const devicePixelRatio = window.devicePixelRatio || 1;
        // Canvas内部の解像度を物理ピクセルに合わせる
        const canvasWidth = actualWidth * devicePixelRatio;
        const canvasHeight = actualHeight * devicePixelRatio;
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        // CSS表示サイズは論理ピクセルで設定
        this.canvas.style.width = `${actualWidth}px`;
        this.canvas.style.height = `${actualHeight}px`;
        // Canvas contextのスケールを調整
        const ctx = this.canvas.getContext('2d');
        if (ctx && devicePixelRatio !== 1) {
            ctx.scale(devicePixelRatio, devicePixelRatio);
        }
        // スクロールコンテナのサイズも更新
        if (this.scrollContainer) {
            this.scrollContainer.style.width = `${actualWidth}px`;
            this.scrollContainer.style.height = `${actualHeight}px`;
            // スクロールバーのサイズも明示的に更新
            if (this.horizontalScrollbar) {
                const scrollbarWidth = Math.max(0, actualWidth - 17);
                this.horizontalScrollbar.style.width = `${scrollbarWidth}px`;
            }
            if (this.verticalScrollbar) {
                const scrollbarHeight = Math.max(0, actualHeight - 17);
                this.verticalScrollbar.style.height = `${scrollbarHeight}px`;
            }
        }
        // Rust側のキャンバスサイズも更新（論理ピクセルで渡す）
        if (this.wasmTable) {
            try {
                // Rust側には論理ピクセルサイズを渡す（描画座標系の一貫性を保つため）
                this.wasmTable.update_canvas_size(actualWidth, actualHeight);
            }
            catch (error) {
                console.error('🔧 Error updating WASM canvas size:', error);
                // フォールバック: 直接プロパティを更新
                try {
                    if ('canvas_width' in this.wasmTable && 'canvas_height' in this.wasmTable) {
                        this.wasmTable.canvas_width = actualWidth;
                        this.wasmTable.canvas_height = actualHeight;
                    }
                }
                catch (fallbackError) {
                    console.error('🔧 Fallback canvas size update also failed:', fallbackError);
                }
            }
        }
        // スクロールバーとテーブルを再描画
        this.updateScrollbars();
        this.render();
    }
    /**
     * Canvasリサイズイベントハンドラー
     */
    handleCanvasResize() {
        this.updateCanvasSize();
    }
    /**
     * 最大水平スクロール値を計算
     */
    calculateMaxScrollX() {
        if (!this.wasmTable)
            return 0;
        const config = this.getConfig();
        let totalWidth = 0;
        // カスタム列ヘッダーがある場合はその幅を使用
        try {
            const headers = this.getColumnHeadersAsArray();
            if (headers.length > 0) {
                for (const header of headers) {
                    totalWidth += header.width;
                }
            }
            else {
                // デフォルト幅を使用
                for (let col = 0; col < config.col_count; col++) {
                    totalWidth += config.default_col_width;
                }
            }
        }
        catch (_a) {
            // エラーの場合はデフォルト幅を使用
            for (let col = 0; col < config.col_count; col++) {
                totalWidth += config.default_col_width;
            }
        }
        // 論理ピクセルサイズを使用（CSSサイズ）
        const canvasDisplayWidth = parseFloat(this.canvas.style.width) || this.canvas.width;
        const visibleWidth = canvasDisplayWidth - (config.row_header_width || 50);
        const maxScroll = Math.max(0, totalWidth - visibleWidth + 50);
        return maxScroll;
    }
    /**
     * 最大垂直スクロール値を計算
     */
    calculateMaxScrollY() {
        if (!this.wasmTable)
            return 0;
        const config = this.getConfig();
        const totalHeight = config.row_count * config.default_row_height;
        const scrollbarHeight = 17; // スクロールバーの高さ
        // 論理ピクセルサイズを使用（CSSサイズ）
        const canvasDisplayHeight = parseFloat(this.canvas.style.height) || this.canvas.height;
        const visibleHeight = canvasDisplayHeight - (config.header_height || 30) - scrollbarHeight;
        const margin = 10; // 余白
        const maxScroll = Math.max(0, totalHeight - visibleHeight + margin);
        return maxScroll;
    }
    /**
     * 範囲選択を開始
     */
    startRangeSelection(row, col) {
        this.ensureInitialized();
        try {
            this.wasmTable.start_range_selection(row, col);
        }
        catch (error) {
            console.error('❌ Failed to start range selection:', error);
        }
    }
    /**
     * 範囲選択を更新
     */
    updateRangeSelection(row, col) {
        this.ensureInitialized();
        try {
            this.wasmTable.update_range_selection(row, col);
        }
        catch (error) {
            console.error('❌ Failed to update range selection:', error);
        }
    }
    /**
     * 範囲選択を終了
     */
    endRangeSelection() {
        this.ensureInitialized();
        try {
            this.wasmTable.end_range_selection();
        }
        catch (error) {
            console.error('❌ Failed to end range selection:', error);
        }
    }
    /**
     * 選択をクリア
     */
    clearSelection() {
        this.ensureInitialized();
        try {
            this.wasmTable.clear_selection();
        }
        catch (error) {
            console.error('❌ Failed to clear selection:', error);
        }
    }
    /**
     * 選択範囲をコピー
     */
    copySelection() {
        this.ensureInitialized();
        return this.wasmTable.copy_selection();
    }
    /**
     * クリップボードからペースト
     */
    pasteFromClipboard(tsvData) {
        this.ensureInitialized();
        this.wasmTable.paste_from_clipboard(tsvData);
    }
    /**
     * 選択情報を取得
     */
    getSelectionInfo() {
        this.ensureInitialized();
        const info = this.wasmTable.get_selection_info();
        return JSON.parse(info);
    }
    /**
     * マウスドラッグを処理
     */
    handleMouseDrag(canvasX, canvasY, isDragging) {
        this.ensureInitialized();
        this.wasmTable.handle_mouse_drag(canvasX, canvasY, isDragging);
    }
    /**
     * キーボードショートカットを処理
     */
    setKeyboardShortcutsEnabled(enabled) {
        this.keyboardShortcutsEnabled = enabled;
    }
    isKeyboardShortcutsEnabled() {
        return this.keyboardShortcutsEnabled;
    }
    handleKeyboardShortcut(event) {
        if (!this.wasmTable || !this.keyboardShortcutsEnabled)
            return false;
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
                case 'z':
                    event.preventDefault();
                    if (event.shiftKey) {
                        this.redo();
                    }
                    else {
                        this.undo();
                    }
                    return true;
                case 'y':
                    event.preventDefault();
                    this.redo();
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
    async handleCopy() {
        try {
            // 選択状態をデバッグ
            const selectionInfo = this.getSelectionInfo();
            const copiedData = this.copySelection();
            if (copiedData) {
                // モダンブラウザのClipboard APIを使用
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(copiedData);
                }
                else {
                    // フォールバック: 古いブラウザ対応
                    this.fallbackCopyToClipboard(copiedData);
                }
                // コピー成功の視覚的フィードバック（オプション）
                this.showCopyFeedback();
            }
        }
        catch (error) {
            console.error('❌ Copy failed:', error);
            // エラー時はフォールバックを試行
            try {
                const copiedData = this.copySelection();
                if (copiedData) {
                    this.fallbackCopyToClipboard(copiedData);
                }
            }
            catch (fallbackError) {
                console.error('❌ Fallback copy also failed:', fallbackError);
            }
        }
    }
    /**
     * ペースト処理
     */
    async handlePaste() {
        try {
            let pasteData = '';
            // モダンブラウザのClipboard APIを使用
            if (navigator.clipboard && navigator.clipboard.readText) {
                pasteData = await navigator.clipboard.readText();
            }
            else {
                // フォールバック: 古いブラウザ対応
                pasteData = this.fallbackReadFromClipboard();
            }
            if (pasteData) {
                const selectedCell = this.getSelectedCell();
                const { row: startRow, col: startCol } = this.getPasteStartPosition();
                const parsed = this.parseTsv(pasteData);
                const changes = this.collectRangeChanges(startRow, startCol, parsed);
                this.pushUndoChanges(changes);
                this.pasteFromClipboard(pasteData);
                // レンダリングを更新
                this.render();
                this.triggerCellSelectEvent();
                const triggerRender = window.triggerRender;
                if (typeof triggerRender === 'function') {
                    triggerRender();
                }
                // ペーストイベントを通知
                if (this.eventHandlers.onCellChange && selectedCell) {
                    this.eventHandlers.onCellChange(selectedCell, '', pasteData);
                }
            }
        }
        catch (error) {
            console.error('❌ Paste failed:', error);
        }
    }
    /**
     * カット処理（コピー + 削除）
     */
    async handleCut() {
        var _a, _b;
        try {
            // まずコピー
            await this.handleCopy();
            const selectionInfo = this.getSelectionInfo();
            if (selectionInfo && selectionInfo.hasSelection) {
                const changes = [];
                if (selectionInfo.isRange) {
                    const startRow = selectionInfo.start_row;
                    const endRow = selectionInfo.end_row;
                    const startCol = selectionInfo.start_col;
                    const endCol = selectionInfo.end_col;
                    if (startRow !== undefined &&
                        endRow !== undefined &&
                        startCol !== undefined &&
                        endCol !== undefined) {
                        for (let row = startRow; row <= endRow; row++) {
                            for (let col = startCol; col <= endCol; col++) {
                                const oldValue = (_a = this.getCellValue(row, col)) !== null && _a !== void 0 ? _a : '';
                                if (oldValue !== '') {
                                    changes.push({ row, col, oldValue, newValue: '' });
                                }
                            }
                        }
                    }
                }
                else if (selectionInfo.row !== undefined && selectionInfo.col !== undefined) {
                    const oldValue = (_b = this.getCellValue(selectionInfo.row, selectionInfo.col)) !== null && _b !== void 0 ? _b : '';
                    if (oldValue !== '') {
                        changes.push({
                            row: selectionInfo.row,
                            col: selectionInfo.col,
                            oldValue,
                            newValue: '',
                        });
                    }
                }
                this.pushUndoChanges(changes);
                this.applyingHistory = true;
                try {
                    for (const change of changes) {
                        this.wasmTable.set_cell_data(change.row, change.col, '');
                    }
                }
                finally {
                    this.applyingHistory = false;
                }
                this.render();
                this.triggerCellSelectEvent();
            }
        }
        catch (error) {
            console.error('❌ Cut failed:', error);
        }
    }
    /**
     * 全選択処理
     */
    handleSelectAll() {
        try {
            const config = this.getConfig();
            this.startRangeSelection(0, 0);
            this.updateRangeSelection(config.row_count - 1, config.col_count - 1);
            this.endRangeSelection();
            this.render();
        }
        catch (error) {
            console.error('❌ Select all failed:', error);
        }
    }
    /**
     * フォールバック: 古いブラウザでのコピー
     */
    fallbackCopyToClipboard(text) {
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
            }
            else {
                console.error('❌ Fallback copy failed');
            }
        }
        catch (err) {
            console.error('❌ Fallback copy error:', err);
        }
        finally {
            document.body.removeChild(textArea);
        }
    }
    /**
     * フォールバック: 古いブラウザでのペースト（制限あり）
     */
    fallbackReadFromClipboard() {
        // 古いブラウザでは自動的にクリップボードから読み取ることはできない
        // ユーザーに手動でペーストを促すか、他の方法を検討する必要がある
        return '';
    }
    /**
     * コピー成功の視覚的フィードバック
     */
    showCopyFeedback() {
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
    handleShiftArrowKey(key) {
        const selectedCell = this.getSelectedCell();
        if (!selectedCell) {
            this.selectCell(0, 0, true);
            this.startRangeSelection(0, 0);
            return;
        }
        // 範囲選択が始まっていない場合は開始
        const selectionInfo = this.getSelectionInfo();
        if (!selectionInfo || !selectionInfo.isRange) {
            this.startRangeSelection(selectedCell.row, selectedCell.col);
        }
        // 範囲選択中は、現在のアクティブセル（終端位置）から移動
        const currentActiveCell = this.getSelectedCell();
        let newRow = currentActiveCell ? currentActiveCell.row : selectedCell.row;
        let newCol = currentActiveCell ? currentActiveCell.col : selectedCell.col;
        switch (key) {
            case 'ArrowUp':
                newRow = Math.max(0, newRow - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(this.config.row_count - 1, newRow + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, newCol - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(this.config.col_count - 1, newCol + 1);
                break;
        }
        // 範囲選択を更新（終端位置を移動）
        this.updateRangeSelection(newRow, newCol);
        // 新しい終端セルが見えるように自動スクロール
        this.scrollToSelectedCell();
        this.render();
        this.triggerCellSelectEvent();
    }
    /**
     * 印刷可能な文字かどうかを判定
     */
    isPrintableCharacterKey(key) {
        if (key.length !== 1) {
            return false;
        }
        const ch = key.charCodeAt(0);
        // 英数字、記号、スペースなどの印刷可能文字
        return (ch >= 32 && ch <= 126) || (ch >= 160); // ASCII印刷可能文字 + 拡張文字
    }
    /**
     * Shift+Ctrl+矢印キーによる範囲選択（データの端まで）を処理
     */
    handleShiftCtrlArrowKey(key) {
        const selectedCell = this.getSelectedCell();
        if (!selectedCell) {
            return;
        }
        // 範囲選択が始まっていない場合は開始
        const selectionInfo = this.getSelectionInfo();
        if (!selectionInfo || !selectionInfo.isRange) {
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
        // 範囲選択を更新（終端位置を移動）
        this.updateRangeSelection(newRow, newCol);
        this.render();
        // 更新後の選択情報を確認
        const updatedSelection = this.getSelectionInfo();
    }
    /**
     * 通常の矢印キーによるセル移動を処理
     */
    handleArrowKey(key) {
        const selectedCell = this.getSelectedCell();
        // デバッグ: 現在のスクロール位置を記録
        const stats = this.getStats();
        if (!selectedCell) {
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
        // デバッグ: セル移動前後の座標を詳しく記録
        const beforePosition = this.getCellScreenPosition(selectedCell.row, selectedCell.col);
        // 新しいセルを選択（自動スクロール有効）
        this.selectCell(newRow, newCol, true);
        // デバッグ: 移動後の座標を記録
        const afterPosition = this.getCellScreenPosition(newRow, newCol);
        // デバッグ: pixel_to_cellで逆変換テスト
        const centerX = afterPosition.centerX;
        const centerY = afterPosition.centerY;
        const pixelToCell = this.wasmTable.pixel_to_cell(centerX, centerY);
        this.render();
        this.triggerCellSelectEvent();
    }
    /**
     * Ctrl+矢印キーによるExcel風の端まで移動を処理
     */
    handleCtrlArrowNavigation(key) {
        const selectedCell = this.getSelectedCell();
        if (!selectedCell) {
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
        // 新しいセルを選択（自動スクロール有効）
        this.selectCell(newRow, newCol, true);
        this.render();
    }
    /**
     * データの端を見つける（Excel風の動作）
     */
    findDataEdge(currentRow, currentCol, direction) {
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
                }
                else {
                    // 現在のセルに値がある場合、連続するデータの最上端を探す
                    let lastNonEmptyRow = currentRow;
                    for (let row = currentRow - 1; row >= 0; row--) {
                        const value = this.getCellValue(row, currentCol);
                        if (value && value.trim() !== '') {
                            lastNonEmptyRow = row;
                        }
                        else {
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
                }
                else {
                    // 現在のセルに値がある場合、連続するデータの最下端を探す
                    let lastNonEmptyRow = currentRow;
                    for (let row = currentRow + 1; row < this.config.row_count; row++) {
                        const value = this.getCellValue(row, currentCol);
                        if (value && value.trim() !== '') {
                            lastNonEmptyRow = row;
                        }
                        else {
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
                }
                else {
                    // 現在のセルに値がある場合、連続するデータの最左端を探す
                    let lastNonEmptyCol = currentCol;
                    for (let col = currentCol - 1; col >= 0; col--) {
                        const value = this.getCellValue(currentRow, col);
                        if (value && value.trim() !== '') {
                            lastNonEmptyCol = col;
                        }
                        else {
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
                }
                else {
                    // 現在のセルに値がある場合、連続するデータの最右端を探す
                    let lastNonEmptyCol = currentCol;
                    for (let col = currentCol + 1; col < this.config.col_count; col++) {
                        const value = this.getCellValue(currentRow, col);
                        if (value && value.trim() !== '') {
                            lastNonEmptyCol = col;
                        }
                        else {
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
    setupGlobalTabCapture() {
        // 編集中のTabキーを確実に阻止するためのキャプチャリスナー
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab' && this.isEditing()) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
            }
        }, true); // キャプチャフェーズで実行
    }
    // Canvasリサイズ監視用
    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Canvasの親要素（コンテナ）のサイズ変更を監視
                const target = entry.target;
                if (target === this.canvas.parentElement) {
                    const { width, height } = entry.contentRect;
                    // デバッグログ
                    // updateCanvasSizeメソッドを使用して統一的に処理
                    this.updateCanvasSize(Math.floor(width), Math.floor(height));
                }
            }
        });
        // Canvasの親要素を監視
        const parentElement = this.canvas.parentElement;
        if (parentElement) {
            this.resizeObserver.observe(parentElement);
        }
        else {
        }
    }
    /**
     * MenuFieldの選択肢を設定
     */
    setMenuFieldOptions(columnName, config) {
        this.menuFieldOptions.set(columnName, config);
    }
    /**
     * MenuFieldの選択肢を取得
     */
    getMenuFieldOptions(columnName) {
        return this.menuFieldOptions.get(columnName);
    }
    /**
     * MenuFieldセルのSelectBoxを表示
     */
    showMenuFieldSelectBox(row, col) {
        const columnHeaders = this.getColumnHeadersAsArray();
        if (col >= columnHeaders.length)
            return;
        const header = columnHeaders[col];
        if (header.field_type !== FieldType.MenuField)
            return;
        // 既存のSelectBoxを非表示
        this.hideMenuFieldSelectBox();
        // セルの画面位置を取得
        const cellPosition = this.getCellScreenPosition(row, col);
        if (!cellPosition)
            return;
        // 選択肢を取得
        const menuConfig = header.menu_config || this.menuFieldOptions.get(header.name);
        const choices = header.choices || [];
        let options = [];
        if (menuConfig === null || menuConfig === void 0 ? void 0 : menuConfig.options) {
            if (Array.isArray(menuConfig.options)) {
                if (typeof menuConfig.options[0] === 'string') {
                    // string[]形式
                    options = menuConfig.options.map(opt => ({
                        label: opt,
                        value: opt
                    }));
                }
                else {
                    // MenuFieldOption[]形式
                    options = menuConfig.options;
                }
            }
        }
        else if (choices.length > 0) {
            // 従来のchoices形式
            options = choices.map(choice => ({
                label: choice,
                value: choice
            }));
        }
        if (options.length === 0)
            return;
        // SelectBox要素を作成
        this.createSelectBoxElement(cellPosition, options, menuConfig);
        // 現在のセル値を設定
        const currentValue = this.getCellValue(row, col) || '';
        this.setSelectBoxValue(currentValue);
        // 現在のMenuFieldセルを記録
        this.currentMenuFieldCell = { row, col };
    }
    /**
     * MenuFieldのSelectBoxを非表示
     */
    hideMenuFieldSelectBox() {
        if (this.selectBoxElement) {
            this.selectBoxElement.remove();
            this.selectBoxElement = null;
        }
        this.currentMenuFieldCell = null;
        // ESCキーリスナーを削除
        document.removeEventListener('keydown', this.handleSelectBoxKeydown);
    }
    /**
     * SelectBox要素を作成
     */
    createSelectBoxElement(cellPosition, options, config) {
        const selectBox = document.createElement('div');
        selectBox.className = 'wasabi-menu-field-selectbox';
        selectBox.style.cssText = `
      position: absolute;
      left: ${cellPosition.x}px;
      top: ${cellPosition.y + cellPosition.height}px;
      width: ${Math.max(cellPosition.width, 250)}px;
      max-height: 300px;
      background: white;
      border: 2px solid #4a7c59;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(74, 124, 89, 0.3);
      z-index: 1000;
      overflow: hidden;
      font-family: ${this.config.font_family};
      font-size: ${this.config.font_size}px;
      backdrop-filter: blur(10px);
    `;
        // 検索ボックスを追加（常に表示、デフォルトで検索可能）
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = (config === null || config === void 0 ? void 0 : config.placeholder) || '検索してください...';
        searchInput.className = 'wasabi-menu-search';
        searchInput.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      border: none;
      border-bottom: 2px solid #c8e6c9;
      outline: none;
      font-size: ${this.config.font_size}px;
      font-family: ${this.config.font_family};
      background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
      box-sizing: border-box;
    `;
        selectBox.appendChild(searchInput);
        // 検索機能を実装
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            this.filterSelectBoxOptions(searchTerm);
        });
        // オプションリストコンテナ
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'wasabi-menu-options';
        optionsContainer.style.cssText = `
      max-height: ${(config === null || config === void 0 ? void 0 : config.maxDisplayItems) ? config.maxDisplayItems * 40 : 200}px;
      overflow-y: auto;
      padding: 8px 0;
    `;
        // オプションを追加
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'wasabi-menu-option';
            optionElement.textContent = option.label;
            optionElement.dataset.value = option.value;
            optionElement.dataset.index = index.toString();
            optionElement.style.cssText = `
        padding: 12px 16px;
        cursor: ${option.disabled ? 'not-allowed' : 'pointer'};
        transition: all 0.2s ease;
        border-radius: 6px;
        margin: 2px 8px;
        ${option.disabled ? 'opacity: 0.5; background: #f5f5f5;' : ''}
      `;
            if (!option.disabled) {
                optionElement.addEventListener('mouseenter', () => {
                    // 他の選択を解除
                    this.clearOptionHighlight();
                    optionElement.style.backgroundColor = '#e8f5e8';
                    optionElement.style.fontWeight = '600';
                    optionElement.classList.add('highlighted');
                });
                optionElement.addEventListener('mouseleave', () => {
                    if (!optionElement.classList.contains('selected')) {
                        optionElement.style.backgroundColor = '';
                        optionElement.style.fontWeight = '';
                        optionElement.classList.remove('highlighted');
                    }
                });
                optionElement.addEventListener('click', () => {
                    this.selectMenuFieldOption(option.value);
                });
            }
            optionsContainer.appendChild(optionElement);
        });
        selectBox.appendChild(optionsContainer);
        // Canvasの親要素に追加
        const canvasParent = this.canvas.parentElement;
        if (canvasParent) {
            canvasParent.style.position = 'relative';
            canvasParent.appendChild(selectBox);
        }
        this.selectBoxElement = selectBox;
        // 検索入力にフォーカス
        setTimeout(() => {
            searchInput.focus();
        }, 50);
        // キーボードナビゲーションを設定
        this.setupSelectBoxKeyboardNavigation(searchInput);
        // 外部クリックで閉じる
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick.bind(this), { once: true });
        }, 0);
        // ESCキーで閉じる
        document.addEventListener('keydown', this.handleSelectBoxKeydown.bind(this));
    }
    /**
     * SelectBoxのキーボードナビゲーション設定
     */
    setupSelectBoxKeyboardNavigation(searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            var _a;
            const optionsContainer = (_a = this.selectBoxElement) === null || _a === void 0 ? void 0 : _a.querySelector('.wasabi-menu-options');
            if (!optionsContainer)
                return;
            const visibleOptions = Array.from(optionsContainer.querySelectorAll('.wasabi-menu-option:not([style*="display: none"])'));
            const highlightedOption = optionsContainer.querySelector('.wasabi-menu-option.highlighted');
            let currentIndex = highlightedOption ? parseInt(highlightedOption.dataset.index || '0') : -1;
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    currentIndex = Math.min(currentIndex + 1, visibleOptions.length - 1);
                    this.highlightOption(visibleOptions[currentIndex]);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    currentIndex = Math.max(currentIndex - 1, 0);
                    this.highlightOption(visibleOptions[currentIndex]);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (highlightedOption && !highlightedOption.dataset.disabled) {
                        const value = highlightedOption.dataset.value || '';
                        this.selectMenuFieldOption(value);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.hideMenuFieldSelectBox();
                    break;
            }
        });
    }
    /**
     * オプションをハイライト
     */
    highlightOption(optionElement) {
        if (!optionElement)
            return;
        this.clearOptionHighlight();
        optionElement.style.backgroundColor = '#e8f5e8';
        optionElement.style.fontWeight = '600';
        optionElement.classList.add('highlighted');
        // スクロールして表示
        optionElement.scrollIntoView({ block: 'nearest' });
    }
    /**
     * オプションのハイライトをクリア
     */
    clearOptionHighlight() {
        if (!this.selectBoxElement)
            return;
        const highlightedOptions = this.selectBoxElement.querySelectorAll('.wasabi-menu-option.highlighted');
        highlightedOptions.forEach(option => {
            const optionElement = option;
            if (!optionElement.classList.contains('selected')) {
                optionElement.style.backgroundColor = '';
                optionElement.style.fontWeight = '';
            }
            optionElement.classList.remove('highlighted');
        });
    }
    /**
     * SelectBoxの値を設定
     */
    setSelectBoxValue(value) {
        if (!this.selectBoxElement)
            return;
        const options = this.selectBoxElement.querySelectorAll('.wasabi-menu-option');
        options.forEach(option => {
            const optionElement = option;
            if (optionElement.dataset.value === value) {
                optionElement.style.backgroundColor = '#4a7c59';
                optionElement.style.color = 'white';
                optionElement.style.fontWeight = 'bold';
                optionElement.classList.add('selected');
            }
            else {
                optionElement.style.backgroundColor = '';
                optionElement.style.color = '';
                optionElement.style.fontWeight = '';
                optionElement.classList.remove('selected');
            }
        });
    }
    /**
     * SelectBoxオプションをフィルタリング
     */
    filterSelectBoxOptions(searchTerm) {
        if (!this.selectBoxElement)
            return;
        const options = this.selectBoxElement.querySelectorAll('.wasabi-menu-option');
        let firstVisibleOption = null;
        options.forEach(option => {
            const optionElement = option;
            const label = optionElement.textContent || '';
            const visible = label.toLowerCase().includes(searchTerm);
            optionElement.style.display = visible ? 'block' : 'none';
            if (visible && !firstVisibleOption) {
                firstVisibleOption = optionElement;
            }
        });
        // 検索結果の最初のオプションをハイライト
        if (firstVisibleOption && searchTerm) {
            this.highlightOption(firstVisibleOption);
        }
        else {
            this.clearOptionHighlight();
        }
    }
    /**
     * MenuFieldオプションを選択
     */
    selectMenuFieldOption(value) {
        var _a, _b;
        if (!this.currentMenuFieldCell)
            return;
        const { row, col } = this.currentMenuFieldCell;
        // セル値を更新
        this.setCellValue(row, col, value);
        // SelectBoxを非表示
        this.hideMenuFieldSelectBox();
        // 再描画
        this.render();
        // イベントを発火
        (_b = (_a = this.eventHandlers).onCellChange) === null || _b === void 0 ? void 0 : _b.call(_a, { row, col }, this.getCellValue(row, col) || '', value);
    }
    /**
     * 外部クリック処理
     */
    handleOutsideClick(event) {
        if (!this.selectBoxElement)
            return;
        const target = event.target;
        if (!this.selectBoxElement.contains(target) && target !== this.canvas) {
            this.hideMenuFieldSelectBox();
        }
    }
    /**
     * CheckFieldの値を切り替え
     */
    toggleCheckField(row, col) {
        var _a, _b;
        const columnHeaders = this.getColumnHeadersAsArray();
        if (col >= columnHeaders.length)
            return;
        const header = columnHeaders[col];
        if (header.field_type !== FieldType.CheckField && header.field_type !== FieldType.BooleanField)
            return;
        // 現在の値を取得
        const currentValue = this.getCellValue(row, col) || '';
        // チェック状態を判定
        const isCurrentlyChecked = this.isCheckFieldChecked(currentValue);
        // 新しい値を設定
        const newValue = isCurrentlyChecked ? 'false' : 'true';
        // セル値を更新
        this.setCellValue(row, col, newValue);
        // 再描画
        this.render();
        // イベントを発火
        (_b = (_a = this.eventHandlers).onCellChange) === null || _b === void 0 ? void 0 : _b.call(_a, { row, col }, currentValue, newValue);
    }
    /**
     * CheckFieldの値がチェック状態かどうかを判定
     */
    isCheckFieldChecked(value) {
        const normalizedValue = value.toLowerCase().trim();
        return ['true', '1', 'yes', 'はい', '✓', 'checked'].includes(normalizedValue);
    }
    /**
     * CheckFieldの値を正規化
     */
    normalizeCheckFieldValue(value) {
        return this.isCheckFieldChecked(value) ? 'true' : 'false';
    }
    /**
     * テーマを適用
     */
    applyTheme(theme) {
        this.ensureInitialized();
        let themeColors;
        if (typeof theme === 'string') {
            themeColors = PREDEFINED_THEMES[theme];
            if (!themeColors) {
                throw new Error(`Unknown theme: ${theme}`);
            }
            this.activeTheme = theme;
        }
        else {
            themeColors = theme;
            this.activeTheme = theme.background_color === PREDEFINED_THEMES.dark.background_color
                ? 'dark'
                : 'light';
        }
        const newConfig = {
            ...this.config,
            background_color: themeColors.background_color,
            text_color: themeColors.text_color,
            grid_color: themeColors.grid_color,
            header_background_color: themeColors.header_background_color,
            selected_cell_color: themeColors.selected_cell_color
        };
        this.wasmTable.update_config(JSON.stringify(newConfig));
        this.config = newConfig;
        this.updateScrollbarAppearance();
        this.render();
    }
    getActiveTheme() {
        return this.activeTheme;
    }
    updateScrollbarAppearance() {
        const isDark = this.activeTheme === 'dark';
        const trackColor = isDark ? '#1a202c' : '#f0f0f0';
        const thumbColor = isDark ? '#4a5568' : '#c0c0c0';
        const thumbHoverColor = isDark ? '#718096' : '#a0a0a0';
        const borderColor = isDark ? '#2d3748' : '#ccc';
        const applyScrollbarStyle = (scrollbar, thumb, hoverColor) => {
            if (!scrollbar || !thumb)
                return;
            scrollbar.style.backgroundColor = trackColor;
            scrollbar.style.borderColor = borderColor;
            thumb.style.backgroundColor = thumbColor;
            thumb.onmouseenter = () => {
                thumb.style.backgroundColor = hoverColor;
            };
            thumb.onmouseleave = () => {
                thumb.style.backgroundColor = thumbColor;
            };
        };
        applyScrollbarStyle(this.horizontalScrollbar, this.horizontalThumb, thumbHoverColor);
        applyScrollbarStyle(this.verticalScrollbar, this.verticalThumb, thumbHoverColor);
    }
    /**
     * カスタムテーマを作成するヘルパー関数
     */
    static createCustomTheme(baseTheme, overrides) {
        const base = PREDEFINED_THEMES[baseTheme];
        if (!base) {
            throw new Error(`Unknown base theme: ${baseTheme}`);
        }
        return { ...base, ...overrides };
    }
    /**
     * 利用可能なテーマ一覧を取得
     */
    static getAvailableThemes() {
        return ['light', 'dark'];
    }
    // ========================================
    // フィルター・ソート機能
    // ========================================
    /**
     * フィルター条件を追加
     */
    addFilterCondition(condition) {
        this.filterSortState.filterConditions = this.filterSortState.filterConditions.filter(c => c.columnIndex !== condition.columnIndex);
        this.filterSortState.filterConditions.push(condition);
        this.applyFilters();
    }
    /**
     * フィルター条件を削除
     */
    removeFilterCondition(columnIndex) {
        this.filterSortState.filterConditions = this.filterSortState.filterConditions.filter(c => c.columnIndex !== columnIndex);
        this.applyFilters();
    }
    /**
     * 全フィルターをクリア
     */
    clearAllFilters() {
        var _a;
        this.filterSortState.filterConditions = [];
        this.filterSortState.isFiltered = false;
        this.filterSortState.filteredRows = [];
        (_a = this.wasmTable) === null || _a === void 0 ? void 0 : _a.clear_filter();
        this.render();
    }
    /**
     * ソート条件を設定
     */
    setSortCondition(condition) {
        this.filterSortState.sortCondition = condition;
        this.applyFilters();
    }
    /**
     * フィルター・ソートを適用
     */
    applyFilters() {
        this.ensureInitialized();
        runFilterSort(this.filterSortState, {
            getCellValue: (row, col) => this.getCellValue(row, col),
            getRowCount: () => this.getConfig().row_count,
        }, {
            set_filtered_rows: (rowsJson) => this.wasmTable.set_filtered_rows(rowsJson),
            clear_filter: () => this.wasmTable.clear_filter(),
        });
    }
    getHeaderDialogController() {
        if (!this.headerDialogController) {
            this.headerDialogController = new HeaderDialogController({
                getColumnHeaders: () => this.getColumnHeadersAsArray(),
                getHeaderPosition: (columnIndex) => this.getHeaderPosition(columnIndex),
                getFilterSortState: () => this.filterSortState,
                addFilterCondition: (condition) => this.addFilterCondition(condition),
                removeFilterCondition: (columnIndex) => this.removeFilterCondition(columnIndex),
                setSortCondition: (condition) => this.setSortCondition(condition),
            });
        }
        return this.headerDialogController;
    }
    /**
     * 統合ヘッダーダイアログを表示
     */
    showHeaderDialog(columnIndex) {
        this.getHeaderDialogController().show(columnIndex);
    }
    /**
     * フィルターダイアログを表示（後方互換性のため）
     */
    showFilterDialog(columnIndex) {
        this.getHeaderDialogController().showFilterDialog(columnIndex);
    }
    /**
     * ヘッダーの位置を取得
     */
    getHeaderPosition(columnIndex) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const config = this.getConfig();
        const stats = this.getStats();
        let x = config.row_header_width;
        const headers = this.getColumnHeadersAsArray();
        for (let i = 0; i < columnIndex && i < headers.length; i++) {
            x += headers[i].width;
        }
        x -= stats.scrollX;
        const width = columnIndex < headers.length ? headers[columnIndex].width : config.default_col_width;
        return {
            x: canvasRect.left + x,
            y: canvasRect.top,
            width,
            height: config.header_height
        };
    }
    /**
     * フィルター状態を取得
     */
    getFilterState() {
        return {
            conditions: [...this.filterSortState.filterConditions],
            sortCondition: this.filterSortState.sortCondition,
            isFiltered: this.filterSortState.isFiltered,
        };
    }
    /**
     * フィルター結果を取得
     */
    getFilterResult() {
        return buildFilterResult(this.filterSortState, this.getConfig().row_count);
    }
    /**
     * X座標から列インデックスを取得
     */
    getColumnIndexFromX(canvasX) {
        const stats = this.getStats();
        const adjustedX = canvasX + stats.scrollX - this.config.row_header_width;
        let currentX = 0;
        const headers = this.getColumnHeadersAsArray();
        for (let col = 0; col < headers.length; col++) {
            const colWidth = headers[col].width;
            if (adjustedX >= currentX && adjustedX < currentX + colWidth) {
                return col;
            }
            currentX += colWidth;
        }
        return -1;
    }
    /**
     * ヘッダークリック処理
     */
    handleHeaderClick(columnIndex, event) {
        const headers = this.getColumnHeadersAsArray();
        if (columnIndex >= headers.length)
            return;
        this.showHeaderDialog(columnIndex);
        event.preventDefault();
    }
    /**
     * ヘッダーソート処理
     */
    handleHeaderSort(columnIndex) {
        const headers = this.getColumnHeadersAsArray();
        if (columnIndex >= headers.length)
            return;
        const header = headers[columnIndex];
        const currentSort = this.filterSortState.sortCondition;
        let newDirection = 'asc';
        if (currentSort && currentSort.columnIndex === columnIndex) {
            newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
        }
        const sortCondition = {
            columnIndex,
            fieldType: header.field_type,
            direction: newDirection
        };
        this.setSortCondition(sortCondition);
    }
    /**
     * ヘッダーボタンを削除
     */
    removeHeaderButtons() {
        const buttons = document.querySelectorAll('.wasabi-header-btn');
        buttons.forEach(btn => btn.remove());
    }
    /**
     * ヘッダーボタンの位置を更新
     */
    updateHeaderButtonPositions() {
        // ヘッダーボタンは使用しないため、何もしない
    }
}
