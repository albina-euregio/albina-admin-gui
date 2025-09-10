import * as Enums from "../enums/enums";
import type { BulletinModel } from "../models/bulletin.model";
import { concatenateLangTexts, LangTexts, LANGUAGES } from "../models/text.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { CopyService } from "../providers/copy-service/copy.service";
import { createWordDiff } from "../shared/wordDiff";
import type { TextcatLegacyIn, TextcatTextfield } from "./avalanche-bulletin.component";
import { HtmlPipe } from "./html.pipe";
import { NgClass, NgIf, NgFor, UpperCasePipe } from "@angular/common";
import { Component, TemplateRef, input, output, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";

@Component({
  selector: "app-bulletin-text",
  templateUrl: "./bulletin-text.component.html",
  standalone: true,
  imports: [NgClass, NgIf, FormsModule, NgFor, UpperCasePipe, TranslateModule, HtmlPipe],
})
export class BulletinTextComponent {
  protected authenticationService = inject(AuthenticationService);
  protected constantsService = inject(ConstantsService);
  private modalService = inject(BsModalService);
  copyService = inject(CopyService);
  translateService = inject(TranslateService);

  readonly textField = input<TextcatTextfield>(undefined);
  readonly rows = input<number>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly bulletin = input<BulletinModel>(undefined);
  readonly comparedBulletin = input<BulletinModel>(undefined);
  readonly showDialog = output<TextcatLegacyIn>();
  readonly updateBulletinOnServer = output();
  showTranslations = false;
  showNotes = false;
  modalRef: BsModalRef;
  createWordDiff = createWordDiff;

  get translationLanguages() {
    return LANGUAGES.filter((l) => l !== this.translateService.currentLang);
  }

  get enableEditableFields(): boolean {
    return this.authenticationService.getActiveRegion().enableEditableFields;
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
      textField: this.textField(),
      textDef: this.bulletin()[this.bulletinTextcatKey] || "",
      currentLang: this.translateService.currentLang,
      region: regions[activeRegion] || "",
    });
  }

  get bulletinTextKey(): `${TextcatTextfield}$` {
    return `${this.textField()}$`;
  }

  get bulletinTextcatKey(): `${TextcatTextfield}Textcat` {
    return `${this.textField()}Textcat`;
  }

  copyTextcat() {
    this.copyService.setCopyTextcat(true);
    const bulletin = this.bulletin();
    this.copyService.setTextTextcat(bulletin[this.bulletinTextcatKey]);
    this.copyService.setFromLangTexts(bulletin[this.bulletinTextKey]);
  }

  concatTextcat(text1: string | undefined, text2: string | undefined) {
    if (!text1) return text2;
    if (!text2) return text1;
    return text1.slice(0, -1).concat(",", text2.substring(1));
  }

  pasteTextcat() {
    this.bulletin()[this.bulletinTextcatKey] = this.concatTextcat(
      this.bulletin()[this.bulletinTextcatKey],
      this.copyService.getTextTextcat(),
    );
    this.bulletin()[this.bulletinTextKey] = concatenateLangTexts(
      this.bulletin()[this.bulletinTextKey],
      this.copyService.toLangTexts,
    );
    this.copyService.resetCopyTextcat();
    this.updateBulletinOnServer.emit();
  }

  deleteTextcat() {
    this.bulletin()[this.bulletinTextcatKey] = undefined;
    this.bulletin()[this.bulletinTextKey] = {} as LangTexts;
    this.updateBulletinOnServer.emit();
  }

  openLoadExampleTextModal(template: TemplateRef<unknown>) {
    this.modalRef = this.modalService.show(template, {
      keyboard: true,
      class: "modal-md",
    });
  }

  loadExampleText(avalancheProblem: keyof typeof Enums.AvalancheProblem) {
    const textcat = this.constantsService[this.bulletinTextcatKey]?.[avalancheProblem];
    if (!textcat) return;
    this.bulletin()[this.bulletinTextcatKey] = this.concatTextcat(this.bulletin()[this.bulletinTextcatKey], textcat);
    this.openTextcat();
    this.modalRef.hide();
  }

  loadExampleTextCancel() {
    this.modalRef.hide();
  }

  createText(): string {
    const currentBulletin = this.bulletin();
    const currentText = currentBulletin?.[this.bulletinTextKey]?.[this.translateService.currentLang] ?? "";
    if (currentBulletin !== null && currentBulletin !== undefined) {
      const comparedBulletin = this.comparedBulletin();
      const comparedText = comparedBulletin?.[this.bulletinTextKey]?.[this.translateService.currentLang] ?? "";
      return createWordDiff(currentText, comparedText);
    } else {
      return "";
    }
  }
}
