export interface CellChange {
  row: number;
  col: number;
  oldValue: string;
  newValue: string;
}

export interface UndoBatch {
  changes: CellChange[];
}

export class UndoStack {
  private undo: UndoBatch[] = [];
  private redo: UndoBatch[] = [];

  constructor(private readonly maxSize = 50) {}

  push(batch: UndoBatch): void {
    const changes = batch.changes.filter((c) => c.oldValue !== c.newValue);
    if (changes.length === 0) return;
    this.undo.push({ changes });
    if (this.undo.length > this.maxSize) {
      this.undo.shift();
    }
    this.redo = [];
  }

  canUndo(): boolean {
    return this.undo.length > 0;
  }

  canRedo(): boolean {
    return this.redo.length > 0;
  }

  popUndo(): UndoBatch | undefined {
    return this.undo.pop();
  }

  pushRedo(batch: UndoBatch): void {
    this.redo.push(batch);
  }

  popRedo(): UndoBatch | undefined {
    return this.redo.pop();
  }

  pushUndo(batch: UndoBatch): void {
    this.undo.push(batch);
    if (this.undo.length > this.maxSize) {
      this.undo.shift();
    }
  }
}
