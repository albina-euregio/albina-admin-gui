import { Component } from "@angular/core";
import { BaseComponent } from "./base-chart.component";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { CommonModule, formatDate } from "@angular/common";
import { NgxEchartsDirective, provideEcharts } from "ngx-echarts";
import type { EChartsOption } from "echarts";
import type { CallbackDataParams } from "echarts/types/dist/shared";
import { ObservationMarkerService } from "../observation-marker.service";
import { ObservationFilterService } from "../observation-filter.service";

const barWidth = 3;
const defaultDataBarOptions = {
  type: "bar",
  barWidth: barWidth,
  itemStyle: {
    //borderRadius: [0, 2, 2, 0],
    color: "#f86c6b",
  },
  barGap: "-100%",
  emphasis: {
    focus: "series",
    //blurScope: 'coordinateSystem'
  },
} as const;

@Component({
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective, TranslateModule],
  selector: "app-bar-chart",
  templateUrl: "./base-chart.component.html",
  styleUrls: ["./bar-chart.component.scss"],
})
export class BarChartComponent extends BaseComponent {
  public readonly defaultOptions: EChartsOption = {
    // title: {
    //     text: 'bar chart'
    // },
    grid: [
      {
        top: "5px",
        left: 0,
        right: 0,
        bottom: 0,
      },
    ],
    tooltip: {
      // position: ['50%', '5'],
      // trigger: 'axis',
      confine: true,
      // position: 'right',
      borderWidth: 0,
      textStyle: {
        color: "#839194",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      },
      formatter: (params: CallbackDataParams) => {
        const valKey = params.dimensionNames.indexOf(params.seriesName);
        let val = params.value[valKey];
        if (params.seriesName === "highlighted") {
          val = params.value[1];
        }
        return (
          '<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:' +
          params.color +
          ';"></span><span style="font-size:14px;color:#839194;font-weight:400;margin-left:2px">' +
          params.name +
          '</span><span style="float:right;margin-left:20px;font-size:14px;color:#839194;font-weight:900">' +
          val +
          "</span>"
        );
      },
    },
    yAxis: {
      inverse: true,
      min: 0,
      max: 10,
      boundaryGap: true,
      // scale: true,
      type: "category",
      axisLabel: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
    },
    xAxis: {
      axisLabel: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      splitLine: {
        show: false,
      },
    },
    series: [
      {
        type: "bar",
        barWidth: barWidth,
        animation: false,
        barGap: "-100%",
        tooltip: {
          show: false,
        },
        showBackground: true,
        itemStyle: {
          color: "#F6F6F6",
          borderWidth: 0,
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        label: {
          fontWeight: "normal",
          fontSize: 12,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          //grey
          color: "#839194",
          position: [0, -14],
          formatter: (params: CallbackDataParams) => {
            return this.getItemLabel(params);
          },
          show: true,
          rich: {
            highlight: {
              color: "#19ABFF",
            },
            label: {
              fontWeight: 600,
              color: "#000000",
            },
            symbol: {
              color: "#19ABFF",
            },
            grainShape: {
              //fontWeight: 600,
              color: "#19ABFF",
              fontFamily: "snowsymbolsiacs",
            },
          },
        },
        itemStyle: {
          color: "#B1C1C7",
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        z: -2,
        barWidth: barWidth,
        // barMinHeight: 6,
        itemStyle: {
          color: "rgba(255, 0, 0, 0.5)",
          //yellow
          shadowColor: "#FF0000",
          shadowBlur: 0,
          shadowOffsetY: barWidth,
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        itemStyle: {
          color: (entry) => this.getItemColor(entry),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        itemStyle: {
          color: (entry) => this.getItemColor(entry),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 0),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 1),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 2),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 3),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 4),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 5),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 6),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 7),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 8),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...defaultDataBarOptions,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 9),
        },
        emphasis: {
          disabled: true,
        },
      },
    ],
  };
  public options = Object.assign(this.defaultOptions);

  constructor(
    public filter: ObservationFilterService,
    protected translateService: TranslateService,
    protected observationMarkerService: ObservationMarkerService,
  ) {
    super(filter, observationMarkerService, translateService);
  }
}
