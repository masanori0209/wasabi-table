export class UndoStack {
    constructor(maxSize = 50) {
        this.maxSize = maxSize;
        this.undo = [];
        this.redo = [];
    }
    push(batch) {
        const changes = batch.changes.filter((c) => c.oldValue !== c.newValue);
        if (changes.length === 0)
            return;
        this.undo.push({ changes });
        if (this.undo.length > this.maxSize) {
            this.undo.shift();
        }
        this.redo = [];
    }
    canUndo() {
        return this.undo.length > 0;
    }
    canRedo() {
        return this.redo.length > 0;
    }
    popUndo() {
        return this.undo.pop();
    }
    pushRedo(batch) {
        this.redo.push(batch);
    }
    popRedo() {
        return this.redo.pop();
    }
    pushUndo(batch) {
        this.undo.push(batch);
        if (this.undo.length > this.maxSize) {
            this.undo.shift();
        }
    }
}
