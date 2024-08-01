import { Component, Input, OnInit } from "@angular/core";
import { UserService } from "../providers/user-service/user.service";
import { EChartsOption } from "echarts";
import { formatDate } from "@angular/common";

@Component({
  selector: "app-team-stress-levels",
  template: ` <div echarts [options]="dataset"></div>`,
})
export class TeamStressLevelsComponent implements OnInit {
  @Input() dates: [Date, Date][];

  dataset: EChartsOption;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getTeamStressLevels([this.dates.at(-1)[0], this.dates.at(0)[1]]).subscribe((stressLevels) => {
      const dates = this.dates
        .flat()
        .map((d) => formatDate(d, "yyyy-MM-dd", "en-US"))
        .filter((d, i, arr) => arr.indexOf(d) === i)
        .sort();
      this.dataset = {
        xAxis: {
          data: dates,
        },
        yAxis: {},
        series: Object.values(stressLevels).map((ll) => ({
          type: "line",
          data: dates.map((date) => ll.find((l) => l.date === date)?.stressLevel),
        })),
      };
    });
  }
}
