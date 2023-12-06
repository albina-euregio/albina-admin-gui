import { Component, EventEmitter, Input, Output } from "@angular/core";
import { LocalFilterTypes } from "app/observations/models/generic-observation.model";
import { type GenericFilterToggleData } from "../../observation-filter.service";

@Component({
  selector: "app-base-chart",
  template: `<div class="zippy">Base Chart Template</div>`,
})
export class BaseComponent {
  longClickDur = 200;
  private pressTimer;

  @Input() caption: string;
  @Input() translationBase: string;
  @Input() formatter: string;
  @Input() type: LocalFilterTypes;
  @Input() data: { dataset: object; nan: number };
  @Output() handleChange: EventEmitter<[LocalFilterTypes, GenericFilterToggleData["data"]]> = new EventEmitter();
  @Input() nanStatus: { selected: Boolean; highlighted: Boolean };
  @Input() isActive: Boolean;

  private resetTimeout() {
    clearTimeout(this.pressTimer);
    this.pressTimer = null;
  }

  onMouseDown(event: any) {
    this.pressTimer = window.setTimeout(() => {
      this.resetTimeout();
      this.handleChange.emit([this.type, { value: event.data[0], altKey: true }]);
    }, this.longClickDur);
    return false;
  }

  onMouseUp(event: any) {
    if (this.pressTimer) {
      this.resetTimeout();
      this.handleChange.emit([this.type, { value: event.data[0], altKey: event.event.event.altKey }]);
    }
    return false;
  }

  onClickNan(event: any) {
    this.handleChange.emit([this.type, { value: "nan", altKey: event.altKey }]);
  }

  onMarkerClassify() {
    this.handleChange.emit([this.type, { markerClassify: true }]);
  }

  onMarkerLabel() {
    this.handleChange.emit([this.type, { markerLabel: true }]);
  }

  onInvert() {
    this.handleChange.emit([this.type, { invert: true }]);
  }

  onReset() {
    this.handleChange.emit([this.type, { reset: true }]);
  }
}
