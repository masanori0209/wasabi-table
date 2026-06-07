import { FieldType, FilterOperator } from './types.js';
export function createFilterSortState() {
    return {
        filterConditions: [],
        sortCondition: null,
        filteredRows: [],
        isFiltered: false,
    };
}
export function passesFilter(row, condition, getCellValue) {
    const cellValue = getCellValue(row, condition.columnIndex) || '';
    const filterValue = condition.value.toLowerCase();
    const cellValueLower = cellValue.toLowerCase();
    switch (condition.operator) {
        case FilterOperator.Contains:
            return cellValueLower.includes(filterValue);
        case FilterOperator.StartsWith:
            return cellValueLower.startsWith(filterValue);
        case FilterOperator.EndsWith:
            return cellValueLower.endsWith(filterValue);
        case FilterOperator.Equals:
            if (condition.fieldType === FieldType.IntegerField ||
                condition.fieldType === FieldType.DecimalField) {
                return parseFloat(cellValue) === parseFloat(condition.value);
            }
            if (condition.fieldType === FieldType.MenuField && condition.value.includes('|')) {
                return condition.value.split('|').includes(cellValue);
            }
            return cellValueLower === filterValue;
        case FilterOperator.NotEquals:
            if (condition.fieldType === FieldType.IntegerField ||
                condition.fieldType === FieldType.DecimalField) {
                return parseFloat(cellValue) !== parseFloat(condition.value);
            }
            return cellValueLower !== filterValue;
        case FilterOperator.GreaterThan:
            return parseFloat(cellValue) > parseFloat(condition.value);
        case FilterOperator.GreaterThanOrEqual:
            return parseFloat(cellValue) >= parseFloat(condition.value);
        case FilterOperator.LessThan:
            return parseFloat(cellValue) < parseFloat(condition.value);
        case FilterOperator.LessThanOrEqual:
            return parseFloat(cellValue) <= parseFloat(condition.value);
        case FilterOperator.IsEmpty:
            return cellValue.trim() === '';
        case FilterOperator.IsNotEmpty:
            return cellValue.trim() !== '';
        default:
            return true;
    }
}
export function sortRows(rows, sortCondition, getCellValue) {
    return [...rows].sort((a, b) => {
        const aValue = getCellValue(a, sortCondition.columnIndex) || '';
        const bValue = getCellValue(b, sortCondition.columnIndex) || '';
        let comparison = 0;
        if (sortCondition.fieldType === FieldType.IntegerField ||
            sortCondition.fieldType === FieldType.DecimalField) {
            comparison = (parseFloat(aValue) || 0) - (parseFloat(bValue) || 0);
        }
        else if (sortCondition.fieldType === FieldType.DateField) {
            comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
        }
        else {
            comparison = aValue.localeCompare(bValue);
        }
        return sortCondition.direction === 'desc' ? -comparison : comparison;
    });
}
export function applyFilters(state, access, wasm) {
    let rows = [];
    for (let i = 0; i < access.getRowCount(); i++) {
        rows.push(i);
    }
    if (state.filterConditions.length > 0) {
        rows = rows.filter((row) => state.filterConditions.every((condition) => {
            if (!condition.isActive)
                return true;
            return passesFilter(row, condition, access.getCellValue);
        }));
        state.isFiltered = true;
    }
    else {
        state.isFiltered = false;
    }
    if (state.sortCondition) {
        rows = sortRows(rows, state.sortCondition, access.getCellValue);
    }
    state.filteredRows = rows;
    if (wasm) {
        try {
            if (state.isFiltered || state.sortCondition) {
                wasm.set_filtered_rows(JSON.stringify(rows));
            }
            else {
                wasm.clear_filter();
            }
        }
        catch (error) {
            console.error('Failed to update filter in Rust:', error);
        }
    }
}
export function getFilterResult(state, totalRows) {
    return {
        filteredRows: state.filteredRows,
        totalRows,
        filteredCount: state.filteredRows.length,
    };
}
