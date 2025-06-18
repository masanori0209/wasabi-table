import init, { WasabiTable as WasmWasabiTable } from '../pkg/wasabi_table.js';
/**
 * 事前定義されたテーマ定義
 */
export const PREDEFINED_THEMES = {
    light: {
        background_color: '#ffffff',
        text_color: '#000000',
        grid_color: '#e0e0e0',
        header_background_color: '#f5f5f5',
        selected_cell_color: '#3498db',
        range_selection_color: 'rgba(52, 152, 219, 0.2)',
        error_cell_color: '#e74c3c',
        editing_cell_color: '#f39c12'
    },
    dark: {
        background_color: '#2d3748',
        text_color: '#e2e8f0',
        grid_color: '#4a5568',
        header_background_color: '#1a202c',
        selected_cell_color: '#667eea',
        range_selection_color: 'rgba(102, 126, 234, 0.2)',
        error_cell_color: '#fc8181',
        editing_cell_color: '#f6ad55'
    }
};
/**
 * デフォルトのテーブル設定
 */
export const DEFAULT_CONFIG = {
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
export var FieldType;
(function (FieldType) {
    FieldType["CharField"] = "CharField";
    FieldType["EmailField"] = "EmailField";
    FieldType["TextareaField"] = "TextareaField";
    FieldType["IntegerField"] = "IntegerField";
    FieldType["DecimalField"] = "DecimalField";
    FieldType["DecimalWithNullField"] = "DecimalWithNullField";
    FieldType["DateField"] = "DateField";
    FieldType["TimeField"] = "TimeField";
    FieldType["CheckField"] = "CheckField";
    FieldType["BooleanField"] = "BooleanField";
    FieldType["ButtonField"] = "ButtonField";
    FieldType["MenuField"] = "MenuField";
})(FieldType || (FieldType = {}));
// リスナー機能をエクスポート
export { NinjaTableListeners } from './listeners.js';
export { createUIElements, exportTableToCSV, clearTable, loadSampleData, debounce, parseCellReference, isKeyboardShortcut } from './utils.js';
/**
 * WasabiTableとリスナーを簡単に初期化する関数
 */
export async function createWasabiTableWithListeners(canvas, config = {}, uiConfig, listenerOptions, callbacks) {
    // 遅延インポートで循環インポートを回避
    const { createUIElements } = await import('./utils.js');
    const { NinjaTableListeners } = await import('./listeners.js');
    const table = await WasabiTable.create(canvas, config);
    const uiElements = createUIElements(uiConfig);
    const listeners = new NinjaTableListeners(table, uiElements, listenerOptions, callbacks);
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
        // MenuField SelectBox関連
        this.selectBoxElement = null;
        this.currentMenuFieldCell = null;
        this.menuFieldOptions = new Map();
        /**
         * SelectBoxのキーダウンハンドラー
         */
        this.handleSelectBoxKeydown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.hideMenuFieldSelectBox();
            }
        };
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
    static async create(canvas, config = {}) {
        // WebAssemblyモジュールを初期化
        await init();
        const finalConfig = { ...DEFAULT_CONFIG, ...config };
        const wasmTable = new WasmWasabiTable(canvas, JSON.stringify(finalConfig));
        const table = new WasabiTable(wasmTable, finalConfig, canvas);
        table.isInitialized = true;
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
    setCellValue(row, col, value) {
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
        this.wasmTable.set_batch_data(jsonData);
    }
    /**
     * テーブルをレンダリング
     */
    render() {
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
    selectCell(row, col, autoScroll = true) {
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
    scrollToSelectedCell() {
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
        // 論理ピクセルサイズを使用（CSSサイズ）
        const canvasDisplayWidth = parseFloat(this.canvas.style.width) || this.canvas.width;
        const canvasDisplayHeight = parseFloat(this.canvas.style.height) || this.canvas.height;
        const viewportWidth = canvasDisplayWidth - rowHeaderWidth - scrollbarWidth;
        const viewportHeight = canvasDisplayHeight - headerHeight - scrollbarWidth;
        console.log('🎯 [DEBUG] Viewport dimensions:', {
            viewportWidth,
            viewportHeight,
            headerHeight,
            rowHeaderWidth
        });
        // セルの絶対位置を取得（Rustから返される値を使用）
        const absoluteCellX = cellPosition.absolute_x;
        const absoluteCellY = cellPosition.absolute_y;
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
        }
        else if (cellRight > viewportRight) {
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
        }
        else if (cellBottom > viewportBottom) {
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
        }
        else {
            console.log('🎯 [DEBUG] Cell is already visible, no scroll needed');
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
        // 編集完了後に検証エラーを更新
        setTimeout(() => {
            this.updateValidationTooltip();
        }, 100);
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
            }
            else {
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
    static getCellReference(row, col) {
        return `${WasabiTable.getColumnName(col)}${row + 1}`;
    }
    setupEventHandlers() {
        let isDragging = false;
        let dragStartCell = null;
        let justFinishedDragging = false;
        let hasActuallyDragged = false; // 実際にマウスが移動したかを追跡
        // グローバルハンドラー関数を設定
        window.handleTableClick = (x, y) => {
            this.wasmTable.handle_canvas_click(x, y);
            this.triggerCellSelectEvent();
        };
        window.handleTableWheel = (deltaX, deltaY) => {
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
            var _a, _b;
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
            console.log('🖱️ [DEBUG] Focus set, activeElement:', (_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.tagName);
            if (event.shiftKey) {
                // Shift+クリックで範囲選択（mousedownで既に処理済みの場合はスキップ）
                const cellPos = this.wasmTable.pixel_to_cell(x, y);
                if (cellPos) {
                    const [row, col] = cellPos.split(':').map(Number);
                    // 現在選択されているセルがある場合は、そこから範囲選択を開始
                    const currentSelection = this.getSelectedCell();
                    if (currentSelection && !((_b = this.getSelectionInfo()) === null || _b === void 0 ? void 0 : _b.isRange)) {
                        this.startRangeSelection(currentSelection.row, currentSelection.col);
                    }
                    this.updateRangeSelection(row, col);
                    this.render();
                }
            }
            else {
                // 通常のクリックでは範囲選択をクリアしてから単一セル選択
                this.clearSelection();
                const result = this.wasmTable.select_cell(x, y);
                if (result) {
                    this.triggerCellSelectEvent();
                    // MenuFieldまたはCheckFieldセルの特別な処理
                    const cellPos = this.wasmTable.pixel_to_cell(x, y);
                    if (cellPos) {
                        const [row, col] = cellPos.split(':').map(Number);
                        const columnHeaders = this.getColumnHeadersAsArray();
                        if (col < columnHeaders.length) {
                            const header = columnHeaders[col];
                            if (header.field_type === FieldType.MenuField) {
                                // MenuFieldの場合はSelectBoxを表示
                                this.showMenuFieldSelectBox(row, col);
                            }
                            else if (header.field_type === FieldType.CheckField || header.field_type === FieldType.BooleanField) {
                                // CheckFieldの場合はチェック状態を切り替え
                                this.toggleCheckField(row, col);
                            }
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
        this.canvas.addEventListener('mousedown', (event) => {
            var _a;
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const cellPos = this.wasmTable.pixel_to_cell(x, y);
            if (cellPos) {
                const [row, col] = cellPos.split(':').map(Number);
                if (event.shiftKey) {
                    // Shift+ドラッグで範囲選択を拡張
                    const currentSelection = this.getSelectedCell();
                    if (currentSelection && !((_a = this.getSelectionInfo()) === null || _a === void 0 ? void 0 : _a.isRange)) {
                        this.startRangeSelection(currentSelection.row, currentSelection.col);
                    }
                    this.updateRangeSelection(row, col);
                    hasActuallyDragged = true; // Shift+クリックは即座に範囲選択
                }
                else {
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
            var _a;
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
                    if (dragStartCell && !((_a = this.getSelectionInfo()) === null || _a === void 0 ? void 0 : _a.isRange)) {
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
                }
                else {
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
                }
                else {
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
            var _a;
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
            console.log('🔍 [DEBUG] Focus check - activeElement:', (_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.tagName, 'canvas:', this.canvas.tagName);
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
                }
                else if (event.shiftKey) {
                    // Shift+矢印キーによる範囲選択
                    console.log('🔀 [DEBUG] Handling Shift+Arrow:', event.key);
                    this.handleShiftArrowKey(event.key);
                }
                else {
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
                }
                catch (error) {
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
        window.handleEditingEnter = () => {
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
            }
            catch (error) {
                console.error('Error handling editing Enter:', error);
            }
        };
        window.handleEditingTab = () => {
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
            }
            catch (error) {
                console.error('Error handling editing Tab:', error);
            }
        };
        window.handleEditingEscape = () => {
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
            }
            catch (error) {
                console.error('Error handling editing Escape:', error);
            }
        };
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
            throw new Error('NinjaTable is not initialized. Use NinjaTable.create() to create an instance.');
        }
    }
    createTooltipElement() {
        var _a;
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'ninja-table-tooltip';
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
        this.wasmTable.handle_canvas_wheel(deltaX, deltaY);
        this.updateScrollbars();
    }
    /**
     * スクロールバーの表示を更新
     */
    updateScrollbars() {
        if (!this.horizontalScrollbar || !this.verticalScrollbar ||
            !this.horizontalThumb || !this.verticalThumb)
            return;
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
    }
    /**
     * Canvasのサイズを更新
     */
    updateCanvasSize(width, height) {
        console.log('🔧 [DEBUG] updateCanvasSize called with:', { width, height });
        let actualWidth;
        let actualHeight;
        if (width !== undefined && height !== undefined) {
            // 明示的なサイズが指定された場合
            actualWidth = width;
            actualHeight = height;
            console.log('🔧 [DEBUG] Using explicit size:', { actualWidth, actualHeight });
        }
        else {
            // 親要素のサイズに合わせる
            const parent = this.canvas.parentElement;
            if (parent) {
                const rect = parent.getBoundingClientRect();
                actualWidth = Math.floor(rect.width);
                actualHeight = Math.floor(rect.height);
                console.log('🔧 [DEBUG] Using parent size:', { actualWidth, actualHeight, parentRect: rect });
            }
            else {
                console.warn('🔧 [DEBUG] No parent element found, using current canvas size');
                actualWidth = this.canvas.width;
                actualHeight = this.canvas.height;
            }
        }
        // Canvas要素のサイズを更新（高解像度ディスプレイ対応）
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        // devicePixelRatioを取得（高解像度ディスプレイ対応）
        const devicePixelRatio = window.devicePixelRatio || 1;
        console.log('🔧 [DEBUG] Device pixel ratio:', devicePixelRatio);
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
            console.log('🔧 [DEBUG] Canvas context scaled by:', devicePixelRatio);
        }
        console.log('🔧 [DEBUG] Canvas size updated:', {
            oldSize: { width: oldWidth, height: oldHeight },
            newSize: { width: canvasWidth, height: canvasHeight },
            displaySize: { width: actualWidth, height: actualHeight },
            devicePixelRatio
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
        // Rust側のキャンバスサイズも更新（論理ピクセルで渡す）
        if (this.wasmTable) {
            try {
                // Rust側には論理ピクセルサイズを渡す（描画座標系の一貫性を保つため）
                this.wasmTable.update_canvas_size(actualWidth, actualHeight);
                console.log('🔧 [DEBUG] WASM canvas size updated via update_canvas_size:', { width: actualWidth, height: actualHeight });
            }
            catch (error) {
                console.error('🔧 [DEBUG] Error updating WASM canvas size:', error);
                // フォールバック: 直接プロパティを更新
                try {
                    if ('canvas_width' in this.wasmTable && 'canvas_height' in this.wasmTable) {
                        this.wasmTable.canvas_width = actualWidth;
                        this.wasmTable.canvas_height = actualHeight;
                        console.log('🔧 [DEBUG] WASM canvas size updated via direct property access:', { width: actualWidth, height: actualHeight });
                    }
                }
                catch (fallbackError) {
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
        console.log('🔧 [DEBUG] calculateMaxScrollX:', {
            totalWidth,
            canvasDisplayWidth,
            visibleWidth,
            maxScroll
        });
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
        console.log('🔧 [DEBUG] calculateMaxScrollY:', {
            totalHeight,
            canvasDisplayHeight,
            visibleHeight,
            maxScroll
        });
        return maxScroll;
    }
    /**
     * 範囲選択を開始
     */
    startRangeSelection(row, col) {
        this.ensureInitialized();
        this.wasmTable.start_range_selection(row, col);
    }
    /**
     * 範囲選択を更新
     */
    updateRangeSelection(row, col) {
        this.ensureInitialized();
        this.wasmTable.update_range_selection(row, col);
    }
    /**
     * 範囲選択を終了
     */
    endRangeSelection() {
        this.ensureInitialized();
        this.wasmTable.end_range_selection();
    }
    /**
     * 選択をクリア
     */
    clearSelection() {
        this.ensureInitialized();
        this.wasmTable.clear_selection();
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
    handleKeyboardShortcut(event) {
        if (!this.wasmTable)
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
            console.error('❌ [DEBUG] Copy failed:', error);
            // エラー時はフォールバックを試行
            try {
                const copiedData = this.copySelection();
                if (copiedData) {
                    this.fallbackCopyToClipboard(copiedData);
                }
            }
            catch (fallbackError) {
                console.error('❌ [DEBUG] Fallback copy also failed:', fallbackError);
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
                console.log('📋 [DEBUG] Pasted data from Clipboard API:', pasteData);
            }
            else {
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
        }
        catch (error) {
            console.error('❌ [DEBUG] Paste failed:', error);
        }
    }
    /**
     * カット処理（コピー + 削除）
     */
    async handleCut() {
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
                }
                else {
                    // 単一セル選択の場合
                    this.setCellValue(selectionInfo.row, selectionInfo.col, '');
                }
                this.render();
                console.log('✅ [DEBUG] Cut completed successfully');
            }
        }
        catch (error) {
            console.error('❌ [DEBUG] Cut failed:', error);
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
            console.log('✅ [DEBUG] Select all completed');
        }
        catch (error) {
            console.error('❌ [DEBUG] Select all failed:', error);
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
                console.log('✅ [DEBUG] Fallback copy successful');
            }
            else {
                console.error('❌ [DEBUG] Fallback copy failed');
            }
        }
        catch (err) {
            console.error('❌ [DEBUG] Fallback copy error:', err);
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
        console.warn('⚠️ [DEBUG] Clipboard read not supported in this browser');
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
    handleShiftCtrlArrowKey(key) {
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
    handleArrowKey(key) {
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
    handleCtrlArrowNavigation(key) {
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
                console.log('🚫 [DEBUG] Global Tab key capture - editing mode');
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
        }
        else {
            console.warn('🔧 [DEBUG] No parent element found for ResizeObserver');
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
            // 事前定義されたテーマの場合
            themeColors = PREDEFINED_THEMES[theme];
            if (!themeColors) {
                throw new Error(`Unknown theme: ${theme}`);
            }
        }
        else {
            // カスタムテーマオブジェクトの場合
            themeColors = theme;
        }
        // 現在の設定にテーマを適用
        const newConfig = {
            ...this.config,
            background_color: themeColors.background_color,
            text_color: themeColors.text_color,
            grid_color: themeColors.grid_color,
            header_background_color: themeColors.header_background_color,
            selected_cell_color: themeColors.selected_cell_color
        };
        // Rust側の設定を更新
        this.wasmTable.update_config(JSON.stringify(newConfig));
        // TypeScript側の設定も更新
        this.config = newConfig;
        // 再描画
        this.render();
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
        return Object.keys(PREDEFINED_THEMES);
    }
}
