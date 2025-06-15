use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// 条件の型定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Condition {
    Equals(String),
    NotEquals(String),
    GreaterThan(f64),
    LessThan(f64),
    Between(f64, f64),
    Contains(String),
    StartsWith(String),
    EndsWith(String),
    IsEmpty,
    IsNotEmpty,
    NotContains(String),
    GreaterThanOrEqual(f64),
    LessThanOrEqual(f64),
}

// セルフォーマットの型定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CellFormat {
    pub condition: Condition,
    pub background_color: Option<String>,
    pub text_color: Option<String>,
    pub font_style: Option<String>,
    pub font_weight: Option<String>,
    pub text_decoration: Option<String>,
}

// セルデータの型定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CellData {
    pub value: String,
    pub row: usize,
    pub col: usize,
    pub width: f64,
    pub height: f64,
    pub background_color: Option<String>,
    pub text_color: Option<String>,
    pub font_style: Option<String>,
    pub font_weight: Option<String>,
    pub text_decoration: Option<String>,
    pub format: Option<CellFormat>,
}

// セルの型定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cell {
    pub value: String,
    pub format: Option<CellFormat>,
}

// テーブル設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableConfig {
    pub row_count: usize,
    pub col_count: usize,
    pub default_row_height: f64,
    pub default_col_width: f64,
    pub header_height: f64,
    pub row_header_width: f64,
    pub show_grid: bool,
    pub grid_color: String,
    pub background_color: String,
    pub text_color: String,
    pub header_background_color: String,
    pub selected_cell_color: String,
    pub font_size: f64,
    pub font_family: String,
    pub font_style: String,
    pub font_weight: String,
}

impl Default for TableConfig {
    fn default() -> Self {
        TableConfig {
            row_count: 100,
            col_count: 26,
            default_row_height: 24.0,
            default_col_width: 100.0,
            header_height: 30.0,
            row_header_width: 50.0,
            show_grid: true,
            grid_color: "#e0e0e0".to_string(),
            background_color: "#ffffff".to_string(),
            text_color: "#333333".to_string(),
            header_background_color: "#f5f5f5".to_string(),
            selected_cell_color: "#3498db".to_string(),
            font_size: 12.0,
            font_family: "Arial, sans-serif".to_string(),
            font_style: "normal".to_string(),
            font_weight: "normal".to_string(),
        }
    }
} 