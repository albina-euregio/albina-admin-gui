import { NgClass, UpperCasePipe } from "@angular/common";
import { Component, TemplateRef, input, output, inject, effect, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateService, TranslatePipe } from "@ngx-translate/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";

import * as Enums from "../enums/enums";
import { TextcatTextfield } from "../enums/enums";
import type { BulletinModel } from "../models/bulletin.model";
import { concatenateLangTexts, convertLangTextsToJSON, LangTexts, LANGUAGES, toLangTexts } from "../models/text.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { CopyService } from "../providers/copy-service/copy.service";
import { createWordDiff } from "../shared/wordDiff";
import type { TextcatLegacyIn } from "./avalanche-bulletin.component";
import { HtmlPipe } from "./html.pipe";

@Component({
  selector: "app-bulletin-text",
  templateUrl: "./bulletin-text.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NgClass, FormsModule, UpperCasePipe, TranslatePipe, HtmlPipe],
})
export class BulletinTextComponent {
  protected authenticationService = inject(AuthenticationService);
  protected constantsService = inject(ConstantsService);
  private modalService = inject(BsModalService);
  copyService = inject(CopyService);
  translateService = inject(TranslateService);

  readonly textField = input<Enums.TextcatTextfield>(undefined);
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
  private comparedSnapshotText: LangTexts | undefined;

  constructor() {
    effect(() => {
      const bulletin = this.bulletin();
      const hasComparedBulletin = !!this.comparedBulletin();

      if (bulletin && hasComparedBulletin) {
        this.comparedSnapshotText = structuredClone(this.bulletinText);
      } else {
        this.comparedSnapshotText = undefined;
      }
    });
  }

  get translationLanguages() {
    return LANGUAGES.filter((l) => l !== this.translateService.getCurrentLang());
  }

  get enableEditableFields() {
    return (this.authenticationService.getActiveRegion()?.enabledEditableFields ?? []).includes(this.textField());
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
      textDef: this.normalizeTextcat(this.bulletin()[this.bulletinTextcatKey]),
      currentLang: this.translateService.getCurrentLang(),
      region: regions[activeRegion] || "",
    });
  }

  get bulletinText(): LangTexts {
    const textField = this.textField();
    switch (textField) {
      case TextcatTextfield.avActivityComment:
        return toLangTexts(this.bulletin().avActivityComment);
      case TextcatTextfield.avActivityHighlights:
        return toLangTexts(this.bulletin().avActivityHighlights);
      case TextcatTextfield.generalHeadlineComment:
        return toLangTexts(this.bulletin().generalHeadlineComment);
      case TextcatTextfield.highlights:
        return toLangTexts(this.bulletin().highlights);
      case TextcatTextfield.snowpackStructureComment:
        return toLangTexts(this.bulletin().snowpackStructureComment);
      case TextcatTextfield.snowpackStructureHighlights:
        return toLangTexts(this.bulletin().snowpackStructureHighlights);
      case TextcatTextfield.synopsisHighlights:
        return toLangTexts(this.bulletin().synopsisHighlights);
      case TextcatTextfield.synopsisComment:
        return toLangTexts(this.bulletin().synopsisComment);
      case TextcatTextfield.tendencyComment:
        return toLangTexts(this.bulletin().tendencyComment);
      case TextcatTextfield.travelAdvisoryComment:
        return toLangTexts(this.bulletin().travelAdvisoryComment);
      case TextcatTextfield.travelAdvisoryHighlights:
        return toLangTexts(this.bulletin().travelAdvisoryHighlights);
      default:
        throw textField satisfies never;
    }
  }
  set bulletinText(v: LangTexts) {
    const textField = this.textField();
    switch (textField) {
      case TextcatTextfield.avActivityComment:
        this.bulletin().avActivityComment = convertLangTextsToJSON(v);
        break;
      case TextcatTextfield.avActivityHighlights:
        this.bulletin().avActivityHighlights = convertLangTextsToJSON(v);
        break;
      case TextcatTextfield.generalHeadlineComment:
        this.bulletin().generalHeadlineComment = convertLangTextsToJSON(v);
        break;
      case TextcatTextfield.highlights:
        this.bulletin().highlights = convertLangTextsToJSON(v);
        break;
      case TextcatTextfield.snowpackStructureComment:
        this.bulletin().snowpackStructureComment = convertLangTextsToJSON(v);
        break;
      case TextcatTextfield.snowpackStructureHighlights:
        this.bulletin().snowpackStructureHighlights = convertLangTextsToJSON(v);
        break;
      case TextcatTextfield.synopsisComment:
        this.bulletin().synopsisComment = convertLangTextsToJSON(v);
        break;
      case TextcatTextfield.synopsisHighlights:
        this.bulletin().synopsisHighlights = convertLangTextsToJSON(v);
        break;
      case TextcatTextfield.tendencyComment:
        this.bulletin().tendencyComment = convertLangTextsToJSON(v);
        break;
      case TextcatTextfield.travelAdvisoryComment:
        this.bulletin().travelAdvisoryComment = convertLangTextsToJSON(v);
        break;
      case TextcatTextfield.travelAdvisoryHighlights:
        this.bulletin().travelAdvisoryHighlights = convertLangTextsToJSON(v);
        break;
      default:
        throw textField satisfies never;
    }
  }

  get bulletinNotesKey(): `${Enums.TextcatTextfield}Notes` {
    return `${this.textField()}Notes`;
  }

  get bulletinTextcatKey(): `${Enums.TextcatTextfield}Textcat` {
    return `${this.textField()}Textcat`;
  }

  copyTextcat() {
    this.copyService.setCopyTextcat(true);
    const bulletin = this.bulletin();
    this.copyService.setTextTextcat(bulletin[this.bulletinTextcatKey]);
    this.copyService.setFromLangTexts(this.bulletinText);
  }

  concatTextcat(text1: string | undefined, text2: string | undefined) {
    const parsedText1 = this.parseTextcat(text1);
    const parsedText2 = this.parseTextcat(text2);

    if (!parsedText1 && !parsedText2) return undefined;
    if (!parsedText1) return JSON.stringify(parsedText2);
    if (!parsedText2) return JSON.stringify(parsedText1);

    return JSON.stringify([...parsedText1, ...parsedText2]);
  }

  private normalizeTextcat(text: string | undefined): string {
    return JSON.stringify(this.parseTextcat(text) ?? []);
  }

  private parseTextcat(text: string | undefined): unknown[] | undefined {
    if (!text?.trim()) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  pasteTextcat() {
    this.bulletin()[this.bulletinTextcatKey] = this.concatTextcat(
      this.bulletin()[this.bulletinTextcatKey],
      this.copyService.getTextTextcat(),
    );
    this.bulletinText = concatenateLangTexts(this.bulletinText, this.copyService.toLangTexts);
    this.copyService.resetCopyTextcat();
    this.updateBulletinOnServer.emit();
  }

  deleteTextcat() {
    this.bulletin()[this.bulletinTextcatKey] = undefined;
    this.bulletinText = {} as LangTexts;
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
    const lang = this.translateService.getCurrentLang() as keyof LangTexts;
    const currentText = this.comparedSnapshotText?.[lang] ?? this.bulletinText?.[lang] ?? "";
    if (this.bulletin()) {
      const comparedBulletin = this.comparedBulletin();
      const comparedText = toLangTexts(comparedBulletin?.[this.textField()])?.[lang] ?? "";
      return createWordDiff(currentText, comparedText);
    } else {
      return "";
    }
  }
}
