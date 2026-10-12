import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TranslateService, type TranslationObject } from "@ngx-translate/core";

import caamlCa from "../../app/i18n/caaml/ca.json";
import caamlDe from "../../app/i18n/caaml/de.json";
import caamlEn from "../../app/i18n/caaml/en.json";
import caamlEs from "../../app/i18n/caaml/es.json";
import caamlFr from "../../app/i18n/caaml/fr.json";
import caamlIt from "../../app/i18n/caaml/it.json";
import caamlOc from "../../app/i18n/caaml/oc.json";
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
    // The incident-report and caaml resources are layered on top of the main resource
    // with shouldMerge=true so ngx-translate deep-merges them: shared categories
    // (e.g. avalancheType) keep the main resource's extra nested keys like
    // .title/.label/.tooltip instead of being clobbered by a shallow spread.
    // The caaml resource uses flat dot-keys (e.g. "dangerRating.low"), which only
    // resolve when the main resource has no nested object under that first segment
    // (e.g. "aspect", "tendency" stay defined in the main resource on purpose).
    // Transifex pulls with --mode onlytranslated yield "" for untranslated strings,
    // so every language is layered over English, skipping those empty values.
    const resources: Record<string, TranslationObject[]> = {
      de: [de, incidentReportDe, caamlDe],
      it: [it, incidentReportIt, caamlIt],
      en: [en, incidentReportEn, caamlEn],
      fr: [fr, incidentReportFr, caamlFr],
      es: [es, incidentReportEs, caamlEs],
      ca: [ca, incidentReportCa, caamlCa],
      oc: [oc, incidentReportOc, caamlOc],
    };
    this.translateService.addLangs(Object.keys(resources));
    for (const [lang, translations] of Object.entries(resources)) {
      const layers = lang === "en" ? translations : [...resources.en, ...translations];
      layers.forEach((t, i) => this.translateService.setTranslation(lang, withoutEmpty(t), i > 0));
    }
    // this language will be used as a fallback when a translation isn't found in the current language
    this.translateService.setFallbackLang("en");
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    const lang = this.localStorageService.getLanguage() || navigator.language.split("-")[0];
    this.localStorageService.setLanguage(lang);

    document.getElementById("appFavicon").setAttribute("href", `${environment.faviconPath}`);
  }
}

function withoutEmpty(translations: TranslationObject): TranslationObject {
  return Object.fromEntries(
    Object.entries(translations)
      .filter(([, value]) => value !== "")
      .map(([key, value]) => [
        key,
        typeof value === "object" && value !== null ? withoutEmpty(value as TranslationObject) : value,
      ]),
  );
}
