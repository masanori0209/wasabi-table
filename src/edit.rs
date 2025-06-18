use wasm_bindgen::prelude::*;
use web_sys::{HtmlInputElement, KeyboardEvent, FocusEvent};
use crate::types::CellData;
use crate::render::Renderable;

pub trait Editable {
    fn start_editing(&mut self, row: usize, col: usize) -> Result<(), JsValue>;
    fn stop_editing(&mut self) -> Result<(), JsValue>;
    fn handle_keydown(&mut self, event: KeyboardEvent) -> Result<(), JsValue>;
}

impl Editable for crate::table::WasabiTable {
    fn start_editing(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        // 既に編集中の場合は終了
        if self.editing_cell.is_some() {
            self.stop_editing()?;
        }
        
        let input = self.create_editing_input(row, col)?;
        
        // 現在のセルの値を取得して入力フィールドに設定
        let current_value = self.get_cell_data(row, col).unwrap_or_default();
        input.set_value(&current_value);
        
        // キーボードイベントリスナーを追加
        self.add_input_keydown_listener(&input)?;
        
        self.editing_cell = Some((row, col));
        
        // DOMに追加
        let document = web_sys::window().unwrap().document().unwrap();
        document.body().unwrap().append_child(&input)?;
        
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
                
                // セル移動は呼び出し元で制御するため、ここでは実行しない
                
                // キャンバスにフォーカスを戻す
                let _ = self.canvas.focus();
                
                web_sys::console::log_1(&format!("✅ [DEBUG] Finished editing cell {}:{}", row, col).into());
            }
        }
        Ok(())
    }

    fn handle_keydown(&mut self, event: KeyboardEvent) -> Result<(), JsValue> {
        match event.key().as_str() {
            "Enter" => {
                event.prevent_default();
                // Enterキー処理はhandle_editing_enterで実行されるため、ここでは何もしない
                web_sys::console::log_1(&"⌨️ [DEBUG] Enter key detected in edit.rs, delegating to handle_editing_enter".into());
            }
            "Escape" => {
                event.prevent_default();
                // Escapeキー処理はhandle_editing_escapeで実行されるため、ここでは何もしない
                web_sys::console::log_1(&"⌨️ [DEBUG] Escape key detected in edit.rs, delegating to handle_editing_escape".into());
            }
            "Tab" => {
                event.prevent_default();
                // Tabキー処理はhandle_editing_tabで実行されるため、ここでは何もしない
                web_sys::console::log_1(&"⌨️ [DEBUG] Tab key detected in edit.rs, delegating to handle_editing_tab".into());
            }
            _ => {}
        }
        Ok(())
    }
}

impl crate::table::WasabiTable {
    pub fn create_editing_input(&self, row: usize, col: usize) -> Result<HtmlInputElement, JsValue> {
        let document = web_sys::window()
            .unwrap()
            .document()
            .unwrap();
        
        let input = document.create_element("input")?;
        let input: HtmlInputElement = input.dyn_into()?;
        
        // スタイルを設定
        let html_element: web_sys::HtmlElement = input.clone().dyn_into()?;
        let style = html_element.style();
        style.set_property("position", "fixed")?;
        style.set_property("z-index", "1000")?;
        style.set_property("border", "2px solid #007bff")?;
        style.set_property("padding", "2px 4px")?;
        style.set_property("font-family", &self.config.font_family)?;
        style.set_property("font-size", &format!("{}px", self.config.font_size))?;
        style.set_property("background", "white")?;
        style.set_property("outline", "none")?;
        
        self.update_editing_input_position(&input, row, col)?;
        
        // 入力タイプを設定
        input.set_type("text");
        
        // Tabキーによるフォーカス移動を無効化
        input.set_attribute("tabindex", "-1")?;
        
        // 追加のイベント阻止設定
        input.set_attribute("data-ninja-editing", "true")?;
        
        Ok(input)
    }

