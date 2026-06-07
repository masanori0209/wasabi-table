/**
 * Wasabi Table 共通型定義
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
        editing_cell_color: '#f39c12',
    },
    dark: {
        background_color: '#2d3748',
        text_color: '#e2e8f0',
        grid_color: '#4a5568',
        header_background_color: '#1a202c',
        selected_cell_color: '#667eea',
        range_selection_color: 'rgba(102, 126, 234, 0.2)',
        error_cell_color: '#fc8181',
        editing_cell_color: '#f6ad55',
    },
};
export const DEFAULT_CONFIG = {
    row_count: 100,
    col_count: 26,
    default_col_width: 100,
    default_row_height: 25,
    header_height: 30,
    row_header_width: 50,
    font_family: 'Arial, sans-serif',
    font_size: 12,
    font_style: 'normal',
    font_weight: 'normal',
    background_color: '#ffffff',
    text_color: '#000000',
    grid_color: '#cccccc',
    header_background_color: '#f0f0f0',
    selected_cell_color: '#3498db',
    show_grid: true,
    column_headers: [],
};
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
export var FilterOperator;
(function (FilterOperator) {
    FilterOperator["Contains"] = "contains";
    FilterOperator["StartsWith"] = "startsWith";
    FilterOperator["EndsWith"] = "endsWith";
    FilterOperator["Equals"] = "equals";
    FilterOperator["NotEquals"] = "notEquals";
    FilterOperator["GreaterThan"] = "greaterThan";
    FilterOperator["GreaterThanOrEqual"] = "greaterThanOrEqual";
    FilterOperator["LessThan"] = "lessThan";
    FilterOperator["LessThanOrEqual"] = "lessThanOrEqual";
    FilterOperator["IsEmpty"] = "isEmpty";
    FilterOperator["IsNotEmpty"] = "isNotEmpty";
})(FilterOperator || (FilterOperator = {}));
export function getColumnName(col) {
    let result = '';
    let n = col;
    while (true) {
        result = String.fromCharCode(65 + (n % 26)) + result;
        if (n < 26)
            break;
        n = Math.floor(n / 26) - 1;
    }
    return result;
}
export function getCellReference(row, col) {
    return `${getColumnName(col)}${row + 1}`;
}
export function getSelectionReference(info) {
    if (!info.hasSelection) {
        return '';
    }
    if (info.isRange &&
        info.start_row !== undefined &&
        info.start_col !== undefined &&
        info.end_row !== undefined &&
        info.end_col !== undefined) {
        const startRow = Math.min(info.start_row, info.end_row);
        const endRow = Math.max(info.start_row, info.end_row);
        const startCol = Math.min(info.start_col, info.end_col);
        const endCol = Math.max(info.start_col, info.end_col);
        const startRef = getCellReference(startRow, startCol);
        const endRef = getCellReference(endRow, endCol);
        return startRef === endRef ? startRef : `${startRef}:${endRef}`;
    }
    if (info.row !== undefined && info.col !== undefined) {
        return getCellReference(info.row, info.col);
    }
    return '';
}
