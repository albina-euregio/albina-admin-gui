import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { UserService } from "../providers/user-service/user.service";
import { Component, OnInit, inject } from "@angular/core";
import type { EChartsCoreOption as EChartsOption } from "echarts/core";
import { NgxEchartsDirective } from "ngx-echarts";

@Component({
  selector: "app-team-stress-levels",
  template: `
    <div echarts [options]="dataset"></div>
  `,
  standalone: true,
  imports: [NgxEchartsDirective],
})
export class TeamStressLevelsComponent implements OnInit {
  private bulletinsService = inject(BulletinsService);
  private userService = inject(UserService);
  private constantsService = inject(ConstantsService);

  dataset: EChartsOption;

  ngOnInit(): void {
    const inputDates = this.bulletinsService.dates;
    this.userService.getTeamStressLevels([inputDates.at(-1)[0], inputDates.at(0)[1]]).subscribe((stressLevels) => {
      const dates = inputDates
        .flat()
        .map((d) => this.constantsService.getISODateString(d))
        .filter((d, i, arr) => arr.indexOf(d) === i)
        .sort();
      this.dataset = {
        xAxis: {
          data: dates,
        },
        yAxis: {
          min: 0,
          max: 100,
        },
        series: Object.values(stressLevels).map((ll) => ({
          type: "line",
          data: dates.map((date) => ll.find((l) => l.date === date)?.stressLevel),
        })),
      };
    });
  }
}
