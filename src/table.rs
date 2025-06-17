use wasm_bindgen::prelude::*;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};
use wasm_bindgen::closure::Closure;
use wasm_bindgen::JsCast;
use std::collections::HashMap;
use serde_json;
use crate::types::*;
use crate::validation::{Validator, ValidationError};
use crate::merge::MergedCell;

// 高速テーブルレンダラー
#[wasm_bindgen]
pub struct NinjaTable {
    #[wasm_bindgen(skip)]
    pub canvas: HtmlCanvasElement,
    #[wasm_bindgen(skip)]
    pub ctx: CanvasRenderingContext2d,
    #[wasm_bindgen(skip)]
    pub config: TableConfig,
    #[wasm_bindgen(skip)]
    pub data: HashMap<String, CellData>,
    #[wasm_bindgen(skip)]
    pub headers: Vec<String>,
    #[wasm_bindgen(skip)]
    pub selected_cell: Option<(usize, usize)>,
    #[wasm_bindgen(skip)]
    pub selected_range: Option<crate::types::CellRange>,
    #[wasm_bindgen(skip)]
    pub is_selecting: bool,
    #[wasm_bindgen(skip)]
    pub selection_start: Option<(usize, usize)>,
    #[wasm_bindgen(skip)]
    pub clipboard_data: Vec<Vec<String>>,
    #[wasm_bindgen(skip)]
    pub editing_cell: Option<(usize, usize)>,
    #[wasm_bindgen(skip)]
    pub editing_input: Option<web_sys::HtmlInputElement>,
    #[wasm_bindgen(skip)]
    pub _click_closure: Option<Closure<dyn FnMut(web_sys::MouseEvent)>>,
    #[wasm_bindgen(skip)]
    pub _wheel_closure: Option<Closure<dyn FnMut(web_sys::WheelEvent)>>,
    pub canvas_width: f64,
    pub canvas_height: f64,
    #[wasm_bindgen(skip)]
    pub scroll_x: f64,
    #[wasm_bindgen(skip)]
    pub scroll_y: f64,
    #[wasm_bindgen(skip)]
    pub merged_cells: HashMap<String, MergedCell>,
    #[wasm_bindgen(skip)]
    pub conditional_formats: HashMap<String, CellFormat>,
    #[wasm_bindgen(skip)]
    pub visible_rows: (usize, usize),
    #[wasm_bindgen(skip)]
    pub visible_cols: (usize, usize),
    #[wasm_bindgen(skip)]
    pub cells: Vec<Vec<Option<Cell>>>,
}

#[wasm_bindgen]
impl NinjaTable {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: HtmlCanvasElement, config_json: &str) -> Result<NinjaTable, JsValue> {
        let config: TableConfig = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse config: {}", e)))?;

        let ctx = canvas
            .get_context("2d")?
            .unwrap()
            .dyn_into::<CanvasRenderingContext2d>()?;

        let canvas_width = canvas.width() as f64;
        let canvas_height = canvas.height() as f64;

        // セルデータを初期化
        let mut cells = Vec::new();
        for _ in 0..config.row_count {
            let mut row = Vec::new();
            for _ in 0..config.col_count {
                row.push(None);
            }
            cells.push(row);
        }

        // ヘッダーを初期化
        let mut headers = Vec::new();
        for i in 0..config.col_count {
            headers.push(format!("{}", (b'A' + (i % 26) as u8) as char));
        }

        let mut table = NinjaTable {
            canvas: canvas.clone(),
            ctx,
            config,
            data: HashMap::new(),
            headers,
            selected_cell: Some((0, 0)), // 初期選択セル
            selected_range: None,
            is_selecting: false,
            selection_start: None,
            clipboard_data: Vec::new(),
            editing_cell: None,
            editing_input: None,
            _click_closure: None,
            _wheel_closure: None,
            canvas_width,
            canvas_height,
            scroll_x: 0.0,
            scroll_y: 0.0,
            merged_cells: HashMap::new(),
            conditional_formats: HashMap::new(),
            visible_rows: (0, 0),
            visible_cols: (0, 0),
            cells,
        };

        // 表示範囲を計算
        table.calculate_visible_range();
        
        // Rust側でイベントリスナーを設定
        table.setup_event_listeners()?;

