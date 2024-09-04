import { Injectable } from "@angular/core";
import { BulletinModel } from "app/models/bulletin.model";

@Injectable()
export class UndoRedoService {
  public undoStack: Record<string, string[]> = {};
  public redoStack: Record<string, string[]> = {};

  undoRedoActiveBulletin(type: "undo" | "redo", activeBulletinID: string) {
    if (!activeBulletinID) return undefined;
    if (type === "undo" && this.isEnabled(type, activeBulletinID)) {
      this.redoStack[activeBulletinID].push(this.undoStack[activeBulletinID].pop());
    } else if (type === "redo" && this.isEnabled(type, activeBulletinID)) {
      this.undoStack[activeBulletinID].push(this.redoStack[activeBulletinID].pop());
    } else {
      return undefined;
    }
    console.info(
      "performing " + type,
      "undo stack size: " + this.undoStack[activeBulletinID].length,
      "redo stack size: " + this.redoStack[activeBulletinID].length,
    );
    const jsonBulletin = JSON.parse(this.undoStack[activeBulletinID].at(-1));
    return BulletinModel.createFromJson(jsonBulletin);
  }

  isEnabled(type: "undo" | "redo", activeBulletinID: string) {
    if (type === "undo") {
      return this.undoStack[activeBulletinID]?.length > 1;
    } else if (type === "redo") {
      return this.undoStack[activeBulletinID]?.length > 0 && this.redoStack[activeBulletinID]?.length > 0;
    } else return false;
  }

  pushToUndoStack(bulletin: BulletinModel) {
    this.redoStack[bulletin.getId()] = [];
    this.undoStack[bulletin.getId()] ??= [];
    // cap undo stack at 100 entries
    if (this.undoStack[bulletin.getId()].length >= 100) {
      this.undoStack[bulletin.getId()].shift();
    }
    this.undoStack[bulletin.getId()].push(JSON.stringify(bulletin.toJson()));
    console.info(
      "undo stack size: " + this.undoStack[bulletin.getId()].length,
      "redo stack size: " + this.redoStack[bulletin.getId()].length,
    );
  }

  initUndoRedoStacksFromServer(bulletin: BulletinModel) {
    this.undoStack[bulletin.getId()] ??= [];
    this.redoStack[bulletin.getId()] ??= [];
    // If the user did not perform any actions of their own, and the state changes on the server, the undo stack should be re-initialized with the state from the server.
    // On the other hand: if the undo stack has length <= 1 because the user is in the middle of some undo/redo, the stacks should not be overwritten.
    if (this.undoStack[bulletin.getId()].length <= 1 && this.redoStack[bulletin.getId()].length === 0) {
      this.pushToUndoStack(bulletin);
    }
  }
}
