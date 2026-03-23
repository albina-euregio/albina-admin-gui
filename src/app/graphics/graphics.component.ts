import { CommonModule } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { LineaExportComponent } from "./lineaexport.component";
import { AwsstatsComponent } from "./awsstats.component";
import { TabsModule } from "ngx-bootstrap/tabs";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-graphics",
  standalone: true,
  imports: [CommonModule, TranslateModule, LineaExportComponent, AwsstatsComponent, TabsModule],
  templateUrl: "./graphics.component.html",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GraphicsComponent implements OnInit {
  authenticationService = inject(AuthenticationService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  activeTabIndex = 0;

  ngOnInit() {
    const initialTab = this.activatedRoute.snapshot.params["tab"] as "lineaexport" | "awsstats" | undefined;
    if (initialTab === "lineaexport" || initialTab === "awsstats") {
      this.setActiveTab(initialTab);
    }
    this.activatedRoute.params.subscribe((params) => {
      const tab = params["tab"] as "lineaexport" | "awsstats" | undefined;
      if (tab === "lineaexport" || tab === "awsstats") {
        this.setActiveTab(tab);
      }
    });
  }

  protected setActiveTab(tab: "lineaexport" | "awsstats") {
    this.activeTabIndex = tab === "awsstats" ? 1 : 0;
  }

  protected showLineaExport() {
    if (this.activeTabIndex === 0) return;
    this.activeTabIndex = 0;
    this.router.navigate(["lineaexport"], { relativeTo: this.activatedRoute.parent });
  }

  protected showAwsstats() {
    if (this.activeTabIndex === 1) return;
    this.activeTabIndex = 1;
    this.router.navigate(["awsstats"], { relativeTo: this.activatedRoute.parent });
  }
}
