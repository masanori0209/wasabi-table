/**
 * Excel-style autofill series prediction (mirrors Rust `autofill.rs`).
 */
export type FillWrite = {
    row: number;
    col: number;
    value: string;
};
export interface CellRange {
    start_row: number;
    start_col: number;
    end_row: number;
    end_col: number;
}
export declare function extendSeries(values: string[], extraCount: number): string[];
export declare function extendSeriesBefore(values: string[], extraCount: number): string[];
export declare function planAutofill(source: CellRange, sourceValues: string[][], fillEndRow: number, fillEndCol: number, rowCount: number, colCount: number): FillWrite[];
export declare function planAutofillDoubleClickDown(source: CellRange, sourceValues: string[][], targetLastRow: number, rowCount: number, colCount: number): FillWrite[];
