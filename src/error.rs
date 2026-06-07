use std::fmt;
use wasm_bindgen::JsValue;

#[derive(Debug)]
pub enum WasabiTableError {
    CanvasError(String),
    RenderError(String),
    EventError(String),
    DataError(String),
    ConfigError(String),
}

impl fmt::Display for WasabiTableError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            WasabiTableError::CanvasError(msg) => write!(f, "Canvas error: {}", msg),
            WasabiTableError::RenderError(msg) => write!(f, "Render error: {}", msg),
            WasabiTableError::EventError(msg) => write!(f, "Event error: {}", msg),
            WasabiTableError::DataError(msg) => write!(f, "Data error: {}", msg),
            WasabiTableError::ConfigError(msg) => write!(f, "Config error: {}", msg),
        }
    }
}

impl From<WasabiTableError> for JsValue {
    fn from(error: WasabiTableError) -> Self {
        JsValue::from_str(&error.to_string())
    }
}
