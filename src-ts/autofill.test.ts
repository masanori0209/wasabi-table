import { describe, expect, it } from 'vitest';
import { extendSeries, planAutofill } from './autofill';

describe('autofill', () => {
  it('extends numeric column series downward', () => {
    const writes = planAutofill(
      { start_row: 0, start_col: 0, end_row: 1, end_col: 0 },
      [['1'], ['2']],
      4,
      0,
      10,
      10
    );
    expect(writes).toEqual([
      { row: 2, col: 0, value: '3' },
      { row: 3, col: 0, value: '4' },
      { row: 4, col: 0, value: '5' },
    ]);
  });

  it('repeats single value when dragging', () => {
    expect(extendSeries(['hello'], 3)).toEqual(['hello', 'hello', 'hello']);
  });
});
