use wasm_bindgen::prelude::*;
use web_sys::CanvasRenderingContext2d;
use crate::types::{CellData, TableConfig};
use crate::error::NinjaTableError;
use crate::ninja_try;
use std::collections::HashMap;

pub trait Renderable {
    fn render(&mut self) -> Result<(), JsValue>;
    fn render_header(&mut self) -> Result<(), JsValue>;
    fn render_cell(&mut self, row: usize, col: usize) -> Result<(), JsValue>;
    fn render_grid(&mut self) -> Result<(), JsValue>;
}

impl Renderable for crate::table::NinjaTable {
    fn render(&mut self) -> Result<(), JsValue> {
        // 安全なコンテキスト検証
        web_sys::console::log_1(&"🎨 [DEBUG] Starting render process".into());
        
        // contextが有効かチェック
        if self.canvas.get_context("2d").is_err() {
            return Err(NinjaTableError::CanvasError("Canvas context is invalid".into()).into());
        }
        
        // キャンバスをクリア
        web_sys::console::log_1(&format!("🧹 [DEBUG] Clearing canvas: {}x{}", self.canvas_width, self.canvas_height).into());
        self.ctx.clear_rect(0.0, 0.0, self.canvas_width, self.canvas_height);

        // 背景を描画
        web_sys::console::log_1(&"🎨 [DEBUG] Drawing background".into());
        self.ctx.set_fill_style_str(&self.config.background_color);
        self.ctx.set_stroke_style_str(&self.config.grid_color);
        self.ctx.fill_rect(0.0, 0.0, self.canvas_width, self.canvas_height);

        // フォント設定（一度だけ設定）
        let font = format!("{}px {}", self.config.font_size, self.config.font_family);
        self.ctx.set_font(&font);
        self.ctx.set_text_align("left");
        self.ctx.set_text_baseline("middle");

        // バッチ処理で描画
        self.ctx.save();
        
        // ヘッダー描画
        ninja_try!(self.render_header());

        // 可視セル描画
        for row in self.visible_rows.0..self.visible_rows.1 {
            for col in self.visible_cols.0..self.visible_cols.1 {
                ninja_try!(self.render_cell(row, col));
            }
        }

        // グリッド描画
        if self.config.show_grid {
            ninja_try!(self.render_grid());
        }

        self.ctx.restore();

        web_sys::console::log_1(&"✅ [DEBUG] Render completed".into());
        Ok(())
    }

    fn render_header(&mut self) -> Result<(), JsValue> {
        // ヘッダー背景を描画
        self.ctx.set_fill_style_str(&self.config.header_background_color);
        self.ctx.set_stroke_style_str(&self.config.grid_color);
        
        // 列ヘッダー背景
        self.ctx.fill_rect(self.config.row_header_width, 0.0, self.canvas_width - self.config.row_header_width, self.config.header_height);
        
        // 行ヘッダー背景
        self.ctx.fill_rect(0.0, 0.0, self.config.row_header_width, self.canvas_height);
        
        // 左上角の背景
        self.ctx.fill_rect(0.0, 0.0, self.config.row_header_width, self.config.header_height);

        // テキスト描画
        self.ctx.set_fill_style_str(&self.config.text_color);
        self.ctx.set_text_align("center");
        
        // 列ヘッダーテキストを描画
        for col in self.visible_cols.0..self.visible_cols.1 {
            let x = col as f64 * self.config.default_col_width - self.scroll_x + self.config.row_header_width;
            let header_text = if col < self.headers.len() && !self.headers[col].is_empty() {
                self.headers[col].clone()
            } else {
                column_name(col)
            };
            ninja_try!(self.ctx.fill_text(&header_text, x + self.config.default_col_width / 2.0, self.config.header_height / 2.0));
        }
        
        // 行番号を描画
        for row in self.visible_rows.0..self.visible_rows.1 {
            let y = row as f64 * self.config.default_row_height + self.config.header_height - self.scroll_y;
            let row_number = (row + 1).to_string();
            ninja_try!(self.ctx.fill_text(&row_number, self.config.row_header_width / 2.0, y + self.config.default_row_height / 2.0));
        }
        
        self.ctx.set_text_align("left");
        Ok(())
    }

    fn render_cell(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        if let Some(cell) = self.data.get(&format!("{}:{}", row, col)) {
            if let Some(bg_color) = &cell.background_color {
                self.ctx.set_fill_style_str(bg_color);
            }
            if let Some(text_color) = &cell.text_color {
                self.ctx.set_fill_style_str(text_color);
            }
            let x = col as f64 * self.config.default_col_width - self.scroll_x + self.config.row_header_width;
            let y = row as f64 * self.config.default_row_height + self.config.header_height - self.scroll_y;

            // セルの背景色を設定（条件付き書式がある場合）
            if let Some(format) = &cell.format {
                if let Some(bg_color) = &format.background_color {
                    self.ctx.set_fill_style_str(bg_color);
                }
            }

            // テキストを描画
            ninja_try!(self.ctx.fill_text(&cell.value, x + 5.0, y + self.config.default_row_height / 2.0));
        }
        Ok(())
    }

    fn render_grid(&mut self) -> Result<(), JsValue> {
        self.ctx.set_stroke_style_str(&self.config.grid_color);
        self.ctx.set_line_width(1.0);

        // 縦線をバッチ処理で描画
        for col in self.visible_cols.0..=self.visible_cols.1 {
            let x = col as f64 * self.config.default_col_width - self.scroll_x + self.config.row_header_width;
            self.ctx.begin_path();
            self.ctx.move_to(x, self.config.header_height);
            self.ctx.line_to(x, self.canvas_height);
            self.ctx.stroke();
        }

        // 横線をバッチ処理で描画
        for row in self.visible_rows.0..=self.visible_rows.1 {
            let y = row as f64 * self.config.default_row_height + self.config.header_height - self.scroll_y;
            self.ctx.begin_path();
            self.ctx.move_to(self.config.row_header_width, y);
            self.ctx.line_to(self.canvas_width, y);
            self.ctx.stroke();
        }

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
}

pub fn column_name(col: usize) -> String {
    let mut name = String::new();
    let mut col = col;
    loop {
        name.insert(0, (b'A' + (col % 26) as u8) as char);
        if col < 26 {
            break;
        }
        col = col / 26 - 1;
    }
    name
} 