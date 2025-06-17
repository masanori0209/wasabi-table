import { 
  createNinjaTableWithListeners,
  NinjaTable, 
  NinjaTableListeners,
  TableConfig, 
  CellPosition, 
  EventHandlers,
  ColumnHeader,
  FieldType 
} from 'ninja-table';

class SpreadsheetApp {
  private table: NinjaTable | null = null;
  private listeners: NinjaTableListeners | null = null;

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    const config: Partial<TableConfig> = {
      row_count: 100,
      col_count: 10,
      default_col_width: 120,
      default_row_height: 28,
      font_family: 'Arial, sans-serif',
      font_size: 12
    };

    // 統合された初期化
    const { table, listeners } = await createNinjaTableWithListeners(
      canvas,
      config,
      {
        cellReferenceSelector: '#cellReference',
        formulaInputSelector: '#formulaInput',
        statsElementSelector: '#stats'
      },
      {
        enableValidation: true,
        enableIMESupport: true
      }
    );

    this.table = table;
    this.listeners = listeners;

    // 型安全な列ヘッダー設定
    const columnHeaders: ColumnHeader[] = [
      {
        name: "employee_id",
        display_name: "社員ID",
        width: 80,
        required: true,
        order: 0,
        is_visible: true,
        field_type: FieldType.IntegerField,
        min_number: 1,
        max_number: 99999
      },
      {
        name: "name",
        display_name: "氏名",
        width: 150,
        required: true,
        order: 1,
        is_visible: true,
        field_type: FieldType.CharField,
        max_length: 50
      },
      {
        name: "department",
        display_name: "部署",
        width: 120,
        required: true,
        order: 2,
        is_visible: true,
        field_type: FieldType.MenuField,
        choices: ["開発部", "営業部", "総務部", "人事部"]
      }
    ];

    // ヘッダー設定を適用
    this.table.setColumnHeaders(JSON.stringify(columnHeaders));

    const handlers: EventHandlers = {
      onCellSelect: this.handleCellSelect.bind(this),
      onCellChange: this.handleCellChange.bind(this)
    };

    this.table.setEventHandlers(handlers);
    this.table.render();
  }

  private handleCellSelect(position: CellPosition): void {
    console.log(`セル選択: ${position.row}, ${position.col}`);
  }

  private handleCellChange(position: CellPosition, value: string): void {
    console.log(`セル変更: ${position.row}, ${position.col} = ${value}`);
  }
} 