import { Component, Inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { SettingsService } from "./providers/settings-service/settings.service";
import { DOCUMENT } from '@angular/common';
import { environment } from "../environments/environment";


@Component({
  // eslint-disable-next-line
  selector: 'body',
  template: "<router-outlet></router-outlet>"
})
export class AppComponent {
  constructor(
    settingsService: SettingsService,
    translate: TranslateService,
    @Inject(DOCUMENT) _document: HTMLDocument) {
    _document.getElementById("appFavicon").setAttribute("href", `${environment.faviconPath}`);
  }
}
