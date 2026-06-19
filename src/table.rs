use wasm_bindgen::prelude::*;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};
use wasm_bindgen::closure::Closure;
use wasm_bindgen::JsCast;
use std::collections::HashMap;
use serde_json;
use crate::types::*;
use crate::validation::{Validator, ValidationError};


// 高速テーブルレンダラー
#[wasm_bindgen]
pub struct WasabiTable {
    #[wasm_bindgen(skip)]
    pub canvas: HtmlCanvasElement,
    #[wasm_bindgen(skip)]
    pub ctx: CanvasRenderingContext2d,
    #[wasm_bindgen(skip)]
    pub config: TableConfig,
    #[wasm_bindgen(skip)]
    pub data: HashMap<String, CellData>,
    /// 行単位の一括データ（大量行バインド向け）
    #[wasm_bindgen(skip)]
    pub row_store: HashMap<usize, Vec<String>>,
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
    pub _editing_keydown_closure: Option<Closure<dyn FnMut(web_sys::KeyboardEvent)>>,
    #[wasm_bindgen(skip)]
    pub _editing_keyup_closure: Option<Closure<dyn FnMut(web_sys::KeyboardEvent)>>,
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
    pub conditional_formats: HashMap<String, CellFormat>,
    #[wasm_bindgen(skip)]
    pub visible_rows: (usize, usize),
    #[wasm_bindgen(skip)]
    pub visible_cols: (usize, usize),
    // フィルター・ソート用フィールドを追加
    #[wasm_bindgen(skip)]
    pub filtered_rows: Vec<usize>,
    #[wasm_bindgen(skip)]
    pub is_filtered: bool,
    #[wasm_bindgen(skip)]
    pub render_dirty: bool,
    #[wasm_bindgen(skip)]
    pub last_render_scroll_x: f64,
    #[wasm_bindgen(skip)]
    pub last_render_scroll_y: f64,
    #[wasm_bindgen(skip)]
    pub last_visible_rows: (usize, usize),
    #[wasm_bindgen(skip)]
    pub last_visible_cols: (usize, usize),
}

#[wasm_bindgen]
impl WasabiTable {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: HtmlCanvasElement, config_json: &str) -> Result<WasabiTable, JsValue> {
        let config: TableConfig = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse config: {}", e)))?;

        let ctx = canvas
            .get_context("2d")?
            .unwrap()
            .dyn_into::<CanvasRenderingContext2d>()?;

        // 論理ピクセル（CSS サイズ）を使用。マウス座標と描画座標系を一致させる
        let rect = canvas.get_bounding_client_rect();
        let canvas_width = if rect.width() > 0.0 {
            rect.width()
        } else {
            canvas.width() as f64
        };
        let canvas_height = if rect.height() > 0.0 {
            rect.height()
        } else {
            canvas.height() as f64
        };

        let mut table = WasabiTable {
            canvas: canvas.clone(),
            ctx,
            config,
            data: HashMap::new(),
            row_store: HashMap::new(),
            selected_cell: Some((0, 0)), // 初期選択セル
            selected_range: None,
            is_selecting: false,
            selection_start: None,
            clipboard_data: Vec::new(),
            editing_cell: None,
            editing_input: None,
            _editing_keydown_closure: None,
            _editing_keyup_closure: None,
            _click_closure: None,
            _wheel_closure: None,
            canvas_width,
            canvas_height,
            scroll_x: 0.0,
            scroll_y: 0.0,

            conditional_formats: HashMap::new(),
            visible_rows: (0, 0),
            visible_cols: (0, 0),
            filtered_rows: Vec::new(),
            is_filtered: false,
            render_dirty: true,
            last_render_scroll_x: 0.0,
            last_render_scroll_y: 0.0,
            last_visible_rows: (0, 0),
            last_visible_cols: (0, 0),
        };

        // 表示範囲を計算
        table.calculate_visible_range();
        
        // Rust側でイベントリスナーを設定
        table.setup_event_listeners()?;

