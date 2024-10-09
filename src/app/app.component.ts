import { Component, Inject } from "@angular/core";
import { environment } from "../environments/environment";
import { SettingsService } from "./providers/settings-service/settings.service";
import { RouterOutlet } from "@angular/router";

@Component({
  // eslint-disable-next-line
  selector: "body",
  template: "<router-outlet></router-outlet>",
  standalone: true,
  imports: [RouterOutlet],
})
export class AppComponent {
  constructor(
    public settings: SettingsService, // init i18n
  ) {
    document.getElementById("appFavicon").setAttribute("href", `${environment.faviconPath}`);
  }
}
