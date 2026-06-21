import { getSelectionReference } from './types.js';
/**
 * WasabiTableのリスナー管理クラス
 */
export class WasabiTableListeners {
    constructor(table, uiElements, options = {}, callbacks = {}) {
        this.isComposing = false;
        this.validationTimeout = null;
        this.abortController = new AbortController();
        this.triggerRenderHandler = () => {
            this.table.render();
            this.updateCellReference();
            this.updateStats();
        };
        this.table = table;
        this.uiElements = uiElements;
        this.callbacks = callbacks;
        // デフォルトオプション
        this.options = {
            enableValidation: true,
            enableIMESupport: true,
            autoFocusCanvas: true,
            validationDelay: 300,
            enableKeyboardShortcuts: true,
            ...options
        };
        if (this.table.setKeyboardShortcutsEnabled) {
            this.table.setKeyboardShortcutsEnabled(this.options.enableKeyboardShortcuts);
        }
        this.initialize();
    }
    initialize() {
        this.setupFormulaBarListeners();
        this.setupIMEListeners();
        this.setupTableEventHandlers();
        this.setupGlobalHandlers();
    }
    /**
     * フォーミュラバーのイベントリスナーを設定
     */
    setupFormulaBarListeners() {
        const { formulaInput } = this.uiElements;
        const { signal } = this.abortController;
        formulaInput.addEventListener('keydown', (e) => {
            var _a, _b, _c, _d, _e, _f;
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleFormulaEnter();
                return;
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
                !e.shiftKey &&
                !((_b = (_a = this.table).isEditing) === null || _b === void 0 ? void 0 : _b.call(_a))) {
                e.preventDefault();
                (_d = (_c = this.table).navigateSelectedCell) === null || _d === void 0 ? void 0 : _d.call(_c, e.key);
                this.updateCellReference();
                (_f = (_e = this.table).focusCanvas) === null || _f === void 0 ? void 0 : _f.call(_e);
            }
        }, { signal });
        // リアルタイム検証
        if (this.options.enableValidation) {
            formulaInput.addEventListener('input', () => {
                this.handleFormulaInput();
            }, { signal });
        }
    }
    /**
     * IME（日本語入力）対応のリスナーを設定
     */
    setupIMEListeners() {
        if (!this.options.enableIMESupport)
            return;
        const { signal } = this.abortController;
        document.addEventListener('compositionstart', () => {
            this.isComposing = true;
        }, { signal });
        document.addEventListener('compositionend', () => {
            this.isComposing = false;
        }, { signal });
    }
    /**
     * テーブルのイベントハンドラーを設定
     */
    setupTableEventHandlers() {
        this.table.setEventHandlers({
            onCellSelect: (position) => {
                var _a, _b, _c, _d;
                this.updateCellReference();
                this.updateStats();
                // インライン編集中にキャンバスへフォーカスを奪うとキー操作が壊れる
                if (!((_b = (_a = this.table).isEditing) === null || _b === void 0 ? void 0 : _b.call(_a))) {
                    this.focusCanvas();
                }
                const reference = getSelectionReference(this.table.getSelectionInfo());
                (_d = (_c = this.callbacks).onCellReferenceUpdate) === null || _d === void 0 ? void 0 : _d.call(_c, reference);
            },
            onNotification: (message, type) => {
                var _a, _b;
                (_b = (_a = this.callbacks).onNotification) === null || _b === void 0 ? void 0 : _b.call(_a, message, type);
            },
        });
    }
    /**
     * Rust側から呼ばれるグローバルコールバックを設定
     * WasabiTable が設定したクリック/ホイール/キーハンドラーは上書きしない
     */
    setupGlobalHandlers() {
        WasabiTableListeners.triggerRenderOwners = WasabiTableListeners.triggerRenderOwners
            .filter((owner) => owner !== this);
        WasabiTableListeners.triggerRenderOwners.push(this);
        WasabiTableListeners.installLatestTriggerRenderOwner();
    }
    static installLatestTriggerRenderOwner() {
        const win = window;
        const owner = WasabiTableListeners.triggerRenderOwners[WasabiTableListeners.triggerRenderOwners.length - 1];
        if (owner) {
            win.triggerRender = owner.triggerRenderHandler;
        }
        else {
            delete win.triggerRender;
        }
    }
    /**
     * フォーミュラバーのEnter処理
     */
    handleFormulaEnter() {
        var _a, _b, _c, _d, _e, _f;
        const selectedCell = this.table.getSelectedCell();
        if (!selectedCell)
            return;
        // インライン編集オーバーレイが残っている場合は先に確定する
        if ((_b = (_a = this.table).isEditing) === null || _b === void 0 ? void 0 : _b.call(_a)) {
            (_d = (_c = this.table).finishEditing) === null || _d === void 0 ? void 0 : _d.call(_c);
        }
        const value = this.uiElements.formulaInput.value;
        try {
            if (this.options.enableValidation) {
                const result = this.table.setCellValueWithValidation(selectedCell.row, selectedCell.col, value);
                if (result.isValid) {
                    this.showValidationSuccess();
                }
                else {
                    this.showValidationError(result.error);
                }
            }
            else {
                this.table.setCellValue(selectedCell.row, selectedCell.col, value);
            }
        }
        catch (error) {
            console.warn('Validation failed, using normal cell set:', error);
            this.table.setCellValue(selectedCell.row, selectedCell.col, value);
        }
        this.table.render();
        this.updateStats();
        // 下のセルに移動
        const config = this.table.getConfig();
        if (selectedCell.row < config.row_count - 1) {
            this.table.selectCell(selectedCell.row + 1, selectedCell.col);
            this.table.render();
            this.updateCellReference();
        }
        (_f = (_e = this.table).focusCanvas) === null || _f === void 0 ? void 0 : _f.call(_e);
    }
    /**
     * フォーミュラバーの入力処理（リアルタイム検証）
     */
    handleFormulaInput() {
        if (!this.options.enableValidation)
            return;
        // デバウンス処理
        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
        }
        this.validationTimeout = window.setTimeout(() => {
            const selectedCell = this.table.getSelectedCell();
            if (!selectedCell)
                return;
            const value = this.uiElements.formulaInput.value;
            try {
                const errors = this.table.validateCellValue(selectedCell.row, selectedCell.col, value);
                if (errors.length > 0 && value.trim() !== '') {
                    this.setInputErrorStyle();
                }
                else {
                    this.setInputNormalStyle();
                }
            }
            catch (error) {
                this.setInputNormalStyle();
            }
        }, this.options.validationDelay);
    }
    /**
     * セル参照を更新
     */
    updateCellReference() {
        const selectionInfo = this.table.getSelectionInfo();
        if (!selectionInfo.hasSelection)
            return;
        const cellRef = getSelectionReference(selectionInfo);
        this.uiElements.cellReference.textContent = cellRef;
        const selectedCell = this.table.getSelectedCell();
        if (!selectedCell)
            return;
        const cellValue = this.table.getCellValue(selectedCell.row, selectedCell.col) || '';
        this.uiElements.formulaInput.value = cellValue;
        // 検証エラーチェック
        if (this.options.enableValidation) {
            try {
                const errorMessage = this.table.getSelectedCellValidationError();
                if (errorMessage) {
                    this.showValidationError({ field_name: '', message: errorMessage, error_type: 'validation' });
                }
            }
            catch (error) {
                console.warn('Error checking validation:', error);
            }
        }
    }
    /**
     * 統計情報を更新
     */
    updateStats() {
        var _a, _b;
        if (!this.uiElements.statsElement)
            return;
        try {
            const stats = this.table.getStats();
            this.uiElements.statsElement.textContent =
                `総セル数: ${stats.totalCells.toLocaleString()} | ` +
                    `表示セル数: ${stats.visibleCells.toLocaleString()} | ` +
                    `データセル数: ${stats.dataCells.toLocaleString()} | ` +
                    `スクロール: (${Math.round(stats.scrollX)}, ${Math.round(stats.scrollY)})`;
            (_b = (_a = this.callbacks).onStatsUpdate) === null || _b === void 0 ? void 0 : _b.call(_a, stats);
        }
        catch (error) {
            console.error('Stats error:', error);
            this.uiElements.statsElement.textContent = '統計情報の取得に失敗しました';
        }
    }
    /**
     * 検証エラーを表示
     */
    showValidationError(error) {
        var _a, _b;
        if (!this.uiElements.validationError)
            return;
        this.uiElements.validationError.textContent = error.message;
        this.uiElements.validationError.style.display = 'block';
        if (this.uiElements.validationSuccess) {
            this.uiElements.validationSuccess.style.display = 'none';
        }
        (_b = (_a = this.callbacks).onValidationError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
        // 3秒後に自動で非表示
        setTimeout(() => {
            if (this.uiElements.validationError) {
                this.uiElements.validationError.style.display = 'none';
            }
        }, 3000);
    }
    /**
     * 検証成功を表示
     */
    showValidationSuccess() {
        var _a, _b;
        if (!this.uiElements.validationSuccess)
            return;
        this.uiElements.validationSuccess.style.display = 'block';
        if (this.uiElements.validationError) {
            this.uiElements.validationError.style.display = 'none';
        }
        (_b = (_a = this.callbacks).onValidationSuccess) === null || _b === void 0 ? void 0 : _b.call(_a);
        // 2秒後に自動で非表示
        setTimeout(() => {
            if (this.uiElements.validationSuccess) {
                this.uiElements.validationSuccess.style.display = 'none';
            }
        }, 2000);
    }
    /**
     * 入力フィールドにエラースタイルを適用
     */
    setInputErrorStyle() {
        this.uiElements.formulaInput.style.borderColor = '#dc3545';
        this.uiElements.formulaInput.style.backgroundColor = '#fff5f5';
    }
    /**
     * 入力フィールドを通常スタイルに戻す
     */
    setInputNormalStyle() {
        this.uiElements.formulaInput.style.borderColor = '#dee2e6';
        this.uiElements.formulaInput.style.backgroundColor = '#ffffff';
    }
    /**
     * キャンバスにフォーカスを設定
     */
    focusCanvas() {
        var _a, _b, _c, _d;
        if (!this.options.autoFocusCanvas)
            return;
        if ((_b = (_a = this.table).isEditing) === null || _b === void 0 ? void 0 : _b.call(_a))
            return;
        (_d = (_c = this.table).focusCanvas) === null || _d === void 0 ? void 0 : _d.call(_c);
    }
    /**
     * セル参照・統計表示を手動更新（プログラムから値を変更した後など）
     */
    refresh() {
        this.updateCellReference();
        this.updateStats();
    }
    /**
     * リスナーを破棄
     */
    destroy() {
        this.abortController.abort();
        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
            this.validationTimeout = null;
        }
        WasabiTableListeners.triggerRenderOwners = WasabiTableListeners.triggerRenderOwners
            .filter((owner) => owner !== this);
        WasabiTableListeners.installLatestTriggerRenderOwner();
        this.table.setEventHandlers({
            onCellSelect: undefined,
            onNotification: undefined,
        });
    }
}
WasabiTableListeners.triggerRenderOwners = [];
