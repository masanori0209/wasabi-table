/**
 * Excel-compatible TSV clipboard helpers.
 *
 * - Normalizes `\r\n` / `\r` → `\n`
 * - Preserves intentional empty rows (incl. tab-only rows for multi-column blanks)
 * - Serializes with `\r\n` + trailing newline (Excel-style) for reliable round-trip
 */
export function normalizeClipboardText(text) {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
/**
 * Parse clipboard TSV into rows. Empty lines become rows with empty cell(s).
 */
export function parseTsvRows(text) {
    let normalized = normalizeClipboardText(text);
    if (normalized.length === 0) {
        return [];
    }
    // One trailing newline is an Excel / our-serialize artifact, not an extra row.
    if (normalized.endsWith('\n')) {
        normalized = normalized.slice(0, -1);
    }
    if (normalized.length === 0) {
        return [];
    }
    return normalized.split('\n').map((line) => line.split('\t'));
}
/**
 * Serialize rows to Excel-style TSV (`\r\n` line endings + trailing newline).
 */
export function serializeTsvRows(rows) {
    if (rows.length === 0) {
        return '';
    }
    return `${rows.map((row) => row.join('\t')).join('\r\n')}\r\n`;
}
