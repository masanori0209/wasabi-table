import {
  ColumnHeader,
  FieldType,
  FilterCondition,
  FilterOperator,
  SortCondition,
} from './types';

const HEADER_DIALOG_STYLE_ID = 'wasabi-header-dialog-styles';

function ensureHeaderDialogStyles(): void {
  if (document.getElementById(HEADER_DIALOG_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = HEADER_DIALOG_STYLE_ID;
  style.textContent = `
    .wasabi-header-dialog,
    .wasabi-filter-dialog {
      background: #ffffff;
      border: 1px solid #c8e6c9;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(45, 90, 61, 0.18);
      padding: 16px;
      min-width: 280px;
      max-width: 360px;
      color: #2d4a2d;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    body.theme-dark .wasabi-header-dialog,
    body.theme-dark .wasabi-filter-dialog {
      background: #2d3748;
      border-color: #4a5568;
      color: #e2e8f0;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    .wasabi-header-dialog__title {
      font-weight: 700;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e8f5e8;
      font-size: 14px;
    }
    body.theme-dark .wasabi-header-dialog__title {
      border-bottom-color: #4a5568;
    }
    .wasabi-header-dialog__tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    body.theme-dark .wasabi-header-dialog__tabs {
      border-bottom-color: #4a5568;
    }
    .wasabi-header-dialog__tab {
      padding: 8px 14px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      color: inherit;
      font-size: 13px;
    }
    .wasabi-header-dialog__tab--active {
      border-bottom-color: #4a7c59;
      color: #2d5a3d;
      font-weight: 600;
    }
    body.theme-dark .wasabi-header-dialog__tab--active {
      border-bottom-color: #7fb069;
      color: #c8e6c9;
    }
    .wasabi-header-dialog__status {
      margin-bottom: 12px;
      padding: 8px 10px;
      border-radius: 8px;
      background: #f8fdf8;
      font-size: 13px;
    }
    body.theme-dark .wasabi-header-dialog__status {
      background: #1a202c;
    }
    .wasabi-header-dialog__status--active {
      background: #e8f5e9;
      color: #2e7d32;
    }
    body.theme-dark .wasabi-header-dialog__status--active {
      background: #22543d;
      color: #c6f6d5;
    }
    .wasabi-header-dialog__actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    .wasabi-header-dialog__btn {
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }
    .wasabi-header-dialog__btn--primary {
      background: linear-gradient(135deg, #4a7c59 0%, #2d5a3d 100%);
      color: #fff;
    }
    .wasabi-header-dialog__btn--secondary {
      background: #edf2f7;
      color: #2d3748;
      border: 1px solid #cbd5e0;
    }
    .wasabi-header-dialog__btn--muted {
      background: #6c757d;
      color: #fff;
    }
    body.theme-dark .wasabi-header-dialog__btn--secondary {
      background: #4a5568;
      color: #e2e8f0;
      border-color: #718096;
    }
    .wasabi-header-dialog__field,
    .wasabi-filter-dialog select,
    .wasabi-filter-dialog input[type="text"],
    .wasabi-filter-dialog input[type="number"] {
      width: 100%;
      padding: 8px 10px;
      margin-bottom: 8px;
      border: 1px solid #c8e6c9;
      border-radius: 8px;
      font-size: 13px;
      box-sizing: border-box;
    }
    body.theme-dark .wasabi-header-dialog__field,
    body.theme-dark .wasabi-filter-dialog select,
    body.theme-dark .wasabi-filter-dialog input[type="text"],
    body.theme-dark .wasabi-filter-dialog input[type="number"] {
      background: #1a202c;
      border-color: #4a5568;
      color: #e2e8f0;
    }
    .wasabi-header-dialog__sort-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .wasabi-header-dialog__sort-btn {
      padding: 10px;
      border: 1px solid #4a7c59;
      border-radius: 8px;
      background: #fff;
      color: #2d5a3d;
      cursor: pointer;
      font-size: 13px;
    }
    .wasabi-header-dialog__sort-btn--active {
      background: #4a7c59;
      color: #fff;
    }
    body.theme-dark .wasabi-header-dialog__sort-btn {
      background: #2d3748;
      color: #c8e6c9;
    }
  `;
  document.head.appendChild(style);
}

export interface HeaderDialogHost {
  getColumnHeaders(): ColumnHeader[];
  getHeaderPosition(columnIndex: number): { x: number; y: number; width: number; height: number };
  getFilterSortState(): {
    filterConditions: FilterCondition[];
    sortCondition: SortCondition | null;
    isFiltered: boolean;
  };
  addFilterCondition(condition: FilterCondition): void;
  removeFilterCondition(columnIndex: number): void;
  setSortCondition(condition: SortCondition | null): void;
}

export class HeaderDialogController {
  private filterDialogs: Map<number, HTMLElement> = new Map();
  private handleOutsideClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const isInsideDialog = target.closest('.wasabi-filter-dialog, .wasabi-header-dialog');
    const isHeaderClick = target.closest('.wasabi-header-filter-btn');
    if (!isInsideDialog && !isHeaderClick) {
      this.hideAll();
    }
  };

  constructor(private host: HeaderDialogHost) {
    ensureHeaderDialogStyles();
  }

  show(columnIndex: number): void {
    // 既存のダイアログを閉じる
    this.hideAll();

    const headers = this.host.getColumnHeaders();
    if (columnIndex >= headers.length) return;

    const header = headers[columnIndex];
    const dialog = this.createHeaderDialog(columnIndex, header);
    
    // ヘッダーの位置を取得してダイアログを配置
    const headerPosition = this.host.getHeaderPosition(columnIndex);
    dialog.style.position = 'fixed';
    dialog.style.left = `${headerPosition.x}px`;
    dialog.style.top = `${headerPosition.y + headerPosition.height}px`;
    dialog.style.zIndex = '10000';

    document.body.appendChild(dialog);
    this.filterDialogs.set(columnIndex, dialog);

    // 外側クリックで閉じる
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 100);
  }

  /**
   * フィルターダイアログを表示（後方互換性のため）
   */
  showFilterDialog(columnIndex: number): void {
    this.show(columnIndex);
  }

  /**
   * 統合ヘッダーダイアログを作成
   */
  createHeaderDialog(columnIndex: number, header: ColumnHeader): HTMLElement {
    const dialog = document.createElement('div');
    dialog.className = 'wasabi-header-dialog';

    const title = document.createElement('div');
    title.className = 'wasabi-header-dialog__title';
    title.textContent = `列操作: ${header.display_name}`;
    dialog.appendChild(title);

    const tabContainer = document.createElement('div');
    tabContainer.className = 'wasabi-header-dialog__tabs';

    const sortTab = document.createElement('button');
    sortTab.textContent = 'ソート';
    sortTab.className = 'wasabi-header-dialog__tab wasabi-header-dialog__tab--active';

    const filterTab = document.createElement('button');
    filterTab.textContent = 'フィルター';
    filterTab.className = 'wasabi-header-dialog__tab';

    tabContainer.appendChild(sortTab);
    tabContainer.appendChild(filterTab);
    dialog.appendChild(tabContainer);

    // コンテンツエリア
    const contentArea = document.createElement('div');
    contentArea.className = 'header-dialog-content';
    dialog.appendChild(contentArea);

    // ソートコンテンツを初期表示
    this.createSortContent(contentArea, columnIndex, header);

    // タブ切り替えイベント
    sortTab.addEventListener('click', () => {
      this.switchTab(sortTab, filterTab, contentArea, columnIndex, header, 'sort');
    });

    filterTab.addEventListener('click', () => {
      this.switchTab(filterTab, sortTab, contentArea, columnIndex, header, 'filter');
    });

    return dialog;
  }

  /**
   * フィルターダイアログを作成（後方互換性のため）
   */
  createFilterDialog(columnIndex: number, header: ColumnHeader): HTMLElement {
    const dialog = document.createElement('div');
    dialog.className = 'wasabi-filter-dialog';
    dialog.style.cssText = `
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 16px;
      min-width: 250px;
      max-width: 350px;
    `;

    // タイトル
    const title = document.createElement('div');
    title.textContent = `フィルター: ${header.display_name}`;
    title.style.cssText = `
      font-weight: bold;
      margin-bottom: 12px;
      color: #333;
    `;
    dialog.appendChild(title);

    // 既存のフィルター条件を取得
    const existingCondition = this.host.getFilterSortState().filterConditions.find(c => c.columnIndex === columnIndex);

    // フィールドタイプに応じたフィルターUIを作成
    if (header.field_type === FieldType.MenuField && header.menu_config) {
      this.createMenuFieldFilter(dialog, columnIndex, header, existingCondition);
    } else if (header.field_type === FieldType.IntegerField || header.field_type === FieldType.DecimalField) {
      this.createNumericFieldFilter(dialog, columnIndex, header, existingCondition);
    } else {
      this.createTextFieldFilter(dialog, columnIndex, header, existingCondition);
    }

    // ボタン
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 16px;
      justify-content: flex-end;
    `;

    const applyBtn = document.createElement('button');
    applyBtn.textContent = '適用';
    applyBtn.style.cssText = `
      background: #007bff;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    `;

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'クリア';
    clearBtn.style.cssText = `
      background: #6c757d;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.style.cssText = `
      background: #f8f9fa;
      color: #333;
      border: 1px solid #ccc;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    `;

    applyBtn.addEventListener('click', () => {
      this.applyFilterFromDialog(dialog, columnIndex, header.field_type as FieldType);
    });

    clearBtn.addEventListener('click', () => {
      this.host.removeFilterCondition(columnIndex);
      this.hide(columnIndex);
    });

    cancelBtn.addEventListener('click', () => {
      this.hide(columnIndex);
    });

    buttonContainer.appendChild(applyBtn);
    buttonContainer.appendChild(clearBtn);
    buttonContainer.appendChild(cancelBtn);
    dialog.appendChild(buttonContainer);

    return dialog;
  }

  /**
   * MenuFieldのフィルターUI作成
   */
  createMenuFieldFilter(dialog: HTMLElement, columnIndex: number, header: ColumnHeader, existingCondition?: FilterCondition): void {
    const container = document.createElement('div');
    
    // 選択肢を取得
    const options = header.menu_config?.options || [];
    const menuOptions = options.map(opt => 
      typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    // チェックボックスリスト
    const checkboxContainer = document.createElement('div');
    checkboxContainer.style.cssText = `
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px;
    `;

    menuOptions.forEach(option => {
      const label = document.createElement('label');
      label.style.cssText = `
        display: block;
        margin-bottom: 4px;
        cursor: pointer;
      `;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = option.value;
      checkbox.style.marginRight = '8px';

      // 既存条件があれば選択状態を復元
      if (existingCondition && existingCondition.value.includes(option.value)) {
        checkbox.checked = true;
      }

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(option.label));
      checkboxContainer.appendChild(label);
    });

    container.appendChild(checkboxContainer);
    dialog.appendChild(container);
  }

  /**
   * 数値フィールドのフィルターUI作成
   */
  createNumericFieldFilter(dialog: HTMLElement, columnIndex: number, header: ColumnHeader, existingCondition?: FilterCondition): void {
    const container = document.createElement('div');

    // 演算子選択
    const operatorSelect = document.createElement('select');
    operatorSelect.style.cssText = `
      width: 100%;
      padding: 6px;
      margin-bottom: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    `;

    const numericOperators = [
      { value: FilterOperator.Equals, label: '等しい (=)' },
      { value: FilterOperator.NotEquals, label: '等しくない (≠)' },
      { value: FilterOperator.GreaterThan, label: 'より大きい (>)' },
      { value: FilterOperator.GreaterThanOrEqual, label: '以上 (≥)' },
      { value: FilterOperator.LessThan, label: 'より小さい (<)' },
      { value: FilterOperator.LessThanOrEqual, label: '以下 (≤)' },
      { value: FilterOperator.IsEmpty, label: '空' },
      { value: FilterOperator.IsNotEmpty, label: '空でない' }
    ];

    numericOperators.forEach(op => {
      const option = document.createElement('option');
      option.value = op.value;
      option.textContent = op.label;
      if (existingCondition && existingCondition.operator === op.value) {
        option.selected = true;
      }
      operatorSelect.appendChild(option);
    });

    // 値入力
    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.placeholder = '値を入力';
    valueInput.style.cssText = `
      width: 100%;
      padding: 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
    `;

    if (existingCondition) {
      valueInput.value = existingCondition.value;
    }

    // 空・空でない の場合は値入力を無効化
    operatorSelect.addEventListener('change', () => {
      const needsValue = ![FilterOperator.IsEmpty, FilterOperator.IsNotEmpty].includes(operatorSelect.value as FilterOperator);
      valueInput.disabled = !needsValue;
      valueInput.style.opacity = needsValue ? '1' : '0.5';
    });

    container.appendChild(operatorSelect);
    container.appendChild(valueInput);
    dialog.appendChild(container);

    // 初期状態の設定
    operatorSelect.dispatchEvent(new Event('change'));
  }

  /**
   * テキストフィールドのフィルターUI作成
   */
  createTextFieldFilter(dialog: HTMLElement, columnIndex: number, header: ColumnHeader, existingCondition?: FilterCondition): void {
    const container = document.createElement('div');

    // 演算子選択
    const operatorSelect = document.createElement('select');
    operatorSelect.style.cssText = `
      width: 100%;
      padding: 6px;
      margin-bottom: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    `;

    const textOperators = [
      { value: FilterOperator.Contains, label: '含む' },
      { value: FilterOperator.StartsWith, label: '～で始まる' },
      { value: FilterOperator.EndsWith, label: '～で終わる' },
      { value: FilterOperator.Equals, label: '等しい' },
      { value: FilterOperator.NotEquals, label: '等しくない' },
      { value: FilterOperator.IsEmpty, label: '空' },
      { value: FilterOperator.IsNotEmpty, label: '空でない' }
    ];

    textOperators.forEach(op => {
      const option = document.createElement('option');
      option.value = op.value;
      option.textContent = op.label;
      if (existingCondition && existingCondition.operator === op.value) {
        option.selected = true;
      }
      operatorSelect.appendChild(option);
    });

    // 値入力
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.placeholder = '検索文字列を入力';
    valueInput.style.cssText = `
      width: 100%;
      padding: 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
    `;

    if (existingCondition) {
      valueInput.value = existingCondition.value;
    }

    // 空・空でない の場合は値入力を無効化
    operatorSelect.addEventListener('change', () => {
      const needsValue = ![FilterOperator.IsEmpty, FilterOperator.IsNotEmpty].includes(operatorSelect.value as FilterOperator);
      valueInput.disabled = !needsValue;
      valueInput.style.opacity = needsValue ? '1' : '0.5';
    });

    container.appendChild(operatorSelect);
    container.appendChild(valueInput);
    dialog.appendChild(container);

    // 初期状態の設定
    operatorSelect.dispatchEvent(new Event('change'));
  }

  /**
   * フィルターダイアログから条件を適用
   */
  applyFilterFromDialog(dialog: HTMLElement, columnIndex: number, fieldType: FieldType): void {
    if (fieldType === FieldType.MenuField) {
      // MenuFieldの場合：選択されたチェックボックスの値を取得
      const checkboxes = dialog.querySelectorAll('input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
      const selectedValues = Array.from(checkboxes).map(cb => cb.value);
      
      if (selectedValues.length > 0) {
        const condition: FilterCondition = {
          columnIndex,
          fieldType,
          operator: FilterOperator.Equals,
          value: selectedValues.join('|'), // 複数値は|で区切る
          isActive: true
        };
        this.host.addFilterCondition(condition);
      }
    } else {
      // その他のフィールド：演算子と値を取得
      const operatorSelect = dialog.querySelector('select') as HTMLSelectElement;
      const valueInput = dialog.querySelector('input[type="text"], input[type="number"]') as HTMLInputElement;
      
      const operator = operatorSelect.value as FilterOperator;
      const value = valueInput?.value || '';
      
      // 空・空でない以外で値が空の場合はスキップ
      if (![FilterOperator.IsEmpty, FilterOperator.IsNotEmpty].includes(operator) && !value.trim()) {
        return;
      }
      
      const condition: FilterCondition = {
        columnIndex,
        fieldType,
        operator,
        value,
        isActive: true
      };
      this.host.addFilterCondition(condition);
    }
    
    this.hide(columnIndex);
  }

  hide(columnIndex: number): void {
    const dialog = this.filterDialogs.get(columnIndex);
    if (dialog && dialog.parentNode) {
      dialog.parentNode.removeChild(dialog);
      this.filterDialogs.delete(columnIndex);
    }
  }

  switchTab(activeTab: HTMLElement, inactiveTab: HTMLElement, contentArea: HTMLElement, columnIndex: number, header: ColumnHeader, tabType: 'sort' | 'filter'): void {
    activeTab.classList.add('wasabi-header-dialog__tab--active');
    inactiveTab.classList.remove('wasabi-header-dialog__tab--active');

    // コンテンツを更新
    contentArea.innerHTML = '';
    if (tabType === 'sort') {
      this.createSortContent(contentArea, columnIndex, header);
    } else {
      this.createFilterContent(contentArea, columnIndex, header);
    }
  }

  /**
   * ソートコンテンツを作成
   */
  createSortContent(container: HTMLElement, columnIndex: number, header: ColumnHeader): void {
    const currentSort = this.host.getFilterSortState().sortCondition;
    const isCurrentColumn = currentSort && currentSort.columnIndex === columnIndex;

    // ソート状態表示
    const statusDiv = document.createElement('div');
    statusDiv.className = 'wasabi-header-dialog__status';
    if (isCurrentColumn) {
      statusDiv.classList.add('wasabi-header-dialog__status--active');
      statusDiv.textContent = `現在のソート: ${currentSort.direction === 'asc' ? '昇順' : '降順'}`;
    } else {
      statusDiv.textContent = 'ソートなし';
    }
    container.appendChild(statusDiv);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'wasabi-header-dialog__sort-list';

    const ascBtn = document.createElement('button');
    ascBtn.textContent = '昇順でソート';
    ascBtn.className = 'wasabi-header-dialog__sort-btn';
    if (isCurrentColumn && currentSort.direction === 'asc') {
      ascBtn.classList.add('wasabi-header-dialog__sort-btn--active');
    }

    const descBtn = document.createElement('button');
    descBtn.textContent = '降順でソート';
    descBtn.className = 'wasabi-header-dialog__sort-btn';
    if (isCurrentColumn && currentSort.direction === 'desc') {
      descBtn.classList.add('wasabi-header-dialog__sort-btn--active');
    }

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'ソートをクリア';
    clearBtn.className = 'wasabi-header-dialog__btn wasabi-header-dialog__btn--secondary';

    // イベントリスナー
    ascBtn.addEventListener('click', () => {
      this.host.setSortCondition({
        columnIndex,
        fieldType: header.field_type as FieldType,
        direction: 'asc'
      });
      this.hideAll();
    });

    descBtn.addEventListener('click', () => {
      this.host.setSortCondition({
        columnIndex,
        fieldType: header.field_type as FieldType,
        direction: 'desc'
      });
      this.hideAll();
    });

    clearBtn.addEventListener('click', () => {
      this.host.setSortCondition(null);
      this.hideAll();
    });

    buttonContainer.appendChild(ascBtn);
    buttonContainer.appendChild(descBtn);
    buttonContainer.appendChild(clearBtn);
    container.appendChild(buttonContainer);
  }

  /**
   * フィルターコンテンツを作成
   */
  createFilterContent(container: HTMLElement, columnIndex: number, header: ColumnHeader): void {
    // 既存のフィルター条件を取得
    const existingCondition = this.host.getFilterSortState().filterConditions.find(c => c.columnIndex === columnIndex);

    // フィルター状態表示
    const statusDiv = document.createElement('div');
    statusDiv.className = 'wasabi-header-dialog__status';
    if (existingCondition && existingCondition.isActive) {
      statusDiv.classList.add('wasabi-header-dialog__status--active');
      statusDiv.textContent = `フィルター適用中: ${existingCondition.operator} "${existingCondition.value}"`;
    } else {
      statusDiv.textContent = 'フィルターなし';
    }
    container.appendChild(statusDiv);

    // フィールドタイプに応じたフィルターUIを作成
    if (header.field_type === FieldType.MenuField && header.menu_config) {
      this.createMenuFieldFilter(container, columnIndex, header, existingCondition);
    } else if (header.field_type === FieldType.IntegerField || header.field_type === FieldType.DecimalField) {
      this.createNumericFieldFilter(container, columnIndex, header, existingCondition);
    } else {
      this.createTextFieldFilter(container, columnIndex, header, existingCondition);
    }

    // ボタン
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'wasabi-header-dialog__actions';

    const applyBtn = document.createElement('button');
    applyBtn.textContent = '適用';
    applyBtn.className = 'wasabi-header-dialog__btn wasabi-header-dialog__btn--primary';

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'クリア';
    clearBtn.className = 'wasabi-header-dialog__btn wasabi-header-dialog__btn--muted';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.className = 'wasabi-header-dialog__btn wasabi-header-dialog__btn--secondary';

    applyBtn.addEventListener('click', () => {
      this.applyFilterFromDialog(container, columnIndex, header.field_type as FieldType);
    });

    clearBtn.addEventListener('click', () => {
      this.host.removeFilterCondition(columnIndex);
      this.hideAll();
    });

    cancelBtn.addEventListener('click', () => {
      this.hideAll();
    });

    buttonContainer.appendChild(applyBtn);
    buttonContainer.appendChild(clearBtn);
    buttonContainer.appendChild(cancelBtn);
    container.appendChild(buttonContainer);
  }
  hideAll(): void {
    this.filterDialogs.forEach((dialog) => {
      if (dialog.parentNode) {
        dialog.parentNode.removeChild(dialog);
      }
    });
    this.filterDialogs.clear();
    document.removeEventListener('click', this.handleOutsideClick);
  }
}
