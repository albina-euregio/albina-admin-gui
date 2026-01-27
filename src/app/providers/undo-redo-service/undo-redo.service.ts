import { DangerSourceVariantModel } from "../../danger-sources/models/danger-source-variant.model";
import { BulletinModel } from "app/models/bulletin.model";

export class UndoRedoState<T extends BulletinModel | DangerSourceVariantModel> {
  public undoStack: Record<string, string[]> = {};
  public redoStack: Record<string, string[]> = {};

  constructor(
    private toJson: (obj: T) => object,
    private createFromJson: (json: object) => T,
  ) {}

  undoRedoActive(type: "undo" | "redo", id: T["id"]) {
    if (!id) return undefined;
    if (type === "undo" && this.isEnabled(type, id)) {
      this.redoStack[id].push(this.undoStack[id].pop());
    } else if (type === "redo" && this.isEnabled(type, id)) {
      this.undoStack[id].push(this.redoStack[id].pop());
    } else {
      return undefined;
    }
    console.info(
      "performing " + type,
      "undo stack size: " + this.undoStack[id].length,
      "redo stack size: " + this.redoStack[id].length,
    );
    const jsonBulletin = JSON.parse(this.undoStack[id].at(-1));
    return this.createFromJson(jsonBulletin);
  }

  isEnabled(type: "undo" | "redo", id: T["id"]) {
    if (type === "undo") {
      return this.undoStack[id]?.length > 1;
    } else if (type === "redo") {
      return this.undoStack[id]?.length > 0 && this.redoStack[id]?.length > 0;
    } else return false;
  }

  pushToUndoStack(model: T) {
    this.redoStack[model.id] = [];
    this.undoStack[model.id] ??= [];
    // cap undo stack at 100 entries
    if (this.undoStack[model.id].length >= 100) {
      this.undoStack[model.id].shift();
    }
    this.undoStack[model.id].push(JSON.stringify(this.toJson(model)));
    console.info(
      "undo stack size: " + this.undoStack[model.id].length,
      "redo stack size: " + this.redoStack[model.id].length,
    );
  }

  initUndoRedoStacksFromServer(model: T) {
    this.undoStack[model.id] ??= [];
    this.redoStack[model.id] ??= [];
    // If the user did not perform any actions of their own, and the state changes on the server, the undo stack should be re-initialized with the state from the server.
    // On the other hand: if the undo stack has length <= 1 because the user is in the middle of some undo/redo, the stacks should not be overwritten.
    if (this.undoStack[model.id].length <= 1 && this.redoStack[model.id].length === 0) {
      this.pushToUndoStack(model);
    }
  }
}
