/**
 * DOM要素を自動的に取得してUIElementsオブジェクトを作成
 */
export function createUIElements(config) {
    const cellReference = document.querySelector(config.cellReferenceSelector);
    const formulaInput = document.querySelector(config.formulaInputSelector);
    if (!cellReference || !formulaInput) {
        throw new Error('Required UI elements not found');
    }
    const uiElements = {
        cellReference,
        formulaInput
    };
    if (config.statsElementSelector) {
        const statsElement = document.querySelector(config.statsElementSelector);
        if (statsElement) {
            uiElements.statsElement = statsElement;
        }
    }
    if (config.validationErrorSelector) {
        const validationError = document.querySelector(config.validationErrorSelector);
        if (validationError) {
            uiElements.validationError = validationError;
        }
    }
    if (config.validationSuccessSelector) {
        const validationSuccess = document.querySelector(config.validationSuccessSelector);
        if (validationSuccess) {
            uiElements.validationSuccess = validationSuccess;
        }
    }
    return uiElements;
}
/**
 * CSV出力ユーティリティ
 */
export function exportTableToCSV(table, filename = 'wasabi-table-export.csv') {
    const config = table.getConfig();
    const rows = [];
    for (let row = 0; row < config.row_count; row++) {
        const cells = [];
        let hasData = false;
        for (let col = 0; col < config.col_count; col++) {
            const value = table.getCellValue(row, col) || '';
            cells.push(`"${value.replace(/"/g, '""')}"`);
            if (value)
                hasData = true;
        }
        if (hasData) {
            rows.push(cells.join(','));
        }
        else if (rows.length > 0) {
            break; // 空行で終了
        }
    }
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
/**
 * テーブルをクリアするユーティリティ
 */
export function clearTable(table) {
    const config = table.getConfig();
    for (let row = 0; row < config.row_count; row++) {
        for (let col = 0; col < config.col_count; col++) {
            table.setCellValue(row, col, '');
        }
    }
    table.render();
}
/**
 * サンプルデータを読み込むユーティリティ（既存セルは上書きのみ — 事前に clearTable を推奨）
 */
export function loadSampleData(table, data) {
    data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            table.setCellValue(rowIndex, colIndex, cell);
        });
    });
    table.render();
}
/**
 * デバウンス関数
 */
export function debounce(func, wait) {
    let timeout = null;
    return (...args) => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = window.setTimeout(() => {
            func(...args);
        }, wait);
    };
}
/**
 * A1形式の参照文字列を行列インデックスに変換
 */
export function parseCellReference(reference) {
    const match = reference.trim().match(/^([A-Za-z]+)(\d+)$/i);
    if (!match)
        return null;
    const colStr = match[1].toUpperCase();
    const rowStr = match[2];
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
        col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    col -= 1;
    const row = parseInt(rowStr, 10) - 1;
    if (row < 0)
        return null;
    return { row, col };
}
const VALIDATION_TOOLTIP_BODY_STYLE = 'background: #dc3545; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; max-width: 250px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);';
/**
 * 検証エラーツールチップの DOM を安全に構築（message は textContent で挿入）
 */
export function buildValidationTooltipContent(message, options) {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    const body = document.createElement('div');
    body.style.cssText = VALIDATION_TOOLTIP_BODY_STYLE;
    body.textContent = message;
    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '6px solid transparent';
    arrow.style.borderRight = '6px solid transparent';
    arrow.style.left = `${options.arrowOffset}px`;
    if (options.isBelow) {
        arrow.style.bottom = '100%';
        arrow.style.borderBottom = '6px solid #dc3545';
        wrapper.appendChild(arrow);
        wrapper.appendChild(body);
    }
    else {
        arrow.style.top = '100%';
        arrow.style.borderTop = '6px solid #dc3545';
        wrapper.appendChild(body);
        wrapper.appendChild(arrow);
    }
    return wrapper;
}
/**
 * キーボードショートカットのヘルパー
 */
export function isKeyboardShortcut(event, shortcut) {
    const keys = shortcut.toLowerCase().split('+');
    const eventKey = event.key.toLowerCase();
    const hasCtrl = keys.includes('ctrl') && (event.ctrlKey || event.metaKey);
    const hasShift = keys.includes('shift') && event.shiftKey;
    const hasAlt = keys.includes('alt') && event.altKey;
    const mainKey = keys.find(key => !['ctrl', 'shift', 'alt'].includes(key));
    if (!mainKey)
        return false;
    return ((!keys.includes('ctrl') || hasCtrl) &&
        (!keys.includes('shift') || hasShift) &&
        (!keys.includes('alt') || hasAlt) &&
        eventKey === mainKey);
}
