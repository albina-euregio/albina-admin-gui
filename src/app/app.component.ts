import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import ca from "../assets/i18n/ca.json";
import de from "../assets/i18n/de.json";
import en from "../assets/i18n/en.json";
import es from "../assets/i18n/es.json";
import fr from "../assets/i18n/fr.json";
import it from "../assets/i18n/it.json";
import oc from "../assets/i18n/oc.json";
import { environment } from "../environments/environment";
import { LocalStorageService } from "./providers/local-storage-service/local-storage.service";

@Component({
  // eslint-disable-next-line
  selector: "body",
  template: "<router-outlet></router-outlet>",
  standalone: true,
  imports: [RouterOutlet],
})
export class AppComponent {
  private translateService = inject(TranslateService);
  private localStorageService = inject(LocalStorageService);

  constructor() {
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
    const lang = this.localStorageService.getLanguage() || navigator.language.split("-")[0];
    this.localStorageService.setLanguage(lang);

    document.getElementById("appFavicon").setAttribute("href", `${environment.faviconPath}`);
  }
}
