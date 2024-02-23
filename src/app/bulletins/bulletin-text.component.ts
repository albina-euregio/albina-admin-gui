import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CopyService } from "../providers/copy-service/copy.service";
import { TranslateService } from "@ngx-translate/core";
import type { BulletinModel } from "../models/bulletin.model";
import type { TextcatLegacyIn, TextcatTextfield } from "./avalanche-bulletin.component";
import { concatenateLangTexts, LangTexts, LANGUAGES } from "../models/text.model";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";

@Component({
  selector: "app-bulletin-text",
  templateUrl: "./bulletin-text.component.html",
})
export class BulletinTextComponent {
  @Input() textField: TextcatTextfield;
  @Input() rows: number;
  @Input() showNotes: boolean;
  @Input() disabled: boolean;
  @Input() bulletin: BulletinModel;
  @Output() showDialog = new EventEmitter<TextcatLegacyIn>();
  @Output() updateBulletinOnServer = new EventEmitter();
  showTranslations = false;

  constructor(
    public authenticationService: AuthenticationService,
    public constantsService: ConstantsService,
    public copyService: CopyService,
    public translateService: TranslateService,
  ) {}

  get translationLanguages() {
    return LANGUAGES.filter((l) => l !== this.translateService.currentLang);
  }

  openTextcat() {
    this.copyService.resetCopyTextcat();
    const regions = {
      [this.constantsService.codeSwitzerland]: "Switzerland",
      [this.constantsService.codeTyrol]: "Tyrol",
      [this.constantsService.codeSouthTyrol]: "South Tyrol",
      [this.constantsService.codeTrentino]: "Trentino",
      [this.constantsService.codeAran]: "Aran",
      [this.constantsService.codeAndorra]: "Andorra",
    };
    const activeRegion = this.authenticationService.getActiveRegionId();
    this.showDialog.emit({
      textField: this.textField,
      textDef: this.bulletin[this.bulletinTextcatKey] || "",
      currentLang: this.translateService.currentLang,
      region: regions[activeRegion] || "",
    });
  }

  get bulletinTextKey() {
    return `${this.textField}$`;
  }

  get bulletinTextcatKey() {
    return `${this.textField}Textcat`;
  }

  copyTextcat() {
    this.copyService.setCopyTextcat(true);
    this.copyService.setTextTextcat(this.bulletin[this.bulletinTextcatKey]);
    this.copyService.setFromLangTexts(this.bulletin[this.bulletinTextKey]);
  }

  concatTextcat(text1: string | undefined, text2: string | undefined) {
    if (!text1) return text2;
    if (!text2) return text1;
    return text1.slice(0, -1).concat(",", text2.substring(1));
  }

  pasteTextcat() {
    this.bulletin[this.bulletinTextcatKey] = this.concatTextcat(
      this.bulletin[this.bulletinTextcatKey],
      this.copyService.getTextTextcat(),
    );
    this.bulletin[this.bulletinTextKey] = concatenateLangTexts(
      this.bulletin[this.bulletinTextKey],
      this.copyService.toLangTexts,
    );
    this.copyService.resetCopyTextcat();
    this.updateBulletinOnServer.emit();
  }

  deleteTextcat() {
    this.bulletin[this.bulletinTextcatKey] = undefined;
    this.bulletin[this.bulletinTextKey] = {} as LangTexts;
    this.updateBulletinOnServer.emit();
  }
}
