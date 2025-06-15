use wasm_bindgen::prelude::*;
use std::fmt;

#[derive(Debug)]
pub enum NinjaTableError {
    CanvasError(String),
    RenderError(String),
    EventError(String),
    DataError(String),
    ConfigError(String),
}

impl fmt::Display for NinjaTableError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            NinjaTableError::CanvasError(msg) => write!(f, "Canvas error: {}", msg),
            NinjaTableError::RenderError(msg) => write!(f, "Render error: {}", msg),
            NinjaTableError::EventError(msg) => write!(f, "Event error: {}", msg),
            NinjaTableError::DataError(msg) => write!(f, "Data error: {}", msg),
            NinjaTableError::ConfigError(msg) => write!(f, "Config error: {}", msg),
        }
    }
}

impl From<NinjaTableError> for JsValue {
    fn from(error: NinjaTableError) -> Self {
        JsValue::from_str(&error.to_string())
    }
}

// エラーハンドリング用のマクロ
#[macro_export]
macro_rules! ninja_try {
    ($e:expr) => {
        match $e {
            Ok(_) => (),
            Err(e) => {
                return Err(JsValue::from_str(&format!("Error: {:?}", e)));
            }
        }
    };
} 