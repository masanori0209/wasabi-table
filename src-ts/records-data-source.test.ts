import { describe, expect, it } from 'vitest';
import { RecordsDataSource } from './records-data-source';

const SAMPLE_COLUMNS = [
  { field: 'personid', header: 'ID', width: 100 },
  { field: 'fname', header: 'First Name', width: 200 },
  { field: 'lname', header: 'Last Name', width: 200 },
  { field: 'email', header: 'Email', width: 250 },
  { field: 'check', header: '', width: 50 },
];

describe('RecordsDataSource', () => {
  it('reads and writes cell values via field mapping', () => {
    const source = new RecordsDataSource(SAMPLE_COLUMNS, [
      { personid: 1, fname: 'Alice', lname: 'Smith', email: 'a@x.com', check: true },
    ]);

    expect(source.getCellValue(0, 1)).toBe('Alice');
    source.setCellValue(0, 1, 'Alicia');
    expect(source.getRecords()[0].fname).toBe('Alicia');
  });
});
