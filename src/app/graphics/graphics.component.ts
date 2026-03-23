import { CommonModule } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { LineaExportComponent } from "./lineaexport.component";
import { AwsstatsComponent } from "./awsstats.component";
import { TabsModule } from "ngx-bootstrap/tabs";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";

@Component({
  selector: "app-graphics",
  standalone: true,
  imports: [CommonModule, TranslateModule, LineaExportComponent, AwsstatsComponent, TabsModule],
  templateUrl: "./graphics.component.html",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GraphicsComponent {
  authenticationService = inject(AuthenticationService);

  protected activeGraphicsTab: "lineaexport" | "awsstats" = "lineaexport";

  protected showLineaExport() {
    this.activeGraphicsTab = "lineaexport";
  }

  protected showAwsstats() {
    this.activeGraphicsTab = "awsstats";
  }
}
