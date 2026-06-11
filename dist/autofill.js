/**
 * Excel-style autofill series prediction (mirrors Rust `autofill.rs`).
 */
function splitTextNumber(value) {
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    let splitAt = trimmed.length;
    while (splitAt > 0 && trimmed[splitAt - 1] >= '0' && trimmed[splitAt - 1] <= '9') {
        splitAt -= 1;
    }
    if (splitAt === trimmed.length || splitAt === 0)
        return null;
    const prefix = trimmed.slice(0, splitAt);
    const num = Number.parseInt(trimmed.slice(splitAt), 10);
    if (Number.isNaN(num))
        return null;
    return { prefix, num };
}
function parseNumber(value) {
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
}
export function extendSeries(values, extraCount) {
    if (extraCount <= 0)
        return [];
    if (values.length === 0)
        return Array(extraCount).fill('');
    if (values.length === 1)
        return Array(extraCount).fill(values[0]);
    const nums = values.map(parseNumber);
    if (nums.every((n) => n != null) && nums.length >= 2) {
        const step = nums[nums.length - 1] - nums[nums.length - 2];
        let current = nums[nums.length - 1];
        const out = [];
        for (let i = 0; i < extraCount; i += 1) {
            current += step;
            out.push(Number.isInteger(current) ? String(Math.round(current)) : String(current));
        }
        return out;
    }
    const lastSplit = splitTextNumber(values[values.length - 1]);
    if (lastSplit && values.every((v) => { var _a; return ((_a = splitTextNumber(v)) === null || _a === void 0 ? void 0 : _a.prefix) === lastSplit.prefix; })) {
        let step = 1;
        if (values.length >= 2) {
            const a = splitTextNumber(values[values.length - 2]);
            const b = splitTextNumber(values[values.length - 1]);
            if (a && b) {
                step = b.num - a.num || 1;
            }
        }
        let current = lastSplit.num;
        const out = [];
        for (let i = 0; i < extraCount; i += 1) {
            current += step;
            out.push(`${lastSplit.prefix}${current}`);
        }
        return out;
    }
    return Array(extraCount).fill(values[values.length - 1]);
}
export function extendSeriesBefore(values, extraCount) {
    if (extraCount <= 0)
        return [];
    if (values.length === 0)
        return Array(extraCount).fill('');
    if (values.length === 1)
        return Array(extraCount).fill(values[0]);
    const nums = values.map(parseNumber);
    if (nums.every((n) => n != null) && nums.length >= 2) {
        const step = nums[1] - nums[0];
        let current = nums[0];
        const out = [];
        for (let i = 0; i < extraCount; i += 1) {
            current -= step;
            out.push(Number.isInteger(current) ? String(Math.round(current)) : String(current));
        }
        return out.reverse();
    }
    const firstSplit = splitTextNumber(values[0]);
    if (firstSplit && values.every((v) => { var _a; return ((_a = splitTextNumber(v)) === null || _a === void 0 ? void 0 : _a.prefix) === firstSplit.prefix; })) {
        let step = 1;
        if (values.length >= 2) {
            const a = splitTextNumber(values[0]);
            const b = splitTextNumber(values[1]);
            if (a && b) {
                step = b.num - a.num || 1;
            }
        }
        let current = firstSplit.num;
        const out = [];
        for (let i = 0; i < extraCount; i += 1) {
            current -= step;
            out.push(`${firstSplit.prefix}${current}`);
        }
        return out.reverse();
    }
    return Array(extraCount).fill(values[0]);
}
export function planAutofill(source, sourceValues, fillEndRow, fillEndCol, rowCount, colCount) {
    if (sourceValues.length === 0)
        return [];
    const extendDown = fillEndRow > source.end_row;
    const extendUp = fillEndRow < source.start_row;
    const extendRight = fillEndCol > source.end_col;
    const extendLeft = fillEndCol < source.start_col;
    if (!extendDown && !extendUp && !extendRight && !extendLeft)
        return [];
    const rowDeltaDown = fillEndRow - source.end_row;
    const rowDeltaUp = source.start_row - fillEndRow;
    const colDeltaRight = fillEndCol - source.end_col;
    const colDeltaLeft = source.start_col - fillEndCol;
    const vertical = Math.max(rowDeltaDown, rowDeltaUp) >= Math.max(colDeltaRight, colDeltaLeft);
    const writes = [];
    const srcRows = source.end_row - source.start_row + 1;
    const srcCols = source.end_col - source.start_col + 1;
    if (vertical) {
        if (extendDown) {
            for (let colOff = 0; colOff < srcCols; colOff += 1) {
                const col = source.start_col + colOff;
                if (col >= colCount)
                    continue;
                const columnValues = Array.from({ length: srcRows }, (_, r) => { var _a, _b; return (_b = (_a = sourceValues[r]) === null || _a === void 0 ? void 0 : _a[colOff]) !== null && _b !== void 0 ? _b : ''; });
                const extras = extendSeries(columnValues, rowDeltaDown);
                extras.forEach((value, i) => {
                    const row = source.end_row + 1 + i;
                    if (row < rowCount)
                        writes.push({ row, col, value });
                });
            }
        }
        if (extendUp) {
            for (let colOff = 0; colOff < srcCols; colOff += 1) {
                const col = source.start_col + colOff;
                if (col >= colCount)
                    continue;
                const columnValues = Array.from({ length: srcRows }, (_, r) => { var _a, _b; return (_b = (_a = sourceValues[r]) === null || _a === void 0 ? void 0 : _a[colOff]) !== null && _b !== void 0 ? _b : ''; });
                const extras = extendSeriesBefore(columnValues, rowDeltaUp);
                extras.forEach((value, i) => {
                    const row = fillEndRow + i;
                    if (row < source.start_row && row < rowCount)
                        writes.push({ row, col, value });
                });
            }
        }
    }
    else if (extendRight) {
        for (let rowOff = 0; rowOff < srcRows; rowOff += 1) {
            const row = source.start_row + rowOff;
            if (row >= rowCount)
                continue;
            const rowValues = Array.from({ length: srcCols }, (_, c) => { var _a, _b; return (_b = (_a = sourceValues[rowOff]) === null || _a === void 0 ? void 0 : _a[c]) !== null && _b !== void 0 ? _b : ''; });
            const extras = extendSeries(rowValues, colDeltaRight);
            extras.forEach((value, i) => {
                const col = source.end_col + 1 + i;
                if (col < colCount)
                    writes.push({ row, col, value });
            });
        }
    }
    else if (extendLeft) {
        for (let rowOff = 0; rowOff < srcRows; rowOff += 1) {
            const row = source.start_row + rowOff;
            if (row >= rowCount)
                continue;
            const rowValues = Array.from({ length: srcCols }, (_, c) => { var _a, _b; return (_b = (_a = sourceValues[rowOff]) === null || _a === void 0 ? void 0 : _a[c]) !== null && _b !== void 0 ? _b : ''; });
            const extras = extendSeriesBefore(rowValues, colDeltaLeft);
            extras.forEach((value, i) => {
                const col = fillEndCol + i;
                if (col < source.start_col && col < colCount)
                    writes.push({ row, col, value });
            });
        }
    }
    return writes;
}
export function planAutofillDoubleClickDown(source, sourceValues, targetLastRow, rowCount, colCount) {
    if (targetLastRow <= source.end_row)
        return [];
    return planAutofill(source, sourceValues, targetLastRow, source.end_col, rowCount, colCount);
}