        Ok(table)
    }
    
    // Rust側でイベントリスナーを設定（簡素化版）
    fn setup_event_listeners(&mut self) -> Result<(), JsValue> {
        use wasm_bindgen::closure::Closure;
        use wasm_bindgen::JsCast;
        
        // キャンバスをフォーカス可能にする
        self.canvas.set_attribute("tabindex", "0")?;
        self.canvas.focus()?;
        
        // クリックイベント - 座標のみ記録
        {
            let click_closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
                let target = event.target().unwrap();
                let canvas: web_sys::HtmlCanvasElement = target.dyn_into().unwrap();
                let rect = canvas.get_bounding_client_rect();
                let x = event.client_x() as f64 - rect.left();
                let y = event.client_y() as f64 - rect.top();
                
                web_sys::console::log_1(&format!("🖱️ [DEBUG] Click at canvas coords ({}, {})", x, y).into());
                
                // グローバル関数を呼び出してテーブルを更新
                if let Some(window) = web_sys::window() {
                    if let Some(handle_click) = window.get("handleTableClick") {
                        let js_value: wasm_bindgen::JsValue = handle_click.into();
                        if let Ok(function) = js_value.dyn_into::<js_sys::Function>() {
                            let args = js_sys::Array::new();
                            args.push(&wasm_bindgen::JsValue::from_f64(x));
                            args.push(&wasm_bindgen::JsValue::from_f64(y));
                            let _ = function.apply(&window, &args);
                        }
                    }
                }
            }) as Box<dyn FnMut(_)>);
            
            self.canvas.add_event_listener_with_callback("click", click_closure.as_ref().unchecked_ref())?;
            self._click_closure = Some(click_closure);
        }
        
        // ホイールイベント
        {
            let wheel_closure = Closure::wrap(Box::new(move |event: web_sys::WheelEvent| {
                event.prevent_default();
                
                web_sys::console::log_1(&format!("🔄 [DEBUG] Wheel delta: ({}, {})", event.delta_x(), event.delta_y()).into());
                
                // グローバル関数を呼び出してスクロール
                if let Some(window) = web_sys::window() {
                    if let Some(handle_wheel) = window.get("handleTableWheel") {
                        let js_value: wasm_bindgen::JsValue = handle_wheel.into();
                        if let Ok(function) = js_value.dyn_into::<js_sys::Function>() {
                            let args = js_sys::Array::new();
                            args.push(&wasm_bindgen::JsValue::from_f64(event.delta_x()));
                            args.push(&wasm_bindgen::JsValue::from_f64(event.delta_y()));
                            let _ = function.apply(&window, &args);
                        }
                    }
                }
            }) as Box<dyn FnMut(_)>);
            
            self.canvas.add_event_listener_with_callback("wheel", wheel_closure.as_ref().unchecked_ref())?;
            self._wheel_closure = Some(wheel_closure);
        }
        
        // キーボードイベント処理はTypeScript側で統一的に処理するため、Rust側では登録しない
        
        Ok(())
    }
    
    // クリックイベントを処理するメソッド（JavaScript側から呼び出される）
    #[wasm_bindgen]
    pub fn handle_canvas_click(&mut self, canvas_x: f64, canvas_y: f64) -> Result<(), JsValue> {
        web_sys::console::log_1(&format!("🖱️ [DEBUG] Canvas click at ({}, {})", canvas_x, canvas_y).into());
        
        if let Some(cell_pos) = self.pixel_to_cell(canvas_x, canvas_y) {
            let parts: Vec<&str> = cell_pos.split(':').collect();
            if parts.len() != 2 {
                return Ok(());
            }
            let (row, col) = match (parts[0].parse::<usize>(), parts[1].parse::<usize>()) {
                (Ok(r), Ok(c)) => (r, c),
                _ => return Ok(()),
            };
            web_sys::console::log_1(&format!("🎯 [DEBUG] Clicked cell ({}, {})", row, col).into());
            
            // 編集中の場合の処理
            if let Some((editing_row, editing_col)) = self.editing_cell {
                // 同じセルをクリックした場合は何もしない（編集継続）
                if editing_row == row && editing_col == col {
                    return Ok(());
                }
                
                // 異なるセルをクリックした場合は編集を終了
                web_sys::console::log_1(&format!("📝 [DEBUG] Finishing edit on ({}, {}) and moving to ({}, {})", editing_row, editing_col, row, col).into());
                self.finish_editing()?;
            }
            
            // 新しいセルを選択
            self.selected_cell = Some((row, col));
            self.render()?;
            
            // グローバル関数でレンダリングをトリガー
            if let Some(window) = web_sys::window() {
                if let Some(trigger_render) = window.get("triggerRender") {
                    let js_value: wasm_bindgen::JsValue = trigger_render.into();
                    if let Ok(function) = js_value.dyn_into::<js_sys::Function>() {
                        let _ = function.call0(&window);
                    }
                }
            }
        }
        
        Ok(())
    }

    // ホイールイベントを処理するメソッド（JavaScript側から呼び出される）
    #[wasm_bindgen]
    pub fn handle_canvas_wheel(&mut self, delta_x: f64, delta_y: f64) -> Result<(), JsValue> {
        web_sys::console::log_1(&format!("🔄 [DEBUG] Processing wheel delta: ({}, {})", delta_x, delta_y).into());

        // スクロール量を調整（より滑らかなスクロール）
        let scroll_factor = 0.5;
        self.scroll(delta_x * scroll_factor, delta_y * scroll_factor);
        self.render()?;
        Ok(())
    }

    // キーボードイベントを処理するメソッド（JavaScript側から呼び出される）
    #[wasm_bindgen]
    pub fn handle_canvas_keydown(&mut self, key: &str) -> Result<(), JsValue> {
        web_sys::console::log_1(&format!("⌨️ [DEBUG] Key pressed: {}", key).into());
        
        match key {
            "ArrowUp" => {
                if let Some((row, col)) = self.selected_cell {
                    if row > 0 {
                        self.selected_cell = Some((row - 1, col));
                        self.render()?;
                    }
                }
            }
            "ArrowDown" => {
                if let Some((row, col)) = self.selected_cell {
                    if row + 1 < self.config.row_count {
                        self.selected_cell = Some((row + 1, col));
                        self.render()?;
                    }
                }
            }
            "ArrowLeft" => {
                if let Some((row, col)) = self.selected_cell {
                    if col > 0 {
                        self.selected_cell = Some((row, col - 1));
                        self.render()?;
                    }
                }
            }
            "ArrowRight" => {
                if let Some((row, col)) = self.selected_cell {
                    if col + 1 < self.config.col_count {
                        self.selected_cell = Some((row, col + 1));
                        self.render()?;
                    }
                }
            }
            "Enter" => {
                if let Some((row, col)) = self.editing_cell {
                    // 編集中の場合：編集を完了して下のセルに移動
                    self.finish_editing()?;
                    
                    if row + 1 < self.config.row_count {
                        self.selected_cell = Some((row + 1, col));
                        web_sys::console::log_1(&format!("⬇️ [DEBUG] Moved to cell ({}, {})", row + 1, col).into());
                    }
                    self.render()?;
                } else if let Some((row, col)) = self.selected_cell {
                    // 選択中の場合：編集開始
                    self.start_editing(row, col)?;
                }
            }
            "Tab" => {
                if let Some((row, col)) = self.editing_cell {
                    // 編集中の場合：編集を完了して右のセルに移動
                    self.finish_editing()?;
                    
                    if col + 1 < self.config.col_count {
                        self.selected_cell = Some((row, col + 1));
                        web_sys::console::log_1(&format!("➡️ [DEBUG] Moved to cell ({}, {})", row, col + 1).into());
                    }
                    self.render()?;
                } else if let Some((row, col)) = self.selected_cell {
                    // 選択中の場合：右のセルに移動
                    if col + 1 < self.config.col_count {
                        self.selected_cell = Some((row, col + 1));
                        web_sys::console::log_1(&format!("➡️ [DEBUG] Moved to cell ({}, {})", row, col + 1).into());
                        self.render()?;
                    }
                }
            }
            "Escape" => {
                if self.editing_cell.is_some() {
                    // 編集中の場合：編集をキャンセル
                    self.cancel_editing()?;
                    web_sys::console::log_1(&"❌ [DEBUG] Cancelled editing with Escape".into());
                }
            }
            "F2" => {
                if let Some((row, col)) = self.selected_cell {
                    if self.editing_cell.is_none() {
                        // F2で編集開始（既存の値を保持）
                        self.start_editing(row, col)?;
                        web_sys::console::log_1(&format!("📝 [DEBUG] Started editing with F2 at ({}, {})", row, col).into());
                    }
                }
            }
            "Delete" | "Backspace" => {
                if let Some((row, col)) = self.selected_cell {
                    if self.editing_cell.is_none() {
                        // 編集中でない場合：セルの内容をクリア
                        self.set_cell_data(row, col, String::new())?;
                        self.render()?;
                        web_sys::console::log_1(&format!("🗑️ [DEBUG] Cleared cell ({}, {})", row, col).into());
                    }
                }
            }
            _ => {
                // 印刷可能な文字の場合
                if self.is_printable_character(key) {
                    if let Some((row, col)) = self.selected_cell {
                        if self.editing_cell.is_none() {
                            // 編集開始（既存の値をクリアして新しい文字から開始）
                            self.start_editing_with_value(row, col, key)?;
                            web_sys::console::log_1(&format!("✏️ [DEBUG] Started editing with character '{}' at ({}, {})", key, row, col).into());
                        }
                    }
                }
            }
        }
        
        Ok(())
    }
    
    // 印刷可能な文字かどうかを判定
    fn is_printable_character(&self, key: &str) -> bool {
        if key.len() != 1 {
            return false;
        }
        
        let ch = key.chars().next().unwrap();
        match ch {
            // 英数字
            'a'..='z' | 'A'..='Z' | '0'..='9' => true,
            // 記号
            ' ' | '!' | '"' | '#' | '$' | '%' | '&' | '\'' | '(' | ')' | '*' | '+' | ',' | '-' | '.' | '/' |
            ':' | ';' | '<' | '=' | '>' | '?' | '@' | '[' | '\\' | ']' | '^' | '_' | '`' | '{' | '|' | '}' | '~' => true,
            _ => false,
        }
    }
    


    // 編集状態を取得
    #[wasm_bindgen]
    pub fn is_editing(&self) -> bool {
        self.editing_cell.is_some()
    }
    
    // 選択されたセルの位置を取得
    #[wasm_bindgen]
    pub fn get_selected_cell(&self) -> Option<String> {
        self.selected_cell.map(|(row, col)| format!("{}:{}", row, col))
    }

    #[wasm_bindgen]
    pub fn set_cell_data(&mut self, row: usize, col: usize, value: String) -> Result<(), JsValue> {
        if row >= self.config.row_count || col >= self.config.col_count {
            return Err(JsValue::from_str("Row or column index out of bounds"));
        }

        // 検証を実行
        let validation_error_info = if let Some(validation_error) = self.validate_cell_value_internal(col, &value) {
            // 検証エラーがある場合でも値は設定するが、エラー情報を保存
            web_sys::console::warn_1(&format!("⚠️ Validation warning: {}", validation_error.message).into());
            Some(ValidationErrorInfo {
                message: validation_error.message,
                error_type: format!("{:?}", validation_error.error_type),
            })
        } else {
            None
        };

        let key = format!("{}:{}", row, col);
        self.data.insert(key.clone(), CellData {
            value: value.clone(),
            row,
            col,
            width: self.get_column_width(col),
            height: self.config.default_row_height as f64,
            background_color: None,
            text_color: None,
            font_style: None,
            font_weight: None,
            text_decoration: None,
            format: None,
            validation_error: validation_error_info.clone(),
        });

        // セル配列も更新
        if let Some(cell_row) = self.cells.get_mut(row) {
            if let Some(cell) = cell_row.get_mut(col) {
                *cell = Some(Cell {
                    value: value.clone(),
                    format: None,
                    validation_error: validation_error_info,
                });
            }
        }

        Ok(())
    }

    /// セルの値を検証する（JavaScript側から呼び出し可能）
    #[wasm_bindgen]
    pub fn validate_cell_value(&self, col: usize, value: &str) -> String {
        match self.validate_cell_value_internal(col, value) {
            Some(error) => Validator::validation_error_to_json(&error),
            None => "null".to_string(), // 検証成功
        }
    }

    /// 内部用の検証メソッド
    fn validate_cell_value_internal(&self, col: usize, value: &str) -> Option<ValidationError> {
        if let Some(header) = self.get_column_header(col) {
            match Validator::validate_cell_value(&header, value) {
                Ok(()) => None,
                Err(error) => Some(error),
            }
        } else {
            None // ヘッダー情報がない場合は検証しない
        }
    }

    #[wasm_bindgen]
    pub fn get_cell_data(&self, row: usize, col: usize) -> Option<String> {
        let key = format!("{}:{}", row, col);
        self.data.get(&key).map(|cell| cell.value.clone())
    }

    // ヘッダーを設定
    #[wasm_bindgen]
    pub fn set_header(&mut self, col: usize, value: &str) {
        if col < self.headers.len() {
            self.headers[col] = value.to_string();
        }
    }

    // ヘッダーを取得
    #[wasm_bindgen]
    pub fn get_header(&self, col: usize) -> Option<String> {
        self.headers.get(col).cloned()
    }

    // テーブル設定を更新
    #[wasm_bindgen]
    pub fn update_config(&mut self, config_json: &str) -> Result<(), JsValue> {
        match serde_json::from_str::<TableConfig>(config_json) {
            Ok(config) => {
                self.config = config;
                self.calculate_visible_range();
                Ok(())
            }
            Err(e) => Err(JsValue::from_str(&format!("Failed to parse config: {}", e))),
        }
    }

    // スクロール処理
    #[wasm_bindgen]
    pub fn scroll(&mut self, delta_x: f64, delta_y: f64) {
        // スクロール上限を計算
        let max_scroll_x = self.calculate_max_scroll_x();
        let max_scroll_y = self.calculate_max_scroll_y();
        
        // スクロール位置を更新（0以上、最大値以下に制限）
        self.scroll_x = (self.scroll_x + delta_x).max(0.0).min(max_scroll_x);
        self.scroll_y = (self.scroll_y + delta_y).max(0.0).min(max_scroll_y);
        
        self.calculate_visible_range();
        
        // 編集中の場合、入力フィールドの位置を更新
        if let (Some((row, col)), Some(ref input)) = (self.editing_cell, &self.editing_input) {
            if let Err(e) = self.update_editing_input_position(input, row, col) {
                web_sys::console::log_1(&format!("⚠️ [DEBUG] Failed to update input position: {:?}", e).into());
            }
        }
    }

    // 水平スクロールの最大値を計算
    fn calculate_max_scroll_x(&self) -> f64 {
        // 全列の幅を計算
        let mut total_width = 0.0;
        for col in 0..self.config.col_count {
            if let Some(header) = self.get_column_header(col) {
                total_width += header.width;
            } else {
                total_width += self.config.default_col_width;
            }
        }
        
        // キャンバス幅から行ヘッダー幅を引いた表示領域幅
        let visible_area_width = self.canvas_width - self.config.row_header_width;
        
        // 最大スクロール値 = 総コンテンツ幅 - 表示領域幅 + 余白（ただし0未満にならないように）
        // 余白を追加して最後のセルが完全に表示されるようにする
        let margin = 50.0; // 50px の余白に増加
        (total_width - visible_area_width + margin).max(0.0)
    }

    // 垂直スクロールの最大値を計算
    fn calculate_max_scroll_y(&self) -> f64 {
        // 全行の高さを計算
        let total_height = self.config.row_count as f64 * self.config.default_row_height;
        
        // キャンバス高さからヘッダー高さとスクロールバー分を引いた表示領域高さ
        let scrollbar_height = 17.0; // スクロールバーの高さ
        let visible_area_height = self.canvas_height - self.config.header_height - scrollbar_height;
        
        // 最大スクロール値 = 総コンテンツ高さ - 表示領域高さ + 余白（ただし0未満にならないように）
        // 余白を追加して最後の行が完全に表示されるようにする
        let margin = 10.0;
        (total_height - visible_area_height + margin).max(0.0)
    }

    // セル選択（座標指定）
    #[wasm_bindgen]
    pub fn select_cell(&mut self, x: f64, y: f64) -> Option<String> {
        let (row, col) = self.pixel_to_cell_internal(x, y)?;
        self.selected_cell = Some((row, col));
        Some(format!("{}:{}", row, col))
    }

    // セル選択（行・列直接指定）
    #[wasm_bindgen]
    pub fn select_cell_by_position(&mut self, row: usize, col: usize) -> Option<String> {
        if row < self.config.row_count && col < self.config.col_count {
            self.selected_cell = Some((row, col));
            Some(format!("{}:{}", row, col))
        } else {
            None
        }
    }

    // 座標からセルを計算（カスタム列幅対応）
    #[wasm_bindgen]
    pub fn pixel_to_cell(&self, x: f64, y: f64) -> Option<String> {
        if let Some((row, col)) = self.pixel_to_cell_internal(x, y) {
            Some(format!("{}:{}", row, col))
        } else {
            None
        }
    }

    // 座標からセルを計算（内部使用）
    fn pixel_to_cell_internal(&self, x: f64, y: f64) -> Option<(usize, usize)> {
        if x < self.config.row_header_width || y < self.config.header_height {
            return None;
        }

        let row = ((y - self.config.header_height + self.scroll_y) / self.config.default_row_height) as usize;
        
        // 列の計算（カスタム幅対応）
        let mut accumulated_width = self.config.row_header_width;
        let target_x = x + self.scroll_x;
        
        for col in 0..self.config.col_count {
            let column_width = if let Some(header) = self.get_column_header(col) {
                header.width
            } else {
                self.config.default_col_width
            };
            
            if target_x >= accumulated_width && target_x < accumulated_width + column_width {
                if row < self.config.row_count {
                    return Some((row, col));
                }
            }
            accumulated_width += column_width;
        }

        None
    }

    // 表示範囲を計算
    fn calculate_visible_range(&mut self) {
        // 列の表示範囲を計算（カスタム幅対応）
        let mut start_col = 0;
        let mut accumulated_width = 0.0;
        
        // 開始列を見つける
        for col in 0..self.config.col_count {
            let column_width = if let Some(header) = self.get_column_header(col) {
                header.width
            } else {
                self.config.default_col_width
            };
            
            if accumulated_width + column_width > self.scroll_x {
                start_col = col;
                break;
            }
            accumulated_width += column_width;
        }
        
        // 終了列を見つける
        let mut end_col = start_col;
        let visible_area_width = self.canvas_width - self.config.row_header_width;
        let mut current_width = 0.0;
        
        // 開始列の位置を取得
        let start_x = self.get_start_x_for_column(start_col);
        
        for col in start_col..self.config.col_count {
            let column_width = if let Some(header) = self.get_column_header(col) {
                header.width
            } else {
                self.config.default_col_width
            };
            
            current_width += column_width;
            
            // 表示領域を超えた場合
            if current_width > visible_area_width + self.scroll_x - start_x {
                end_col = col + 1;
                break;
            }
            end_col = col + 1;
        }
        
        end_col = end_col.min(self.config.col_count);

        // 行の表示範囲を計算
        let start_row = (self.scroll_y / self.config.default_row_height) as usize;
        let end_row = ((self.scroll_y + self.canvas_height - self.config.header_height) / self.config.default_row_height) as usize + 1;
        let end_row = end_row.min(self.config.row_count);

        self.visible_rows = (start_row, end_row);
        self.visible_cols = (start_col, end_col);
    }
    
    // 指定した列の開始X座標を取得（スクロール考慮なし）
    fn get_start_x_for_column(&self, col: usize) -> f64 {
        let mut accumulated_width = 0.0;
        for prev_col in 0..col {
            if let Some(header) = self.get_column_header(prev_col) {
                accumulated_width += header.width;
            } else {
                accumulated_width += self.config.default_col_width;
            }
        }
        accumulated_width
    }

    // テーブルの総幅を計算
    fn get_table_width(&self) -> f64 {
        let mut total_width = 0.0;
        for col in 0..self.config.col_count {
            if let Some(header) = self.get_column_header(col) {
                total_width += header.width;
            } else {
                total_width += self.config.default_col_width;
            }
        }
        total_width
    }

    // テーブルの総高さを計算
    fn get_table_height(&self) -> f64 {
        self.config.row_count as f64 * self.config.default_row_height
    }

    // バッチデータ設定
    #[wasm_bindgen]
    pub fn set_batch_data(&mut self, data_json: &str) -> Result<(), JsValue> {
        match serde_json::from_str::<Vec<CellData>>(data_json) {
            Ok(cells) => {
                for cell in cells {
                    let key = format!("{}:{}", cell.row, cell.col);
                    self.data.insert(key, cell);
                }
                Ok(())
            }
            Err(e) => Err(JsValue::from_str(&format!("Failed to parse data: {}", e))),
        }
    }

    // 統計情報取得
    #[wasm_bindgen]
    pub fn get_stats(&self) -> String {
        let visible_cells = (self.visible_rows.1 - self.visible_rows.0) * (self.visible_cols.1 - self.visible_cols.0);
        let total_cells = self.config.row_count * self.config.col_count;
        
        let stats = serde_json::json!({
            "totalCells": total_cells,
            "visibleCells": visible_cells,
            "dataCells": self.data.len(),
            "scrollX": self.scroll_x,
            "scrollY": self.scroll_y,
            "visibleRows": {
                "start": self.visible_rows.0,
                "end": self.visible_rows.1
            },
            "visibleCols": {
                "start": self.visible_cols.0,
                "end": self.visible_cols.1
            }
        });
        
        stats.to_string()
    }

    #[wasm_bindgen]
    pub fn start_editing(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        use crate::edit::Editable;
        Editable::start_editing(self, row, col)
    }

    // 編集中の入力フィールドの位置を更新
    pub fn update_editing_input_position(&self, input: &web_sys::HtmlInputElement, row: usize, col: usize) -> Result<(), JsValue> {
        // キャンバスの位置を取得
        let canvas_rect = self.canvas.get_bounding_client_rect();
        
        // セルの位置を計算（スクロールとキャンバス位置を考慮）
        let cell_x = self.get_column_x_position(col) + canvas_rect.left();
        let cell_y = self.get_cell_y_for_editing(row) + canvas_rect.top();
        let cell_width = self.get_column_width(col);
        let cell_height = self.config.default_row_height;
        
        // スタイルを設定
        input.set_attribute("style", &format!(
            "position: fixed; left: {}px; top: {}px; width: {}px; height: {}px; border: 2px solid #3498db; padding: 2px; box-sizing: border-box; font-family: {}; font-size: {}px; z-index: 1000; background: white; outline: none;",
            cell_x,
            cell_y,
            cell_width,
            cell_height,
            self.config.font_family,
            self.config.font_size
        ))?;
        
        Ok(())
    }

    fn get_column_x_position(&self, col: usize) -> f64 {
        let mut accumulated_width = self.config.row_header_width;
        
        // 指定した列までの幅を累積計算
        for prev_col in 0..col {
            if let Some(header) = self.get_column_header(prev_col) {
                accumulated_width += header.width;
            } else {
                accumulated_width += self.config.default_col_width;
            }
        }
        
        // スクロール位置を考慮して最終位置を計算
        accumulated_width - self.scroll_x
    }

    fn get_cell_y_for_editing(&self, row: usize) -> f64 {
        self.config.header_height + (row as f64 * self.config.default_row_height) - self.scroll_y
    }

    // 編集を完了する
    #[wasm_bindgen]
    pub fn finish_editing(&mut self) -> Result<(), JsValue> {
        if let Some((row, col)) = self.editing_cell {
            // 編集入力フィールドから値を取得して保存
            if let Some(input) = &self.editing_input {
                let value = input.value();
                web_sys::console::log_1(&format!("💾 [DEBUG] Saving edited value: '{}' to cell ({}, {})", value, row, col).into());
                
                // セルデータを更新
                self.set_cell_data(row, col, value)?;
            }
            
            // 編集入力フィールドを削除
            if let Some(input) = &self.editing_input {
                if let Some(parent) = input.parent_node() {
                    parent.remove_child(input)?;
                }
            }
            
            // 編集状態をクリア
            self.editing_cell = None;
            self.editing_input = None;
            
            // キャンバスにフォーカスを戻す
            self.canvas.focus()?;
            
            web_sys::console::log_1(&format!("✅ [DEBUG] Finished editing cell ({}, {})", row, col).into());
        }
        
        Ok(())
    }
    
    // 編集をキャンセルする
    #[wasm_bindgen]
    pub fn cancel_editing(&mut self) -> Result<(), JsValue> {
        if let Some((row, col)) = self.editing_cell {
            // 編集入力フィールドを削除（値は保存しない）
            if let Some(input) = &self.editing_input {
                if let Some(parent) = input.parent_node() {
                    parent.remove_child(input)?;
                }
            }
            
            // 編集状態をクリア
            self.editing_cell = None;
            self.editing_input = None;
            
            // キャンバスにフォーカスを戻す
            self.canvas.focus()?;
            
            self.render()?;
            
            web_sys::console::log_1(&format!("❌ [DEBUG] Cancelled editing cell ({}, {})", row, col).into());
        }
        
        Ok(())
    }

    #[wasm_bindgen]
    pub fn merge_cells(&mut self, start_row: usize, start_col: usize, row_span: usize, col_span: usize) -> Result<(), JsValue> {
        use crate::merge::Mergeable;
        Mergeable::merge_cells(self, start_row, start_col, row_span, col_span)
    }

    #[wasm_bindgen]
    pub fn unmerge_cells(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        use crate::merge::Mergeable;
        Mergeable::unmerge_cells(self, row, col)
    }

    #[wasm_bindgen]
    pub fn add_conditional_format(&mut self, row: usize, col: usize, format_json: &str) -> Result<(), JsValue> {
        let format: CellFormat = serde_json::from_str(format_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid format JSON: {}", e)))?;
        // TODO: Implement format application
        Ok(())
    }

    #[wasm_bindgen]
    pub fn remove_conditional_format(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        // TODO: Implement format removal
        Ok(())
    }

    // レンダリングメソッドの更新
    #[wasm_bindgen]
    pub fn render(&mut self) -> Result<(), JsValue> {
        // キャンバスをクリア
        self.ctx.clear_rect(0.0, 0.0, self.canvas.width() as f64, self.canvas.height() as f64);
        
        // 背景を描画
        self.ctx.set_fill_style_str(&self.config.background_color);
        self.ctx.fill_rect(0.0, 0.0, self.canvas.width() as f64, self.canvas.height() as f64);
        
        // すべての可視セルを描画（空のセルも含む）
        // テーブルの範囲内でのみ描画
        let max_row = self.visible_rows.1.min(self.config.row_count);
        let max_col = self.visible_cols.1.min(self.config.col_count);
        
        for row in self.visible_rows.0..max_row {
            for col in self.visible_cols.0..max_col {
                self.render_cell(row, col)?;
            }
        }
        
        // グリッドと選択セルを描画
        self.render_grid()?;
        
        // ヘッダーを最後に描画（常に最前面に表示）
        self.render_header()?;
        
        Ok(())
    }

    fn render_cell(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        // 行・列が範囲外の場合は描画しない
        if row >= self.config.row_count || col >= self.config.col_count {
            return Ok(());
        }
        
        let x = self.get_column_x_position(col);
        let y = (row as f64 * self.config.default_row_height as f64) + self.config.header_height as f64 - self.scroll_y;
        let width = self.get_column_width(col);
        let height = self.config.default_row_height as f64;

        // セルが画面外にある場合は描画しない
        if x + width < self.config.row_header_width || 
           x > self.canvas_width || 
           y + height < self.config.header_height || 
           y > self.canvas_height {
            return Ok(());
        }

        // セルの背景を描画
        self.ctx.set_fill_style_str(&self.config.background_color);
        self.ctx.fill_rect(x, y, width, height);

        // セルの値を取得
        let key = format!("{}:{}", row, col);
        let cell_value = self.data.get(&key).map(|data| data.value.clone()).unwrap_or_default();
        let has_validation_error = self.data.get(&key).and_then(|data| data.validation_error.as_ref()).is_some();

        // 選択されたセルの場合は境界線を描画
        if let Some((selected_row, selected_col)) = self.selected_cell {
            if selected_row == row && selected_col == col {
                self.ctx.set_stroke_style_str(&self.config.selected_cell_color);
                self.ctx.set_line_width(2.0);
                self.ctx.stroke_rect(x, y, width, height);
            }
        }

        // 検証エラーがある場合は黄色の枠を描画
        if has_validation_error {
            self.ctx.set_stroke_style_str("#ffc107"); // Bootstrap warning color
            self.ctx.set_line_width(2.0);
            self.ctx.stroke_rect(x + 1.0, y + 1.0, width - 2.0, height - 2.0);
        }

        // テキストを描画
        if !cell_value.is_empty() {
            self.ctx.set_fill_style_str(&self.config.text_color);
            self.ctx.set_font(&format!("{}px {}", self.config.font_size, self.config.font_family));
            
            // 検証エラーがある場合はテキストを右にずらす（警告アイコン用のスペース）
            let text_x = if has_validation_error { x + 25.0 } else { x + 5.0 };
            let text_y = y + (height / 2.0) + (self.config.font_size as f64 / 3.0);
            
            self.ctx.fill_text(&cell_value, text_x, text_y)?;
        }

        // 検証エラーがある場合は警告アイコンを描画
        if has_validation_error {
            self.draw_warning_icon(x + 5.0, y + (height / 2.0) - 8.0)?;
        }

        Ok(())
    }

    // 警告アイコンを描画
    fn draw_warning_icon(&mut self, x: f64, y: f64) -> Result<(), JsValue> {
        let size = 16.0;
        
        // 三角形の警告アイコンを描画
        self.ctx.begin_path();
        self.ctx.move_to(x + size / 2.0, y);
        self.ctx.line_to(x, y + size);
        self.ctx.line_to(x + size, y + size);
        self.ctx.close_path();
        
        // 背景（黄色）
        self.ctx.set_fill_style_str("#ffc107");
        self.ctx.fill();
        
        // 境界線（オレンジ）
        self.ctx.set_stroke_style_str("#ff8c00");
        self.ctx.set_line_width(1.0);
        self.ctx.stroke();
        
        // 感嘆符を描画
        self.ctx.set_fill_style_str("#000000");
        self.ctx.set_font("bold 10px Arial");
        self.ctx.fill_text("!", x + size / 2.0 - 2.0, y + size - 3.0)?;
        
        Ok(())
    }

    fn render_header(&mut self) -> Result<(), JsValue> {
        // ヘッダー背景を描画（固定位置）
        self.ctx.set_fill_style_str(&self.config.header_background_color);
        self.ctx.set_stroke_style_str(&self.config.grid_color);
        
        // 列ヘッダー背景（上部の固定領域）
        self.ctx.fill_rect(self.config.row_header_width, 0.0, self.canvas.width() as f64 - self.config.row_header_width, self.config.header_height);
        
        // 行ヘッダー背景（左側の固定領域）
        self.ctx.fill_rect(0.0, self.config.header_height, self.config.row_header_width, self.canvas.height() as f64 - self.config.header_height);

        // テキスト描画設定
        self.ctx.set_fill_style_str(&self.config.text_color);
        self.ctx.set_font(&format!("bold {}px {}", self.config.font_size, self.config.font_family));
        self.ctx.set_text_align("center");
        self.ctx.set_text_baseline("middle");
        
        // 列ヘッダーテキストを描画（スクロールに影響されない固定位置）
        let max_col = self.visible_cols.1.min(self.config.col_count);
        for col in self.visible_cols.0..max_col {
            let column_width = if let Some(header) = self.get_column_header(col) {
                header.width
            } else {
                self.config.default_col_width
            };
            
            let x = if col == 0 {
                self.config.row_header_width
            } else {
                // 前の列までの幅を累積計算
                let mut accumulated_width = self.config.row_header_width;
                for prev_col in 0..col {
                    if let Some(prev_header) = self.get_column_header(prev_col) {
                        accumulated_width += prev_header.width;
                    } else {
                        accumulated_width += self.config.default_col_width;
                    }
                }
                accumulated_width - self.scroll_x
            };
            
            // 列ヘッダーは画面内に表示される場合のみ描画
            if x + column_width > self.config.row_header_width && x < self.canvas.width() as f64 {
                let display_name = if let Some(header) = self.get_column_header(col) {
                    if header.is_visible {
                        header.display_name.clone()
                    } else {
                        continue; // 非表示の列はスキップ
                    }
                } else {
                    self.get_column_name(col)
                };
                
                self.ctx.fill_text(&display_name, x + column_width / 2.0, self.config.header_height / 2.0)?;
            }
        }
        
        // 行番号を描画（スクロールに影響されない固定位置）
        let max_row = self.visible_rows.1.min(self.config.row_count);
        for row in self.visible_rows.0..max_row {
            let y = row as f64 * self.config.default_row_height + self.config.header_height - self.scroll_y;
            // 行ヘッダーは画面内に表示される場合のみ描画
            if y + self.config.default_row_height > self.config.header_height && y < self.canvas.height() as f64 {
                let row_number = (row + 1).to_string();
                self.ctx.fill_text(&row_number, self.config.row_header_width / 2.0, y + self.config.default_row_height / 2.0)?;
            }
        }
        
        // 境界線を描画
        self.ctx.set_stroke_style_str(&self.config.grid_color);
        self.ctx.set_line_width(1.0);
        
        // 行ヘッダーと列ヘッダーの境界線
        self.ctx.begin_path();
        self.ctx.move_to(self.config.row_header_width, 0.0);
        self.ctx.line_to(self.config.row_header_width, self.canvas.height() as f64);
        self.ctx.stroke();

        self.ctx.begin_path();
        self.ctx.move_to(0.0, self.config.header_height);
        self.ctx.line_to(self.canvas.width() as f64, self.config.header_height);
        self.ctx.stroke();
        
        // 左上角の背景を最後に描画（他の要素の上に重ねる）
        self.ctx.set_fill_style_str(&self.config.header_background_color);
        self.ctx.fill_rect(0.0, 0.0, self.config.row_header_width, self.config.header_height);
        
        // 左上角の境界線を強調
        self.ctx.set_stroke_style_str(&self.config.grid_color);
        self.ctx.set_line_width(2.0);
        self.ctx.stroke_rect(0.0, 0.0, self.config.row_header_width, self.config.header_height);
        
        // 左上角の全選択ボタンを再描画
        self.ctx.set_fill_style_str(&self.config.text_color);
        self.ctx.set_font(&format!("{}px {}", self.config.font_size - 2.0, self.config.font_family));
        self.ctx.set_text_align("center");
        self.ctx.set_text_baseline("middle");
        
        let corner_size = 8.0;
        let corner_x = self.config.row_header_width / 2.0 - corner_size / 2.0;
        let corner_y = self.config.header_height / 2.0 - corner_size / 2.0;
        
        self.ctx.set_stroke_style_str(&self.config.text_color);
        self.ctx.set_line_width(1.0);
        self.ctx.stroke_rect(corner_x, corner_y, corner_size, corner_size);
        
        // テキスト設定をリセット
        self.ctx.set_text_align("left");
        self.ctx.set_text_baseline("alphabetic");
        
        Ok(())
    }
    
    // 列名を生成する関数 (A, B, C, ..., Z, AA, AB, ...)
    fn get_column_name(&self, col: usize) -> String {
        let mut result = String::new();
        let mut n = col;
        
        loop {
            result = format!("{}{}", (b'A' + (n % 26) as u8) as char, result);
            if n < 26 {
                break;
            }
            n = n / 26 - 1;
        }
        
        result
    }

    fn render_grid(&mut self) -> Result<(), JsValue> {
        self.ctx.set_stroke_style_str(&self.config.grid_color);
        self.ctx.set_line_width(1.0);
        
        // 縦線をバッチ処理で描画（カスタム列幅対応）
        let mut accumulated_width = self.config.row_header_width;
        for col in 0..=self.config.col_count {
            let x = accumulated_width - self.scroll_x;
            if x >= self.config.row_header_width && x <= self.canvas.width() as f64 {
                self.ctx.begin_path();
                self.ctx.move_to(x, self.config.header_height);
                // 縦線はテーブルの実際の高さまで描画（最後の行の終端まで）
                let table_end_y = self.get_table_height() + self.config.header_height - self.scroll_y;
                let line_end_y = table_end_y.min(self.canvas.height() as f64);
                self.ctx.line_to(x, line_end_y);
                self.ctx.stroke();
            }
            
            if col < self.config.col_count {
                let column_width = if let Some(header) = self.get_column_header(col) {
                    header.width
                } else {
                    self.config.default_col_width
                };
                accumulated_width += column_width;
            }
        }

        // 横線をバッチ処理で描画（テーブル範囲内のみ）
        let max_row = self.visible_rows.1.min(self.config.row_count);
        for row in self.visible_rows.0..=max_row {
            let y = row as f64 * self.config.default_row_height + self.config.header_height - self.scroll_y;
            if y >= self.config.header_height && y <= self.canvas.height() as f64 {
                self.ctx.begin_path();
                self.ctx.move_to(self.config.row_header_width, y);
                // 横線は最後の列の終端まで描画（テーブルの実際の幅まで）
                let table_end_x = self.get_table_width() + self.config.row_header_width - self.scroll_x;
                let line_end_x = table_end_x.min(self.canvas.width() as f64);
                self.ctx.line_to(line_end_x, y);
                self.ctx.stroke();
            }
        }
        
        // 範囲選択の描画
        if let Some(range) = self.selected_range {
            self.ctx.set_fill_style_str("rgba(52, 152, 219, 0.2)"); // 半透明の青
            
            // 全ての選択されたセルの背景を塗りつぶし
            for row in range.start_row..=range.end_row {
                for col in range.start_col..=range.end_col {
                    let x = self.get_column_x_position(col);
                    let y = row as f64 * self.config.default_row_height + self.config.header_height - self.scroll_y;
                    
                    let column_width = if let Some(header) = self.get_column_header(col) {
                        header.width
                    } else {
                        self.config.default_col_width
                    };
                    
                    // セルが画面内にある場合のみ描画
                    if x + column_width > self.config.row_header_width && 
                       x < self.canvas_width && 
                       y + self.config.default_row_height > self.config.header_height && 
                       y < self.canvas_height {
                        // 背景を塗りつぶし
                        self.ctx.fill_rect(x, y, column_width, self.config.default_row_height);
                    }
                }
            }
            
            // 範囲全体の境界線を描画
            self.ctx.set_stroke_style_str(&self.config.selected_cell_color);
            self.ctx.set_line_width(2.0);
            
            let start_x = self.get_column_x_position(range.start_col);
            let start_y = range.start_row as f64 * self.config.default_row_height + self.config.header_height - self.scroll_y;
            let end_x = self.get_column_x_position(range.end_col) + if let Some(header) = self.get_column_header(range.end_col) {
                header.width
            } else {
                self.config.default_col_width
            };
            let end_y = (range.end_row + 1) as f64 * self.config.default_row_height + self.config.header_height - self.scroll_y;
            
            let range_width = end_x - start_x;
            let range_height = end_y - start_y;
            
            // 範囲全体の境界線を描画
            self.ctx.stroke_rect(start_x, start_y, range_width, range_height);
            
        } else if let Some((row, col)) = self.selected_cell {
            // 単一セル選択の枠を描画（カスタム列幅対応）
            let x = self.get_column_x_position(col);
            let y = row as f64 * self.config.default_row_height + self.config.header_height - self.scroll_y;
            
            let column_width = if let Some(header) = self.get_column_header(col) {
                header.width
            } else {
                self.config.default_col_width
            };
            
            self.ctx.set_stroke_style_str(&self.config.selected_cell_color);
            self.ctx.set_line_width(2.0);
            self.ctx.stroke_rect(x, y, column_width, self.config.default_row_height);
        }
        
        Ok(())
    }

    // ヘッダー設定を更新
    #[wasm_bindgen]
    pub fn set_column_headers(&mut self, headers_json: &str) -> Result<(), JsValue> {
        match serde_json::from_str::<Vec<crate::types::ColumnHeader>>(headers_json) {
            Ok(headers) => {
                self.config.column_headers = headers;
                // 列数を更新
                self.config.col_count = self.config.column_headers.len().max(1);
                // 表示範囲を再計算（重要：これを追加）
                self.calculate_visible_range();
                Ok(())
            }
            Err(e) => Err(JsValue::from_str(&format!("Failed to parse headers: {}", e))),
        }
    }

    // ヘッダー情報を取得
    #[wasm_bindgen]
    pub fn get_column_headers(&self) -> String {
        serde_json::to_string(&self.config.column_headers).unwrap_or_default()
    }

    // 特定の列のヘッダー情報を取得（内部使用）
    fn get_column_header(&self, col: usize) -> Option<crate::types::ColumnHeader> {
        if let Some(header) = self.config.column_headers.get(col) {
            Some(header.clone())
        } else {
            None
        }
    }

    /// 列の幅を取得（ヘッダー設定を考慮）
    fn get_column_width(&self, col: usize) -> f64 {
        if let Some(header) = self.get_column_header(col) {
            header.width as f64
        } else {
            self.config.default_col_width as f64
        }
    }

    /// 選択されたセルの検証エラーメッセージを取得
    #[wasm_bindgen]
    pub fn get_selected_cell_validation_error(&self) -> Option<String> {
        if let Some(selected) = &self.selected_cell {
            if let Some(row) = self.cells.get(selected.0) {
                if let Some(cell) = row.get(selected.1) {
                    if let Some(cell_data) = cell {
                        if let Some(error_info) = &cell_data.validation_error {
                            return Some(error_info.message.clone());
                        }
                    }
                }
            }
        }
        None
    }

    /// 選択されたセルの画面上の位置を取得（JSON形式）
    #[wasm_bindgen]
    pub fn get_selected_cell_screen_position(&self) -> Option<String> {
        if let Some(selected) = &self.selected_cell {
            let cell_screen_pos = self.get_cell_screen_position(selected.0, selected.1);
            match serde_json::to_string(&cell_screen_pos) {
                Ok(json) => Some(json),
                Err(_) => None,
            }
        } else {
            None
        }
    }

    /// 指定されたセルの検証エラー情報を取得
    #[wasm_bindgen]
    pub fn get_cell_validation_error(&self, row: usize, col: usize) -> Option<String> {
        let key = format!("{}:{}", row, col);
        if let Some(cell_data) = self.data.get(&key) {
            if let Some(validation_error) = &cell_data.validation_error {
                return Some(serde_json::json!({
                    "message": validation_error.message,
                    "error_type": validation_error.error_type
                }).to_string());
            }
        }
        None
    }

    /// 指定されたセルの画面上の位置を取得（ピクセル座標）
    #[wasm_bindgen]
    pub fn get_cell_screen_position(&self, row: usize, col: usize) -> String {
        let x = self.get_column_x_position(col);
        let y = (row as f64 * self.config.default_row_height as f64) + self.config.header_height as f64 - self.scroll_y;
        let width = self.get_column_width(col);
        let height = self.config.default_row_height as f64;
        
        serde_json::json!({
            "x": x,
            "y": y,
            "width": width,
            "height": height,
            "centerX": x + width / 2.0,
            "centerY": y + height / 2.0
        }).to_string()
    }

    /// 指定した値で編集を開始する
    #[wasm_bindgen]
    pub fn start_editing_with_value(&mut self, row: usize, col: usize, initial_value: &str) -> Result<(), JsValue> {
        // 既存の編集を終了
        if self.editing_cell.is_some() {
            self.finish_editing()?;
        }
        
        self.editing_cell = Some((row, col));
        
        // 入力要素を作成
        let document = web_sys::window().unwrap().document().unwrap();
        let input = document.create_element("input")?.dyn_into::<web_sys::HtmlInputElement>()?;
        
        // 初期値を設定
        input.set_value(initial_value);
        
        // スタイルを設定
        let style = input.style();
        style.set_property("position", "fixed")?;
        style.set_property("z-index", "1000")?;
        style.set_property("border", "2px solid #007bff")?;
        style.set_property("padding", "2px 4px")?;
        style.set_property("font-family", &self.config.font_family)?;
        style.set_property("font-size", &format!("{}px", self.config.font_size))?;
        style.set_property("background", "white")?;
        style.set_property("outline", "none")?;
        
        // 位置を設定
        self.update_editing_input_position(&input, row, col)?;
        
        // DOMに追加
        document.body().unwrap().append_child(&input)?;
        
        // フォーカスして全選択
        input.focus()?;
        input.select();
        
        self.editing_input = Some(input);
        
        web_sys::console::log_1(&format!("📝 [DEBUG] Started editing cell ({}, {}) with value '{}'", row, col, initial_value).into());
        
        Ok(())
    }

    /// 編集中のEnterキーを処理
    #[wasm_bindgen]
    pub fn handle_editing_enter(&mut self) -> Result<(), JsValue> {
        if let Some((row, col)) = self.editing_cell {
            web_sys::console::log_1(&format!("⬇️ [DEBUG] Handling Enter during editing at ({}, {})", row, col).into());
            
            // 編集を完了
            self.finish_editing()?;
            
            // 下のセルに移動
            if row + 1 < self.config.row_count {
                self.selected_cell = Some((row + 1, col));
                web_sys::console::log_1(&format!("⬇️ [DEBUG] Moved to cell ({}, {})", row + 1, col).into());
            }
            
            // キャンバスにフォーカスを確実に戻す
            self.canvas.focus()?;
            
            self.render()?;
        }
        Ok(())
    }

    /// 編集中のTabキーを処理
    #[wasm_bindgen]
    pub fn handle_editing_tab(&mut self) -> Result<(), JsValue> {
        if let Some((row, col)) = self.editing_cell {
            web_sys::console::log_1(&format!("➡️ [DEBUG] Handling Tab during editing at ({}, {})", row, col).into());
            
            // 編集を完了
            self.finish_editing()?;
            
            // 右のセルに移動
            if col + 1 < self.config.col_count {
                self.selected_cell = Some((row, col + 1));
                web_sys::console::log_1(&format!("➡️ [DEBUG] Moved to cell ({}, {})", row, col + 1).into());
            }
            
            // キャンバスにフォーカスを確実に戻す
            self.canvas.focus()?;
            
            self.render()?;
        }
        Ok(())
    }

    /// 編集中のEscapeキーを処理
    #[wasm_bindgen]
    pub fn handle_editing_escape(&mut self) -> Result<(), JsValue> {
        if self.editing_cell.is_some() {
            web_sys::console::log_1(&"❌ [DEBUG] Handling Escape during editing".into());
            
            // 編集をキャンセル（cancel_editingでキャンバスフォーカスも処理される）
            self.cancel_editing()?;
            self.render()?;
        }
        Ok(())
    }

    // 範囲選択開始
    #[wasm_bindgen]
    pub fn start_range_selection(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        self.is_selecting = true;
        self.selection_start = Some((row, col));
        self.selected_range = Some(crate::types::CellRange::new(row, col, row, col));
        // 範囲選択中もselected_cellを保持（現在のアクティブセル）
        self.selected_cell = Some((row, col));
        Ok(())
    }

    // 範囲選択更新
    #[wasm_bindgen]
    pub fn update_range_selection(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        if let Some((start_row, start_col)) = self.selection_start {
            self.selected_range = Some(crate::types::CellRange::new(start_row, start_col, row, col));
            // 現在のアクティブセル位置を更新
            self.selected_cell = Some((row, col));
        }
        Ok(())
    }

    // 範囲選択終了
    #[wasm_bindgen]
    pub fn end_range_selection(&mut self) -> Result<(), JsValue> {
        self.is_selecting = false;
        Ok(())
    }

    // 範囲選択をクリア
    #[wasm_bindgen]
    pub fn clear_selection(&mut self) -> Result<(), JsValue> {
        self.selected_range = None;
        self.is_selecting = false;
        self.selection_start = None;
        // 単一セル選択は保持する（clear_selectionは範囲選択のみをクリア）
        Ok(())
    }

    // 選択された範囲をコピー
    #[wasm_bindgen]
    pub fn copy_selection(&mut self) -> Result<String, JsValue> {
        let mut copied_data = Vec::new();
        
        if let Some(range) = self.selected_range {
            for row in range.start_row..=range.end_row {
                let mut row_data = Vec::new();
                for col in range.start_col..=range.end_col {
                    let value = self.get_cell_data(row, col).unwrap_or_default();
                    row_data.push(value);
                }
                copied_data.push(row_data);
            }
        } else if let Some((row, col)) = self.selected_cell {
            // 単一セルの場合
            let value = self.get_cell_data(row, col).unwrap_or_default();
            copied_data.push(vec![value]);
        }

        self.clipboard_data = copied_data.clone();
        
        // TSV形式で返す（タブ区切り）
        let tsv = copied_data.iter()
            .map(|row| row.join("\t"))
            .collect::<Vec<_>>()
            .join("\n");
            
        Ok(tsv)
    }

    // クリップボードからペースト
    #[wasm_bindgen]
    pub fn paste_from_clipboard(&mut self, tsv_data: &str) -> Result<(), JsValue> {
        let rows: Vec<&str> = tsv_data.split('\n').collect();
        let mut paste_data = Vec::new();
        
        for row_str in rows {
            if !row_str.trim().is_empty() {
                let cols: Vec<String> = row_str.split('\t').map(|s| s.to_string()).collect();
                paste_data.push(cols);
            }
        }

        if paste_data.is_empty() {
            return Ok(());
        }

        // ペースト開始位置を決定
        let (start_row, start_col) = if let Some(range) = self.selected_range {
            (range.start_row, range.start_col)
        } else if let Some((row, col)) = self.selected_cell {
            (row, col)
        } else {
            (0, 0)
        };

        // データをペースト
        for (row_offset, row_data) in paste_data.iter().enumerate() {
            for (col_offset, value) in row_data.iter().enumerate() {
                let target_row = start_row + row_offset;
                let target_col = start_col + col_offset;
                
                if target_row < self.config.row_count && target_col < self.config.col_count {
                    self.set_cell_data(target_row, target_col, value.clone())?;
                }
            }
        }

        Ok(())
    }

    // 選択された範囲の情報を取得
    #[wasm_bindgen]
    pub fn get_selection_info(&self) -> String {
        if let Some(range) = self.selected_range {
            let cell_count = (range.end_row - range.start_row + 1) * (range.end_col - range.start_col + 1);
            serde_json::json!({
                "type": "range",
                "hasSelection": true,
                "isRange": true,
                "start_row": range.start_row,
                "start_col": range.start_col,
                "end_row": range.end_row,
                "end_col": range.end_col,
                "cell_count": cell_count
            }).to_string()
        } else if let Some((row, col)) = self.selected_cell {
            serde_json::json!({
                "type": "single",
                "hasSelection": true,
                "isRange": false,
                "row": row,
                "col": col,
                "cell_count": 1
            }).to_string()
        } else {
            serde_json::json!({
                "type": "none",
                "hasSelection": false,
                "isRange": false,
                "cell_count": 0
            }).to_string()
        }
    }

    // マウスドラッグによる範囲選択処理
    #[wasm_bindgen]
    pub fn handle_mouse_drag(&mut self, canvas_x: f64, canvas_y: f64, is_dragging: bool) -> Result<(), JsValue> {
        if let Some(cell_pos) = self.pixel_to_cell(canvas_x, canvas_y) {
            let parts: Vec<&str> = cell_pos.split(':').collect();
            if parts.len() == 2 {
                if let (Ok(row), Ok(col)) = (parts[0].parse::<usize>(), parts[1].parse::<usize>()) {
                    if is_dragging && self.selection_start.is_some() {
                        // ドラッグ中の場合、範囲を更新
                        self.update_range_selection(row, col)?;
                    } else if !is_dragging {
                        // ドラッグ開始の場合
                        self.start_range_selection(row, col)?;
                    }
                }
            }
        }
        Ok(())
    }
} 