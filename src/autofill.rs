//! Excel-style autofill (fill handle) series prediction.

use crate::types::CellRange;

pub type FillWrite = (usize, usize, String);

/// Split trailing digits from text (`Item12` -> (`Item`, 12)).
fn split_text_number(value: &str) -> Option<(String, i64)> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return None;
    }
    let mut split_at = trimmed.len();
    while split_at > 0 && trimmed.as_bytes()[split_at - 1].is_ascii_digit() {
        split_at -= 1;
    }
    if split_at == trimmed.len() || split_at == 0 {
        return None;
    }
    let prefix = trimmed[..split_at].to_string();
    let suffix = trimmed[split_at..].parse::<i64>().ok()?;
    Some((prefix, suffix))
}

fn parse_number(value: &str) -> Option<f64> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return None;
    }
    trimmed.parse::<f64>().ok()
}

/// Extend a 1D series by `extra_count` values.
pub fn extend_series(values: &[String], extra_count: usize) -> Vec<String> {
    if extra_count == 0 {
        return Vec::new();
    }
    if values.is_empty() {
        return vec![String::new(); extra_count];
    }
    if values.len() == 1 {
        return vec![values[0].clone(); extra_count];
    }

    let nums: Vec<f64> = values.iter().filter_map(|v| parse_number(v)).collect();
    if nums.len() == values.len() && nums.len() >= 2 {
        let step = nums[nums.len() - 1] - nums[nums.len() - 2];
        let mut out = Vec::with_capacity(extra_count);
        let mut current = nums[nums.len() - 1];
        for _ in 0..extra_count {
            current += step;
            if (current - current.round()).abs() < f64::EPSILON {
                out.push(format!("{}", current.round() as i64));
            } else {
                out.push(format!("{}", current));
            }
        }
        return out;
    }

    if let Some((prefix, last_num)) = split_text_number(&values[values.len() - 1]) {
        if values
            .iter()
            .all(|v| split_text_number(v).is_some_and(|(p, _)| p == prefix))
        {
            let mut step = 1i64;
            if values.len() >= 2 {
                if let (Some((_, a)), Some((_, b))) = (
                    split_text_number(&values[values.len() - 2]),
                    split_text_number(&values[values.len() - 1]),
                ) {
                    step = b - a;
                    if step == 0 {
                        step = 1;
                    }
                }
            }
            let mut out = Vec::with_capacity(extra_count);
            let mut current = last_num;
            for _ in 0..extra_count {
                current += step;
                out.push(format!("{prefix}{current}"));
            }
            return out;
        }
    }

    vec![values[values.len() - 1].clone(); extra_count]
}

/// Extend a series backward (cells above / left of the source).
pub fn extend_series_before(values: &[String], extra_count: usize) -> Vec<String> {
    if extra_count == 0 {
        return Vec::new();
    }
    if values.is_empty() {
        return vec![String::new(); extra_count];
    }
    if values.len() == 1 {
        return vec![values[0].clone(); extra_count];
    }

    let nums: Vec<f64> = values.iter().filter_map(|v| parse_number(v)).collect();
    if nums.len() == values.len() && nums.len() >= 2 {
        let step = nums[1] - nums[0];
        let mut out = Vec::with_capacity(extra_count);
        let mut current = nums[0];
        for _ in 0..extra_count {
            current -= step;
            if (current - current.round()).abs() < f64::EPSILON {
                out.push(format!("{}", current.round() as i64));
            } else {
                out.push(format!("{}", current));
            }
        }
        out.reverse();
        return out;
    }

    if let Some((prefix, first_num)) = split_text_number(&values[0]) {
        if values
            .iter()
            .all(|v| split_text_number(v).is_some_and(|(p, _)| p == prefix))
        {
            let mut step = 1i64;
            if values.len() >= 2 {
                if let (Some((_, a)), Some((_, b))) =
                    (split_text_number(&values[0]), split_text_number(&values[1]))
                {
                    step = b - a;
                    if step == 0 {
                        step = 1;
                    }
                }
            }
            let mut out = Vec::with_capacity(extra_count);
            let mut current = first_num;
            for _ in 0..extra_count {
                current -= step;
                out.push(format!("{prefix}{current}"));
            }
            out.reverse();
            return out;
        }
    }

    vec![values[0].clone(); extra_count]
}

