import { describe, expect, it } from 'vitest';
import { normalizeClipboardText, parseTsvRows, serializeTsvRows } from './clipboard-tsv';

describe('clipboard-tsv', () => {
  it('normalizes CRLF and lone CR', () => {
    expect(normalizeClipboardText('a\tb\r\nc\td\r')).toBe('a\tb\nc\td\n');
  });

  it('parses Excel CRLF without trailing CR in cells', () => {
    expect(parseTsvRows('Alpha\tBeta\r\nGamma\tDelta\r\n')).toEqual([
      ['Alpha', 'Beta'],
      ['Gamma', 'Delta'],
    ]);
  });

  it('preserves empty row between data', () => {
    expect(parseTsvRows('Top\r\n\r\nBottom\r\n')).toEqual([['Top'], [''], ['Bottom']]);
  });

  it('preserves tab-only row (all-empty multi-column row)', () => {
    expect(parseTsvRows('A\tB\r\n\t\r\nC\tD\r\n')).toEqual([
      ['A', 'B'],
      ['', ''],
      ['C', 'D'],
    ]);
  });

  it('round-trips range with empty middle row', () => {
    const rows = [['A', 'B'], ['', ''], ['C', 'D']];
    expect(parseTsvRows(serializeTsvRows(rows))).toEqual(rows);
  });

  it('round-trips trailing empty row in single column', () => {
    const rows = [['hello'], ['world'], ['']];
    expect(parseTsvRows(serializeTsvRows(rows))).toEqual(rows);
  });

  it('single-row Excel paste does not add extra row', () => {
    expect(parseTsvRows('hello\r\n')).toEqual([['hello']]);
  });
});
