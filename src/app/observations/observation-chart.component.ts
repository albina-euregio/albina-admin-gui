import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { LocalFilterTypes } from "./models/generic-observation.model";
import { type FilterSelectionData, ObservationFilterService } from "./observation-filter.service";
import type { CallbackDataParams } from "echarts/types/dist/shared";
import type { ECElementEvent, EChartsOption } from "echarts";
import { CommonModule } from "@angular/common";
import { NgxEchartsDirective } from "ngx-echarts";
import { ObservationMarkerService } from "./observation-marker.service";

export type ChartType = "bar" | "rose";

export type Dataset = Array<Array<string | number>>;

@Component({
  standalone: true,
  selector: "app-observation-chart",
  imports: [CommonModule, NgxEchartsDirective, TranslateModule],
  templateUrl: "./observation-chart.component.html",
})
export class ObservationChartComponent implements OnInit {
  longClickDur = 200;
  private pressTimer;

  @Input() filterSelection: FilterSelectionData;
  @Output() handleChange: EventEmitter<void> = new EventEmitter();
  public options: EChartsOption;

  get isActive(): boolean {
    return this.filterSelection["selected"].size > 0 || this.filterSelection["highlighted"].size > 0;
  }

  get translationBase(): string {
    switch (this.filterSelection.type) {
      case LocalFilterTypes.Aspect:
        return "aspect.";
      case LocalFilterTypes.Stability:
        return "snowpackStability.";
      case LocalFilterTypes.ObservationType:
        return "observationType.";
      case LocalFilterTypes.ImportantObservation:
        return "importantObservation.";
      case LocalFilterTypes.AvalancheProblem:
        return "avalancheProblem.";
      case LocalFilterTypes.DangerPattern:
        return "dangerPattern.";
      default:
        return "";
    }
  }

  constructor(
    public filter: ObservationFilterService,
    public markerService: ObservationMarkerService,
    protected translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    this.options = this.filterSelection.chartType === "rose" ? this.roseOptions : this.barOptions;
  }

  get barOptions(): EChartsOption {
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
    return {
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
        formatter: (params: CallbackDataParams) => this.formatTooltip(params),
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
            formatter: (params: CallbackDataParams) => this.getItemLabel(params),
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
        ...[undefined, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
          ...defaultDataBarOptions,
          stack: "total",
          itemStyle: {
            color: (entry) => this.getClassifyColor(entry, i),
          },
          emphasis: {
            disabled: true,
          },
        })),
      ],
    };
  }

  get roseOptions(): EChartsOption {
    const barDefaults = {
      type: "bar",
      barGap: "-100%",
      coordinateSystem: "polar",
      barCategoryGap: "0%",
      //name: legendName[0],
      //stack: 'c',
    } as const;

    return {
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
        formatter: (params: CallbackDataParams) => this.formatTooltip(params),
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
          formatter: (params: string) => this.getItemLabel(params),
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
        ...[undefined, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
          ...barDefaults,
          stack: "total",
          itemStyle: {
            color: (entry) => this.getClassifyColor(entry, i),
          },
          emphasis: {
            disabled: true,
          },
        })),
      ],
    };
  }

  private resetTimeout() {
    clearTimeout(this.pressTimer);
    this.pressTimer = null;
  }

  onMouseDown(event: any) {
    this.pressTimer = window.setTimeout(() => {
      this.resetTimeout();
      this.filter.toggleFilterValue(this.filterSelection, "highlighted", event.data[0]);
      this.handleChange.emit();
    }, this.longClickDur);
    return false;
  }

  onMouseUp(event: ECElementEvent) {
    if (!this.pressTimer) {
      return false;
    }
    this.resetTimeout();
    if (event.componentType === "series") {
      this.onSeriesClick(event);
    } else if (event.componentType === "angleAxis") {
      this.onAngleAxisClick(event);
    }
    return false;
  }

  private onSeriesClick(event: ECElementEvent) {
    const subset = event.event.event.altKey ? "highlighted" : "selected";
    this.filter.toggleFilterValue(this.filterSelection, subset, event.data[0]);
    if (event.event.event.ctrlKey) {
      this.filter.invertFilter(this.filterSelection, subset);
    }
    this.handleChange.emit();
  }

  private onAngleAxisClick(event: ECElementEvent) {
    const subset = event.event.event.altKey ? "highlighted" : "selected";
    this.filter.toggleFilterValue(this.filterSelection, subset, event.value as string);
    if (event.event.event.ctrlKey) {
      this.filter.invertFilter(this.filterSelection, subset);
    }
    this.handleChange.emit();
  }

  onClickNan(event: MouseEvent) {
    const subset = event.altKey ? "highlighted" : "selected";
    this.filter.toggleFilterValue(this.filterSelection, subset, "nan");
    if (event.ctrlKey) {
      this.filter.invertFilter(this.filterSelection, subset);
    }
    this.handleChange.emit();
  }

  onMarkerClassify() {
    this.markerService.markerClassify =
      this.filterSelection.type !== this.markerService.markerClassify ? this.filterSelection.type : undefined;
    this.handleChange.emit();
  }

  onMarkerLabel() {
    this.markerService.markerLabel =
      this.filterSelection.type !== this.markerService.markerLabel ? this.filterSelection.type : undefined;
    this.handleChange.emit();
  }

  onInvert() {
    this.filter.invertFilter(this.filterSelection, "selected");
    this.handleChange.emit();
  }

  onReset() {
    this.filter.resetFilter(this.filterSelection);
    this.handleChange.emit();
  }

  getItemColor(entry) {
    if (this.markerService.markerClassify === this.filterSelection.type) {
      const filterSelection = this.filter.filterSelection[this.markerService.markerClassify];
      const color = filterSelection.values.find((v) => v.value === entry.name)?.color;
      return !color || color === "white" ? "#000000" : color;
    } else {
      return "#000000";
    }
  }

  getClassifyColor(entry, count?: number) {
    if (this.markerService.markerClassify === this.filterSelection.type) {
      return this.getItemColor(entry);
    }
    if (this.markerService.markerClassify && count !== undefined) {
      const filterSelection = this.filter.filterSelection[this.markerService.markerClassify];
      const color = filterSelection.values[count]?.color;
      return !color || color === "white" ? "#000000" : color;
    } else {
      return "#000000";
    }
  }

  getItemLabel(entry): string {
    let value: string;
    if (this.filterSelection.chartType === "rose") {
      value = entry;
    } else {
      value = entry.value[0];
    }
    const isSelected = this.filter.isIncluded(this.filterSelection, "selected", value);
    const result = this.translationBase ? this.translateService.instant(this.translationBase + value) : value;
    const formattedResult = isSelected && this.isActive ? "{highlight|" + result + "}" : result;

    if (this.markerService.markerLabel === this.filterSelection.type) {
      const filterSelection = this.filter.filterSelection[this.markerService.markerLabel];
      const value = filterSelection.values.find((v) => v.value === entry.name);
      if (value) {
        return `{${filterSelection.chartRichLabel}|${value.label}} ${formattedResult}`;
      }
    }
    return formattedResult;
  }

  formatTooltip(params: CallbackDataParams) {
    const valKey = params.dimensionNames.indexOf(params.seriesName);
    let val = params.value[valKey];
    if (params.seriesName === "highlighted") {
      val = params.value[1];
    } else if (params.seriesName === "all") {
      val = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        .map((entry) => params.value[entry])
        .reduce((sum, entry) => sum + entry);
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
  }
}
