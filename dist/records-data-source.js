import { FieldType } from './types.js';
export function buildColumnHeadersFromRecords(columns, defaultColWidth) {
    return columns.map((col, order) => {
        var _a, _b;
        return ({
            name: col.field,
            display_name: (_a = col.header) !== null && _a !== void 0 ? _a : col.field,
            width: (_b = col.width) !== null && _b !== void 0 ? _b : defaultColWidth,
            required: false,
            order,
            is_visible: true,
            field_type: FieldType.CharField,
        });
    });
}
export class RecordsDataSource {
    constructor(columns, records) {
        this.columns = columns;
        this.records = records;
    }
    getRecords() {
        return this.records;
    }
    setRecords(records) {
        this.records = records;
    }
    getRowCount() {
        return this.records.length;
    }
    getColCount() {
        return this.columns.length;
    }
    getColumns() {
        return this.columns;
    }
    getCellValue(row, col) {
        const column = this.columns[col];
        if (!column)
            return '';
        const record = this.records[row];
        if (!record)
            return '';
        if (column.getter)
            return column.getter(record, row);
        const raw = record[column.field];
        return raw == null ? '' : String(raw);
    }
    setCellValue(row, col, value) {
        const column = this.columns[col];
        if (!column || column.getter)
            return false;
        const record = this.records[row];
        if (!record)
            return false;
        record[column.field] = value;
        return true;
    }
    getRowValues(row) {
        const values = new Array(this.columns.length);
        for (let col = 0; col < this.columns.length; col += 1) {
            values[col] = this.getCellValue(row, col);
        }
        return values;
    }
    getLogicalCellCount() {
        return this.records.length * this.columns.length;
    }
}
