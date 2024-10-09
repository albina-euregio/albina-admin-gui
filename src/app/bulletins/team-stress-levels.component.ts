import { Component, Input, OnInit } from "@angular/core";
import { UserService } from "../providers/user-service/user.service";
import { EChartsOption } from "echarts";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { NgxEchartsDirective } from "ngx-echarts";

@Component({
  selector: "app-team-stress-levels",
  template: ` <div echarts [options]="dataset"></div>`,
  standalone: true,
  imports: [NgxEchartsDirective],
})
export class TeamStressLevelsComponent implements OnInit {
  @Input() dates: [Date, Date][];

  dataset: EChartsOption;

  constructor(
    private userService: UserService,
    private constantsService: ConstantsService,
  ) {}

  ngOnInit(): void {
    this.userService.getTeamStressLevels([this.dates.at(-1)[0], this.dates.at(0)[1]]).subscribe((stressLevels) => {
      const dates = this.dates
        .flat()
        .map((d) => this.constantsService.getISODateString(d))
        .filter((d, i, arr) => arr.indexOf(d) === i)
        .sort();
      this.dataset = {
        xAxis: {
          data: dates,
        },
        yAxis: {
          splitNumber: 4,
        },
        series: Object.values(stressLevels).map((ll) => ({
          type: "line",
          data: dates.map((date) => ll.find((l) => l.date === date)?.stressLevel),
        })),
      };
    });
  }
}
