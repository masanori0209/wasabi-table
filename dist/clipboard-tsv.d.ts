/**
 * Excel-compatible TSV clipboard helpers.
 *
 * - Normalizes `\r\n` / `\r` → `\n`
 * - Preserves intentional empty rows (incl. tab-only rows for multi-column blanks)
 * - Serializes with `\r\n` + trailing newline (Excel-style) for reliable round-trip
 */
export declare function normalizeClipboardText(text: string): string;
/**
 * Parse clipboard TSV into rows. Empty lines become rows with empty cell(s).
 */
export declare function parseTsvRows(text: string): string[][];
/**
 * Serialize rows to Excel-style TSV (`\r\n` line endings + trailing newline).
 */
export declare function serializeTsvRows(rows: string[][]): string;
