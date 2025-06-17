import init, { NinjaTable as WasmNinjaTable } from '../pkg/ninja_table.js';
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
 * NinjaTableとリスナーを簡単に初期化する関数
 */
export async function createNinjaTableWithListeners(canvas, config = {}, uiConfig, listenerOptions, callbacks) {
    // 遅延インポートで循環インポートを回避
    const { createUIElements } = await import('./utils.js');
    const { NinjaTableListeners } = await import('./listeners.js');
    const table = await NinjaTable.create(canvas, config);
    const uiElements = createUIElements(uiConfig);
    const listeners = new NinjaTableListeners(table, uiElements, listenerOptions, callbacks);
    return { table, listeners };
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
    constructor(wasmTable, config, canvas) {
        this.eventHandlers = {};
        this.isInitialized = false;
        this.tooltipElement = null;
        this.isComposing = false; // IME入力状態を管理
        // スクロールバー関連の要素
        this.scrollContainer = null;
        this.horizontalScrollbar = null;
        this.verticalScrollbar = null;
        this.horizontalThumb = null;
        this.verticalThumb = null;
        this.wasmTable = wasmTable;
        this.config = config;
        this.canvas = canvas;
        this.setupEventHandlers();
        this.createTooltipElement();
        this.setupScrollbars();
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
        const wasmTable = new WasmNinjaTable(canvas, JSON.stringify(finalConfig));
        const table = new NinjaTable(wasmTable, finalConfig, canvas);
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
     */
    selectCell(row, col) {
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
     *
     * @returns 現在の設定
     */
    getConfig() {
        return { ...this.config };
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
        return `${NinjaTable.getColumnName(col)}${row + 1}`;
    }
    setupEventHandlers() {
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
        window.handleTableKey = (key) => {
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
        window.handleEditingEnter = () => {
            this.wasmTable.handle_editing_enter();
            this.triggerCellSelectEvent();
        };
        window.handleEditingTab = () => {
            this.wasmTable.handle_editing_tab();
            this.triggerCellSelectEvent();
        };
        window.handleEditingEscape = () => {
            this.wasmTable.handle_editing_escape();
            this.triggerCellSelectEvent();
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
        const visibleWidth = this.canvas.width - (config.row_header_width || 50);
        return Math.max(0, totalWidth - visibleWidth + 50);
    }
    /**
     * 最大垂直スクロール値を計算
     */
    calculateMaxScrollY() {
        if (!this.wasmTable)
            return 0;
        const config = this.getConfig();
        const totalHeight = config.row_count * config.default_row_height;
        const visibleHeight = this.canvas.height - (config.header_height || 30);
        return Math.max(0, totalHeight - visibleHeight);
    }
}