        Ok(table)
    }
    
    // Rust側でイベントリスナーを設定（簡素化版）
    fn setup_event_listeners(&mut self) -> Result<(), JsValue> {
        // キャンバスをフォーカス可能にする
        self.canvas.set_attribute("tabindex", "0")?;
        self.canvas.focus()?;
        
        // クリック・ホイールは TypeScript 側で統一処理（二重発火を防ぐ）
        // キーボードイベント処理も TypeScript 側で統一的に処理するため、Rust側では登録しない
        
        Ok(())
    }
    
    // クリックイベントを処理するメソッド（JavaScript側から呼び出される）
    #[wasm_bindgen]
    pub fn handle_canvas_click(&mut self, canvas_x: f64, canvas_y: f64) -> Result<(), JsValue> {
        
        if let Some(cell_pos) = self.pixel_to_cell(canvas_x, canvas_y) {
            let parts: Vec<&str> = cell_pos.split(':').collect();
            if parts.len() != 2 {
                return Ok(());
            }
            let (row, col) = match (parts[0].parse::<usize>(), parts[1].parse::<usize>()) {
                (Ok(r), Ok(c)) => (r, c),
                _ => return Ok(()),
            };
            
            // 編集中の場合の処理
            if let Some((editing_row, editing_col)) = self.editing_cell {
                // 同じセルをクリックした場合は何もしない（編集継続）
                if editing_row == row && editing_col == col {
                    return Ok(());
                }
                
                // 異なるセルをクリックした場合は編集を終了
                self.finish_editing()?;
            }
            
            // 範囲選択状態をクリア（通常のクリック時）
            // 注意：Shift+クリックの場合は、TypeScript側で処理されるため、ここではクリアしない
            self.clear_range_selection_if_needed(false);
            
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

        // スクロール量を調整（より滑らかなスクロール）
        let scroll_factor = 0.3; // さらに滑らかに調整
        let adjusted_delta_x = delta_x * scroll_factor;
        let adjusted_delta_y = delta_y * scroll_factor;
        
        // スクロール前の位置を保存
        let old_scroll_x = self.scroll_x;
        let old_scroll_y = self.scroll_y;
        
        self.scroll(adjusted_delta_x, adjusted_delta_y);
        
        // スクロール位置が実際に変更された場合のみレンダリング
        if (self.scroll_x - old_scroll_x).abs() > 0.1 || (self.scroll_y - old_scroll_y).abs() > 0.1 {
            self.render()?;
        }
        
        Ok(())
    }

    // キーボードイベントを処理するメソッド（JavaScript側から呼び出される）
    #[wasm_bindgen]
    pub fn handle_canvas_keydown(&mut self, key: &str) -> Result<(), JsValue> {
        
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
                    }
                    self.render()?;
                } else if let Some((row, col)) = self.selected_cell {
                    // 選択中の場合：右のセルに移動
                    if col + 1 < self.config.col_count {
                        self.selected_cell = Some((row, col + 1));
                        self.render()?;
                    }
                }
            }
            "Escape" => {
                if self.editing_cell.is_some() {
                    // 編集中の場合：編集をキャンセル
                    self.cancel_editing()?;
                }
            }
            "F2" => {
                if let Some((row, col)) = self.selected_cell {
                    if self.editing_cell.is_none() {
                        // F2で編集開始（既存の値を保持）
                        self.start_editing(row, col)?;
                    }
                }
            }
            "Delete" | "Backspace" => {
                // 範囲選択がある場合は、範囲内の全セルをクリア
                if let Some(range) = self.selected_range {
                    for row in self.selected_rows_in_display_order(range) {
                        for col in Self::selected_cols(range) {
                            self.set_cell_data(row, col, String::new())?;
                        }
                    }
                    
                    // 範囲選択をクリアして単一セル選択に戻す
                    let active_cell = (range.end_row, range.end_col);
                    self.clear_range_selection_if_needed(false);
                    self.selected_cell = Some(active_cell);
                    
                    self.render()?;
                } else if let Some((row, col)) = self.selected_cell {
                    if self.editing_cell.is_none() {
                        // 編集中でない場合：セルの内容をクリア
                        self.set_cell_data(row, col, String::new())?;
                        self.render()?;
                    }
                }
            }
            _ => {
                // 印刷可能な文字の場合
                if self.is_printable_character(key) {
                    // 範囲選択がある場合は、アクティブセルで編集を開始
                    if let Some(range) = self.selected_range {
                        let active_cell = (range.end_row, range.end_col);
                        self.clear_range_selection_if_needed(false);
                        self.selected_cell = Some(active_cell);
                        if self.editing_cell.is_none() {
                            self.start_editing_with_value(active_cell.0, active_cell.1, key)?;
                        }
                    } else if let Some((row, col)) = self.selected_cell {
                        if self.editing_cell.is_none() {
                            // 編集開始（既存の値をクリアして新しい文字から開始）
                            self.start_editing_with_value(row, col, key)?;
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

    /// 編集中のセル位置を取得（"row:col" 形式）
    #[wasm_bindgen]
    pub fn get_editing_cell(&self) -> Option<String> {
        self.editing_cell
            .map(|(row, col)| format!("{}:{}", row, col))
    }

    /// 編集中の入力フィールドの現在値を取得
    #[wasm_bindgen]
    pub fn get_editing_input_value(&self) -> Option<String> {
        self.editing_input.as_ref().map(|input| input.value())
    }
    
    // 選択されたセルの位置を取得
    #[wasm_bindgen]
    pub fn get_selected_cell(&self) -> Option<String> {
        self.selected_cell.map(|(row, col)| format!("{}:{}", row, col))
    }

    fn stored_cell_value(&self, row: usize, col: usize) -> Option<String> {
        if let Some(row_values) = self.row_store.get(&row) {
            return row_values.get(col).cloned();
        }
        let key = format!("{}:{}", row, col);
        self.data.get(&key).map(|cell| cell.value.clone())
    }

    fn stored_data_cell_count(&self) -> usize {
        let row_cells: usize = self.row_store.values().map(|values| values.len()).sum();
        self.data.len() + row_cells
    }

    fn parse_cell_key(key: &str) -> Option<(usize, usize)> {
        let mut parts = key.split(':');
        let row: usize = parts.next()?.parse().ok()?;
        let col: usize = parts.next()?.parse().ok()?;
        Some((row, col))
    }

    /// 現在の row_count / col_count 外のセルデータを除去
    fn prune_stored_data_beyond_bounds(&mut self) {
        self.data.retain(|key, _| {
            Self::parse_cell_key(key)
                .map(|(row, col)| row < self.config.row_count && col < self.config.col_count)
                .unwrap_or(false)
        });
        self.conditional_formats.retain(|key, _| {
            Self::parse_cell_key(key)
                .map(|(row, col)| row < self.config.row_count && col < self.config.col_count)
                .unwrap_or(false)
        });
        self.row_store.retain(|&row, values| {
            if row >= self.config.row_count {
                return false;
            }
            values.truncate(self.config.col_count);
            values.iter().any(|v| !v.is_empty())
        });
    }

    #[wasm_bindgen]
    pub fn clear_all_cell_data(&mut self) -> Result<(), JsValue> {
        self.data.clear();
        self.row_store.clear();
        self.conditional_formats.clear();
        self.mark_render_dirty();
        Ok(())
    }

    #[wasm_bindgen]
    pub fn reset_scroll(&mut self) {
        self.scroll_x = 0.0;
        self.scroll_y = 0.0;
        self.calculate_visible_range();
        self.mark_render_dirty();
    }

    #[wasm_bindgen]
    pub fn set_cell_data(&mut self, row: usize, col: usize, value: String) -> Result<(), JsValue> {
        if row >= self.config.row_count || col >= self.config.col_count {
            return Err(JsValue::from_str("Row or column index out of bounds"));
        }

        if let Some(row_values) = self.row_store.get_mut(&row) {
            if col < row_values.len() {
                row_values[col] = value;
                self.mark_render_dirty();
                return Ok(());
            }
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
            validation_error: validation_error_info,
        });

        self.mark_render_dirty();
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
        self.stored_cell_value(row, col)
    }

    /// records モードのビューポート同期前に row_store をクリア
    #[wasm_bindgen]
    pub fn clear_row_store(&mut self) {
        self.row_store.clear();
        self.mark_render_dirty();
    }

    /// 行単位でセル値を一括設定（records モードの大量バインド向け）
    #[wasm_bindgen]
    pub fn set_row_batch(&mut self, json: &str) -> Result<(), JsValue> {
        #[derive(serde::Deserialize)]
        struct RowBatchPayload {
            start_row: usize,
            values: Vec<Vec<String>>,
        }

        let batch: RowBatchPayload = serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse row batch: {}", e)))?;

        for (offset, row_values) in batch.values.into_iter().enumerate() {
            let row = batch.start_row + offset;
            if row >= self.config.row_count {
                break;
            }
            if row_values.len() != self.config.col_count {
                return Err(JsValue::from_str(&format!(
                    "Row {} has {} values, expected {}",
                    row,
                    row_values.len(),
                    self.config.col_count
                )));
            }
            self.row_store.insert(row, row_values);
        }

        self.mark_render_dirty();
        Ok(())
    }

    fn ensure_column_headers_capacity(&mut self, col: usize) {
        while self.config.column_headers.len() <= col {
            let i = self.config.column_headers.len();
            self.config.column_headers.push(crate::types::ColumnHeader {
                name: format!("col_{}", i),
                display_name: self.get_column_name(i),
                ..Default::default()
            });
        }
    }

    // ヘッダー表示名を設定（column_headers に統合）
    #[wasm_bindgen]
    pub fn set_header(&mut self, col: usize, value: &str) {
        self.ensure_column_headers_capacity(col);
        if let Some(header) = self.config.column_headers.get_mut(col) {
            header.display_name = value.to_string();
        }
        self.mark_render_dirty();
    }

    // ヘッダー表示名を取得（column_headers に統合）
    #[wasm_bindgen]
    pub fn get_header(&self, col: usize) -> Option<String> {
        if let Some(header) = self.config.column_headers.get(col) {
            if !header.display_name.is_empty() {
                return Some(header.display_name.clone());
            }
        }
        if col < self.config.col_count {
            Some(self.get_column_name(col))
        } else {
            None
        }
    }

    // テーブル設定を更新
    #[wasm_bindgen]
    pub fn update_config(&mut self, config_json: &str) -> Result<(), JsValue> {
        match serde_json::from_str::<TableConfig>(config_json) {
            Ok(config) => {
                self.config = config;
                self.prune_stored_data_beyond_bounds();
                self.scroll_x = self.scroll_x.min(self.calculate_max_scroll_x());
                self.scroll_y = self.scroll_y.min(self.calculate_max_scroll_y());
                self.calculate_visible_range();
                self.mark_render_dirty();
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
            if let Err(_e) = self.update_editing_input_position(input, row, col) {
            }
        }
        
        // 範囲選択中の場合は描画を更新
        if self.is_selecting || self.selected_range.is_some() {
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
        (total_width - visible_area_width).max(0.0)
    }

    // 垂直スクロールの最大値を計算
    fn calculate_max_scroll_y(&self) -> f64 {
        let total_height =
            self.effective_row_count() as f64 * self.config.default_row_height;
        
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

        let display_row =
            ((y - self.config.header_height + self.scroll_y) / self.config.default_row_height) as usize;

        let row = if self.is_filtered {
            if self.filtered_rows.is_empty() || display_row >= self.filtered_rows.len() {
                return None;
            }
            self.filtered_rows[display_row]
        } else {
            display_row
        };

        // 列の計算（カスタム幅・固定列対応）
        let freeze = self.config.freeze_cols.min(self.config.col_count);
        let mut accumulated_width = self.config.row_header_width;

        for col in 0..freeze {
            let column_width = self.get_column_width(col);
            if x >= accumulated_width && x < accumulated_width + column_width {
                if row < self.config.row_count {
                    return Some((row, col));
                }
            }
            accumulated_width += column_width;
        }

        let absolute_x = x + self.scroll_x;
        for col in freeze..self.config.col_count {
            let column_width = self.get_column_width(col);
            if absolute_x >= accumulated_width && absolute_x < accumulated_width + column_width {
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
        let header_height = self.config.header_height;
        let row_header_width = self.config.row_header_width;
        let default_row_height = self.config.default_row_height;
        let default_col_width = self.config.default_col_width;

        // 表示可能な行数を計算（フィルターを考慮）
        let available_height = self.canvas_height - header_height;
        let max_visible_rows = (available_height / default_row_height).floor() as usize + 2; // バッファを含む

        // 表示可能な列数を計算
        let available_width = self.canvas_width - row_header_width;
        let max_visible_cols = (available_width / default_col_width).floor() as usize + 2; // バッファを含む

        // スクロール位置から表示開始行を計算
        let start_row_offset = (self.scroll_y / default_row_height).floor() as usize;
        
        // フィルターが適用されている場合
        if self.is_filtered {
            if self.filtered_rows.is_empty() {
                self.visible_rows = (0, 0);
            } else {
                // フィルターされた行の中での表示範囲を計算
                let end_row_offset = std::cmp::min(start_row_offset + max_visible_rows, self.filtered_rows.len());
                self.visible_rows = (start_row_offset, end_row_offset);
            }
        } else {
            // 通常の表示範囲計算
            let end_row = std::cmp::min(start_row_offset + max_visible_rows, self.config.row_count);
            self.visible_rows = (start_row_offset, end_row);
        }

        // 列の表示範囲計算
        let start_col = (self.scroll_x / default_col_width).floor() as usize;
        let end_col = std::cmp::min(start_col + max_visible_cols, self.config.col_count);
        self.visible_cols = (start_col, end_col);
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
        self.effective_row_count() as f64 * self.config.default_row_height
    }

    /// フィルター適用時を考慮した表示行数
    fn effective_row_count(&self) -> usize {
        if self.is_filtered {
            self.filtered_rows.len()
        } else {
            self.config.row_count
        }
    }

    /// データ行番号を画面上のY座標に変換（フィルター対応）
    fn row_to_screen_y(&self, data_row: usize) -> Option<f64> {
        if self.is_filtered {
            if self.filtered_rows.is_empty() {
                return None;
            }
            self.filtered_rows
                .iter()
                .position(|&r| r == data_row)
                .map(|display_row| {
                    display_row as f64 * self.config.default_row_height
                        + self.config.header_height
                        - self.scroll_y
                })
        } else {
            Some(
                data_row as f64 * self.config.default_row_height
                    + self.config.header_height
                    - self.scroll_y,
            )
        }
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
                self.mark_render_dirty();
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
            "dataCells": self.stored_data_cell_count(),
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
        
        // 範囲選択をクリアしてから編集開始
        self.clear_range_selection_if_needed(false);
        self.selected_cell = Some((row, col));
        
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
        let freeze = self.config.freeze_cols.min(self.config.col_count);
        let mut accumulated_width = self.config.row_header_width;

        for prev_col in 0..col {
            accumulated_width += self.get_column_width(prev_col);
        }

        if col < freeze {
            accumulated_width
        } else {
            accumulated_width - self.scroll_x
        }
    }

    fn get_cell_y_for_editing(&self, row: usize) -> f64 {
        self.config.header_height + (row as f64 * self.config.default_row_height) - self.scroll_y
    }

    // 編集を完了する
    #[wasm_bindgen]
    pub fn finish_editing(&mut self) -> Result<(), JsValue> {
        if let Some((row, col)) = self.editing_cell {
            // 編集入力フィールドから値を取得
            let value = if let Some(input) = &self.editing_input {
                input.value()
            } else {
                String::new()
            };
            
            
            // セルデータを更新
            self.set_cell_data(row, col, value)?;
            
            if let Some(input) = self.editing_input.take() {
                self.detach_editing_input_listeners(&input)?;
                if let Some(parent) = input.parent_node() {
                    parent.remove_child(&input)?;
                }
            }
            
            // 編集状態をクリア
            self.editing_cell = None;
            
            // キャンバスにフォーカスを戻す
            self.canvas.focus()?;
            
        }
        
        Ok(())
    }
    
    // 編集をキャンセルする
    #[wasm_bindgen]
    pub fn cancel_editing(&mut self) -> Result<(), JsValue> {
        if let Some((_row, _col)) = self.editing_cell {
            // 編集入力フィールドを削除（値は保存しない）
            if let Some(input) = self.editing_input.take() {
                self.detach_editing_input_listeners(&input)?;
                if let Some(parent) = input.parent_node() {
                    parent.remove_child(&input)?;
                }
            }

            self.editing_cell = None;
            
            // キャンバスにフォーカスを戻す
            self.canvas.focus()?;
            
            // render()の呼び出しを削除（JavaScriptサイドで処理）
            
        }
        
        Ok(())
    }



    fn conditional_format_for_cell(&self, row: usize, col: usize) -> Option<&CellFormat> {
        let key = format!("format:{}:{}", row, col);
        self.conditional_formats.get(&key)
    }

    #[wasm_bindgen]
    pub fn add_conditional_format(&mut self, row: usize, col: usize, format_json: &str) -> Result<(), JsValue> {
        let format: CellFormat = serde_json::from_str(format_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid format JSON: {}", e)))?;
        let key = format!("format:{}:{}", row, col);
        self.conditional_formats.insert(key, format);
        self.mark_render_dirty();
        Ok(())
    }

    #[wasm_bindgen]
    pub fn remove_conditional_format(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        let key = format!("format:{}:{}", row, col);
        self.conditional_formats.remove(&key);
        self.mark_render_dirty();
        Ok(())
    }

    fn mark_render_dirty(&mut self) {
        self.render_dirty = true;
    }

    fn selection_bounds(&self) -> Option<(usize, usize, usize, usize)> {
        if let Some(range) = &self.selected_range {
            Some((
                range.start_row.min(range.end_row),
                range.start_row.max(range.end_row),
                range.start_col.min(range.end_col),
                range.start_col.max(range.end_col),
            ))
        } else if let Some((row, col)) = self.selected_cell {
            Some((row, row, col, col))
        } else {
            None
        }
    }

    fn is_column_header_active(&self, col: usize) -> bool {
        self.selection_bounds()
            .map(|(_, _, min_col, max_col)| col >= min_col && col <= max_col)
            .unwrap_or(false)
    }

    fn is_row_header_active(&self, data_row: usize) -> bool {
        self.selection_bounds()
            .map(|(min_row, max_row, _, _)| data_row >= min_row && data_row <= max_row)
            .unwrap_or(false)
    }

    fn is_cell_in_selection(&self, row: usize, col: usize) -> bool {
        self.selection_bounds()
            .map(|(min_row, max_row, min_col, max_col)| {
                row >= min_row && row <= max_row && col >= min_col && col <= max_col
            })
            .unwrap_or(false)
    }

    fn truncate_text(&self, text: &str, max_width: f64) -> String {
        if max_width <= 0.0 {
            return String::new();
        }

        const ELLIPSIS: &str = "...";
        let approx_char_width = self.config.font_size as f64 * 0.55;
        let max_chars = (max_width / approx_char_width).floor() as usize;
        let char_count = text.chars().count();

        if char_count <= max_chars {
            return text.to_string();
        }

        if max_chars <= ELLIPSIS.len() {
            return ELLIPSIS.to_string();
        }

        let take = max_chars - ELLIPSIS.len();
        format!(
            "{}{ELLIPSIS}",
            text.chars().take(take).collect::<String>()
        )
    }

    // レンダリングメソッドの更新
    #[wasm_bindgen]
    pub fn render(&mut self) -> Result<(), JsValue> {
        let scroll_changed = (self.scroll_x - self.last_render_scroll_x).abs() > 0.5
            || (self.scroll_y - self.last_render_scroll_y).abs() > 0.5;
        let viewport_changed = self.visible_rows != self.last_visible_rows
            || self.visible_cols != self.last_visible_cols;
        let needs_full_render = self.render_dirty || scroll_changed || viewport_changed;

        if needs_full_render {
            self.ctx.clear_rect(0.0, 0.0, self.canvas_width, self.canvas_height);
            self.ctx.set_fill_style_str(&self.config.background_color);
            self.ctx.fill_rect(0.0, 0.0, self.canvas_width, self.canvas_height);
            self.last_render_scroll_x = self.scroll_x;
            self.last_render_scroll_y = self.scroll_y;
            self.last_visible_rows = self.visible_rows;
            self.last_visible_cols = self.visible_cols;
            self.render_dirty = false;
        }
        
        // ===== ヘッダーの固定部分を先に描画 =====
        self.render_fixed_headers()?;
        
        // セルを描画（フィルターを考慮）
        if self.is_filtered {
            // フィルターされた行のみを描画
            for display_row in self.visible_rows.0..self.visible_rows.1 {
                if display_row < self.filtered_rows.len() {
                    let actual_row = self.filtered_rows[display_row];
                    for col in self.visible_cols.0..self.visible_cols.1 {
                        self.render_cell_at_position(actual_row, col, display_row)?;
                    }
                }
            }
        } else {
            // 通常の描画
            for row in self.visible_rows.0..self.visible_rows.1 {
                for col in self.visible_cols.0..self.visible_cols.1 {
                    self.render_cell(row, col)?;
                }
            }
        }
        
        // グリッドを描画
        if self.config.show_grid {
            self.render_grid()?;
        } else {
            self.render_selection_overlay()?;
        }

        // テーブル範囲外の余白を単色で塗りつぶし（幽霊グリッド・選択の防止）
        self.fill_viewport_margins()?;
        
        // スクロール可能なヘッダー部分を最後に描画（セルとグリッドの上に重ねる）
        self.render_scrollable_headers()?;
        
        Ok(())
    }

    // 固定ヘッダー部分の描画（スクロールに影響されない）
    fn render_fixed_headers(&mut self) -> Result<(), JsValue> {
        // ヘッダー背景（固定領域）
        self.ctx.set_fill_style_str(&self.config.header_background_color);
        
        // 左上角の背景（常に固定）
        self.ctx.fill_rect(0.0, 0.0, self.config.row_header_width, self.config.header_height);
        
        // 行ヘッダー背景（左側の固定領域）
        self.ctx.fill_rect(0.0, self.config.header_height, self.config.row_header_width, self.canvas_height - self.config.header_height);
        
        // 左上角の境界線とアイコン
        self.ctx.set_stroke_style_str(&self.config.grid_color);
        self.ctx.set_line_width(2.0);
        self.ctx.stroke_rect(0.0, 0.0, self.config.row_header_width, self.config.header_height);
        
        // 全選択ボタン
        self.ctx.set_fill_style_str(&self.config.text_color);
        let corner_size = 8.0;
        let corner_x = self.config.row_header_width / 2.0 - corner_size / 2.0;
        let corner_y = self.config.header_height / 2.0 - corner_size / 2.0;
        self.ctx.set_line_width(1.0);
        self.ctx.stroke_rect(corner_x, corner_y, corner_size, corner_size);
        
        // 固定境界線
        self.ctx.set_stroke_style_str(&self.config.grid_color);
        self.ctx.set_line_width(1.0);
        
        // 行ヘッダーと列ヘッダーの境界線
        self.ctx.begin_path();
        self.ctx.move_to(self.config.row_header_width, 0.0);
        self.ctx.line_to(self.config.row_header_width, self.canvas_height);
        self.ctx.stroke();

        self.ctx.begin_path();
        self.ctx.move_to(0.0, self.config.header_height);
        self.ctx.line_to(self.canvas_width, self.config.header_height);
        self.ctx.stroke();
        
        Ok(())
    }

    // スクロール可能なヘッダー部分の描画
    fn render_scrollable_headers(&mut self) -> Result<(), JsValue> {
        // 列ヘッダー背景（上部の可変領域）
        self.ctx.set_fill_style_str(&self.config.header_background_color);
        self.ctx.fill_rect(self.config.row_header_width, 0.0, self.canvas_width - self.config.row_header_width, self.config.header_height);
        
        // テキスト描画設定
        self.ctx.set_fill_style_str(&self.config.text_color);
        self.ctx.set_font(&format!("bold {}px {}", self.config.font_size, self.config.font_family));
        self.ctx.set_text_align("center");
        self.ctx.set_text_baseline("middle");
        
        // 列ヘッダーテキストを描画（スクロール対応）
        let max_col = self.visible_cols.1.min(self.config.col_count);
        for col in self.visible_cols.0..max_col {
            let column_width = self.get_column_width(col);
            let x = self.get_column_x_position(col);
            
            // 列ヘッダーは画面内に表示される場合のみ描画
            if x + column_width > self.config.row_header_width && x < self.canvas_width {
                if self.is_column_header_active(col) {
                    self.ctx.set_fill_style_str(&self.config.selected_cell_color);
                    self.ctx.fill_rect(x, 0.0, column_width, self.config.header_height);
                }

                let display_name = if let Some(header) = self.get_column_header(col) {
                    if header.is_visible {
                        header.display_name.clone()
                    } else {
                        continue; // 非表示の列はスキップ
                    }
                } else {
                    self.get_column_name(col)
                };

                let header_text_color = if self.is_column_header_active(col) {
                    "#ffffff"
                } else {
                    self.config.text_color.as_str()
                };
                self.ctx.set_fill_style_str(header_text_color);

                let has_filter_control = self.get_column_header(col).is_some();
                let label_center_x = if has_filter_control {
                    x + (column_width - 28.0) / 2.0
                } else {
                    x + column_width / 2.0
                };
                self.ctx.fill_text(&display_name, label_center_x, self.config.header_height / 2.0)?;

                if has_filter_control {
                    let filter_x = x + column_width - 28.0;
                    self.ctx.set_stroke_style_str(&self.config.grid_color);
                    self.ctx.set_line_width(1.0);
                    self.ctx.begin_path();
                    self.ctx.move_to(filter_x, 2.0);
                    self.ctx.line_to(filter_x, self.config.header_height - 2.0);
                    self.ctx.stroke();

                    let icon_cx = filter_x + 14.0;
                    let icon_cy = self.config.header_height / 2.0;
                    let icon_color = if self.is_column_header_active(col) {
                        "#ffffff"
                    } else {
                        self.config.text_color.as_str()
                    };
                    self.ctx.set_fill_style_str(icon_color);
                    self.ctx.set_font(&format!("{}px {}", self.config.font_size as i32 - 1, self.config.font_family));
                    self.ctx.fill_text("▾", icon_cx, icon_cy + 1.0)?;
                    self.ctx.set_font(&format!("bold {}px {}", self.config.font_size, self.config.font_family));
                }
            }
        }
        
        // 行番号を描画（スクロール対応）
        let max_row = if self.is_filtered {
            self.visible_rows.1.min(self.filtered_rows.len())
        } else {
            self.visible_rows.1.min(self.config.row_count)
        };
        for display_row in self.visible_rows.0..max_row {
            let y = display_row as f64 * self.config.default_row_height + self.config.header_height - self.scroll_y;
            if y + self.config.default_row_height > self.config.header_height && y < self.canvas_height {
                let data_row = if self.is_filtered {
                    if display_row < self.filtered_rows.len() {
                        self.filtered_rows[display_row]
                    } else {
                        continue;
                    }
                } else {
                    display_row
                };

                if self.is_row_header_active(data_row) {
                    self.ctx.set_fill_style_str(&self.config.selected_cell_color);
                    self.ctx.fill_rect(
                        0.0,
                        y,
                        self.config.row_header_width,
                        self.config.default_row_height,
                    );
                }

                let row_number = (data_row + 1).to_string();
                let row_text_color = if self.is_row_header_active(data_row) {
                    "#ffffff"
                } else {
                    self.config.text_color.as_str()
                };
                self.ctx.set_fill_style_str(row_text_color);
                self.ctx.fill_text(
                    &row_number,
                    self.config.row_header_width / 2.0,
                    y + self.config.default_row_height / 2.0,
                )?;
            }
        }
        
        // テキスト設定をリセット
        self.ctx.set_text_align("left");
        self.ctx.set_text_baseline("alphabetic");
        
        Ok(())
    }

    fn render_cell(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        self.render_cell_at_position(row, col, row)
    }

    fn render_cell_at_position(&mut self, data_row: usize, col: usize, display_row: usize) -> Result<(), JsValue> {
        // 行・列が範囲外の場合は描画しない
        if data_row >= self.config.row_count || col >= self.config.col_count {
            return Ok(());
        }
        
        let x = self.get_column_x_position(col);
        let y = (display_row as f64 * self.config.default_row_height as f64) + self.config.header_height as f64 - self.scroll_y;
        let width = self.get_column_width(col);
        let height = self.config.default_row_height as f64;

        // セルが画面外にある場合は描画しない
        if x + width < self.config.row_header_width || 
           x > self.canvas_width || 
           y + height < self.config.header_height || 
           y > self.canvas_height {
            return Ok(());
        }

        // セルの値を取得
        let key = format!("{}:{}", data_row, col);
        let cell_value = self.stored_cell_value(data_row, col).unwrap_or_default();
        let has_validation_error = self.data.get(&key).and_then(|data| data.validation_error.as_ref()).is_some();

        // 条件付き書式を適用
        let mut cell_bg = self.config.background_color.clone();
        let mut cell_text = self.config.text_color.clone();
        let temp_cell = CellData {
            value: cell_value.clone(),
            row: data_row,
            col,
            width,
            height,
            background_color: None,
            text_color: None,
            font_style: None,
            font_weight: None,
            text_decoration: None,
            format: None,
            validation_error: None,
        };
        if let Some(format) = self.conditional_format_for_cell(data_row, col) {
            if format.matches_condition(&temp_cell) {
                if let Some(c) = &format.background_color {
                    cell_bg = c.clone();
                }
                if let Some(c) = &format.text_color {
                    cell_text = c.clone();
                }
            }
        }
        self.ctx.set_fill_style_str(&cell_bg);
        self.ctx.fill_rect(x, y, width, height);

        // 検証エラーがある場合は黄色の枠を描画
        if has_validation_error {
            self.ctx.set_stroke_style_str("#ffc107"); // Bootstrap warning color
            self.ctx.set_line_width(2.0);
            self.ctx.stroke_rect(x + 1.0, y + 1.0, width - 2.0, height - 2.0);
        }

        // フィールドタイプを判定
        let (is_menu_field, is_check_field) = if let Some(header) = self.get_column_header(col) {
            (
                matches!(header.field_type, crate::types::FieldType::MenuField),
                matches!(header.field_type, crate::types::FieldType::CheckField | crate::types::FieldType::BooleanField)
            )
        } else {
            (false, false)
        };

        // CheckFieldの場合はチェックボックスを描画（テキストの代わり）
        if is_check_field {
            let checkbox_size = 16.0;
            let checkbox_x = x + (width / 2.0) - (checkbox_size / 2.0);
            let checkbox_y = y + (height / 2.0) - (checkbox_size / 2.0);
            
            // チェック状態を判定
            let is_checked = match cell_value.to_lowercase().as_str() {
                "true" | "1" | "yes" | "はい" | "✓" | "checked" => true,
                _ => false,
            };
            
            self.draw_checkbox(checkbox_x, checkbox_y, checkbox_size, is_checked)?;
        } else if !cell_value.is_empty() {
            // 通常のテキストを描画
            self.ctx.set_fill_style_str(&cell_text);
            self.ctx.set_font(&format!("{}px {}", self.config.font_size, self.config.font_family));
            
            // アイコン用のスペースを考慮してテキスト位置を調整
            let mut text_x = x + 5.0;
            if has_validation_error {
                text_x += 20.0; // 警告アイコン用のスペース
            }
            if is_menu_field {
                // MenuFieldの場合、右側のドロップダウンアイコン用のスペースを確保
                let max_text_width = width - 25.0 - (text_x - x);
                self.ctx.save();
                self.ctx.rect(text_x, y, max_text_width, height);
                self.ctx.clip();
            }
            
            let max_text_width = if is_menu_field {
                width - 25.0 - (text_x - x)
            } else if has_validation_error {
                width - 25.0 - (text_x - x)
            } else {
                width - 10.0 - (text_x - x)
            };
            let display_text = self.truncate_text(&cell_value, max_text_width);
            let text_y = y + (height / 2.0) + (self.config.font_size as f64 / 3.0);
            self.ctx.fill_text(&display_text, text_x, text_y)?;
            
            if is_menu_field {
                self.ctx.restore();
            }
        }

        // 検証エラーがある場合は警告アイコンを描画
        if has_validation_error {
            self.draw_warning_icon(x + 5.0, y + (height / 2.0) - 8.0)?;
        }

        // MenuFieldの場合は値があるか選択中のみドロップダウンアイコンを描画
        if is_menu_field
            && (!cell_value.is_empty() || self.is_cell_in_selection(data_row, col))
        {
            self.draw_dropdown_icon(x + width - 20.0, y + (height / 2.0) - 6.0)?;
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

    // ドロップダウンアイコンを描画（MenuField用）
    fn draw_dropdown_icon(&mut self, x: f64, y: f64) -> Result<(), JsValue> {
        let size = 12.0;
        
        // 背景の丸いボタンを描画
        self.ctx.begin_path();
        self.ctx.arc(x + size / 2.0, y + size / 2.0, size / 2.0, 0.0, 2.0 * std::f64::consts::PI)?;
        
        // わさび色の背景
        self.ctx.set_fill_style_str("#4a7c59");
        self.ctx.fill();
        
        // 境界線
        self.ctx.set_stroke_style_str("#2d5a3d");
        self.ctx.set_line_width(1.0);
        self.ctx.stroke();
        
        // 下向き矢印を描画
        self.ctx.begin_path();
        let arrow_size = 4.0;
        let center_x = x + size / 2.0;
        let center_y = y + size / 2.0;
        
        // 三角形の矢印
        self.ctx.move_to(center_x - arrow_size / 2.0, center_y - 1.0);
        self.ctx.line_to(center_x + arrow_size / 2.0, center_y - 1.0);
        self.ctx.line_to(center_x, center_y + arrow_size / 2.0);
        self.ctx.close_path();
        
        // 白い矢印
        self.ctx.set_fill_style_str("#ffffff");
        self.ctx.fill();
        
        Ok(())
    }

    // チェックボックスを描画（CheckField用）
    fn draw_checkbox(&mut self, x: f64, y: f64, size: f64, is_checked: bool) -> Result<(), JsValue> {
        // チェックボックスの背景
        self.ctx.begin_path();
        self.ctx.rect(x, y, size, size);
        
        if is_checked {
            // チェック済みの場合はわさび色の背景
            self.ctx.set_fill_style_str("#4a7c59");
        } else {
            // 未チェックの場合は白い背景
            self.ctx.set_fill_style_str("#ffffff");
        }
        self.ctx.fill();
        
        // 境界線
        self.ctx.set_stroke_style_str("#2d5a3d");
        self.ctx.set_line_width(2.0);
        self.ctx.stroke();
        
        // チェックマークを描画
        if is_checked {
            self.ctx.begin_path();
            self.ctx.set_stroke_style_str("#ffffff");
            self.ctx.set_line_width(2.0);
            self.ctx.set_line_cap("round");
            self.ctx.set_line_join("round");
            
            // チェックマークの形状
            let check_offset = size * 0.2;
            let check_width = size * 0.6;
            let check_height = size * 0.4;
            
            // チェックマークのパス
            self.ctx.move_to(x + check_offset, y + size / 2.0);
            self.ctx.line_to(x + check_offset + check_width * 0.4, y + size / 2.0 + check_height * 0.5);
            self.ctx.line_to(x + check_offset + check_width, y + size / 2.0 - check_height * 0.5);
            
            self.ctx.stroke();
        }
        
        Ok(())
    }

    /// テーブル右端・下端より外側のキャンバス余白を背景色で塗る
    fn fill_viewport_margins(&mut self) -> Result<(), JsValue> {
        let table_right = (self.get_table_width() + self.config.row_header_width as f64 - self.scroll_x)
            .max(self.config.row_header_width as f64);
        let table_bottom = (self.get_table_height()
            + self.config.header_height as f64
            - self.scroll_y)
            .max(self.config.header_height as f64);

        self.ctx.set_fill_style_str(&self.config.background_color);

        if table_right < self.canvas_width {
            self.ctx.fill_rect(
                table_right,
                self.config.header_height as f64,
                self.canvas_width - table_right,
                self.canvas_height - self.config.header_height as f64,
            );
        }

        if table_bottom < self.canvas_height {
            self.ctx.fill_rect(
                self.config.row_header_width as f64,
                table_bottom,
                self.canvas_width - self.config.row_header_width as f64,
                self.canvas_height - table_bottom,
            );
        }

        Ok(())
    }

    fn render_grid(&mut self) -> Result<(), JsValue> {
        self.ctx.set_stroke_style_str(&self.config.grid_color);
        self.ctx.set_line_width(1.0);
        
        // 縦線をバッチ処理で描画（カスタム列幅対応）
        let mut accumulated_width = self.config.row_header_width;
        for col in 0..=self.config.col_count {
            let x = accumulated_width - self.scroll_x;
            if x >= self.config.row_header_width && x <= self.canvas_width {
                self.ctx.begin_path();
                self.ctx.move_to(x, self.config.header_height);
                // 縦線はテーブルの実際の高さまで描画（最後の行の終端まで）
                let table_end_y = self.get_table_height() + self.config.header_height - self.scroll_y;
                let line_end_y = table_end_y.min(self.canvas_height);
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
        let max_row = if self.is_filtered {
            self.visible_rows.1.min(self.filtered_rows.len())
        } else {
            self.visible_rows.1.min(self.config.row_count)
        };
        for display_row in self.visible_rows.0..=max_row {
            let y = display_row as f64 * self.config.default_row_height + self.config.header_height - self.scroll_y;
            if y >= self.config.header_height && y <= self.canvas_height {
                self.ctx.begin_path();
                self.ctx.move_to(self.config.row_header_width, y);
                // 横線は最後の列の終端まで描画（テーブルの実際の幅まで）
                let table_end_x = self.get_table_width() + self.config.row_header_width - self.scroll_x;
                let line_end_x = table_end_x.min(self.canvas_width);
                self.ctx.line_to(line_end_x, y);
                self.ctx.stroke();
            }
        }
        
        self.render_selection_overlay()?;
        Ok(())
    }

    /// 選択状態のオーバーレイを描画（グリッド有無に関わらず共通）
    fn render_selection_overlay(&mut self) -> Result<(), JsValue> {
        if let Some(range) = self.selected_range {
            self.ctx.set_fill_style_str("rgba(52, 152, 219, 0.42)");

            for row in range.start_row..=range.end_row {
                for col in range.start_col..=range.end_col {
                    let x = self.get_column_x_position(col);
                    if let Some(y) = self.row_to_screen_y(row) {
                        let column_width = if let Some(header) = self.get_column_header(col) {
                            header.width
                        } else {
                            self.config.default_col_width
                        };

                        if x + column_width > self.config.row_header_width
                            && x < self.canvas_width
                            && y + self.config.default_row_height > self.config.header_height
                            && y < self.canvas_height
                        {
                            self.ctx.fill_rect(x, y, column_width, self.config.default_row_height);
                        }
                    }
                }
            }

            self.ctx.set_stroke_style_str(&self.config.selected_cell_color);
            self.ctx.set_line_width(2.0);

            let start_x = self.get_column_x_position(range.start_col);
            if let (Some(start_y), Some(end_y)) = (
                self.row_to_screen_y(range.start_row),
                self.row_to_screen_y(range.end_row),
            ) {
                let end_x = self.get_column_x_position(range.end_col)
                    + if let Some(header) = self.get_column_header(range.end_col) {
                        header.width
                    } else {
                        self.config.default_col_width
                    };
                let range_width = end_x - start_x;
                let range_height =
                    end_y + self.config.default_row_height - start_y;
                self.ctx.stroke_rect(start_x, start_y, range_width, range_height);
            }
        } else if let Some((row, col)) = self.selected_cell {
            let x = self.get_column_x_position(col);
            if let Some(y) = self.row_to_screen_y(row) {
                let column_width = if let Some(header) = self.get_column_header(col) {
                    header.width
                } else {
                    self.config.default_col_width
                };

                self.ctx.set_fill_style_str("rgba(52, 152, 219, 0.28)");
                self.ctx.fill_rect(x, y, column_width, self.config.default_row_height);
                self.ctx.set_stroke_style_str(&self.config.selected_cell_color);
                self.ctx.set_line_width(2.0);
                self.ctx.stroke_rect(x, y, column_width, self.config.default_row_height);
            }
        }

        self.draw_fill_handle()?;

        Ok(())
    }

    // ヘッダー設定を更新
    #[wasm_bindgen]
    pub fn set_column_headers(&mut self, headers_json: &str) -> Result<(), JsValue> {
        match serde_json::from_str::<Vec<crate::types::ColumnHeader>>(headers_json) {
            Ok(headers) => {
                self.config.column_headers = headers;
                // 列数をヘッダー定義に合わせる（サンプル列のみ表示）
                self.config.col_count = self.config.column_headers.len().max(1);
                self.prune_stored_data_beyond_bounds();
                self.scroll_x = 0.0;
                self.scroll_y = 0.0;
                self.calculate_visible_range();
                self.mark_render_dirty();
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
        if let Some((row, col)) = self.selected_cell {
            let key = format!("{}:{}", row, col);
            if let Some(cell_data) = self.data.get(&key) {
                if let Some(error_info) = &cell_data.validation_error {
                    return Some(error_info.message.clone());
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
        // 絶対座標（スクロールを考慮しない位置）を計算
        let mut absolute_x = self.config.row_header_width;
        for prev_col in 0..col {
            if let Some(header) = self.get_column_header(prev_col) {
                absolute_x += header.width;
            } else {
                absolute_x += self.config.default_col_width;
            }
        }
        let absolute_y = (row as f64 * self.config.default_row_height as f64) + self.config.header_height as f64;
        let screen_x = self.get_column_x_position(col);
        let screen_y = absolute_y - self.scroll_y;
        
        let width = self.get_column_width(col);
        let height = self.config.default_row_height as f64;
        
        serde_json::json!({
            "x": screen_x,
            "y": screen_y,
            "width": width,
            "height": height,
            "centerX": screen_x + width / 2.0,
            "centerY": screen_y + height / 2.0,
            "scroll_x": self.scroll_x,
            "scroll_y": self.scroll_y,
            "absolute_x": absolute_x,
            "absolute_y": absolute_y
        }).to_string()
    }

    /// 指定した値で編集を開始する
    #[wasm_bindgen]
    pub fn start_editing_with_value(&mut self, row: usize, col: usize, initial_value: &str) -> Result<(), JsValue> {
        self.clear_range_selection_if_needed(false);

        if self.editing_cell.is_some() {
            self.finish_editing()?;
        }

        Self::remove_stale_editing_inputs();

        let input = self.create_editing_input(row, col)?;
        input.set_value(initial_value);
        self.attach_editing_input_listeners(&input)?;

        self.editing_cell = Some((row, col));
        self.selected_cell = Some((row, col));

        let document = web_sys::window().unwrap().document().unwrap();
        document.body().unwrap().append_child(&input)?;
        self.editing_input = Some(input.clone());

        input.focus()?;
        input.select();

        Ok(())
    }

    /// 編集中のEnterキーを処理
    #[wasm_bindgen]
    pub fn handle_editing_enter(&mut self) -> Result<(), JsValue> {
        if let Some((row, col)) = self.editing_cell {
            
            // 編集を完了
            self.finish_editing()?;
            
            // 下のセルに移動
            if row + 1 < self.config.row_count {
                self.selected_cell = Some((row + 1, col));
            } else {
                // 最下行の場合は同じセルに留まる
                self.selected_cell = Some((row, col));
            }
            
            // キャンバスにフォーカスを確実に戻す
            self.canvas.focus()?;
            
            // 明示的にレンダリングを実行
            self.render()?;
        }
        Ok(())
    }

    /// 編集中のTabキーを処理
    #[wasm_bindgen]
    pub fn handle_editing_tab(&mut self) -> Result<(), JsValue> {
        if let Some((row, col)) = self.editing_cell {
            
            // 編集を完了
            self.finish_editing()?;
            
            // 右のセルに移動
            if col + 1 < self.config.col_count {
                self.selected_cell = Some((row, col + 1));
            } else {
                // 最右列の場合は同じセルに留まる
                self.selected_cell = Some((row, col));
            }
            
            // キャンバスにフォーカスを確実に戻す
            self.canvas.focus()?;
            
            // 明示的にレンダリングを実行
            self.render()?;
        }
        Ok(())
    }

    /// 編集中のEscapeキーを処理
    #[wasm_bindgen]
    pub fn handle_editing_escape(&mut self) -> Result<(), JsValue> {
        if self.editing_cell.is_some() {
            
            // 編集をキャンセル（cancel_editingでキャンバスフォーカスも処理される）
            self.cancel_editing()?;
            
            // 明示的にレンダリングを実行
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
        // selected_cellは現在の選択を保持（開始位置に固定しない）
        // 範囲選択中は終端位置がアクティブセルとなる
        Ok(())
    }

    // 範囲選択更新
    #[wasm_bindgen]
    pub fn update_range_selection(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        if let Some((start_row, start_col)) = self.selection_start {
            self.selected_range = Some(crate::types::CellRange::new(start_row, start_col, row, col));
            // 現在のアクティブセル位置を更新（範囲選択の終端位置）
            self.selected_cell = Some((row, col));
        } else {
        }
        Ok(())
    }

    // 範囲選択終了
    #[wasm_bindgen]
    pub fn end_range_selection(&mut self) -> Result<(), JsValue> {
        self.is_selecting = false;
        // selection_startとselected_rangeは保持（範囲選択状態を維持）
        // selected_cellも現在の終端位置を保持
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

    // 範囲選択状態をクリアする統一メソッド
    fn clear_range_selection_if_needed(&mut self, preserve_single_selection: bool) {
        if self.selected_range.is_some() || self.is_selecting {
            self.selected_range = None;
            self.is_selecting = false;
            self.selection_start = None;
            if !preserve_single_selection {
                self.selected_cell = None;
            }
        }
    }

    // 選択された範囲をコピー
    #[wasm_bindgen]
    pub fn copy_selection(&mut self) -> Result<String, JsValue> {
        let mut copied_data = Vec::new();
        
        if let Some(range) = self.selected_range {
            for row in self.selected_rows_in_display_order(range) {
                let mut row_data = Vec::new();
                for col in Self::selected_cols(range) {
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
        
        Ok(crate::clipboard_tsv::serialize_tsv_rows(&copied_data))
    }

    // クリップボードからペースト
    #[wasm_bindgen]
    pub fn paste_from_clipboard(&mut self, tsv_data: &str) -> Result<(), JsValue> {
        let paste_data = crate::clipboard_tsv::parse_tsv_rows(tsv_data);

        if paste_data.is_empty() {
            return Ok(());
        }

        let writes = if let Some(range) = self.selected_range {
            if self.should_use_display_order_selection(range) {
                self.plan_display_order_paste(&paste_data, range)
            } else {
                crate::clipboard_paste::plan_excel_paste(
                    &paste_data,
                    Some(&range),
                    self.selected_cell,
                    self.config.row_count,
                    self.config.col_count,
                )
            }
        } else {
            crate::clipboard_paste::plan_excel_paste(
                &paste_data,
                None,
                self.selected_cell,
                self.config.row_count,
                self.config.col_count,
            )
        };

        for (target_row, target_col, value) in writes {
            self.set_cell_data(target_row, target_col, value)?;
        }

        self.render()?;
        Ok(())
    }

    fn current_selection_range(&self) -> Option<crate::types::CellRange> {
        if let Some(range) = self.selected_range {
            Some(range)
        } else if let Some((row, col)) = self.selected_cell {
            Some(crate::types::CellRange::new(row, col, row, col))
        } else {
            None
        }
    }

    fn should_use_display_order_selection(&self, range: crate::types::CellRange) -> bool {
        if !self.is_filtered {
            return false;
        }

        if self.filtered_rows.is_empty() {
            return true;
        }

        self.filtered_rows.contains(&range.start_row)
            && self.filtered_rows.contains(&range.end_row)
    }

    fn selected_rows_in_display_order(&self, range: crate::types::CellRange) -> Vec<usize> {
        if self.should_use_display_order_selection(range) {
            let start = self.filtered_rows.iter().position(|row| *row == range.start_row);
            let end = self.filtered_rows.iter().position(|row| *row == range.end_row);
            if let (Some(start), Some(end)) = (start, end) {
                let from = start.min(end);
                let to = start.max(end);
                return self.filtered_rows[from..=to].to_vec();
            }
        }

        if self.is_filtered {
            return Vec::new();
        }

        (range.start_row..=range.end_row).collect()
    }

    fn selected_cols(range: crate::types::CellRange) -> Vec<usize> {
        (range.start_col..=range.end_col).collect()
    }

    fn plan_display_order_paste(
        &self,
        paste_data: &[Vec<String>],
        range: crate::types::CellRange,
    ) -> Vec<(usize, usize, String)> {
        if paste_data.is_empty() {
            return Vec::new();
        }

        let selected_rows = self.selected_rows_in_display_order(range);
        let selected_cols = Self::selected_cols(range);
        if selected_rows.is_empty() || selected_cols.is_empty() {
            return Vec::new();
        }

        let src_rows = paste_data.len();
        let src_cols = paste_data.iter().map(|row| row.len()).max().unwrap_or(0);
        if src_cols == 0 {
            return Vec::new();
        }

        let mut writes = Vec::new();

        if src_rows == 1 && src_cols == 1 && selected_rows.len() * selected_cols.len() > 1 {
            let value = paste_data[0][0].clone();
            for row in selected_rows {
                for col in selected_cols.iter().copied() {
                    if row < self.config.row_count && col < self.config.col_count {
                        writes.push((row, col, value.clone()));
                    }
                }
            }
            return writes;
        }

        let (active_row, active_col) = self
            .selected_cell
            .unwrap_or((range.start_row, range.start_col));
        let start_row_index = selected_rows
            .iter()
            .position(|row| *row == active_row)
            .unwrap_or(0);
        let start_col_index = selected_cols
            .iter()
            .position(|col| *col == active_col)
            .unwrap_or(0);

        for (row_offset, row_data) in paste_data.iter().enumerate() {
            let Some(row) = selected_rows.get(start_row_index + row_offset).copied() else {
                continue;
            };
            if row >= self.config.row_count {
                continue;
            }

            for (col_offset, value) in row_data.iter().enumerate() {
                let Some(col) = selected_cols.get(start_col_index + col_offset).copied() else {
                    continue;
                };
                if col < self.config.col_count {
                    writes.push((row, col, value.clone()));
                }
            }
        }

        writes
    }

    fn collect_range_values(&self, range: crate::types::CellRange) -> Vec<Vec<String>> {
        let rows = range.end_row - range.start_row + 1;
        let cols = range.end_col - range.start_col + 1;
        let mut values = vec![vec![String::new(); cols]; rows];
        for r in 0..rows {
            for c in 0..cols {
                values[r][c] = self
                    .stored_cell_value(range.start_row + r, range.start_col + c)
                    .unwrap_or_default();
            }
        }
        values
    }

    fn fill_handle_screen_position(&self) -> Option<(f64, f64)> {
        let range = self.current_selection_range()?;
        let x = self.get_column_x_position(range.end_col);
        let y = self.row_to_screen_y(range.end_row)?;
        let width = self.get_column_width(range.end_col);
        let height = self.config.default_row_height;
        Some((x + width, y + height))
    }

    fn draw_fill_handle(&mut self) -> Result<(), JsValue> {
        let Some((hx, hy)) = self.fill_handle_screen_position() else {
            return Ok(());
        };
        if hx < self.config.row_header_width
            || hy < self.config.header_height
            || hx > self.canvas_width
            || hy > self.canvas_height
        {
            return Ok(());
        }

        const SIZE: f64 = 6.0;
        self.ctx.set_fill_style_str(&self.config.selected_cell_color);
        self.ctx.fill_rect(hx - SIZE / 2.0, hy - SIZE / 2.0, SIZE, SIZE);
        self.ctx.set_stroke_style_str("#ffffff");
        self.ctx.set_line_width(1.0);
        self.ctx.stroke_rect(hx - SIZE / 2.0, hy - SIZE / 2.0, SIZE, SIZE);
        Ok(())
    }

    /// Fill handle hit-test (canvas coordinates).
    #[wasm_bindgen]
    pub fn hit_test_fill_handle(&self, canvas_x: f64, canvas_y: f64) -> bool {
        const HIT: f64 = 10.0;
        let Some((hx, hy)) = self.fill_handle_screen_position() else {
            return false;
        };
        (canvas_x - hx).abs() <= HIT && (canvas_y - hy).abs() <= HIT
    }

    /// Apply Excel-style autofill by dragging the fill handle to `(fill_end_row, fill_end_col)`.
    #[wasm_bindgen]
    pub fn apply_autofill(&mut self, fill_end_row: usize, fill_end_col: usize) -> Result<(), JsValue> {
        let Some(source) = self.current_selection_range() else {
            return Ok(());
        };
        let source_values = self.collect_range_values(source);
        let writes = crate::autofill::plan_autofill(
            source,
            &source_values,
            fill_end_row,
            fill_end_col,
            self.config.row_count,
            self.config.col_count,
        );
        for (row, col, value) in writes {
            self.set_cell_data(row, col, value)?;
        }
        self.render()?;
        Ok(())
    }

    /// Double-click fill handle: extend series down to adjacent data (Excel-style).
    #[wasm_bindgen]
    pub fn autofill_double_click_down(&mut self) -> Result<(), JsValue> {
        let Some(source) = self.current_selection_range() else {
            return Ok(());
        };
        let ref_col = if source.start_col > 0 {
            source.start_col - 1
        } else {
            source.start_col
        };
        let mut target_last_row = source.end_row;
        for row in (source.end_row + 1)..self.config.row_count {
            if self
                .stored_cell_value(row, ref_col)
                .unwrap_or_default()
                .is_empty()
            {
                break;
            }
            target_last_row = row;
        }
        if target_last_row <= source.end_row {
            return Ok(());
        }
        let source_values = self.collect_range_values(source);
        let writes = crate::autofill::plan_autofill_double_click_down(
            source,
            &source_values,
            target_last_row,
            self.config.row_count,
            self.config.col_count,
        );
        for (row, col, value) in writes {
            self.set_cell_data(row, col, value)?;
        }
        self.render()?;
        Ok(())
    }

    // 選択された範囲の情報を取得
    #[wasm_bindgen]
    pub fn get_selection_info(&self) -> String {
        if let Some(range) = self.selected_range {
            let cell_count = (range.end_row - range.start_row + 1) * (range.end_col - range.start_col + 1);
            let (active_row, active_col) = self
                .selected_cell
                .unwrap_or((range.start_row, range.start_col));
            serde_json::json!({
                "type": "range",
                "hasSelection": true,
                "isRange": true,
                "start_row": range.start_row,
                "start_col": range.start_col,
                "end_row": range.end_row,
                "end_col": range.end_col,
                "active_row": active_row,
                "active_col": active_col,
                "cell_count": cell_count
            }).to_string()
        } else if let Some((row, col)) = self.selected_cell {
            serde_json::json!({
                "type": "single",
                "hasSelection": true,
                "isRange": false,
                "row": row,
                "col": col,
                "active_row": row,
                "active_col": col,
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

    /// Canvasサイズを更新し、表示範囲を再計算
    #[wasm_bindgen]
    pub fn update_canvas_size(&mut self, width: f64, height: f64) -> Result<(), JsValue> {
        self.canvas_width = width;
        self.canvas_height = height;
        self.calculate_visible_range();
        self.mark_render_dirty();
        Ok(())
    }
    
    // フィルター・ソート結果を設定
    #[wasm_bindgen]
    pub fn set_filtered_rows(&mut self, filtered_rows_json: &str) -> Result<(), JsValue> {
        let filtered_rows: Vec<usize> = serde_json::from_str(filtered_rows_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse filtered rows: {}", e)))?;
        
        
        self.filtered_rows = filtered_rows;
        self.is_filtered = true;
        self.mark_render_dirty();

        // 範囲選択の妥当性をチェック
        if let Some(range) = &self.selected_range {
            let is_valid = !self.filtered_rows.is_empty()
                && self.filtered_rows.contains(&range.start_row)
                && self.filtered_rows.contains(&range.end_row);
            if !is_valid {
                self.clear_range_selection_if_needed(true);
            }
        }
        
        // 単一セル選択の妥当性もチェック
        if let Some((row, _)) = self.selected_cell {
            if self.is_filtered && !self.filtered_rows.contains(&row) {
                self.selected_cell = None;
            }
        }
        
        // 表示範囲を再計算
        self.calculate_visible_range();
        
        // 再描画を実行
        self.render()?;

        Ok(())
    }
    
    // フィルターをクリア
    #[wasm_bindgen]
    pub fn clear_filter(&mut self) -> Result<(), JsValue> {
        
        self.filtered_rows.clear();
        self.is_filtered = false;
        self.calculate_visible_range();
        self.mark_render_dirty();

        // 再描画を実行
        self.render()?;
        
        
        Ok(())
    }
    
    // フィルター状態を取得
    #[wasm_bindgen]
    pub fn get_filter_info(&self) -> String {
        serde_json::to_string(&serde_json::json!({
            "isFiltered": self.is_filtered,
            "filteredRowCount": self.filtered_rows.len(),
            "totalRowCount": self.config.row_count
        })).unwrap_or_else(|_| "{}".to_string())
    }

    /// 列ヘッダー右端のリサイズハンドル hit-test（canvas 座標）
    #[wasm_bindgen]
    pub fn hit_test_column_resize(&self, canvas_x: f64, canvas_y: f64, zone: f64) -> i32 {
        let header_height = self.config.header_height as f64;
        let row_header_width = self.config.row_header_width as f64;

        if canvas_y < 0.0 || canvas_y > header_height || canvas_x <= row_header_width {
            return -1;
        }

        let zone = if zone > 0.0 { zone } else { 6.0 };
        let mut absolute_x = row_header_width;

        for col in 0..self.config.col_count {
            let w = self.get_column_width(col);
            let screen_left = absolute_x - self.scroll_x;
            let screen_right = screen_left + w;

            if screen_right > row_header_width && screen_left < self.canvas_width {
                if canvas_x >= screen_right - zone && canvas_x <= screen_right + zone {
                    return col as i32;
                }
            }
            absolute_x += w;
        }

        -1
    }

    /// 列幅を更新（最小 40px）
    #[wasm_bindgen]
    pub fn set_column_width(&mut self, col: usize, width: f64) -> Result<(), JsValue> {
        if col >= self.config.col_count {
            return Err(JsValue::from_str("Column index out of range"));
        }

        let width = width.max(40.0);

        while self.config.column_headers.len() <= col {
            let idx = self.config.column_headers.len();
            let mut header = crate::types::ColumnHeader::default();
            header.name = format!("col_{}", idx);
            header.display_name = self.get_column_name(idx);
            header.width = self.config.default_col_width;
            header.order = idx;
            self.config.column_headers.push(header);
        }

        self.config.column_headers[col].width = width;
        self.calculate_visible_range();
        self.mark_render_dirty();
        self.render()?;
        Ok(())
    }

    /// 列幅を取得（px）
    #[wasm_bindgen]
    pub fn get_column_width_at(&self, col: usize) -> f64 {
        if col >= self.config.col_count {
            return self.config.default_col_width;
        }
        self.get_column_width(col)
    }

    /// 行ヘッダー hit-test（行番号領域クリック）
    #[wasm_bindgen]
    pub fn hit_test_row_header(&self, canvas_x: f64, canvas_y: f64) -> i32 {
        if canvas_x >= self.config.row_header_width as f64
            || canvas_y <= self.config.header_height as f64
        {
            return -1;
        }

        let display_row = ((canvas_y - self.config.header_height as f64 + self.scroll_y)
            / self.config.default_row_height as f64)
            .floor() as usize;

        let row = if self.is_filtered {
            if self.filtered_rows.is_empty() || display_row >= self.filtered_rows.len() {
                return -1;
            }
            self.filtered_rows[display_row]
        } else if display_row < self.config.row_count {
            display_row
        } else {
            return -1;
        };

        row as i32
    }

    /// 行全体を選択（Shift で範囲拡張）
    #[wasm_bindgen]
    pub fn select_entire_row(&mut self, row: usize, extend: bool) -> Result<(), JsValue> {
        if row >= self.config.row_count {
            return Err(JsValue::from_str("Row index out of range"));
        }

        let last_col = self.config.col_count.saturating_sub(1);

        if extend {
            if let Some(range) = self.selected_range {
                self.selected_range = Some(crate::types::CellRange::new(
                    range.start_row.min(row),
                    0,
                    range.end_row.max(row),
                    last_col,
                ));
            } else if let Some((sel_row, _)) = self.selected_cell {
                self.selected_range = Some(crate::types::CellRange::new(
                    sel_row.min(row),
                    0,
                    sel_row.max(row),
                    last_col,
                ));
            } else {
                self.selected_range =
                    Some(crate::types::CellRange::new(row, 0, row, last_col));
            }
        } else {
            self.selected_range = Some(crate::types::CellRange::new(row, 0, row, last_col));
            self.selected_cell = Some((row, 0));
        }

        self.render()?;
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
} 
