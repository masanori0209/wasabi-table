import { ColumnHeader, FieldType, FilterCondition, SortCondition } from './types';
export interface HeaderDialogHost {
    getColumnHeaders(): ColumnHeader[];
    getHeaderPosition(columnIndex: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    getFilterSortState(): {
        filterConditions: FilterCondition[];
        sortCondition: SortCondition | null;
        isFiltered: boolean;
    };
    addFilterCondition(condition: FilterCondition): void;
    removeFilterCondition(columnIndex: number): void;
    setSortCondition(condition: SortCondition | null): void;
}
export declare class HeaderDialogController {
    private host;
    private filterDialogs;
    private handleOutsideClick;
    constructor(host: HeaderDialogHost);
    show(columnIndex: number): void;
    /**
     * フィルターダイアログを表示（後方互換性のため）
     */
    showFilterDialog(columnIndex: number): void;
    /**
     * 統合ヘッダーダイアログを作成
     */
    createHeaderDialog(columnIndex: number, header: ColumnHeader): HTMLElement;
    /**
     * フィルターダイアログを作成（後方互換性のため）
     */
    createFilterDialog(columnIndex: number, header: ColumnHeader): HTMLElement;
    /**
     * MenuFieldのフィルターUI作成
     */
    createMenuFieldFilter(dialog: HTMLElement, columnIndex: number, header: ColumnHeader, existingCondition?: FilterCondition): void;
    /**
     * 数値フィールドのフィルターUI作成
     */
    createNumericFieldFilter(dialog: HTMLElement, columnIndex: number, header: ColumnHeader, existingCondition?: FilterCondition): void;
    /**
     * テキストフィールドのフィルターUI作成
     */
    createTextFieldFilter(dialog: HTMLElement, columnIndex: number, header: ColumnHeader, existingCondition?: FilterCondition): void;
    /**
     * フィルターダイアログから条件を適用
     */
    applyFilterFromDialog(dialog: HTMLElement, columnIndex: number, fieldType: FieldType): void;
    hide(columnIndex: number): void;
    switchTab(activeTab: HTMLElement, inactiveTab: HTMLElement, contentArea: HTMLElement, columnIndex: number, header: ColumnHeader, tabType: 'sort' | 'filter'): void;
    /**
     * ソートコンテンツを作成
     */
    createSortContent(container: HTMLElement, columnIndex: number, header: ColumnHeader): void;
    /**
     * フィルターコンテンツを作成
     */
    createFilterContent(container: HTMLElement, columnIndex: number, header: ColumnHeader): void;
    hideAll(): void;
}
