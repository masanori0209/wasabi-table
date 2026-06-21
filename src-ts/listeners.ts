import type {
  CellPosition,
  EventCallbacks,
  IWasabiTable,
  ListenerOptions,
  UIElements,
  ValidationError,
  ValidationResult,
} from './types';
import { getCellReference, getSelectionReference } from './types';

export type { EventCallbacks, ListenerOptions, UIElements } from './types';

/**
 * WasabiTableのリスナー管理クラス
 */
export class WasabiTableListeners {
  private static triggerRenderOwners: WasabiTableListeners[] = [];

  private table: IWasabiTable;
  private options: Required<ListenerOptions>;
  private uiElements: UIElements;
  private callbacks: EventCallbacks;
  private isComposing: boolean = false;
  private validationTimeout: number | null = null;
  private readonly abortController = new AbortController();
  private readonly triggerRenderHandler = (): void => {
    this.table.render();
    this.updateCellReference();
    this.updateStats();
  };

  constructor(
    table: IWasabiTable,
    uiElements: UIElements,
    options: ListenerOptions = {},
    callbacks: EventCallbacks = {}
  ) {
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

  private initialize(): void {
    this.setupFormulaBarListeners();
    this.setupIMEListeners();
    this.setupTableEventHandlers();
    this.setupGlobalHandlers();
  }

  /**
   * フォーミュラバーのイベントリスナーを設定
   */
  private setupFormulaBarListeners(): void {
    const { formulaInput } = this.uiElements;
    const { signal } = this.abortController;

    formulaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleFormulaEnter();
        return;
      }

      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
        !e.shiftKey &&
        !this.table.isEditing?.()
      ) {
        e.preventDefault();
        this.table.navigateSelectedCell?.(e.key);
        this.updateCellReference();
        this.table.focusCanvas?.();
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
  private setupIMEListeners(): void {
    if (!this.options.enableIMESupport) return;
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
  private setupTableEventHandlers(): void {
    this.table.setEventHandlers({
      onCellSelect: (position: CellPosition) => {
        this.updateCellReference();
        this.updateStats();
        // インライン編集中にキャンバスへフォーカスを奪うとキー操作が壊れる
        if (!this.table.isEditing?.()) {
          this.focusCanvas();
        }
        const reference = getSelectionReference(this.table.getSelectionInfo());
        this.callbacks.onCellReferenceUpdate?.(reference);
      },
      onNotification: (message, type) => {
        this.callbacks.onNotification?.(message, type);
      },
    });
  }

  /**
   * Rust側から呼ばれるグローバルコールバックを設定
   * WasabiTable が設定したクリック/ホイール/キーハンドラーは上書きしない
   */
  private setupGlobalHandlers(): void {
    WasabiTableListeners.triggerRenderOwners = WasabiTableListeners.triggerRenderOwners
      .filter((owner) => owner !== this);
    WasabiTableListeners.triggerRenderOwners.push(this);
    WasabiTableListeners.installLatestTriggerRenderOwner();
  }

  private static installLatestTriggerRenderOwner(): void {
    const win = window as Window & { triggerRender?: () => void };
    const owner = WasabiTableListeners.triggerRenderOwners[
      WasabiTableListeners.triggerRenderOwners.length - 1
    ];
    if (owner) {
      win.triggerRender = owner.triggerRenderHandler;
    } else {
      delete win.triggerRender;
    }
  }

  /**
   * フォーミュラバーのEnter処理
   */
  private handleFormulaEnter(): void {
    const selectedCell = this.table.getSelectedCell();
    if (!selectedCell) return;

    // インライン編集オーバーレイが残っている場合は先に確定する
    if (this.table.isEditing?.()) {
      this.table.finishEditing?.();
    }

    const value = this.uiElements.formulaInput.value;

    try {
      if (this.options.enableValidation) {
        const result = this.table.setCellValueWithValidation(
          selectedCell.row,
          selectedCell.col,
          value
        );

        if (result.isValid) {
          this.showValidationSuccess();
        } else {
          this.showValidationError(result.error!);
        }
      } else {
        this.table.setCellValue(selectedCell.row, selectedCell.col, value);
      }
    } catch (error) {
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
    this.table.focusCanvas?.();
  }

  /**
   * フォーミュラバーの入力処理（リアルタイム検証）
   */
  private handleFormulaInput(): void {
    if (!this.options.enableValidation) return;

    // デバウンス処理
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }

    this.validationTimeout = window.setTimeout(() => {
      const selectedCell = this.table.getSelectedCell();
      if (!selectedCell) return;

      const value = this.uiElements.formulaInput.value;

      try {
        const errors = this.table.validateCellValue(selectedCell.row, selectedCell.col, value);

        if (errors.length > 0 && value.trim() !== '') {
          this.setInputErrorStyle();
        } else {
          this.setInputNormalStyle();
        }
      } catch (error) {
        this.setInputNormalStyle();
      }
    }, this.options.validationDelay);
  }

  /**
   * セル参照を更新
   */
  private updateCellReference(): void {
    const selectionInfo = this.table.getSelectionInfo();
    if (!selectionInfo.hasSelection) return;

    const cellRef = getSelectionReference(selectionInfo);
    this.uiElements.cellReference.textContent = cellRef;

    const selectedCell = this.table.getSelectedCell();
    if (!selectedCell) return;

    const cellValue = this.table.getCellValue(selectedCell.row, selectedCell.col) || '';
    this.uiElements.formulaInput.value = cellValue;

    // 検証エラーチェック
    if (this.options.enableValidation) {
      try {
        const errorMessage = this.table.getSelectedCellValidationError();
        if (errorMessage) {
          this.showValidationError({ field_name: '', message: errorMessage, error_type: 'validation' });
        }
      } catch (error) {
        console.warn('Error checking validation:', error);
      }
    }
  }

  /**
   * 統計情報を更新
   */
  private updateStats(): void {
    if (!this.uiElements.statsElement) return;

    try {
      const stats = this.table.getStats();
      this.uiElements.statsElement.textContent = 
        `総セル数: ${stats.totalCells.toLocaleString()} | ` +
        `表示セル数: ${stats.visibleCells.toLocaleString()} | ` +
        `データセル数: ${stats.dataCells.toLocaleString()} | ` +
        `スクロール: (${Math.round(stats.scrollX)}, ${Math.round(stats.scrollY)})`;
      
      this.callbacks.onStatsUpdate?.(stats);
    } catch (error) {
      console.error('Stats error:', error);
      this.uiElements.statsElement.textContent = '統計情報の取得に失敗しました';
    }
  }

  /**
   * 検証エラーを表示
   */
  private showValidationError(error: ValidationError): void {
    if (!this.uiElements.validationError) return;

    this.uiElements.validationError.textContent = error.message;
    this.uiElements.validationError.style.display = 'block';
    
    if (this.uiElements.validationSuccess) {
      this.uiElements.validationSuccess.style.display = 'none';
    }

    this.callbacks.onValidationError?.(error);

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
  private showValidationSuccess(): void {
    if (!this.uiElements.validationSuccess) return;

    this.uiElements.validationSuccess.style.display = 'block';
    
    if (this.uiElements.validationError) {
      this.uiElements.validationError.style.display = 'none';
    }

    this.callbacks.onValidationSuccess?.();

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
  private setInputErrorStyle(): void {
    this.uiElements.formulaInput.style.borderColor = '#dc3545';
    this.uiElements.formulaInput.style.backgroundColor = '#fff5f5';
  }

  /**
   * 入力フィールドを通常スタイルに戻す
   */
  private setInputNormalStyle(): void {
    this.uiElements.formulaInput.style.borderColor = '#dee2e6';
    this.uiElements.formulaInput.style.backgroundColor = '#ffffff';
  }

  /**
   * キャンバスにフォーカスを設定
   */
  private focusCanvas(): void {
    if (!this.options.autoFocusCanvas) return;
    if (this.table.isEditing?.()) return;
    this.table.focusCanvas?.();
  }

  /**
   * セル参照・統計表示を手動更新（プログラムから値を変更した後など）
   */
  public refresh(): void {
    this.updateCellReference();
    this.updateStats();
  }

  /**
   * リスナーを破棄
   */
  public destroy(): void {
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
