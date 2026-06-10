//! Excel-compatible TSV clipboard parsing and serialization.

/// Normalize `\r\n` and `\r` to `\n`.
pub fn normalize_clipboard_text(text: &str) -> String {
    text.replace("\r\n", "\n").replace('\r', "\n")
}

/// Parse clipboard TSV into rows. Empty lines become rows with empty cell(s).
pub fn parse_tsv_rows(text: &str) -> Vec<Vec<String>> {
    let mut normalized = normalize_clipboard_text(text);
    if normalized.is_empty() {
        return Vec::new();
    }
    // One trailing newline is an Excel / serialize artifact, not an extra row.
    if normalized.ends_with('\n') {
        normalized.pop();
    }
    if normalized.is_empty() {
        return Vec::new();
    }
    normalized
        .split('\n')
        .map(|line| line.split('\t').map(|s| s.to_string()).collect())
        .collect()
}

/// Serialize rows to Excel-style TSV (`\r\n` + trailing newline).
pub fn serialize_tsv_rows(rows: &[Vec<String>]) -> String {
    if rows.is_empty() {
        return String::new();
    }
    let body = rows
        .iter()
        .map(|row| row.join("\t"))
        .collect::<Vec<_>>()
        .join("\r\n");
    format!("{body}\r\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_crlf_without_trailing_cr_in_cells() {
        assert_eq!(
            parse_tsv_rows("Alpha\tBeta\r\nGamma\tDelta\r\n"),
            vec![
                vec!["Alpha".to_string(), "Beta".to_string()],
                vec!["Gamma".to_string(), "Delta".to_string()],
            ]
        );
    }

    #[test]
    fn preserves_empty_row_between_data() {
        assert_eq!(
            parse_tsv_rows("Top\r\n\r\nBottom\r\n"),
            vec![
                vec!["Top".to_string()],
                vec![String::new()],
                vec!["Bottom".to_string()],
            ]
        );
    }

    #[test]
    fn preserves_tab_only_row() {
        assert_eq!(
            parse_tsv_rows("A\tB\r\n\t\r\nC\tD\r\n"),
            vec![
                vec!["A".to_string(), "B".to_string()],
                vec![String::new(), String::new()],
                vec!["C".to_string(), "D".to_string()],
            ]
        );
    }

    #[test]
    fn round_trips_with_trailing_empty_row() {
        let rows = vec![
            vec!["hello".to_string()],
            vec!["world".to_string()],
            vec![String::new()],
        ];
        assert_eq!(parse_tsv_rows(&serialize_tsv_rows(&rows)), rows);
    }

    #[test]
    fn single_row_excel_paste_no_extra_row() {
        assert_eq!(parse_tsv_rows("hello\r\n"), vec![vec!["hello".to_string()]]);
    }
}
