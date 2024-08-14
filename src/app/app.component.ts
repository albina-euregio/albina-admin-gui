import { Component, Inject } from "@angular/core";
import { environment } from "../environments/environment";

@Component({
  // eslint-disable-next-line
  selector: "body",
  template: "<router-outlet></router-outlet>",
})
export class AppComponent {
  constructor() {
    document.getElementById("appFavicon").setAttribute("href", `${environment.faviconPath}`);
  }
}
