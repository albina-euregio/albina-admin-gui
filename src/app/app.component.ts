import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";

import ca from "../assets/i18n/ca.json";
import de from "../assets/i18n/de.json";
import en from "../assets/i18n/en.json";
import es from "../assets/i18n/es.json";
import fr from "../assets/i18n/fr.json";
import incidentReportCa from "../assets/i18n/incident-report/ca.json";
import incidentReportDe from "../assets/i18n/incident-report/de.json";
import incidentReportEn from "../assets/i18n/incident-report/en.json";
import incidentReportEs from "../assets/i18n/incident-report/es.json";
import incidentReportFr from "../assets/i18n/incident-report/fr.json";
import incidentReportIt from "../assets/i18n/incident-report/it.json";
import incidentReportOc from "../assets/i18n/incident-report/oc.json";
import it from "../assets/i18n/it.json";
import oc from "../assets/i18n/oc.json";
import { environment } from "../environments/environment";
import { LocalStorageService } from "./providers/local-storage-service/local-storage.service";

@Component({
  // eslint-disable-next-line
  selector: "body",
  template: "<router-outlet></router-outlet>",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterOutlet],
})
export class AppComponent {
  private translateService = inject(TranslateService);
  private localStorageService = inject(LocalStorageService);

  constructor() {
    // lang
    this.translateService.addLangs(["de", "it", "en", "fr", "es", "ca", "oc"]);
    this.translateService.setTranslation("de", { ...de, ...incidentReportDe });
    this.translateService.setTranslation("it", { ...it, ...incidentReportIt });
    this.translateService.setTranslation("en", { ...en, ...incidentReportEn });
    this.translateService.setTranslation("fr", { ...fr, ...incidentReportFr });
    this.translateService.setTranslation("es", { ...es, ...incidentReportEs });
    this.translateService.setTranslation("ca", { ...ca, ...incidentReportCa });
    this.translateService.setTranslation("oc", { ...oc, ...incidentReportOc });
    // this language will be used as a fallback when a translation isn't found in the current language
    this.translateService.setFallbackLang("en");
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    const lang = this.localStorageService.getLanguage() || navigator.language.split("-")[0];
    this.localStorageService.setLanguage(lang);

    document.getElementById("appFavicon").setAttribute("href", `${environment.faviconPath}`);
  }
}
