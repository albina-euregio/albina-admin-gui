import { CommonModule } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { TabsModule } from "ngx-bootstrap/tabs";

import { AwsstatsComponent } from "./awsstats.component";
import { LineaExportComponent } from "./lineaexport.component";
import { YearlystatsComponent } from "./yearlystats.component";

@Component({
  selector: "app-graphics",
  standalone: true,
  imports: [CommonModule, TranslateModule, LineaExportComponent, AwsstatsComponent, YearlystatsComponent, TabsModule],
  templateUrl: "./graphics.component.html",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GraphicsComponent implements OnInit {
  authenticationService = inject(AuthenticationService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  activeTabIndex = 0;

  ngOnInit() {
    const initialTab = this.activatedRoute.snapshot.params["tab"] as
      | "lineaexport"
      | "awsstats"
      | "yearlystats"
      | undefined;
    if (initialTab === "lineaexport" || initialTab === "awsstats" || initialTab === "yearlystats") {
      this.setActiveTab(initialTab);
    }
    this.activatedRoute.params.subscribe((params) => {
      const tab = params["tab"] as "lineaexport" | "awsstats" | "yearlystats" | undefined;
      if (tab === "lineaexport" || tab === "awsstats" || tab === "yearlystats") {
        this.setActiveTab(tab);
      }
    });
  }

  protected setActiveTab(tab: "lineaexport" | "awsstats" | "yearlystats") {
    this.activeTabIndex = tab === "yearlystats" ? 2 : tab === "awsstats" ? 1 : 0;
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

  protected showYearlyStats() {
    if (this.activeTabIndex === 2) return;
    this.activeTabIndex = 2;
    this.router.navigate(["yearlystats"], { relativeTo: this.activatedRoute.parent });
  }
}
