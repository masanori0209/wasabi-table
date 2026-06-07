/// Excel 形式の列名を生成 (A, B, ..., Z, AA, ...)
pub fn column_name(col: usize) -> String {
    let mut name = String::new();
    let mut col = col;
    loop {
        name.insert(0, (b'A' + (col % 26) as u8) as char);
        if col < 26 {
            break;
        }
        col = col / 26 - 1;
    }
    name
}
