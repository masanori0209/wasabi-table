/**
 * Wasabi Table 共通型定義
 */

export interface ThemeColors {
  background_color: string;
  text_color: string;
  grid_color: string;
  header_background_color: string;
  selected_cell_color: string;
  range_selection_color?: string;
  error_cell_color?: string;
  editing_cell_color?: string;
}

export type PredefinedTheme = 'light' | 'dark';

export const PREDEFINED_THEMES: Record<PredefinedTheme, ThemeColors> = {
  light: {
    background_color: '#ffffff',
    text_color: '#000000',
    grid_color: '#e0e0e0',
    header_background_color: '#f5f5f5',
    selected_cell_color: '#3498db',
    range_selection_color: 'rgba(52, 152, 219, 0.2)',
    error_cell_color: '#e74c3c',
    editing_cell_color: '#f39c12',
  },
  dark: {
    background_color: '#2d3748',
    text_color: '#e2e8f0',
    grid_color: '#4a5568',
    header_background_color: '#1a202c',
    selected_cell_color: '#667eea',
    range_selection_color: 'rgba(102, 126, 234, 0.2)',
    error_cell_color: '#fc8181',
    editing_cell_color: '#f6ad55',
  },
};

export interface WasabiTableCreateOptions extends Partial<TableConfig> {
  dataSource?: import('./records-data-source').RecordsDataSourceConfig;
}

export interface TableConfig {
  row_count: number;
  col_count: number;
  default_col_width: number;
  default_row_height: number;
  header_height: number;
  row_header_width: number;
  font_family: string;
  font_size: number;
  font_style: string;
  font_weight: string;
  background_color: string;
  text_color: string;
  grid_color: string;
  header_background_color: string;
  selected_cell_color: string;
  show_grid: boolean;
  column_headers: ColumnHeader[];
  freeze_cols?: number;
  freeze_rows?: number;
  contextMenu?: ContextMenuOptions;
}

export interface CellData {
  value: string;
  row: number;
  col: number;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface ContextMenuCell extends CellPosition {
  value: string;
  reference: string;
}

export interface PasteSpecialOptions {
  transpose?: boolean;
  skipEmpty?: boolean;
}

export type ContextMenuBuiltInActionId =
  | 'copy'
  | 'cut'
  | 'paste-values'
  | 'paste-transpose'
  | 'paste-skip-empty';

export interface ContextMenuActionContext {
  table: IWasabiTable;
  cell: ContextMenuCell;
  selection: SelectionInfo;
  event: MouseEvent;
  recordsMode: boolean;
}

export interface ContextMenuAction {
  id: string;
  label: string;
  run: (context: ContextMenuActionContext) => void | Promise<void>;
  enabled?: (context: ContextMenuActionContext) => boolean;
  visible?: (context: ContextMenuActionContext) => boolean;
}

export interface ContextMenuOptions {
  enabled?: boolean;
  builtInActions?: ContextMenuBuiltInActionId[] | false;
  actions?: ContextMenuAction[];
}

export interface TableStats {
  totalCells: number;
  visibleCells: number;
  dataCells: number;
  scrollX: number;
  scrollY: number;
  visibleRows: { start: number; end: number };
  visibleCols: { start: number; end: number };
}

export type NotificationType = 'info' | 'success' | 'warning' | 'redo';

export interface EventHandlers {
  onCellSelect?: (position: CellPosition) => void;
  onEditStart?: (position: CellPosition, value: string) => void;
  onEditEnd?: (position: CellPosition, value: string) => void;
  onCellChange?: (position: CellPosition, oldValue: string, newValue: string) => void;
  onNotification?: (message: string, type?: NotificationType) => void;
}

/** Width of the filter/sort control zone on the right edge of each column header (px). */
export const HEADER_FILTER_CONTROL_WIDTH = 28;

export const DEFAULT_CONFIG: TableConfig = {
  row_count: 100,
  col_count: 26,
  default_col_width: 100,
  default_row_height: 25,
  header_height: 30,
  row_header_width: 50,
  font_family: 'Arial, sans-serif',
  font_size: 12,
  font_style: 'normal',
  font_weight: 'normal',
  background_color: '#ffffff',
  text_color: '#000000',
  grid_color: '#cccccc',
  header_background_color: '#f0f0f0',
  selected_cell_color: '#3498db',
  show_grid: true,
  column_headers: [],
  freeze_cols: 0,
  freeze_rows: 0,
};

export enum FieldType {
  CharField = 'CharField',
  EmailField = 'EmailField',
  TextareaField = 'TextareaField',
  IntegerField = 'IntegerField',
  DecimalField = 'DecimalField',
  DecimalWithNullField = 'DecimalWithNullField',
  DateField = 'DateField',
  TimeField = 'TimeField',
  CheckField = 'CheckField',
  BooleanField = 'BooleanField',
  ButtonField = 'ButtonField',
  MenuField = 'MenuField',
}

export enum FilterOperator {
  Contains = 'contains',
  StartsWith = 'startsWith',
  EndsWith = 'endsWith',
  Equals = 'equals',
  NotEquals = 'notEquals',
  GreaterThan = 'greaterThan',
  GreaterThanOrEqual = 'greaterThanOrEqual',
  LessThan = 'lessThan',
  LessThanOrEqual = 'lessThanOrEqual',
  IsEmpty = 'isEmpty',
  IsNotEmpty = 'isNotEmpty',
}

export interface FilterCondition {
  columnIndex: number;
  fieldType: FieldType;
  operator: FilterOperator;
  value: string;
  isActive: boolean;
}

export interface SortCondition {
  columnIndex: number;
  fieldType: FieldType;
  direction: 'asc' | 'desc';
}

export interface FilterResult {
  filteredRows: number[];
  totalRows: number;
  filteredCount: number;
}

export interface MenuFieldOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface MenuFieldConfig {
  options: MenuFieldOption[] | string[];
  searchable?: boolean;
  placeholder?: string;
  maxDisplayItems?: number;
}

export interface ColumnHeader {
  name: string;
  display_name: string;
  width: number;
  required: boolean;
  order: number;
  is_visible: boolean;
  field_type: FieldType | string;
  max_length?: number;
  min_length?: number;
  max_digits?: number;
  decimal_places?: number;
  min_number?: number;
  max_number?: number;
  choices?: string[];
  menu_config?: MenuFieldConfig;
}

export interface ValidationError {
  field_name: string;
  message: string;
  error_type: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: ValidationError;
}

export interface CellScreenPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  absolute_x: number;
  absolute_y: number;
}

