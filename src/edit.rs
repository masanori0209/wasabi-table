use wasm_bindgen::prelude::*;
use web_sys::{HtmlInputElement, KeyboardEvent};
use crate::types::CellData;
use crate::render::Renderable;

pub trait Editable {
    fn start_editing(&mut self, row: usize, col: usize) -> Result<(), JsValue>;
    fn stop_editing(&mut self) -> Result<(), JsValue>;
    fn handle_keydown(&mut self, event: KeyboardEvent) -> Result<(), JsValue>;
}

impl Editable for crate::table::NinjaTable {
    fn start_editing(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        // 既に編集中の場合は終了
        if self.editing_cell.is_some() {
            self.stop_editing()?;
        }
        
        let input = self.create_editing_input(row, col)?;
        
        // 現在のセルの値を取得して入力フィールドに設定
        let current_value = self.data.get(&format!("{}:{}", row, col))
            .map(|cell| cell.value.clone())
            .unwrap_or_default();
        input.set_value(&current_value);
        
        self.editing_cell = Some((row, col));
        self.canvas.parent_element().unwrap().append_child(&input)?;
        self.editing_input = Some(input.clone());
        
        // 入力フィールドにフォーカスを設定
        input.focus()?;
        
        // テキストを全選択
        input.select();
        
        web_sys::console::log_1(&format!("📝 [DEBUG] Started editing cell {}:{}", row, col).into());
        
        Ok(())
    }

    fn stop_editing(&mut self) -> Result<(), JsValue> {
        if let Some(input) = self.editing_input.take() {
            if let Some((row, col)) = self.editing_cell {
                let value = input.value();
                self.set_cell_data(row, col, value)?;
                input.remove();
                self.editing_cell = None;
                self.render()?;
                
                web_sys::console::log_1(&format!("✅ [DEBUG] Finished editing cell {}:{}", row, col).into());
            }
        }
        Ok(())
    }

    fn handle_keydown(&mut self, event: KeyboardEvent) -> Result<(), JsValue> {
        match event.key().as_str() {
            "Enter" => {
                self.stop_editing()?;
            }
            "Escape" => {
                // 編集をキャンセル（値を元に戻す）
                if let Some(input) = self.editing_input.take() {
                    input.remove();
                    self.editing_cell = None;
                    self.render()?;
                }
            }
            "Tab" => {
                event.prevent_default();
                self.stop_editing()?;
            }
            _ => {}
        }
        Ok(())
    }
}

impl crate::table::NinjaTable {
    pub fn create_editing_input(&self, row: usize, col: usize) -> Result<HtmlInputElement, JsValue> {
        let document = web_sys::window()
            .unwrap()
            .document()
            .unwrap();
        
        let input = document.create_element("input")?;
        let input: HtmlInputElement = input.dyn_into()?;
        
        self.update_editing_input_position(&input, row, col)?;
        
        // 入力タイプを設定
        input.set_type("text");
        
        Ok(input)
    }




} 