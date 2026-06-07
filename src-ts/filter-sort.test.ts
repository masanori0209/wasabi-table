import { describe, expect, it } from 'vitest';
import {
  applyFilters,
  createFilterSortState,
  passesFilter,
  sortRows,
} from './filter-sort';
import { FieldType, FilterOperator } from './types';

describe('filter-sort', () => {
  const cells: Record<string, string> = {
    '0:0': 'apple',
    '1:0': 'banana',
    '2:0': '10',
    '3:0': '20',
  };

  const getCellValue = (row: number, col: number) => cells[`${row}:${col}`];

  it('passesFilter matches contains operator', () => {
    const result = passesFilter(
      0,
      {
        columnIndex: 0,
        fieldType: FieldType.CharField,
        operator: FilterOperator.Contains,
        value: 'app',
        isActive: true,
      },
      getCellValue
    );
    expect(result).toBe(true);
  });

  it('applyFilters keeps matching rows only', () => {
    const state = createFilterSortState();
    state.filterConditions.push({
      columnIndex: 0,
      fieldType: FieldType.CharField,
      operator: FilterOperator.StartsWith,
      value: 'b',
      isActive: true,
    });

    applyFilters(state, { getCellValue, getRowCount: () => 4 });
    expect(state.filteredRows).toEqual([1]);
    expect(state.isFiltered).toBe(true);
  });

  it('sortRows orders numeric values', () => {
    const sorted = sortRows(
      [3, 2],
      {
        columnIndex: 0,
        fieldType: FieldType.IntegerField,
        direction: 'asc',
      },
      getCellValue
    );
    expect(sorted).toEqual([2, 3]);
  });
});
