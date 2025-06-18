#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;
    use web_sys::HtmlCanvasElement;
    use js_sys::Object;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    fn test_column_name() {
        assert_eq!(column_name(0), "A");
        assert_eq!(column_name(25), "Z");
        assert_eq!(column_name(26), "AA");
        assert_eq!(column_name(27), "AB");
        assert_eq!(column_name(701), "ZZ");
        assert_eq!(column_name(702), "AAA");
    }

    #[wasm_bindgen_test]
    fn test_cell_data() {
        let canvas = create_test_canvas();
        let mut table = WasabiTable::new(canvas).unwrap();

        // セルデータの設定と取得
        table.set_cell_data(0, 0, "Test");
        assert_eq!(table.get_cell_data(0, 0), Some("Test".to_string()));
        assert_eq!(table.get_cell_data(1, 1), None);
    }

    #[wasm_bindgen_test]
    fn test_scroll() {
        let canvas = create_test_canvas();
        let mut table = WasabiTable::new(canvas).unwrap();

        // スクロール前の状態
        let initial_scroll = (table.scroll_x, table.scroll_y);

        // スクロール
        table.scroll(100.0, 50.0);

        // スクロール後の状態
        assert!(table.scroll_x > initial_scroll.0);
        assert!(table.scroll_y > initial_scroll.1);
    }

    #[wasm_bindgen_test]
    fn test_config_update() {
        let canvas = create_test_canvas();
        let mut table = WasabiTable::new(canvas).unwrap();

        // 設定の更新
        let config_json = r##"{
            "row_count": 200,
            "col_count": 30,
            "default_row_height": 30.0,
            "default_col_width": 120.0,
            "header_height": 40.0,
            "show_grid": true,
            "grid_color": "#000000",
            "background_color": "#ffffff",
            "text_color": "#000000",
            "header_background_color": "#f0f0f0",
            "selected_cell_color": "#0000ff",
            "font_size": 14.0,
            "font_family": "Arial"
        }"##;

        table.update_config(config_json).unwrap();
        assert_eq!(table.config.row_count, 200);
        assert_eq!(table.config.col_count, 30);
        assert_eq!(table.config.default_row_height, 30.0);
    }

    fn create_test_canvas() -> HtmlCanvasElement {
        let window = web_sys::window().unwrap();
        let document = window.document().unwrap();
        let canvas = document.create_element("canvas").unwrap();
        canvas.set_attribute("width", "800").unwrap();
        canvas.set_attribute("height", "600").unwrap();
        canvas.dyn_into::<HtmlCanvasElement>().unwrap()
    }
} 