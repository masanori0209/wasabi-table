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
    constructor(wasmTable, config) {
        this.eventHandlers = {};
        this.isInitialized = false;
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
    static async create(canvas, config = {}) {
        // WebAssemblyモジュールを初期化
        await init();
        const finalConfig = { ...DEFAULT_CONFIG, ...config };
        const wasmTable = new WasmNinjaTable(canvas, JSON.stringify(finalConfig));
        const table = new NinjaTable(wasmTable, finalConfig);
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
     * セルに値を設定
     *
     * @param row - 行インデックス
     * @param col - 列インデックス
     * @param value - 設定する値
     */
    setCellValue(row, col, value) {
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
     * 編集中かどうかを取得
     *
     * @returns 編集中の場合true
     */
    isEditing() {
        this.ensureInitialized();
        return this.wasmTable.is_editing();
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
        };
        window.handleTableKey = (key) => {
            this.wasmTable.handle_canvas_keydown(key);
            this.triggerCellSelectEvent();
        };
    }
    triggerCellSelectEvent() {
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
}
//# sourceMappingURL=index.js.map