import type { IWasabiTable, UIElements } from './types';
/**
 * IME変換中に発生したキーイベントかを判定する。
 * keyCode 229 は isComposing が変換確定キーで false になるブラウザ向けのフォールバック。
 */
export declare function isImeCompositionKey(event: Pick<KeyboardEvent, 'isComposing' | 'keyCode'>, compositionActive?: boolean): boolean;
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
export declare function exportTableToCSV(table: IWasabiTable, filename?: string): void;
/**
 * テーブルをクリアするユーティリティ
 */
export declare function clearTable(table: IWasabiTable): void;
/**
 * サンプルデータを読み込むユーティリティ（既存セルは上書きのみ — 事前に clearTable を推奨）
 */
export declare function loadSampleData(table: IWasabiTable, data: string[][]): void;
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
 * 検証エラーツールチップの DOM を安全に構築（message は textContent で挿入）
 */
export declare function buildValidationTooltipContent(message: string, options: {
    isBelow: boolean;
    arrowOffset: number;
}): HTMLDivElement;
/**
 * キーボードショートカットのヘルパー
 */
export declare function isKeyboardShortcut(event: KeyboardEvent, shortcut: string): boolean;
