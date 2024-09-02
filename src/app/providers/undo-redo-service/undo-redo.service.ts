import { Injectable } from "@angular/core";
import { BulletinModel } from "app/models/bulletin.model";

@Injectable()
export class UndoRedoService {
  public undoStack: Record<string, string[]> = {};
  public redoStack: Record<string, string[]> = {};

  undoRedoActiveBulletin(type: "undo" | "redo", activeBulletinID: string) {
    if (!activeBulletinID) return undefined;
    if (type === "undo" && this.undoStack[activeBulletinID].length > 1) {
      this.redoStack[activeBulletinID].push(this.undoStack[activeBulletinID].pop());
    } else if (
      type === "redo" &&
      this.redoStack[activeBulletinID].length > 0 &&
      this.undoStack[activeBulletinID].length > 0
    ) {
      this.undoStack[activeBulletinID].push(this.redoStack[activeBulletinID].pop());
    } else {
      return undefined;
    }
    const jsonBulletin = JSON.parse(this.undoStack[activeBulletinID].at(-1));
    return BulletinModel.createFromJson(jsonBulletin);
  }

  pushToUndoStack(bulletin: BulletinModel) {
    this.undoStack[bulletin.getId()] ??= [];
    this.undoStack[bulletin.getId()].push(JSON.stringify(bulletin.toJson()));
  }

  initUndoRedoStacksFromServer(bulletin: BulletinModel) {
    this.undoStack[bulletin.getId()] ??= [];
    this.redoStack[bulletin.getId()] ??= [];
    // if there is no entry or only one entry on the stack, then the user did not push any undo-actions
    if (this.undoStack[bulletin.id].length <= 1) {
      this.pushToUndoStack(bulletin);
    }
  }
}
