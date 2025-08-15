import { LangTexts } from "../../models/text.model";
import { ConstantsService } from "../constants-service/constants.service";
import { Injectable, inject } from "@angular/core";
import { BulletinModel } from "app/models/bulletin.model";

@Injectable()
export class CopyService {
  constantsService = inject(ConstantsService);

  private copyTextcat: boolean;
  private copyBulletin: boolean;
  private textTextcat: string;
  private bulletin: BulletinModel;
  private texts: LangTexts;

  constructor() {
    this.copyTextcat = false;
    this.copyBulletin = false;
  }

  isCopyTextcat(): boolean {
    return this.copyTextcat;
  }

  setCopyTextcat(copyTextcat: boolean) {
    this.copyTextcat = copyTextcat;
  }

  getTextTextcat(): string {
    return this.textTextcat;
  }

  setTextTextcat(textTextcat: string) {
    this.textTextcat = textTextcat;
  }

  resetCopyTextcat() {
    this.copyTextcat = false;
    this.textTextcat = undefined;
    this.texts = undefined;
  }

  isCopyBulletin(): boolean {
    return this.copyBulletin;
  }

  setCopyBulletin(copyBulletin: boolean) {
    this.copyBulletin = copyBulletin;
  }

  getBulletin(): BulletinModel {
    return this.bulletin;
  }

  setBulletin(bulletin: BulletinModel) {
    this.bulletin = bulletin;
  }

  resetCopyBulletin() {
    this.copyBulletin = false;
    this.bulletin = undefined;
  }

  setFromLangTexts(l: LangTexts) {
    this.texts = { ...l };
  }

  get toLangTexts(): LangTexts {
    return { ...this.texts };
  }
}
