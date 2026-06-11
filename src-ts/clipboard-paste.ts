/**
 * Excel-compatible paste target planning (mirrors Rust `clipboard_paste.rs`).
 */

export type PasteWrite = { row: number; col: number; value: string };

export interface PasteSelection {
  isRange: boolean;
  start_row?: number;
  start_col?: number;
  end_row?: number;
  end_col?: number;
  active_row?: number;
  active_col?: number;
  row?: number;
  col?: number;
  cell_count: number;
}

function cellCount(sel: PasteSelection): number {
  if (
    sel.isRange &&
    sel.start_row != null &&
    sel.end_row != null &&
    sel.start_col != null &&
    sel.end_col != null
  ) {
    return (sel.end_row - sel.start_row + 1) * (sel.end_col - sel.start_col + 1);
  }
  return sel.cell_count;
}

export function planExcelPaste(
  pasteData: string[][],
  selection: PasteSelection,
  rowCount: number,
  colCount: number
): PasteWrite[] {
  if (pasteData.length === 0) return [];

  const srcRows = pasteData.length;
  const srcCols = Math.max(...pasteData.map((r) => r.length), 0);
  if (srcCols === 0) return [];

  const anchorRow =
    selection.active_row ?? selection.row ?? selection.start_row ?? 0;
  const anchorCol =
    selection.active_col ?? selection.col ?? selection.start_col ?? 0;

  const writes: PasteWrite[] = [];

  if (
    srcRows === 1 &&
    srcCols === 1 &&
    selection.isRange &&
    cellCount(selection) > 1 &&
    selection.start_row != null &&
    selection.end_row != null &&
    selection.start_col != null &&
    selection.end_col != null
  ) {
    const value = pasteData[0][0] ?? '';
    for (let row = selection.start_row; row <= selection.end_row; row += 1) {
      for (let col = selection.start_col; col <= selection.end_col; col += 1) {
        if (row < rowCount && col < colCount) {
          writes.push({ row, col, value });
        }
      }
    }
    return writes;
  }

  for (let rowOffset = 0; rowOffset < pasteData.length; rowOffset += 1) {
    const rowData = pasteData[rowOffset] ?? [];
    for (let colOffset = 0; colOffset < rowData.length; colOffset += 1) {
      const targetRow = anchorRow + rowOffset;
      const targetCol = anchorCol + colOffset;
      if (targetRow < rowCount && targetCol < colCount) {
        writes.push({ row: targetRow, col: targetCol, value: rowData[colOffset] ?? '' });
      }
    }
  }

  return writes;
}
