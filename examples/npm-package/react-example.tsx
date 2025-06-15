// React での NinjaTable 使用例（統合版）
// 実際の使用時は以下のパッケージをインストールしてください:
// npm install ninja-table react @types/react

import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { 
//   createNinjaTableWithListeners,
//   NinjaTable, 
//   NinjaTableListeners,
//   TableConfig, 
//   CellPosition, 
//   EventHandlers 
// } from 'ninja-table';

// 型定義（実際のパッケージから import されます）
interface TableConfig {
  row_count: number;
  col_count: number;
  default_col_width: number;
  default_row_height: number;
  header_height?: number;
  font_family?: string;
  font_size?: number;
  background_color?: string;
  text_color?: string;
  grid_color?: string;
  header_background_color?: string;
  selected_cell_color?: string;
  show_grid?: boolean;
}

interface CellPosition {
  row: number;
  col: number;
}

interface EventHandlers {
  onCellSelect?: (position: CellPosition) => void;
  onEditStart?: (position: CellPosition, value: string) => void;
  onEditEnd?: (position: CellPosition, value: string) => void;
  onCellChange?: (position: CellPosition, oldValue: string, newValue: string) => void;
}

declare class NinjaTable {
  static create(canvas: HTMLCanvasElement, config: Partial<TableConfig>): Promise<NinjaTable>;
  static getCellReference(row: number, col: number): string;
  
  setEventHandlers(handlers: EventHandlers): void;
  render(): void;
  setCellValue(row: number, col: number, value: string): void;
  getCellValue(row: number, col: number): string | undefined;
  getConfig(): TableConfig;
  getStats(): any;
  getSelectedCell(): CellPosition | null;
  selectCell(row: number, col: number): void;
  dispose(): void;
}

// カスタムフック
function useNinjaTable(config: Partial<TableConfig> = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [table, setTable] = useState<NinjaTable | null>(null);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [selectedCellRef, setSelectedCellRef] = useState<string>('A1');
  const [cellValue, setCellValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const updateStats = useCallback(() => {
    if (table) {
      try {
        const tableStats = table.getStats();
        setStats(tableStats);
      } catch (err) {
        console.error('Failed to get stats:', err);
      }
    }
  }, [table]);

  const handleCellSelect = useCallback((position: CellPosition) => {
    setSelectedCell(position);
    const cellRef = NinjaTable.getCellReference(position.row, position.col);
    setSelectedCellRef(cellRef);
    
    if (table) {
      const value = table.getCellValue(position.row, position.col) || '';
      setCellValue(value);
    }
    
    updateStats();
  }, [table, updateStats]);

  const handleCellChange = useCallback((position: CellPosition, oldValue: string, newValue: string) => {
    console.log(`Cell changed: ${NinjaTable.getCellReference(position.row, position.col)} = "${newValue}"`);
    updateStats();
  }, [updateStats]);

  useEffect(() => {
    const initTable = async () => {
      if (!canvasRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        const defaultConfig: Partial<TableConfig> = {
          row_count: 50,
          col_count: 20,
          default_col_width: 120,
          default_row_height: 28,
          header_height: 30,
          font_family: 'Arial, sans-serif',
          font_size: 12,
          background_color: '#ffffff',
          text_color: '#000000',
          grid_color: '#e9ecef',
          header_background_color: '#f8f9fa',
          selected_cell_color: '#667eea',
          show_grid: true,
          ...config
        };

        const ninjaTable = await NinjaTable.create(canvasRef.current, defaultConfig);
        
        ninjaTable.setEventHandlers({
          onCellSelect: handleCellSelect,
          onCellChange: handleCellChange
        });

        ninjaTable.render();
        setTable(ninjaTable);
        
        // 初期選択状態を設定
        handleCellSelect({ row: 0, col: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    initTable();

    return () => {
      if (table) {
        table.dispose();
      }
    };
  }, [config, handleCellSelect, handleCellChange]);

  const setCellValueAndRender = useCallback((row: number, col: number, value: string) => {
    if (table) {
      table.setCellValue(row, col, value);
      table.render();
      updateStats();
    }
  }, [table, updateStats]);

  const getCellValue = useCallback((row: number, col: number) => {
    return table?.getCellValue(row, col);
  }, [table]);

  const render = useCallback(() => {
    table?.render();
  }, [table]);

  return {
    canvasRef,
    table,
    selectedCell,
    selectedCellRef,
    cellValue,
    setCellValue: setCellValueAndRender,
    getCellValue,
    render,
    isLoading,
    error,
    stats
  };
}

// メインコンポーネント
const NinjaTableComponent: React.FC<{
  config?: Partial<TableConfig>;
  onCellSelect?: (position: CellPosition, cellRef: string, value: string) => void;
  onCellChange?: (position: CellPosition, cellRef: string, oldValue: string, newValue: string) => void;
}> = ({ config, onCellSelect, onCellChange }) => {
  const {
    canvasRef,
    table,
    selectedCell,
    selectedCellRef,
    cellValue,
    setCellValue,
    isLoading,
    error,
    stats
  } = useNinjaTable(config);

  const [formulaValue, setFormulaValue] = useState('');

  // セル選択時の処理
  useEffect(() => {
    setFormulaValue(cellValue);
    if (selectedCell && onCellSelect) {
      onCellSelect(selectedCell, selectedCellRef, cellValue);
    }
  }, [selectedCell, selectedCellRef, cellValue, onCellSelect]);

  // 数式バーでの入力処理
  const handleFormulaSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && selectedCell) {
      setCellValue(selectedCell.row, selectedCell.col, formulaValue);
      
      if (onCellChange) {
        onCellChange(selectedCell, selectedCellRef, cellValue, formulaValue);
      }

      // 下のセルに移動
      if (table && selectedCell.row < (table.getConfig().row_count - 1)) {
        table.selectCell(selectedCell.row + 1, selectedCell.col);
        table.render();
      }
    }
  };

  // サンプルデータを読み込み
  const loadSampleData = () => {
    if (!table) return;

    // ヘッダー行
    const headers = ['名前', '年齢', '職業', '給与', '部署', 'メール', '評価'];
    headers.forEach((header, col) => {
      setCellValue(0, col, header);
    });

    // サンプルデータ
    const sampleData = [
      ['田中太郎', '28', 'エンジニア', '¥500,000', '開発部', 'tanaka@example.com', 'A'],
      ['佐藤花子', '32', 'デザイナー', '¥450,000', 'デザイン部', 'sato@example.com', 'B'],
      ['鈴木一郎', '45', 'マネージャー', '¥700,000', '営業部', 'suzuki@example.com', 'A'],
      ['高橋美咲', '26', 'マーケター', '¥400,000', 'マーケティング部', 'takahashi@example.com', 'B'],
      ['山田健太', '35', 'エンジニア', '¥550,000', '開発部', 'yamada@example.com', 'A']
    ];

    sampleData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        setCellValue(rowIndex + 1, colIndex, cell);
      });
    });
  };

  // テーブルをクリア
  const clearTable = () => {
    if (!table) return;
    
    const config = table.getConfig();
    for (let row = 0; row < config.row_count; row++) {
      for (let col = 0; col < config.col_count; col++) {
        setCellValue(row, col, '');
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>NinjaTable を初期化中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <div>エラー: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* 数式バー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '6px',
        marginBottom: '10px'
      }}>
        <div style={{
          fontWeight: 'bold',
          minWidth: '60px',
          padding: '8px 12px',
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          textAlign: 'center',
          fontFamily: 'Monaco, monospace'
        }}>
          {selectedCellRef}
        </div>
        <input
          type="text"
          value={formulaValue}
          onChange={(e) => setFormulaValue(e.target.value)}
          onKeyDown={handleFormulaSubmit}
          placeholder="セルの内容を入力..."
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontFamily: 'Monaco, monospace',
            fontSize: '14px'
          }}
        />
      </div>

      {/* キャンバス */}
      <div style={{
        border: '2px solid #e9ecef',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '10px',
        backgroundColor: 'white'
      }}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={500}
          style={{ display: 'block', cursor: 'crosshair' }}
        />
      </div>

      {/* コントロール */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '10px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={loadSampleData}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          サンプルデータ
        </button>
        <button
          onClick={clearTable}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          クリア
        </button>
      </div>

      {/* 統計情報 */}
      {stats && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '10px',
          borderRadius: '4px',
          fontFamily: 'Monaco, monospace',
          fontSize: '12px',
          color: '#6c757d'
        }}>
          総セル数: {stats.totalCells?.toLocaleString()} | 
          表示セル数: {stats.visibleCells?.toLocaleString()} | 
          データセル数: {stats.dataCells?.toLocaleString()} | 
          スクロール: ({Math.round(stats.scrollX || 0)}, {Math.round(stats.scrollY || 0)})
        </div>
      )}
    </div>
  );
};

