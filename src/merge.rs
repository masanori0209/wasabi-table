use wasm_bindgen::prelude::*;
use crate::types::{CellData, TableConfig};
use crate::error::NinjaTableError;
use crate::ninja_try;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergedCell {
    pub start_row: usize,
    pub start_col: usize,
    pub row_span: usize,
    pub col_span: usize,
    pub value: String,
}

pub trait Mergeable {
    fn merge_cells(&mut self, start_row: usize, start_col: usize, row_span: usize, col_span: usize) -> Result<(), JsValue>;
    fn unmerge_cells(&mut self, row: usize, col: usize) -> Result<(), JsValue>;
    fn get_merged_cell(&self, row: usize, col: usize) -> Option<&MergedCell>;
    fn is_merged_cell(&self, row: usize, col: usize) -> bool;
}

impl Mergeable for crate::table::NinjaTable {
    fn merge_cells(&mut self, start_row: usize, start_col: usize, end_row: usize, end_col: usize) -> Result<(), JsValue> {
        if start_row > end_row || start_col > end_col {
            return Err(JsValue::from_str("Invalid merge range"));
        }

        let value = self.get_cell_data(start_row, start_col)
            .unwrap_or_default();

        for row in start_row..=end_row {
            for col in start_col..=end_col {
                if row == start_row && col == start_col {
                    self.set_cell_data(row, col, value.clone())?;
                } else {
                    self.set_cell_data(row, col, String::new())?;
                }
            }
        }

        Ok(())
    }

    fn unmerge_cells(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        if let Some(merged_cell) = self.get_merged_cell(row, col).cloned() {
            let merge_key = format!("merge:{}:{}", merged_cell.start_row, merged_cell.start_col);
            self.merged_cells.remove(&merge_key);
            
            // セルデータをクリア
            for r in merged_cell.start_row..merged_cell.start_row + merged_cell.row_span {
                for c in merged_cell.start_col..merged_cell.start_col + merged_cell.col_span {
                    self.set_cell_data(r, c, "".to_string())?;
                }
            }
        }
        Ok(())
    }

    fn get_merged_cell(&self, row: usize, col: usize) -> Option<&MergedCell> {
        // 指定されたセルを含む結合セルを探す
        for (_, merged_cell) in &self.merged_cells {
            if row >= merged_cell.start_row && row < merged_cell.start_row + merged_cell.row_span &&
               col >= merged_cell.start_col && col < merged_cell.start_col + merged_cell.col_span {
                return Some(merged_cell);
            }
        }
        None
    }

    fn is_merged_cell(&self, row: usize, col: usize) -> bool {
        self.get_merged_cell(row, col).is_some()
    }
} 