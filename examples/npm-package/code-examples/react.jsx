import React, { useEffect, useRef, useState } from 'react';
import { createNinjaTableWithListeners } from 'ninja-table';

const NinjaTableComponent = () => {
  const canvasRef = useRef(null);
  const [table, setTable] = useState(null);
  const [listeners, setListeners] = useState(null);
  const [selectedCell, setSelectedCell] = useState('A1');

  useEffect(() => {
    const initTable = async () => {
      if (canvasRef.current) {
        // 統合された初期化
        const { table: tableInstance, listeners: listenersInstance } = 
          await createNinjaTableWithListeners(
            canvasRef.current,
            {
              row_count: 50,
              col_count: 10,
              default_col_width: 120,
              default_row_height: 28
            },
            {
              cellReferenceSelector: '#cellReference',
              formulaInputSelector: '#formulaInput'
            },
            {
              enableValidation: true
            },
            {
              onCellReferenceUpdate: (reference) => {
                setSelectedCell(reference);
              }
            }
          );

        tableInstance.render();
        setTable(tableInstance);
        setListeners(listenersInstance);
      }
    };

    initTable();

    // クリーンアップ
    return () => {
      if (listeners) {
        listeners.destroy();
      }
    };
  }, []);

  return (
    <div>
      <div className="formula-bar">
        <div id="cellReference">{selectedCell}</div>
        <input type="text" id="formulaInput" placeholder="セルの内容を入力..." />
      </div>
      <canvas ref={canvasRef} width={800} height={400} />
    </div>
  );
};

export default NinjaTableComponent; 