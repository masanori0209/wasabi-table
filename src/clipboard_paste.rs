//! Excel-compatible paste target planning.

use crate::types::CellRange;

/// One cell write: (row, col, value).
pub type PasteWrite = (usize, usize, String);

/// Plan paste writes using Excel-style rules.
///
/// - Anchor is the active cell when set, otherwise range top-left, otherwise (0, 0).
/// - A 1×1 clipboard pasted onto a multi-cell selection fills every selected cell.
/// - Otherwise the clipboard block is placed starting at the anchor.
pub fn plan_excel_paste(
    paste_data: &[Vec<String>],
    selected_range: Option<&CellRange>,
    active_cell: Option<(usize, usize)>,
    row_count: usize,
    col_count: usize,
) -> Vec<PasteWrite> {
    if paste_data.is_empty() {
        return Vec::new();
    }

    let src_rows = paste_data.len();
    let src_cols = paste_data.iter().map(|r| r.len()).max().unwrap_or(0);
    if src_cols == 0 {
        return Vec::new();
    }

    let anchor = active_cell.unwrap_or_else(|| {
        selected_range
            .map(|r| (r.start_row, r.start_col))
            .unwrap_or((0, 0))
    });

    let mut writes = Vec::new();

    if src_rows == 1
        && src_cols == 1
        && selected_range.is_some_and(|r| r.cell_count() > 1)
    {
        let value = paste_data[0][0].clone();
        let range = selected_range.unwrap();
        for row in range.start_row..=range.end_row {
            for col in range.start_col..=range.end_col {
                if row < row_count && col < col_count {
                    writes.push((row, col, value.clone()));
                }
            }
        }
        return writes;
    }

    for (row_offset, row_data) in paste_data.iter().enumerate() {
        for (col_offset, value) in row_data.iter().enumerate() {
            let target_row = anchor.0 + row_offset;
            let target_col = anchor.1 + col_offset;
            if target_row < row_count && target_col < col_count {
                writes.push((target_row, target_col, value.clone()));
            }
        }
    }

    writes
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn single_value_fills_multi_cell_selection() {
        let range = CellRange::new(1, 1, 3, 2);
        let writes = plan_excel_paste(
            &[vec!["X".to_string()]],
            Some(&range),
            Some((2, 2)),
            10,
            10,
        );
        assert_eq!(writes.len(), 6);
        for (row, col, val) in &writes {
            assert!(*row >= 1 && *row <= 3);
            assert!(*col >= 1 && *col <= 2);
            assert_eq!(val, "X");
        }
    }

    #[test]
    fn block_paste_starts_at_active_cell() {
        let range = CellRange::new(0, 0, 2, 2);
        let data = vec![
            vec!["A".to_string(), "B".to_string()],
            vec!["C".to_string(), "D".to_string()],
        ];
        let writes = plan_excel_paste(&data, Some(&range), Some((1, 1)), 10, 10);
        assert_eq!(
            writes,
            vec![
                (1, 1, "A".to_string()),
                (1, 2, "B".to_string()),
                (2, 1, "C".to_string()),
                (2, 2, "D".to_string()),
            ]
        );
    }

    #[test]
    fn single_cell_paste_to_single_selection() {
        let writes = plan_excel_paste(
            &[vec!["Hi".to_string()]],
            None,
            Some((0, 0)),
            10,
            10,
        );
        assert_eq!(writes, vec![(0, 0, "Hi".to_string())]);
    }
}
