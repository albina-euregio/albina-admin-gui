import { Component, OnInit, ViewChild } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

import { ModellingService, SnowpackPlots } from "./modelling.service";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import { TranslateModule } from "@ngx-translate/core";
import { NgFor } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  standalone: true,
  imports: [FormsModule, NgFor, TranslateModule],
  providers: [ModellingService, RegionsService],
  templateUrl: "./snowpack.component.html",
})
export class SnowpackComponent implements OnInit {
  snowpackPlots: SnowpackPlots;
  station: string;
  aspect: string;
  plotType: string;
  plotUrl: SafeResourceUrl;
  @ViewChild("iframe") iframe;

  constructor(
    private constantsService: ConstantsService,
    private modellingService: ModellingService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.snowpackPlots = this.modellingService.getSnowpackPlots();
    this.station = this.snowpackPlots.stations[0];
    this.aspect = this.snowpackPlots.aspects[0];
    this.plotType = this.snowpackPlots.plotTypes[0];
    this.updatePlotUrl();
  }

  updatePlotUrl() {
    const url = [
      this.constantsService.snowpackModelsUrl,
      `${this.plotType}_plot_${this.aspect}_${this.station}.html`,
    ].join("");
    this.plotUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  toggleFullscreen() {
    const element: HTMLIFrameElement = this.iframe.nativeElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    }
  }
}
