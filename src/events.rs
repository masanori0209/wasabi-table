use wasm_bindgen::prelude::*;
use web_sys::{MouseEvent, WheelEvent, KeyboardEvent};
use crate::types::CellData;
use crate::render::Renderable;

pub trait EventHandler {
    fn handle_click(&mut self, event: MouseEvent) -> Result<(), JsValue>;
    fn handle_wheel(&mut self, event: WheelEvent) -> Result<(), JsValue>;
    fn handle_keydown(&mut self, event: KeyboardEvent) -> Result<(), JsValue>;
}

impl EventHandler for crate::table::NinjaTable {
    fn handle_click(&mut self, event: MouseEvent) -> Result<(), JsValue> {
        let rect = self.canvas.get_bounding_client_rect();
        let x = event.client_x() as f64 - rect.left();
        let y = event.client_y() as f64 - rect.top();

        web_sys::console::log_1(&format!("🖱️ [DEBUG] Click at ({}, {})", x, y).into());

        if let Some(cell_pos) = self.select_cell(x, y) {
            web_sys::console::log_1(&format!("📌 [DEBUG] Selected cell: {}", cell_pos).into());
            self.render()?;
        }
        Ok(())
    }

    fn handle_wheel(&mut self, event: WheelEvent) -> Result<(), JsValue> {
        let delta_x = event.delta_x();
        let delta_y = event.delta_y();

        web_sys::console::log_1(&format!("🔄 [DEBUG] Wheel delta: ({}, {})", delta_x, delta_y).into());

        // スクロール量を調整（より滑らかなスクロール）
        let scroll_factor = 0.5;
        self.scroll(delta_x * scroll_factor, delta_y * scroll_factor);
        self.render()?;
        Ok(())
    }

    fn handle_keydown(&mut self, event: KeyboardEvent) -> Result<(), JsValue> {
        let key = event.key();
        web_sys::console::log_1(&format!("⌨️ [DEBUG] Key pressed: {}", key).into());
        match key.as_str() {
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
                    if row < self.config.row_count - 1 {
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
                    if col < self.config.col_count - 1 {
                        self.selected_cell = Some((row, col + 1));
                        self.render()?;
                    }
                }
            }
            _ => {}
        }
        Ok(())
    }
} 