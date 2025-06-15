use wasm_bindgen::prelude::*;
use web_sys::{HtmlCanvasElement, MouseEvent, WheelEvent, KeyboardEvent};
use serde::{Deserialize, Serialize};

pub mod table;
pub mod types;
pub mod error;
pub mod render;
pub mod events;
pub mod edit;
pub mod merge;
pub mod format;
pub mod validation;

pub use table::NinjaTable;
pub use types::{CellData, TableConfig, CellFormat, Condition};
pub use format::Formattable;
pub use error::NinjaTableError;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}