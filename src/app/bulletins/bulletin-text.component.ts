import { Component, Input, TemplateRef, input, output } from "@angular/core";
import { CopyService } from "../providers/copy-service/copy.service";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import type { BulletinModel } from "../models/bulletin.model";
import type { TextcatLegacyIn, TextcatTextfield } from "./avalanche-bulletin.component";
import { concatenateLangTexts, LangTexts, LANGUAGES } from "../models/text.model";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import * as Enums from "../enums/enums";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { NgClass, NgIf, NgFor, UpperCasePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HtmlPipe } from "./html.pipe";

@Component({
  selector: "app-bulletin-text",
  templateUrl: "./bulletin-text.component.html",
  standalone: true,
  imports: [NgClass, NgIf, FormsModule, NgFor, UpperCasePipe, TranslateModule, HtmlPipe],
})
export class BulletinTextComponent {
  @Input() textField: TextcatTextfield;
  readonly rows = input<number>(undefined);
  readonly disabled = input<boolean>(undefined);
  @Input() bulletin: BulletinModel;
  readonly showDialog = output<TextcatLegacyIn>();
  readonly updateBulletinOnServer = output();
  showTranslations = false;
  showNotes = false;
  modalRef: BsModalRef;

  constructor(
    protected authenticationService: AuthenticationService,
    protected constantsService: ConstantsService,
    private modalService: BsModalService,
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

  get bulletinTextKey(): `${TextcatTextfield}$` {
    return `${this.textField}$`;
  }

  get bulletinTextcatKey(): `${TextcatTextfield}Textcat` {
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

  openLoadExampleTextModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, {
      keyboard: true,
      class: "modal-md",
    });
  }

  loadExampleText(avalancheProblem: keyof typeof Enums.AvalancheProblem) {
    const textcat = this.constantsService[this.bulletinTextcatKey]?.[avalancheProblem];
    if (!textcat) return;
    this.bulletin[this.bulletinTextcatKey] = this.concatTextcat(this.bulletin[this.bulletinTextcatKey], textcat);
    this.openTextcat();
    this.modalRef.hide();
  }

  loadExampleTextCancel() {
    this.modalRef.hide();
  }
}
