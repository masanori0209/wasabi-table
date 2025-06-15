import type { ValidationError, INinjaTable } from './types';
/**
 * リスナー設定オプション
 */
export interface ListenerOptions {
    enableValidation?: boolean;
    enableIMESupport?: boolean;
    autoFocusCanvas?: boolean;
    validationDelay?: number;
    enableKeyboardShortcuts?: boolean;
}
/**
 * UI要素の設定
 */
export interface UIElements {
    cellReference: HTMLElement;
    formulaInput: HTMLInputElement;
    statsElement?: HTMLElement;
    validationError?: HTMLElement;
    validationSuccess?: HTMLElement;
}
/**
 * イベントコールバック
 */
export interface EventCallbacks {
    onStatsUpdate?: (stats: any) => void;
    onValidationError?: (error: ValidationError) => void;
    onValidationSuccess?: () => void;
    onCellReferenceUpdate?: (reference: string) => void;
}
/**
 * NinjaTableのリスナー管理クラス
 */
export declare class NinjaTableListeners {
    private table;
    private options;
    private uiElements;
    private callbacks;
    private isComposing;
    private validationTimeout;
    constructor(table: INinjaTable, uiElements: UIElements, options?: ListenerOptions, callbacks?: EventCallbacks);
    private initialize;
    /**
     * フォーミュラバーのイベントリスナーを設定
     */
    private setupFormulaBarListeners;
    /**
     * IME（日本語入力）対応のリスナーを設定
     */
    private setupIMEListeners;
    /**
     * テーブルのイベントハンドラーを設定
     */
    private setupTableEventHandlers;
    /**
     * グローバルハンドラー関数を設定
     */
    private setupGlobalHandlers;
    /**
     * フォーミュラバーのEnter処理
     */
    private handleFormulaEnter;
    /**
     * フォーミュラバーの入力処理（リアルタイム検証）
     */
    private handleFormulaInput;
    /**
     * セル参照を更新
     */
    private updateCellReference;
    /**
     * 統計情報を更新
     */
    private updateStats;
    /**
     * 検証エラーを表示
     */
    private showValidationError;
    /**
     * 検証成功を表示
     */
    private showValidationSuccess;
    /**
     * 入力フィールドにエラースタイルを適用
     */
    private setInputErrorStyle;
    /**
     * 入力フィールドを通常スタイルに戻す
     */
    private setInputNormalStyle;
    /**
     * キャンバスにフォーカスを設定
     */
    private focusCanvas;
    /**
     * リスナーを破棄
     */
    destroy(): void;
}
