import { UpperCasePipe } from "@angular/common";
import { Component, inject, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { QuillModule } from "ngx-quill";

import type { AlbinaLanguage, LangTexts } from "../models/text.model";
import { LANGUAGES } from "../models/text.model";

@Component({
  selector: "app-rich-text-multilang",
  templateUrl: "./rich-text-multilang.component.html",
  standalone: true,
  imports: [FormsModule, QuillModule, UpperCasePipe, TranslateModule],
})
export class RichTextMultilangComponent {
  private translateService = inject(TranslateService);
  readonly value = model<LangTexts | null | undefined>();
  readonly disabled = input<boolean>(false);
  showAllLanguages = false;

  get currentLang(): AlbinaLanguage {
    return this.translateService.getCurrentLang() as AlbinaLanguage;
  }

  get otherLanguages(): AlbinaLanguage[] {
    return LANGUAGES.filter((l) => l !== this.currentLang);
  }

  getValueForLang(lang: AlbinaLanguage): string {
    return this.value()?.[lang] ?? "";
  }

  setValueForLang(lang: AlbinaLanguage, text: string): void {
    const current = this.value() ?? ({} as LangTexts);
    this.value.set({ ...current, [lang]: text } as LangTexts);
  }
}
