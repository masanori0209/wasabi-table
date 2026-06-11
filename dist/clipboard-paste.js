/**
 * Excel-compatible paste target planning (mirrors Rust `clipboard_paste.rs`).
 */
function cellCount(sel) {
    if (sel.isRange &&
        sel.start_row != null &&
        sel.end_row != null &&
        sel.start_col != null &&
        sel.end_col != null) {
        return (sel.end_row - sel.start_row + 1) * (sel.end_col - sel.start_col + 1);
    }
    return sel.cell_count;
}
export function planExcelPaste(pasteData, selection, rowCount, colCount) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (pasteData.length === 0)
        return [];
    const srcRows = pasteData.length;
    const srcCols = Math.max(...pasteData.map((r) => r.length), 0);
    if (srcCols === 0)
        return [];
    const anchorRow = (_c = (_b = (_a = selection.active_row) !== null && _a !== void 0 ? _a : selection.row) !== null && _b !== void 0 ? _b : selection.start_row) !== null && _c !== void 0 ? _c : 0;
    const anchorCol = (_f = (_e = (_d = selection.active_col) !== null && _d !== void 0 ? _d : selection.col) !== null && _e !== void 0 ? _e : selection.start_col) !== null && _f !== void 0 ? _f : 0;
    const writes = [];
    if (srcRows === 1 &&
        srcCols === 1 &&
        selection.isRange &&
        cellCount(selection) > 1 &&
        selection.start_row != null &&
        selection.end_row != null &&
        selection.start_col != null &&
        selection.end_col != null) {
        const value = (_g = pasteData[0][0]) !== null && _g !== void 0 ? _g : '';
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
        const rowData = (_h = pasteData[rowOffset]) !== null && _h !== void 0 ? _h : [];
        for (let colOffset = 0; colOffset < rowData.length; colOffset += 1) {
            const targetRow = anchorRow + rowOffset;
            const targetCol = anchorCol + colOffset;
            if (targetRow < rowCount && targetCol < colCount) {
                writes.push({ row: targetRow, col: targetCol, value: (_j = rowData[colOffset]) !== null && _j !== void 0 ? _j : '' });
            }
        }
    }
    return writes;
}
