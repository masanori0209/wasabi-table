import { type ColumnHeader } from './types';
export type RecordRow = Record<string, unknown>;
export interface RecordColumnDef {
    field: string;
    header?: string;
    width?: number;
    getter?: (record: RecordRow, rowIndex: number) => string;
}
export interface RecordsDataSourceConfig {
    records: RecordRow[];
    columns: RecordColumnDef[];
}
export declare function buildColumnHeadersFromRecords(columns: RecordColumnDef[], defaultColWidth: number): ColumnHeader[];
export declare class RecordsDataSource {
    private readonly columns;
    private records;
    constructor(columns: RecordColumnDef[], records: RecordRow[]);
    getRecords(): RecordRow[];
    setRecords(records: RecordRow[]): void;
    getRowCount(): number;
    getColCount(): number;
    getColumns(): RecordColumnDef[];
    getCellValue(row: number, col: number): string;
    setCellValue(row: number, col: number, value: string): boolean;
    getRowValues(row: number): string[];
    getLogicalCellCount(): number;
}
