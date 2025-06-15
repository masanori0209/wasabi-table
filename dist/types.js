/**
 * 共通の型定義とユーティリティ関数
 */
export var FieldType;
(function (FieldType) {
    FieldType["CharField"] = "CharField";
    FieldType["EmailField"] = "EmailField";
    FieldType["TextareaField"] = "TextareaField";
    FieldType["IntegerField"] = "IntegerField";
    FieldType["DecimalField"] = "DecimalField";
    FieldType["DecimalWithNullField"] = "DecimalWithNullField";
    FieldType["DateField"] = "DateField";
    FieldType["TimeField"] = "TimeField";
    FieldType["CheckField"] = "CheckField";
    FieldType["BooleanField"] = "BooleanField";
    FieldType["ButtonField"] = "ButtonField";
    FieldType["MenuField"] = "MenuField";
})(FieldType || (FieldType = {}));
/**
 * 列名を生成（A, B, C, ..., Z, AA, AB, ...）
 */
export function getColumnName(col) {
    let result = '';
    let n = col;
    while (true) {
        result = String.fromCharCode(65 + (n % 26)) + result;
        if (n < 26) {
            break;
        }
        n = Math.floor(n / 26) - 1;
    }
    return result;
}
/**
 * セル参照文字列を生成（例: A1, B2, AA10）
 */
export function getCellReference(row, col) {
    return `${getColumnName(col)}${row + 1}`;
}
