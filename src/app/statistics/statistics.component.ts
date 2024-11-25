import { Component, inject } from "@angular/core";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { StatisticsService } from "../providers/statistics-service/statistics.service";
import { saveAs } from "file-saver";
import { FormsModule } from "@angular/forms";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";
import { NgIf } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

@Component({
  templateUrl: "statistics.component.html",
  selector: "app-statistics",
  standalone: true,
  imports: [FormsModule, BsDatepickerModule, NgIf, TranslateModule],
})
export class StatisticsComponent {
  statisticsService = inject(StatisticsService);
  translateService = inject(TranslateService);
  constantsService = inject(ConstantsService);

  public loadingStatistics = false;
  public bsRangeValue: Date[];
  public duplicates: boolean;
  public extended: boolean;

  getStatistics(event) {
    event.stopPropagation();
    if (this.bsRangeValue) {
      this.loadingStatistics = true;
      //document.getElementById("overlay").style.display = "block";
      this.statisticsService
        .getStatisticsCsv(
          this.bsRangeValue[0],
          this.bsRangeValue[1],
          this.translateService.currentLang,
          this.extended,
          this.duplicates,
        )
        .subscribe((blob) => {
          this.loadingStatistics = false;
          //document.getElementById("overlay").style.display = "none";
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
          filename = filename + "_" + this.translateService.currentLang + ".csv";
          saveAs(blob, filename);
          console.log("Statistics loaded.");
        });
    }
  }
}
