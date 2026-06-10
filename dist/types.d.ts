/**
 * Wasabi Table 共通型定義
 */
export interface ThemeColors {
    background_color: string;
    text_color: string;
    grid_color: string;
    header_background_color: string;
    selected_cell_color: string;
    range_selection_color?: string;
    error_cell_color?: string;
    editing_cell_color?: string;
}
export type PredefinedTheme = 'light' | 'dark';
export declare const PREDEFINED_THEMES: Record<PredefinedTheme, ThemeColors>;
export interface WasabiTableCreateOptions extends Partial<TableConfig> {
    dataSource?: import('./records-data-source').RecordsDataSourceConfig;
}
export interface TableConfig {
    row_count: number;
    col_count: number;
    default_col_width: number;
    default_row_height: number;
    header_height: number;
    row_header_width: number;
    font_family: string;
    font_size: number;
    font_style: string;
    font_weight: string;
    background_color: string;
    text_color: string;
    grid_color: string;
    header_background_color: string;
    selected_cell_color: string;
    show_grid: boolean;
    column_headers: ColumnHeader[];
    freeze_cols?: number;
    freeze_rows?: number;
}
export interface CellData {
    value: string;
    row: number;
    col: number;
}
export interface CellPosition {
    row: number;
    col: number;
}
export interface TableStats {
    totalCells: number;
    visibleCells: number;
    dataCells: number;
    scrollX: number;
    scrollY: number;
    visibleRows: {
        start: number;
        end: number;
    };
    visibleCols: {
        start: number;
        end: number;
    };
}
export type NotificationType = 'info' | 'success' | 'warning' | 'redo';
export interface EventHandlers {
    onCellSelect?: (position: CellPosition) => void;
    onEditStart?: (position: CellPosition, value: string) => void;
    onEditEnd?: (position: CellPosition, value: string) => void;
    onCellChange?: (position: CellPosition, oldValue: string, newValue: string) => void;
    onNotification?: (message: string, type?: NotificationType) => void;
}
export declare const DEFAULT_CONFIG: TableConfig;
export declare enum FieldType {
    CharField = "CharField",
    EmailField = "EmailField",
    TextareaField = "TextareaField",
    IntegerField = "IntegerField",
    DecimalField = "DecimalField",
    DecimalWithNullField = "DecimalWithNullField",
    DateField = "DateField",
    TimeField = "TimeField",
    CheckField = "CheckField",
    BooleanField = "BooleanField",
    ButtonField = "ButtonField",
    MenuField = "MenuField"
}
export declare enum FilterOperator {
    Contains = "contains",
    StartsWith = "startsWith",
    EndsWith = "endsWith",
    Equals = "equals",
    NotEquals = "notEquals",
    GreaterThan = "greaterThan",
    GreaterThanOrEqual = "greaterThanOrEqual",
    LessThan = "lessThan",
    LessThanOrEqual = "lessThanOrEqual",
    IsEmpty = "isEmpty",
    IsNotEmpty = "isNotEmpty"
}
export interface FilterCondition {
    columnIndex: number;
    fieldType: FieldType;
    operator: FilterOperator;
    value: string;
    isActive: boolean;
}
export interface SortCondition {
    columnIndex: number;
    fieldType: FieldType;
    direction: 'asc' | 'desc';
}
export interface FilterResult {
    filteredRows: number[];
    totalRows: number;
    filteredCount: number;
}
export interface MenuFieldOption {
    label: string;
    value: string;
    disabled?: boolean;
}
export interface MenuFieldConfig {
    options: MenuFieldOption[] | string[];
    searchable?: boolean;
    placeholder?: string;
    maxDisplayItems?: number;
}
export interface ColumnHeader {
    name: string;
    display_name: string;
    width: number;
    required: boolean;
    order: number;
    is_visible: boolean;
    field_type: FieldType | string;
    max_length?: number;
    min_length?: number;
    max_digits?: number;
    decimal_places?: number;
    min_number?: number;
    max_number?: number;
    choices?: string[];
    menu_config?: MenuFieldConfig;
}
export interface ValidationError {
    field_name: string;
    message: string;
    error_type: string;
}
export interface ValidationResult {
    isValid: boolean;
    error?: ValidationError;
}
export interface CellScreenPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    absolute_x: number;
    absolute_y: number;
}
export interface ListenerOptions {
    enableValidation?: boolean;
    enableIMESupport?: boolean;
    autoFocusCanvas?: boolean;
    validationDelay?: number;
    enableKeyboardShortcuts?: boolean;
}
export interface UIElements {
    cellReference: HTMLElement;
    formulaInput: HTMLInputElement;
    statsElement?: HTMLElement;
    validationError?: HTMLElement;
    validationSuccess?: HTMLElement;
}
export interface EventCallbacks {
    onStatsUpdate?: (stats: TableStats) => void;
    onValidationError?: (error: ValidationError) => void;
    onValidationSuccess?: () => void;
    onCellReferenceUpdate?: (reference: string) => void;
    onNotification?: (message: string, type?: NotificationType) => void;
}
export interface SelectionInfo {
    type: 'range' | 'single' | 'none';
    hasSelection: boolean;
    isRange: boolean;
    start_row?: number;
    start_col?: number;
    end_row?: number;
    end_col?: number;
    row?: number;
    col?: number;
    cell_count: number;
}
/**
 * WasabiTable の公開インターフェース（循環参照回避用）
 */
export interface IWasabiTable {
    getSelectedCell(): CellPosition | undefined;
    setCellValue(row: number, col: number, value: string): void;
    setCellValueWithValidation(row: number, col: number, value: string): ValidationResult;
    validateCellValue(row: number, col: number, value: string): ValidationError[];
    getConfig(): TableConfig;
    render(): void;
    selectCell(row: number, col: number): void;
    setEventHandlers(handlers: EventHandlers): void;
    getCellValue(row: number, col: number): string | undefined;
    getSelectedCellValidationError(): string | undefined;
    getStats(): TableStats;
    getSelectionInfo(): SelectionInfo;
    isEditing?(): boolean;
    finishEditing?(): void;
    focusCanvas?(): void;
    navigateSelectedCell?(key: string): void;
    setKeyboardShortcutsEnabled?(enabled: boolean): void;
}
export interface CreateWasabiTableUIConfig {
    cellReferenceSelector: string;
    formulaInputSelector: string;
    statsElementSelector?: string;
    validationErrorSelector?: string;
    validationSuccessSelector?: string;
}
export declare function getColumnName(col: number): string;
export declare function getCellReference(row: number, col: number): string;
export declare function getSelectionReference(info: SelectionInfo): string;