    fn add_input_keydown_listener(&self, input: &HtmlInputElement) -> Result<(), JsValue> {
        use wasm_bindgen::closure::Closure;
        use wasm_bindgen::JsCast;
        
        // キーボードイベントリスナーを追加（改善版）
        let keydown_closure = Closure::wrap(Box::new(move |event: KeyboardEvent| {
            let key = event.key();
            web_sys::console::log_1(&format!("⌨️ [DEBUG] Input key pressed: {}", key).into());
            
            match key.as_str() {
                "Enter" => {
                    event.prevent_default();
                    event.stop_propagation(); // イベント伝播を停止
                    event.stop_immediate_propagation(); // 即座にイベント伝播を停止
                    // グローバル関数を呼び出してEnter処理
                    if let Some(window) = web_sys::window() {
                        if let Some(handle_enter) = window.get("handleEditingEnter") {
                            let js_value: wasm_bindgen::JsValue = handle_enter.into();
                            if let Ok(function) = js_value.dyn_into::<js_sys::Function>() {
                                let _ = function.call0(&window);
                            }
                        }
                    }
                }
                "Tab" => {
                    event.prevent_default();
                    event.stop_propagation(); // イベント伝播を停止
                    event.stop_immediate_propagation(); // 即座にイベント伝播を停止
                    web_sys::console::log_1(&"🚫 [DEBUG] Tab event fully prevented in input field".into());
                    // グローバル関数を呼び出してTab処理
                    if let Some(window) = web_sys::window() {
                        if let Some(handle_tab) = window.get("handleEditingTab") {
                            let js_value: wasm_bindgen::JsValue = handle_tab.into();
                            if let Ok(function) = js_value.dyn_into::<js_sys::Function>() {
                                let _ = function.call0(&window);
                            }
                        }
                    }
                }
                "Escape" => {
                    event.prevent_default();
                    event.stop_propagation(); // イベント伝播を停止
                    event.stop_immediate_propagation(); // 即座にイベント伝播を停止
                    // グローバル関数を呼び出してEscape処理
                    if let Some(window) = web_sys::window() {
                        if let Some(handle_escape) = window.get("handleEditingEscape") {
                            let js_value: wasm_bindgen::JsValue = handle_escape.into();
                            if let Ok(function) = js_value.dyn_into::<js_sys::Function>() {
                                let _ = function.call0(&window);
                            }
                        }
                    }
                }
                // 矢印キーは入力フィールド内でのカーソル移動として処理（デフォルトの動作を許可）
                "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" => {
                    web_sys::console::log_1(&format!("⬅️➡️ [DEBUG] Arrow key {} in input field - allowing default cursor movement", key).into());
                    // デフォルトの動作を許可（入力フィールド内でのカーソル移動）
                    // event.prevent_default() を呼び出さない
                }
                _ => {
                    // その他のキーは通常通り処理
                    // Rustのハンドラーは呼び出さない（重複を避けるため）
                }
            }
        }) as Box<dyn FnMut(_)>);
        
        input.add_event_listener_with_callback("keydown", keydown_closure.as_ref().unchecked_ref())?;
        
        // keyupイベントでもTabキーを阻止（追加の安全措置）
        let keyup_closure = Closure::wrap(Box::new(move |event: KeyboardEvent| {
            let key = event.key();
            if key == "Tab" {
                event.prevent_default();
                event.stop_propagation();
                event.stop_immediate_propagation();
                web_sys::console::log_1(&"🚫 [DEBUG] Tab keyup event also prevented".into());
            }
        }) as Box<dyn FnMut(_)>);
        
        input.add_event_listener_with_callback("keyup", keyup_closure.as_ref().unchecked_ref())?;
        
        // blurイベントリスナーを削除（自動編集完了を無効化）
        // ESCキーでフォーカスが外れた時に意図しない編集完了を防ぐため
        
        // クロージャーをリークして永続化（メモリリークを避けるため、編集終了時に適切にクリーンアップする必要がある）
        keydown_closure.forget();
        keyup_closure.forget();
        
        Ok(())
    }
} 