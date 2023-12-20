import { Component, OnInit, ViewChild } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

import { ConstantsService } from "app/providers/constants-service/constants.service";
import { TranslateModule } from "@ngx-translate/core";
import { NgFor } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  standalone: true,
  imports: [FormsModule, NgFor, TranslateModule],
  templateUrl: "./snowpack.meteo.component.html",
})
export class SnowpackMeteoComponent implements OnInit {
  snowpackMeteoPlots: string[] = [
    "AT-7_new_snow_plot_3day",
    "AT-7_new_snow_plot_7day",
    "AT-7_new_snow_plot_1month",
    "AT-7_new_snow_plot_season",
    "AT-7_new_snow_plot_forecast",
    "AT-7_wet_snow_plot_3day",
    "AT-7_wet_snow_plot_7day",
    "AT-7_wet_snow_plot_1month",
    "AT-7_wet_snow_plot_season",
    "AT-7_wet_snow_plot_forecast",
    "AT-7_HS_table_24h",
    "AT-7_HS_table_72h",
    "AT-7_HS_table_season",
    "AT-7_HS_table_forecast",
    "AT-7_TA_table_24h",
    "AT-7_TA_table_72h",
    "AT-7_TA_table_season",
  ];
  snowpackMeteoPlot: string = this.snowpackMeteoPlots[0];
  plotUrl: SafeResourceUrl;
  @ViewChild("iframe") iframe;

  constructor(
    private constantsService: ConstantsService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.updatePlotUrl();
  }

  updatePlotUrl() {
    const url = [this.constantsService.snowpackModelsUrl, this.snowpackMeteoPlot, ".html"].join("");
    this.plotUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  toggleFullscreen() {
    const element: HTMLIFrameElement = this.iframe.nativeElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    }
  }
}
