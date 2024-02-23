import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CopyService } from "../providers/copy-service/copy.service";
import { TranslateService } from "@ngx-translate/core";
import type { BulletinModel } from "../models/bulletin.model";
import type { TextcatTextfield } from "./avalanche-bulletin.component";
import { LANGUAGES } from "../models/text.model";

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
  @Output() openTextcat = new EventEmitter<TextcatTextfield>();
  @Output() copyTextcat = new EventEmitter<TextcatTextfield>();
  @Output() pasteTextcat = new EventEmitter<TextcatTextfield>();
  @Output() deleteTextcat = new EventEmitter<TextcatTextfield>();
  @Output() notesFocusOut = new EventEmitter<TextcatTextfield>();
  showTranslations = false;

  constructor(
    public copyService: CopyService,
    public translateService: TranslateService,
  ) {}

  get translationLanguages() {
    return LANGUAGES.filter((l) => l !== this.translateService.currentLang);
  }
}
