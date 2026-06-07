use wasm_bindgen::prelude::*;

pub mod table;
pub mod types;
pub mod error;
pub mod render;
pub mod edit;

pub mod format;
pub mod validation;

#[cfg(all(test, target_arch = "wasm32"))]
mod tests;

pub use table::WasabiTable;
pub use render::column_name;
pub use types::{CellData, TableConfig, CellFormat, Condition};
pub use format::Formattable;
pub use error::WasabiTableError;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}