import { createNinjaTableWithListeners } from 'ninja-table';

async function initTable() {
  const canvas = document.getElementById('myCanvas');
  
  // テーブルとリスナーを同時に作成
  const { table, listeners } = await createNinjaTableWithListeners(
    canvas,
    {
      row_count: 50,
      col_count: 10,
      default_col_width: 120,
      default_row_height: 28
    },
    {
      cellReferenceSelector: '#cellReference',
      formulaInputSelector: '#formulaInput',
      statsElementSelector: '#stats',
      validationErrorSelector: '#validationError',
      validationSuccessSelector: '#validationSuccess'
    }
  );

  // 列ヘッダーを設定
  const columnHeaders = [
    {
      name: "id",
      display_name: "ID",
      width: 60,
      required: true,
      order: 0,
      is_visible: true,
      field_type: "IntegerField",
      min_number: 1,
      max_number: 99999
    },
    {
      name: "name",
      display_name: "名前",
      width: 150,
      required: true,
      order: 1,
      is_visible: true,
      field_type: "CharField",
      max_length: 50
    },
    {
      name: "email",
      display_name: "メールアドレス",
      width: 200,
      required: false,
      order: 2,
      is_visible: true,
      field_type: "EmailField",
      max_length: 100
    },
    {
      name: "salary",
      display_name: "給与",
      width: 100,
      required: false,
      order: 3,
      is_visible: true,
      field_type: "DecimalField",
      max_digits: 8,
      decimal_places: 0
    }
  ];

  // ヘッダー設定を適用
  table.setColumnHeaders(JSON.stringify(columnHeaders));

  // セルに値を設定
  table.setCellValue(0, 0, '1001');
  table.setCellValue(0, 1, '田中太郎');
  table.setCellValue(0, 2, 'tanaka@example.com');
  table.setCellValue(0, 3, '500000');

  // イベントハンドラーを設定
  table.setEventHandlers({
    onCellSelect: (position) => {
      console.log(`選択: ${NinjaTable.getCellReference(position.row, position.col)}`);
    }
  });

  // レンダリング
  table.render();
}

initTable(); 