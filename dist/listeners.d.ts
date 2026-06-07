import type { EventCallbacks, IWasabiTable, ListenerOptions, UIElements } from './types';
export type { EventCallbacks, ListenerOptions, UIElements } from './types';
/**
 * WasabiTableのリスナー管理クラス
 */
export declare class WasabiTableListeners {
    private table;
    private options;
    private uiElements;
    private callbacks;
    private isComposing;
    private validationTimeout;
    constructor(table: IWasabiTable, uiElements: UIElements, options?: ListenerOptions, callbacks?: EventCallbacks);
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
     * Rust側から呼ばれるグローバルコールバックを設定
     * WasabiTable が設定したクリック/ホイール/キーハンドラーは上書きしない
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
     * セル参照・統計表示を手動更新（プログラムから値を変更した後など）
     */
    refresh(): void;
    /**
     * リスナーを破棄
     */
    destroy(): void;
}
