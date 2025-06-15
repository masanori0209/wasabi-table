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
     * セルに値を設定
     *
     * @param row - 行インデックス
     * @param col - 列インデックス
     * @param value - 設定する値
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
     * 編集中かどうかを取得
     *
     * @returns 編集中の場合true
     */
    isEditing(): boolean;
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
}
//# sourceMappingURL=index.d.ts.map