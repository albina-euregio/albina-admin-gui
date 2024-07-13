import { Component } from "@angular/core";
import { BaseComponent } from "./base-chart.component";
import { NgxEchartsDirective } from "ngx-echarts";
import { CommonModule } from "@angular/common";
import type { EChartsOption } from "echarts";
import type { CallbackDataParams } from "echarts/types/dist/shared";
import { ObservationMarkerService } from "../observation-marker.service";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { ObservationFilterService } from "../observation-filter.service";

const barDefaults = {
  type: "bar",
  barGap: "-100%",
  coordinateSystem: "polar",
  barCategoryGap: "0%",
  //name: legendName[0],
  //stack: 'c',
} as const;

@Component({
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective, TranslateModule],
  selector: "app-rose-chart",
  templateUrl: "./base-chart.component.html",
})
export class RoseChartComponent extends BaseComponent {
  public readonly defaultOptions: EChartsOption = {
    // title: {
    //     text: this.caption || 'points of the compass chart'
    // },
    grid: [
      {
        top: "10px",
        left: 0,
        right: 0,
        bottom: 0,
      },
    ],
    tooltip: {
      //position: ['50%', '5'],
      confine: true,
      trigger: "item",
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
    // dataset: {
    //     // Provide a set of data.
    //     source: [
    //         ['category', 'all', 'highlighted' ,'available', 'selected'],
    //         ['N', 100, 20, 0],
    //         ['NE', 70, 0, 60],
    //         ['E', 30, 0, 20],
    //         ['SE', 80, 80, 0],
    //         ['S', 90, 80, 0],
    //         ['SW', 100, 0, 30],
    //         ['W', 80, 80, 0],
    //         ['NW', 90, 80, 0],
    //     ]
    // },
    color: ["#B1C1C7", "", "rgba(255, 0, 0, 0.5)", "#000", "#19ABFF"],
    angleAxis: {
      triggerEvent: true,
      type: "category",
      z: 10,
      // scale: true,
      startAngle: 110,
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      axisLabel: {
        show: true,
        formatter: (params: string) => {
          return this.getItemLabel(params);
        },
        //interval: 1,
        rich: {
          labelhighlight: {
            fontWeight: 600,
            color: "#19ABFF",
          },
          highlight: {
            color: "#19ABFF",
          },
          label: {
            fontWeight: 600,
            color: "#000000",
          },
        },
      },
      splitLine: {
        show: true,
      },
      splitArea: {
        show: false,
      },
    },
    radiusAxis: {
      show: false,
      axisLabel: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      },
    },
    polar: {
      center: ["50%", "115px"],
      // emphasis: {
      //   disabled: true,
      // },
    },
    series: [
      {
        ...barDefaults,
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        emphasis: {
          disabled: true,
        },
        z: 5,
      },
      {
        ...barDefaults,
        itemStyle: {
          color: (entry) => this.getItemColor(entry),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        itemStyle: {
          color: (entry) => this.getItemColor(entry),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 0),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 1),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 2),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 3),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 4),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 5),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 6),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 7),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
        stack: "total",
        itemStyle: {
          color: (entry) => this.getClassifyColor(entry, 8),
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        ...barDefaults,
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
    protected observationMarkerService: ObservationMarkerService,
    protected translateService: TranslateService,
  ) {
    super(filter, observationMarkerService, translateService);
  }
}
