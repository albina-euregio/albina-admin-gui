import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { LocalFilterTypes } from "../models/generic-observation.model";
import { ObservationFilterService, type GenericFilterToggleData } from "../observation-filter.service";
import { ObservationMarkerService } from "../observation-marker.service";
import type { CallbackDataParams } from "echarts/types/dist/shared";

@Component({
  selector: "app-base-chart",
  template: `<div class="zippy">Base Chart Template</div>`,
})
export class BaseComponent {
  longClickDur = 200;
  private pressTimer;

  @Input() caption: string;
  @Input() formatter: string;
  @Input() type: LocalFilterTypes;
  @Input() data: { dataset: object; nan: number };
  @Output() handleChange: EventEmitter<GenericFilterToggleData> = new EventEmitter();
  @Input() nanStatus: { selected: boolean; highlighted: boolean };
  @Input() isActive: boolean;
  @Input() labelType: LocalFilterTypes;
  @Input() classifyType: LocalFilterTypes;

  get translationBase(): string {
    switch (this.type) {
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
    protected observationMarkerService: ObservationMarkerService,
    protected translateService: TranslateService,
  ) {}

  private resetTimeout() {
    clearTimeout(this.pressTimer);
    this.pressTimer = null;
  }

  onMouseDown(event: any) {
    this.pressTimer = window.setTimeout(() => {
      this.resetTimeout();
      this.handleChange.emit({ type: this.type, data: { value: event.data[0], altKey: true, ctrlKey: false } });
    }, this.longClickDur);
    return false;
  }

  onMouseUp(event: any) {
    if (this.pressTimer) {
      this.resetTimeout();
      if (event.componentType === "series") {
        this.handleChange.emit({
          type: this.type,
          data: { value: event.data[0], altKey: event.event.event.altKey, ctrlKey: event.event.event.ctrlKey },
        });
      } else if (event.componentType === "angleAxis") {
        this.handleChange.emit({
          type: this.type,
          data: { value: event.value, altKey: event.event.event.altKey, ctrlKey: event.event.event.ctrlKey },
        });
      }
    }
    return false;
  }

  onClickNan(event: any) {
    this.handleChange.emit({ type: this.type, data: { value: "nan", altKey: event.altKey, ctrlKey: event.ctrlKey } });
  }

  onMarkerClassify() {
    this.handleChange.emit({ type: this.type, data: { markerClassify: true } });
  }

  onMarkerLabel() {
    this.handleChange.emit({ type: this.type, data: { markerLabel: true } });
  }

  onInvert() {
    this.handleChange.emit({ type: this.type, data: { invert: true } });
  }

  onReset() {
    this.handleChange.emit({ type: this.type, data: { reset: true } });
  }

  getItemColor(entry) {
    if (this.classifyType === this.type) {
      const filterSelection = this.filter.filterSelection[this.classifyType];
      const color = filterSelection.values.find((v) => v.value === entry.name)?.color;
      return !color || color === "white" ? "#000000" : color;
    } else {
      return "#000000";
    }
  }

  getClassifyColor(entry, count?: number) {
    if (this.classifyType === this.type) {
      return this.getItemColor(entry);
    }
    if (this.classifyType && count !== undefined) {
      const filterSelection = this.filter.filterSelection[this.classifyType];
      const color = filterSelection.values[count]?.color;
      return !color || color === "white" ? "#000000" : color;
    } else {
      return "#000000";
    }
  }

  getItemLabel(entry): string {
    let value: string;
    if (this.type === LocalFilterTypes.Aspect) {
      value = entry;
    } else {
      value = entry.value[0];
    }
    const isSelected = this.filter.isIncluded(this.type, value);
    const result = this.translationBase ? this.translateService.instant(this.translationBase + value) : value;
    const formattedResult = isSelected && this.isActive ? "{highlight|" + result + "}" : result;

    if (this.labelType === this.type) {
      const filterSelection = this.filter.filterSelection[this.labelType];
      const value = filterSelection.values.find((v) => v.value === entry.name);
      return `{${filterSelection.chartRichLabel}|${value.label}} ${formattedResult}`;
    } else {
      return formattedResult;
    }
  }

  formatTooltip(params: CallbackDataParams) {
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
  }
}
