import type { UIElements } from './listeners';
import type { INinjaTable } from './types';
/**
 * DOM要素を自動的に取得してUIElementsオブジェクトを作成
 */
export declare function createUIElements(config: {
    cellReferenceSelector: string;
    formulaInputSelector: string;
    statsElementSelector?: string;
    validationErrorSelector?: string;
    validationSuccessSelector?: string;
}): UIElements;
/**
 * CSV出力ユーティリティ
 */
export declare function exportTableToCSV(table: INinjaTable, filename?: string): void;
/**
 * テーブルをクリアするユーティリティ
 */
export declare function clearTable(table: INinjaTable): void;
/**
 * サンプルデータを読み込むユーティリティ
 */
export declare function loadSampleData(table: INinjaTable, data: string[][]): void;
/**
 * デバウンス関数
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * A1形式の参照文字列を行列インデックスに変換
 */
export declare function parseCellReference(reference: string): {
    row: number;
    col: number;
} | null;
/**
 * キーボードショートカットのヘルパー
 */
export declare function isKeyboardShortcut(event: KeyboardEvent, shortcut: string): boolean;
