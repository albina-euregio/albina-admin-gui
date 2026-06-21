import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { saveAs } from "file-saver";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";
import { TabsModule } from "ngx-bootstrap/tabs";
import { firstValueFrom } from "rxjs";

import { ConstantsService } from "../providers/constants-service/constants.service";
import { StatisticsService } from "../providers/statistics-service/statistics.service";

@Component({
  templateUrl: "statistics.component.html",
  selector: "app-statistics",
  standalone: true,
  imports: [FormsModule, BsDatepickerModule, TranslatePipe, TabsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [StatisticsService],
})
export class StatisticsComponent {
  statisticsService = inject(StatisticsService);
  translateService = inject(TranslateService);
  constantsService = inject(ConstantsService);

  public loadingStatistics = false;
  public statisticsError = "";
  public bsRangeValueBulletin: Date[];
  public duplicates: boolean;
  public extended: boolean;

  public bsRangeValueDangerSource: Date[];

  async getBulletinStatistics(event: Event) {
    event.stopPropagation();

    if (!this.bsRangeValueBulletin) {
      return;
    }

    this.loadingStatistics = true;
    this.statisticsError = "";

    try {
      const blob = await firstValueFrom(
        this.statisticsService.getBulletinStatisticsCsv(
          this.bsRangeValueBulletin[0],
          this.bsRangeValueBulletin[1],
          this.translateService.getCurrentLang(),
          this.extended,
          this.duplicates,
        ),
      );
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
      filename = filename + "_" + this.translateService.getCurrentLang() + ".csv";
      saveAs(blob, filename);
      console.log("Bulletin statistics loaded.");
    } catch (error) {
      this.statisticsError = this.translateService.instant("statistics.error.downloadFailed");
      console.error("Bulletin statistics could not be downloaded.", error);
    } finally {
      this.loadingStatistics = false;
    }
  }

  async getDangerSourceStatistics(event: Event) {
    event.stopPropagation();

    if (!this.bsRangeValueDangerSource) {
      return;
    }

    this.loadingStatistics = true;
    this.statisticsError = "";

    try {
      const blob = await firstValueFrom(
        this.statisticsService.getDangerSourceStatisticsCsv(
          this.bsRangeValueDangerSource[0],
          this.bsRangeValueDangerSource[1],
        ),
      );
      const startDate = this.constantsService.getISODateString(this.bsRangeValueDangerSource[0]);
      const endDate = this.constantsService.getISODateString(this.bsRangeValueDangerSource[1]);
      let filename = "danger_source_statistic_" + startDate + "_" + endDate;
      filename = filename + ".csv";
      saveAs(blob, filename);
      console.log("Danger source statistics loaded.");
    } catch (error) {
      this.statisticsError = this.translateService.instant("statistics.error.downloadFailed");
      console.error("Danger source statistics could not be downloaded.", error);
    } finally {
      this.loadingStatistics = false;
    }
  }
}
