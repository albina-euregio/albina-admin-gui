import type { FilterSelectionData } from "./filter-selection-data";
import { ObservationMarkerService } from "./observation-marker.service";
import { CommonModule } from "@angular/common";
import { Component, OnInit, output, input, inject } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import type { ECElementEvent, EChartsCoreOption as EChartsOption } from "echarts/core";
import type { CallbackDataParams } from "echarts/types/dist/shared";
import { NgxEchartsDirective } from "ngx-echarts";

@Component({
  standalone: true,
  selector: "app-observation-chart",
  imports: [CommonModule, NgxEchartsDirective, TranslateModule],
  templateUrl: "./observation-chart.component.html",
})
export class ObservationChartComponent<T> implements OnInit {
  markerService = inject<ObservationMarkerService<T>>(ObservationMarkerService);
  protected translateService = inject(TranslateService);

  longClickDur = 200;
  private pressTimer;

  readonly filterSelection = input<FilterSelectionData<T>>(undefined);
  readonly handleChange = output();
  readonly handleReload = output();
  public options: EChartsOption;

  get isActive(): boolean {
    return this.filterSelection()["selected"].size > 0 || this.filterSelection()["highlighted"].size > 0;
  }

  ngOnInit(): void {
    this.options = this.filterSelection().chartType === "rose" ? this.roseOptions : this.barOptions;
  }

  get fontFamily() {
    return getComputedStyle(document.body).getPropertyValue("font-family");
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
          fontFamily: this.fontFamily,
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
            fontFamily: this.fontFamily,
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
          fontFamily: this.fontFamily,
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

  onMouseDown(event: ECElementEvent) {
    this.pressTimer = window.setTimeout(() => {
      this.resetTimeout();
      this.filterSelection().toggleFilterValue("highlighted", event.data[0]);
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
      this.onSeriesClick(event.event.event, event.data[0]);
    } else if (event.componentType === "angleAxis") {
      this.onSeriesClick(event.event.event, event.value as string);
    }
    return false;
  }

  onSeriesClick(event: MouseEvent | TouchEvent, value: "nan" | string) {
    const subset = event.altKey ? "highlighted" : "selected";
    if (event.shiftKey) {
      this.filterSelection().toggleFilterValue(subset, value);
    } else {
      this.filterSelection().setFilterValue(subset, value);
    }
    if (event.ctrlKey) {
      this.filterSelection().invertFilter(subset);
    }
    this.handleChange.emit();
  }

  onReload() {
    this.handleReload.emit();
  }

  onMarkerClassify() {
    const filterSelection = this.filterSelection();
    this.markerService.markerClassify =
      filterSelection.type !== this.markerService.markerClassify?.type ? filterSelection : undefined;
    this.handleChange.emit();
  }

  onMarkerLabel() {
    const filterSelection = this.filterSelection();
    this.markerService.markerLabel =
      filterSelection.type !== this.markerService.markerLabel?.type ? filterSelection : undefined;
    this.handleChange.emit();
  }

  onInvert() {
    this.filterSelection().invertFilter("selected");
    this.handleChange.emit();
  }

  onReset() {
    this.filterSelection().resetFilter();
    this.handleChange.emit();
  }

  getItemColor(entry) {
    const filterSelection = this.markerService.markerClassify;
    if (filterSelection?.type === this.filterSelection().type) {
      const color = filterSelection.values.find((v) => v.value === entry.name)?.color;
      return !color || color === "white" ? "#000000" : color;
    } else {
      return "#000000";
    }
  }

  getClassifyColor(entry, count?: number) {
    const filterSelection = this.markerService.markerClassify;
    if (filterSelection?.type === this.filterSelection().type) {
      return this.getItemColor(entry);
    }
    if (filterSelection && count !== undefined) {
      const color = filterSelection.values[count]?.color;
      return !color || color === "white" ? "#000000" : color;
    } else {
      return "#000000";
    }
  }

  getItemLabel(entry): string {
    let value: string;
    const filterSelectionValue = this.filterSelection();
    if (filterSelectionValue.chartType === "rose") {
      value = entry;
    } else {
      value = entry.value[0];
    }
    const isSelected = filterSelectionValue.isIncluded("selected", value);
    const result = filterSelectionValue.values.find((v) => v.value === value)?.legend || value;
    const formattedResult = isSelected && this.isActive ? "{highlight|" + result + "}" : result;

    const filterSelection = this.markerService.markerLabel;
    if (filterSelection?.type === filterSelectionValue.type) {
      const value = filterSelection.values.find((v) => v.value === entry.name);
      if (value) {
        return `{${filterSelection.chartRichLabel ?? "symbol"}|${value.label}} ${formattedResult}`;
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
    return `
<span class="badge rounded-pill me-1" style="width: 0.75rem;height:0.75rem;background-color:${params.color};"></span>
<span>${params.name}</span>
<strong>${val}</strong>
<div>Click to set, <kbd>Shift</kbd> click to add, <kbd>Ctrl</kbd> click to invert</div>
`;
  }
}