export interface ListenerOptions {
  enableValidation?: boolean;
  enableIMESupport?: boolean;
  autoFocusCanvas?: boolean;
  validationDelay?: number;
  enableKeyboardShortcuts?: boolean;
}

export interface UIElements {
  cellReference: HTMLElement;
  formulaInput: HTMLInputElement;
  statsElement?: HTMLElement;
  validationError?: HTMLElement;
  validationSuccess?: HTMLElement;
}

export interface EventCallbacks {
  onStatsUpdate?: (stats: TableStats) => void;
  onValidationError?: (error: ValidationError) => void;
  onValidationSuccess?: () => void;
  onCellReferenceUpdate?: (reference: string) => void;
  onNotification?: (message: string, type?: NotificationType) => void;
}

export interface SelectionInfo {
  type: 'range' | 'single' | 'none';
  hasSelection: boolean;
  isRange: boolean;
  start_row?: number;
  start_col?: number;
  end_row?: number;
  end_col?: number;
  row?: number;
  col?: number;
  active_row?: number;
  active_col?: number;
  cell_count: number;
}

/**
 * WasabiTable の公開インターフェース（循環参照回避用）
 */
export interface IWasabiTable {
  getSelectedCell(): CellPosition | undefined;
  setCellValue(row: number, col: number, value: string): void;
  setCellValueWithValidation(row: number, col: number, value: string): ValidationResult;
  validateCellValue(row: number, col: number, value: string): ValidationError[];
  getConfig(): TableConfig;
  render(): void;
  selectCell(row: number, col: number): void;
  setEventHandlers(handlers: EventHandlers): void;
  getCellValue(row: number, col: number): string | undefined;
  getSelectedCellValidationError(): string | undefined;
  getStats(): TableStats;
  getSelectionInfo(): SelectionInfo;
  isEditing?(): boolean;
  finishEditing?(): void;
  focusCanvas?(): void;
  navigateSelectedCell?(key: string): void;
  setKeyboardShortcutsEnabled?(enabled: boolean): void;
  copySelection(): string;
  copySelectionToClipboard?(): Promise<string>;
  cutSelectionToClipboard?(): Promise<string>;
  pasteClipboardToSelection?(options?: PasteSpecialOptions): Promise<void>;
  pasteFromClipboard(tsvData: string, options?: PasteSpecialOptions): void;
}

export interface CreateWasabiTableUIConfig {
  cellReferenceSelector: string;
  formulaInputSelector: string;
  statsElementSelector?: string;
  validationErrorSelector?: string;
  validationSuccessSelector?: string;
}

export function getColumnName(col: number): string {
  let result = '';
  let n = col;

  while (true) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    if (n < 26) break;
    n = Math.floor(n / 26) - 1;
  }

  return result;
}

export function getCellReference(row: number, col: number): string {
  return `${getColumnName(col)}${row + 1}`;
}

export function getSelectionReference(info: SelectionInfo): string {
  if (!info.hasSelection) {
    return '';
  }

  if (
    info.isRange &&
    info.start_row !== undefined &&
    info.start_col !== undefined &&
    info.end_row !== undefined &&
    info.end_col !== undefined
  ) {
    const startRow = Math.min(info.start_row, info.end_row);
    const endRow = Math.max(info.start_row, info.end_row);
    const startCol = Math.min(info.start_col, info.end_col);
    const endCol = Math.max(info.start_col, info.end_col);
    const startRef = getCellReference(startRow, startCol);
    const endRef = getCellReference(endRow, endCol);
    return startRef === endRef ? startRef : `${startRef}:${endRef}`;
  }

  if (info.row !== undefined && info.col !== undefined) {
    return getCellReference(info.row, info.col);
  }

  return '';
}
