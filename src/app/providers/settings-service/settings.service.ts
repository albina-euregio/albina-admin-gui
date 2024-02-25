import { EventEmitter, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";

@Injectable()
export class SettingsService {
  private lang: string;
  private eventEmitter: EventEmitter<string> = new EventEmitter();

  constructor(private translateService: TranslateService) {
    // lang
    this.translateService.addLangs(["de", "it", "en", "fr", "es", "ca", "oc"]);

    // this language will be used as a fallback when a translation isn't found in the current language
    this.translateService.setDefaultLang("en");
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    const lang = navigator.language.split("-")[0];
    this.setLangString(lang);
  }

  getLangString(): string {
    return this.lang;
  }

  setLangString(lang: string) {
    if (lang) {
      let language = lang;
      if (this.translateService.langs.indexOf(language) < 0) {
        language = "de";
      }
      document.documentElement.setAttribute("lang", language);
      this.translateService.use(language);
      this.lang = language;

      // to reload iframe
      this.eventEmitter.emit(this.lang);
    }
  }
}
