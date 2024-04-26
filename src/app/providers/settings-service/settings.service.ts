import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import de from "../../../assets/i18n/de.json";
import it from "../../../assets/i18n/it.json";
import en from "../../../assets/i18n/en.json";
import fr from "../../../assets/i18n/fr.json";
import es from "../../../assets/i18n/es.json";
import ca from "../../../assets/i18n/ca.json";
import oc from "../../../assets/i18n/oc.json";
import { UserService } from "../user-service/user.service";
import { AuthenticationService } from "../authentication-service/authentication.service";

@Injectable()
export class SettingsService {
  constructor(
    private translateService: TranslateService,
    private userService: UserService,
    private authenticationService: AuthenticationService,
  ) {
    // lang
    this.translateService.addLangs(["de", "it", "en", "fr", "es", "ca", "oc"]);
    this.translateService.setTranslation("de", de);
    this.translateService.setTranslation("it", it);
    this.translateService.setTranslation("en", en);
    this.translateService.setTranslation("fr", fr);
    this.translateService.setTranslation("es", es);
    this.translateService.setTranslation("ca", ca);
    this.translateService.setTranslation("oc", oc);

    // this language will be used as a fallback when a translation isn't found in the current language
    this.translateService.setDefaultLang("en");
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    const lang = navigator.language.split("-")[0];
    this.setLangString(lang);
  }

  getLangString(): string {
    return this.translateService.currentLang;
  }

  setLangString(language: string) {
    if (!language) {
      return;
    }
    if (!this.translateService.langs.includes(language)) {
      language = "en";
    }
    document.documentElement.setAttribute("lang", language);
    this.translateService.use(language);
    const currentAuthor = this.authenticationService.getCurrentAuthor();
    if (currentAuthor && currentAuthor != null) {
      currentAuthor.setLanguageCode(language);
      this.userService.updateUser(currentAuthor).subscribe(
        (data) => {
          console.debug("User language updated!");
        },
        (error) => {
          console.error("User language could not be updated!");
        },
      );
    }
  }
}
