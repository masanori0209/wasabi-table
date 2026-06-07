use wasm_bindgen::prelude::*;
use wasm_bindgen::closure::Closure;
use wasm_bindgen::JsCast;
use web_sys::{HtmlInputElement, KeyboardEvent};

pub trait Editable {
    fn start_editing(&mut self, row: usize, col: usize) -> Result<(), JsValue>;
    fn stop_editing(&mut self) -> Result<(), JsValue>;
}

impl Editable for crate::table::WasabiTable {
    fn start_editing(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        if self.editing_cell.is_some() {
            self.stop_editing()?;
        }

        let input = self.create_editing_input(row, col)?;
        let current_value = self.get_cell_data(row, col).unwrap_or_default();
        input.set_value(&current_value);
        self.attach_editing_input_listeners(&input)?;

        self.editing_cell = Some((row, col));

        let document = web_sys::window().unwrap().document().unwrap();
        document.body().unwrap().append_child(&input)?;

        self.editing_input = Some(input.clone());
        input.focus()?;
        input.select();

        Ok(())
    }

    fn stop_editing(&mut self) -> Result<(), JsValue> {
        if let Some(input) = self.editing_input.take() {
            if let Some((row, col)) = self.editing_cell {
                let value = input.value();
                self.set_cell_data(row, col, value)?;
                self.detach_editing_input_listeners(&input)?;
                input.remove();
                self.editing_cell = None;
                let _ = self.canvas.focus();
            }
        }
        Ok(())
    }
}

impl crate::table::WasabiTable {
    pub fn create_editing_input(&self, row: usize, col: usize) -> Result<HtmlInputElement, JsValue> {
        let document = web_sys::window().unwrap().document().unwrap();

        let input = document.create_element("input")?;
        let input: HtmlInputElement = input.dyn_into()?;

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

        input.set_type("text");
        input.set_attribute("tabindex", "-1")?;
        input.set_attribute("data-wasabi-editing", "true")?;

        Ok(input)
    }

    fn call_editing_handler(handler_name: &str) {
        if let Some(window) = web_sys::window() {
            if let Some(handler) = window.get(handler_name) {
                let js_value: wasm_bindgen::JsValue = handler.into();
                if let Ok(function) = js_value.dyn_into::<js_sys::Function>() {
                    let _ = function.call0(&window);
                }
            }
        }
    }

    pub(crate) fn attach_editing_input_listeners(
        &mut self,
        input: &HtmlInputElement,
    ) -> Result<(), JsValue> {
        self.detach_editing_input_listeners(input)?;

        let keydown_closure = Closure::wrap(Box::new(move |event: KeyboardEvent| {
            match event.key().as_str() {
                "Enter" => {
                    event.prevent_default();
                    event.stop_propagation();
                    event.stop_immediate_propagation();
                    Self::call_editing_handler("handleEditingEnter");
                }
                "Tab" => {
                    event.prevent_default();
                    event.stop_propagation();
                    event.stop_immediate_propagation();
                    Self::call_editing_handler("handleEditingTab");
                }
                "Escape" => {
                    event.prevent_default();
                    event.stop_propagation();
                    event.stop_immediate_propagation();
                    Self::call_editing_handler("handleEditingEscape");
                }
                _ => {}
            }
        }) as Box<dyn FnMut(KeyboardEvent)>);

        let keyup_closure = Closure::wrap(Box::new(move |event: KeyboardEvent| {
            if event.key() == "Tab" {
                event.prevent_default();
                event.stop_propagation();
                event.stop_immediate_propagation();
            }
        }) as Box<dyn FnMut(KeyboardEvent)>);

        input.add_event_listener_with_callback(
            "keydown",
            keydown_closure.as_ref().unchecked_ref(),
        )?;
        input.add_event_listener_with_callback("keyup", keyup_closure.as_ref().unchecked_ref())?;

        self._editing_keydown_closure = Some(keydown_closure);
        self._editing_keyup_closure = Some(keyup_closure);

        Ok(())
    }

    pub(crate) fn detach_editing_input_listeners(
        &mut self,
        input: &HtmlInputElement,
    ) -> Result<(), JsValue> {
        if let Some(closure) = self._editing_keydown_closure.take() {
            let _ = input.remove_event_listener_with_callback(
                "keydown",
                closure.as_ref().unchecked_ref(),
            );
        }
        if let Some(closure) = self._editing_keyup_closure.take() {
            let _ = input.remove_event_listener_with_callback(
                "keyup",
                closure.as_ref().unchecked_ref(),
            );
        }
        Ok(())
    }

}
