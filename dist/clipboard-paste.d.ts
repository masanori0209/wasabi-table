/**
 * Excel-compatible paste target planning (mirrors Rust `clipboard_paste.rs`).
 */
export type PasteWrite = {
    row: number;
    col: number;
    value: string;
};
export interface PasteSelection {
    isRange: boolean;
    start_row?: number;
    start_col?: number;
    end_row?: number;
    end_col?: number;
    active_row?: number;
    active_col?: number;
    row?: number;
    col?: number;
    cell_count: number;
}
export declare function planExcelPaste(pasteData: string[][], selection: PasteSelection, rowCount: number, colCount: number): PasteWrite[];
