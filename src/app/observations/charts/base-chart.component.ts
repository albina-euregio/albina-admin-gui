import { Component, EventEmitter, Input, Output } from "@angular/core";
import { LocalFilterTypes } from "../models/generic-observation.model";
import { type GenericFilterToggleData } from "../observation-filter.service";
import { ObservationMarkerService } from "../observation-marker.service";

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

  constructor(protected observationMarkerService: ObservationMarkerService) {
  }

  private resetTimeout() {
    clearTimeout(this.pressTimer);
    this.pressTimer = null;
  }

  onMouseDown(event: any) {
    this.pressTimer = window.setTimeout(() => {
      this.resetTimeout();
      this.handleChange.emit({ type: this.type, data: { value: event.data[0], altKey: true } });
    }, this.longClickDur);
    return false;
  }

  onMouseUp(event: any) {
    if (this.pressTimer) {
      this.resetTimeout();
      this.handleChange.emit({ type: this.type, data: { value: event.data[0], altKey: event.event.event.altKey } });
    }
    return false;
  }

  onClickNan(event: any) {
    this.handleChange.emit({ type: this.type, data: { value: "nan", altKey: event.altKey } });
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
      const color = this.observationMarkerService.getColor(this.classifyType, entry.name);
      if (color === "white") {
        return "#000000";
      } else {
        return color;
      }
    } else {
      return "#000000";
    }
  }
}