/// Compute autofill writes for dragging the fill handle to `(fill_end_row, fill_end_col)`.
pub fn plan_autofill(
    source: CellRange,
    source_values: &[Vec<String>],
    fill_end_row: usize,
    fill_end_col: usize,
    row_count: usize,
    col_count: usize,
) -> Vec<FillWrite> {
    if source_values.is_empty() {
        return Vec::new();
    }

    let extend_down = fill_end_row > source.end_row;
    let extend_up = fill_end_row < source.start_row;
    let extend_right = fill_end_col > source.end_col;
    let extend_left = fill_end_col < source.start_col;

    if !extend_down && !extend_up && !extend_right && !extend_left {
        return Vec::new();
    }

    let row_delta_down = fill_end_row.saturating_sub(source.end_row);
    let row_delta_up = source.start_row.saturating_sub(fill_end_row);
    let col_delta_right = fill_end_col.saturating_sub(source.end_col);
    let col_delta_left = source.start_col.saturating_sub(fill_end_col);

    let vertical = row_delta_down.max(row_delta_up) >= col_delta_right.max(col_delta_left);

    let mut writes = Vec::new();

    if vertical {
        let src_rows = source.end_row - source.start_row + 1;
        let src_cols = source.end_col - source.start_col + 1;

        if extend_down {
            for col_off in 0..src_cols {
                let col = source.start_col + col_off;
                if col >= col_count {
                    continue;
                }
                let column_values: Vec<String> = (0..src_rows)
                    .map(|r| {
                        source_values
                            .get(r)
                            .and_then(|row| row.get(col_off))
                            .cloned()
                            .unwrap_or_default()
                    })
                    .collect();
                let extras = extend_series(&column_values, row_delta_down);
                for (i, value) in extras.into_iter().enumerate() {
                    let row = source.end_row + 1 + i;
                    if row < row_count {
                        writes.push((row, col, value));
                    }
                }
            }
        }

        if extend_up {
            for col_off in 0..src_cols {
                let col = source.start_col + col_off;
                if col >= col_count {
                    continue;
                }
                let column_values: Vec<String> = (0..src_rows)
                    .map(|r| {
                        source_values
                            .get(r)
                            .and_then(|row| row.get(col_off))
                            .cloned()
                            .unwrap_or_default()
                    })
                    .collect();
                let extras = extend_series_before(&column_values, row_delta_up);
                for (i, value) in extras.into_iter().enumerate() {
                    let row = fill_end_row + i;
                    if row < source.start_row && row < row_count {
                        writes.push((row, col, value));
                    }
                }
            }
        }
    } else if extend_right {
        let src_rows = source.end_row - source.start_row + 1;
        let src_cols = source.end_col - source.start_col + 1;

        for row_off in 0..src_rows {
            let row = source.start_row + row_off;
            if row >= row_count {
                continue;
            }
            let row_values: Vec<String> = (0..src_cols)
                .map(|c| {
                    source_values
                        .get(row_off)
                        .and_then(|r| r.get(c))
                        .cloned()
                        .unwrap_or_default()
                })
                .collect();
            let extras = extend_series(&row_values, col_delta_right);
            for (i, value) in extras.into_iter().enumerate() {
                let col = source.end_col + 1 + i;
                if col < col_count {
                    writes.push((row, col, value));
                }
            }
        }
    } else if extend_left {
        let src_rows = source.end_row - source.start_row + 1;
        let src_cols = source.end_col - source.start_col + 1;

        for row_off in 0..src_rows {
            let row = source.start_row + row_off;
            if row >= row_count {
                continue;
            }
            let row_values: Vec<String> = (0..src_cols)
                .map(|c| {
                    source_values
                        .get(row_off)
                        .and_then(|r| r.get(c))
                        .cloned()
                        .unwrap_or_default()
                })
                .collect();
            let extras = extend_series_before(&row_values, col_delta_left);
            for (i, value) in extras.into_iter().enumerate() {
                let col = fill_end_col + i;
                if col < source.start_col && col < col_count {
                    writes.push((row, col, value));
                }
            }
        }
    }

    writes
}

/// Double-click fill down: extend each column in `source` to `target_last_row`.
pub fn plan_autofill_double_click_down(
    source: CellRange,
    source_values: &[Vec<String>],
    target_last_row: usize,
    row_count: usize,
    col_count: usize,
) -> Vec<FillWrite> {
    if target_last_row <= source.end_row {
        return Vec::new();
    }
    plan_autofill(
        source,
        source_values,
        target_last_row,
        source.end_col,
        row_count,
        col_count,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extend_numeric_series() {
        assert_eq!(
            extend_series(&["1".into(), "2".into()], 3),
            vec!["3", "4", "5"]
        );
    }

    #[test]
    fn extend_single_value_repeats() {
        assert_eq!(
            extend_series(&["hello".into()], 2),
            vec!["hello", "hello"]
        );
    }

    #[test]
    fn extend_text_with_number() {
        assert_eq!(
            extend_series(&["Item1".into(), "Item2".into()], 2),
            vec!["Item3", "Item4"]
        );
    }

    #[test]
    fn autofill_down_from_two_numbers() {
        let source = CellRange::new(0, 0, 1, 0);
        let values = vec![vec!["1".into()], vec!["2".into()]];
        let writes = plan_autofill(source, &values, 4, 0, 10, 10);
        assert_eq!(
            writes,
            vec![
                (2, 0, "3".to_string()),
                (3, 0, "4".to_string()),
                (4, 0, "5".to_string()),
            ]
        );
    }
}
