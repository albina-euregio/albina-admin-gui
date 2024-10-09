import { Component } from "@angular/core";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { StatisticsService } from "../providers/statistics-service/statistics.service";
import { SettingsService } from "../providers/settings-service/settings.service";
import { saveAs } from "file-saver";
import { FormsModule } from "@angular/forms";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";
import { NgIf } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  templateUrl: "statistics.component.html",
  selector: "app-statistics",
  standalone: true,
  imports: [FormsModule, BsDatepickerModule, NgIf, TranslateModule],
})
export class StatisticsComponent {
  public loadingStatistics: boolean;
  public bsRangeValue: Date[];
  public duplicates: boolean;
  public extended: boolean;

  constructor(
    public statisticsService: StatisticsService,
    public settingsService: SettingsService,
    public constantsService: ConstantsService,
  ) {
    this.loadingStatistics = false;
  }

  getStatistics(event) {
    event.stopPropagation();
    if (this.bsRangeValue) {
      this.loadingStatistics = true;
      document.getElementById("overlay").style.display = "block";
      this.statisticsService
        .getStatisticsCsv(
          this.bsRangeValue[0],
          this.bsRangeValue[1],
          this.settingsService.getLangString(),
          this.extended,
          this.duplicates,
        )
        .subscribe((blob) => {
          this.loadingStatistics = false;
          document.getElementById("overlay").style.display = "none";
          const startDate = this.constantsService.getISODateString(this.bsRangeValue[0]);
          const endDate = this.constantsService.getISODateString(this.bsRangeValue[1]);
          let filename = "statistic_" + startDate + "_" + endDate;
          if (this.extended || this.duplicates) {
            filename = filename + "_";
            if (this.duplicates) {
              filename = filename + "d";
            }
            if (this.extended) {
              filename = filename + "e";
            }
          }
          filename = filename + "_" + this.settingsService.getLangString() + ".csv";
          saveAs(blob, filename);
          console.log("Statistics loaded.");
        });
    }
  }
}
