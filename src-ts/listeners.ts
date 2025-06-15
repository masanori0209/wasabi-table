import type { CellPosition, ValidationError, ValidationResult, INinjaTable } from './types';
import { getCellReference } from './types';

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
export class NinjaTableListeners {
  private table: INinjaTable;
  private options: Required<ListenerOptions>;
  private uiElements: UIElements;
  private callbacks: EventCallbacks;
  private isComposing: boolean = false;
  private validationTimeout: number | null = null;

  constructor(
    table: INinjaTable,
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

    // Enter キー処理
    formulaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleFormulaEnter();
      }
    });

    // リアルタイム検証
    if (this.options.enableValidation) {
      formulaInput.addEventListener('input', () => {
        this.handleFormulaInput();
      });
    }
  }

  /**
   * IME（日本語入力）対応のリスナーを設定
   */
  private setupIMEListeners(): void {
    if (!this.options.enableIMESupport) return;

    document.addEventListener('compositionstart', () => {
      this.isComposing = true;
    });

    document.addEventListener('compositionend', () => {
      this.isComposing = false;
    });
  }

  /**
   * テーブルのイベントハンドラーを設定
   */
  private setupTableEventHandlers(): void {
    this.table.setEventHandlers({
      onCellSelect: (position: CellPosition) => {
        this.updateCellReference();
        this.updateStats();
        this.callbacks.onCellReferenceUpdate?.(
          getCellReference(position.row, position.col)
        );
      }
    });
  }

  /**
   * グローバルハンドラー関数を設定
   */
  private setupGlobalHandlers(): void {
    // グローバル関数として公開
    (window as any).handleTableClick = (x: number, y: number) => {
      // Canvas click handling logic would go here
      console.log('Table click:', x, y);
    };

    (window as any).handleTableWheel = (deltaX: number, deltaY: number) => {
      // Canvas wheel handling logic would go here
      console.log('Table wheel:', deltaX, deltaY);
    };

    (window as any).handleTableKey = (key: string) => {
      if (this.isComposing && (key === 'Enter' || key === 'Tab')) {
        return; // IME入力中はスキップ
      }
      // Key handling logic would go here
      console.log('Table key:', key);
    };

    (window as any).triggerRender = () => {
      this.table.render();
      this.updateCellReference();
    };
  }

  /**
   * フォーミュラバーのEnter処理
   */
  private handleFormulaEnter(): void {
    const selectedCell = this.table.getSelectedCell();
    if (!selectedCell) return;

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
    const selectedCell = this.table.getSelectedCell();
    if (!selectedCell) return;

          const cellRef = getCellReference(selectedCell.row, selectedCell.col);
    this.uiElements.cellReference.textContent = cellRef;

    const cellValue = this.table.getCellValue(selectedCell.row, selectedCell.col) || '';
    this.uiElements.formulaInput.value = cellValue;

    // 検証エラーチェック
    if (this.options.enableValidation) {
      try {
        const errorMessage = this.table.getSelectedCellValidationError();
        if (errorMessage) {
          console.log('Validation error for selected cell:', errorMessage);
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

    setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.focus();
      }
    }, 10);
  }

  /**
   * リスナーを破棄
   */
  public destroy(): void {
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }

    // グローバル関数をクリア
    delete (window as any).handleTableClick;
    delete (window as any).handleTableWheel;
    delete (window as any).handleTableKey;
    delete (window as any).triggerRender;
  }
} 