import { inject, Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { RouterStateSnapshot, TitleStrategy } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";

/**
 * Sets `document.title` from each route's `title`, which is interpreted as an
 * i18n key and translated via ngx-translate. The title is re-applied whenever
 * the active language changes. Routes without a `title` fall back to the app name.
 */
@Injectable({ providedIn: "root" })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);
  private titleKey?: string;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => this.setDocumentTitle());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.titleKey = this.buildTitle(snapshot);
    this.setDocumentTitle();
  }

  private setDocumentTitle(): void {
    const appName = "Avalanche.report";
    const title = [this.titleKey ? this.translate.instant(this.titleKey) : "", appName]
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(" · ");
    this.title.setTitle(title);
  }
}