// アプリケーション例
const App: React.FC = () => {
  const [selectedInfo, setSelectedInfo] = useState<string>('');

  const handleCellSelect = (position: CellPosition, cellRef: string, value: string) => {
    setSelectedInfo(`選択: ${cellRef} = "${value}"`);
  };

  const handleCellChange = (position: CellPosition, cellRef: string, oldValue: string, newValue: string) => {
    console.log(`セル変更: ${cellRef} "${oldValue}" → "${newValue}"`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: '#667eea', marginBottom: '20px' }}>
        🥷 NinjaTable React Example
      </h1>
      
      <div style={{ marginBottom: '20px', color: '#666' }}>
        {selectedInfo || 'セルを選択してください'}
      </div>

      <NinjaTableComponent
        config={{
          row_count: 30,
          col_count: 15,
          default_col_width: 140,
          default_row_height: 30
        }}
        onCellSelect={handleCellSelect}
        onCellChange={handleCellChange}
      />

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ color: '#667eea', marginBottom: '10px' }}>使用方法</h3>
        <ul style={{ color: '#666', lineHeight: '1.6' }}>
          <li><strong>矢印キー</strong>: セル移動</li>
          <li><strong>Enter</strong>: 編集確定 & 下のセルに移動</li>
          <li><strong>F2</strong>: 編集開始</li>
          <li><strong>Tab</strong>: 右のセルに移動</li>
          <li><strong>Escape</strong>: 編集キャンセル</li>
          <li><strong>Delete/Backspace</strong>: セル内容削除</li>
          <li><strong>マウスクリック</strong>: セル選択</li>
          <li><strong>マウスホイール</strong>: スクロール</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
export { NinjaTableComponent, useNinjaTable }; 