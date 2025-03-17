import { Component, inject } from "@angular/core";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { StatisticsService } from "../providers/statistics-service/statistics.service";
import { saveAs } from "file-saver";
import { FormsModule } from "@angular/forms";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";
import { NgIf } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { TabsModule } from "ngx-bootstrap/tabs";

@Component({
  templateUrl: "statistics.component.html",
  selector: "app-statistics",
  standalone: true,
  imports: [FormsModule, BsDatepickerModule, NgIf, TranslateModule, TabsModule],
})
export class StatisticsComponent {
  statisticsService = inject(StatisticsService);
  translateService = inject(TranslateService);
  constantsService = inject(ConstantsService);

  public loadingStatistics = false;
  public bsRangeValueBulletin: Date[];
  public duplicates: boolean;
  public extended: boolean;

  public bsRangeValueDangerSource: Date[];

  getBulletinStatistics(event) {
    event.stopPropagation();
    if (this.bsRangeValueBulletin) {
      this.loadingStatistics = true;
      //document.getElementById("overlay").style.display = "block";
      this.statisticsService
        .getBulletinStatisticsCsv(
          this.bsRangeValueBulletin[0],
          this.bsRangeValueBulletin[1],
          this.translateService.currentLang,
          this.extended,
          this.duplicates,
        )
        .subscribe((blob) => {
          this.loadingStatistics = false;
          //document.getElementById("overlay").style.display = "none";
          const startDate = this.constantsService.getISODateString(this.bsRangeValueBulletin[0]);
          const endDate = this.constantsService.getISODateString(this.bsRangeValueBulletin[1]);
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
          filename = filename + "_" + this.translateService.currentLang + ".csv";
          saveAs(blob, filename);
          console.log("Bulletin statistics loaded.");
        });
    }
  }

  getDangerSourceStatistics(event) {
    event.stopPropagation();
    if (this.bsRangeValueDangerSource) {
      this.loadingStatistics = true;
      //document.getElementById("overlay").style.display = "block";
      this.statisticsService
        .getDangerSourceStatisticsCsv(this.bsRangeValueDangerSource[0], this.bsRangeValueDangerSource[1])
        .subscribe((blob) => {
          this.loadingStatistics = false;
          //document.getElementById("overlay").style.display = "none";
          const startDate = this.constantsService.getISODateString(this.bsRangeValueDangerSource[0]);
          const endDate = this.constantsService.getISODateString(this.bsRangeValueDangerSource[1]);
          let filename = "danger_source_statistic_" + startDate + "_" + endDate;
          filename = filename + ".csv";
          saveAs(blob, filename);
          console.log("Danger source statistics loaded.");
        });
    }
  }
}
