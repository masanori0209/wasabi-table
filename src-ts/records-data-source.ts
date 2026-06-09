import { FieldType, type ColumnHeader } from './types';

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

export function buildColumnHeadersFromRecords(
  columns: RecordColumnDef[],
  defaultColWidth: number
): ColumnHeader[] {
  return columns.map((col, order) => ({
    name: col.field,
    display_name: col.header ?? col.field,
    width: col.width ?? defaultColWidth,
    required: false,
    order,
    is_visible: true,
    field_type: FieldType.CharField,
  }));
}

export class RecordsDataSource {
  private records: RecordRow[];

  constructor(
    private readonly columns: RecordColumnDef[],
    records: RecordRow[]
  ) {
    this.records = records;
  }

  getRecords(): RecordRow[] {
    return this.records;
  }

  setRecords(records: RecordRow[]): void {
    this.records = records;
  }

  getRowCount(): number {
    return this.records.length;
  }

  getColCount(): number {
    return this.columns.length;
  }

  getColumns(): RecordColumnDef[] {
    return this.columns;
  }

  getCellValue(row: number, col: number): string {
    const column = this.columns[col];
    if (!column) return '';
    const record = this.records[row];
    if (!record) return '';
    if (column.getter) return column.getter(record, row);
    const raw = record[column.field];
    return raw == null ? '' : String(raw);
  }

  setCellValue(row: number, col: number, value: string): boolean {
    const column = this.columns[col];
    if (!column || column.getter) return false;
    const record = this.records[row];
    if (!record) return false;
    record[column.field] = value;
    return true;
  }

  getRowValues(row: number): string[] {
    const values = new Array(this.columns.length);
    for (let col = 0; col < this.columns.length; col += 1) {
      values[col] = this.getCellValue(row, col);
    }
    return values;
  }

  getLogicalCellCount(): number {
    return this.records.length * this.columns.length;
  }
}

/** CheetahGrid サンプル相当のテストデータ生成 */
export function generatePersonRecords(count: number): RecordRow[] {
  const records = new Array(count);
  for (let i = 0; i < count; i += 1) {
    records[i] = {
      personid: i + 1,
      fname: `fname_${i}`,
      lname: `lname_${i}`,
      email: `user${i}@example.com`,
      check: i % 3 === 0,
    };
  }
  return records;
}

export const CHEETAH_STYLE_COLUMNS: RecordColumnDef[] = [
  { field: 'personid', header: 'ID', width: 100 },
  { field: 'fname', header: 'First Name', width: 200 },
  { field: 'lname', header: 'Last Name', width: 200 },
  { field: 'email', header: 'Email', width: 250 },
  { field: 'check', header: '', width: 50 },
];
