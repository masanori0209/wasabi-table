import { describe, expect, it } from 'vitest';
import { planExcelPaste } from './clipboard-paste';

describe('planExcelPaste', () => {
  it('fills entire multi-cell selection with a single copied value', () => {
    const writes = planExcelPaste(
      [['X']],
      {
        type: 'range',
        hasSelection: true,
        isRange: true,
        start_row: 1,
        start_col: 1,
        end_row: 3,
        end_col: 2,
        active_row: 2,
        active_col: 2,
        cell_count: 6,
      },
      10,
      10
    );
    expect(writes).toHaveLength(6);
    expect(writes.every((w) => w.value === 'X')).toBe(true);
  });

  it('pastes block starting at active cell within range', () => {
    const writes = planExcelPaste(
      [
        ['A', 'B'],
        ['C', 'D'],
      ],
      {
        type: 'range',
        hasSelection: true,
        isRange: true,
        start_row: 0,
        start_col: 0,
        end_row: 2,
        end_col: 2,
        active_row: 1,
        active_col: 1,
        cell_count: 9,
      },
      10,
      10
    );
    expect(writes).toEqual([
      { row: 1, col: 1, value: 'A' },
      { row: 1, col: 2, value: 'B' },
      { row: 2, col: 1, value: 'C' },
      { row: 2, col: 2, value: 'D' },
    ]);
  });
});
