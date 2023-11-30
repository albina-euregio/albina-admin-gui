import { Component, OnInit, ViewChild } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

import { RegionsService } from "app/providers/regions-service/regions.service";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import { TranslateModule } from "@ngx-translate/core";
import { NgFor } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  standalone: true,
  imports: [FormsModule, NgFor, TranslateModule],
  providers: [RegionsService],
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
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.snowpackPlots = SnowpackComponent.getSnowpackPlots();
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

  /**
   * Returns a data structure for the snowpack visualizations.
   */
  static getSnowpackPlots(): SnowpackPlots {
    const plotTypes = ["LWC_stratigraphy", "wet_snow_instability", "Sk38_stratigraphy", "stratigraphy"];
    const aspects = ["flat", "north", "south"];
    const stations = [
      "AKLE2",
      "AXLIZ1",
      "BJOE2",
      "GGAL2",
      "GJAM2",
      "INAC2",
      "ISEE2",
      "KAUN2",
      "MIOG2",
      "NGAN2",
      "PESE2",
      "RHAN2",
      "SDAW2",
      "SSON2",
      "TRAU2",
    ];
    return { plotTypes, aspects, stations };
  }
}

interface SnowpackPlots {
  plotTypes: string[];
  aspects: string[];
  stations: string[];
}
