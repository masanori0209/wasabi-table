export interface CellChange {
    row: number;
    col: number;
    oldValue: string;
    newValue: string;
}
export interface UndoBatch {
    changes: CellChange[];
}
export declare class UndoStack {
    private readonly maxSize;
    private undo;
    private redo;
    constructor(maxSize?: number);
    push(batch: UndoBatch): void;
    canUndo(): boolean;
    canRedo(): boolean;
    popUndo(): UndoBatch | undefined;
    pushRedo(batch: UndoBatch): void;
    popRedo(): UndoBatch | undefined;
    pushUndo(batch: UndoBatch): void;
}
