use wasm_bindgen::prelude::*;
use crate::types::{CellData, CellFormat, Condition};
use crate::error::WasabiTableError;
use crate::ninja_try;
use crate::render::Renderable;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

pub trait Formattable {
    fn apply_format(&mut self, row: usize, col: usize, format: CellFormat) -> Result<(), JsValue>;
    fn clear_format(&mut self, row: usize, col: usize) -> Result<(), JsValue>;
}

impl Formattable for crate::table::WasabiTable {
    fn apply_format(&mut self, row: usize, col: usize, format: CellFormat) -> Result<(), JsValue> {
        let key = format!("format:{}:{}", row, col);
        self.conditional_formats.insert(key, format);
        Ok(())
    }

    fn clear_format(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        let key = format!("format:{}:{}", row, col);
        self.conditional_formats.remove(&key);
        Ok(())
    }
}

impl CellFormat {
    pub fn apply(&self, cell: &mut CellData) {
        if let Some(bg_color) = &self.background_color {
            cell.background_color = Some(bg_color.clone());
        }
        if let Some(text_color) = &self.text_color {
            cell.text_color = Some(text_color.clone());
        }
        if let Some(font_style) = &self.font_style {
            cell.font_style = Some(font_style.clone());
        }
        if let Some(font_weight) = &self.font_weight {
            cell.font_weight = Some(font_weight.clone());
        }
        if let Some(text_decoration) = &self.text_decoration {
            cell.text_decoration = Some(text_decoration.clone());
        }
    }

    pub fn matches_condition(&self, cell: &CellData) -> bool {
        match self.condition {
            Condition::Equals(ref value) => cell.value == *value,
            Condition::NotEquals(ref value) => cell.value != *value,
            Condition::Contains(ref value) => cell.value.contains(value),
            Condition::NotContains(ref value) => !cell.value.contains(value),
            Condition::StartsWith(ref value) => cell.value.starts_with(value),
            Condition::EndsWith(ref value) => cell.value.ends_with(value),
            Condition::GreaterThan(ref value) => {
                if let Ok(cell_value) = cell.value.parse::<f64>() {
                    cell_value > *value
                } else {
                    false
                }
            },
            Condition::LessThan(ref value) => {
                if let Ok(cell_value) = cell.value.parse::<f64>() {
                    cell_value < *value
                } else {
                    false
                }
            },
            Condition::GreaterThanOrEqual(ref value) => {
                if let Ok(cell_value) = cell.value.parse::<f64>() {
                    cell_value >= *value
                } else {
                    false
                }
            },
            Condition::LessThanOrEqual(ref value) => {
                if let Ok(cell_value) = cell.value.parse::<f64>() {
                    cell_value <= *value
                } else {
                    false
                }
            },
            Condition::Between(min, max) => {
                if let Ok(num) = cell.value.parse::<f64>() {
                    num >= min && num <= max
                } else {
                    false
                }
            }
            Condition::IsEmpty => cell.value.is_empty(),
            Condition::IsNotEmpty => !cell.value.is_empty(),
        }
    }
} 