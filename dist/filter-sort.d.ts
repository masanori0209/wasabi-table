import type { FilterCondition, FilterResult, SortCondition } from './types';
export interface FilterSortWasmBridge {
    set_filtered_rows(rows_json: string): void;
    clear_filter(): void;
}
export interface FilterSortCellAccess {
    getCellValue(row: number, col: number): string | undefined;
    getRowCount(): number;
}
export interface FilterSortState {
    filterConditions: FilterCondition[];
    sortCondition: SortCondition | null;
    filteredRows: number[];
    isFiltered: boolean;
}
export declare function createFilterSortState(): FilterSortState;
export declare function passesFilter(row: number, condition: FilterCondition, getCellValue: FilterSortCellAccess['getCellValue']): boolean;
export declare function sortRows(rows: number[], sortCondition: SortCondition, getCellValue: FilterSortCellAccess['getCellValue']): number[];
export declare function applyFilters(state: FilterSortState, access: FilterSortCellAccess, wasm?: FilterSortWasmBridge): void;
export declare function getFilterResult(state: FilterSortState, totalRows: number): FilterResult;
