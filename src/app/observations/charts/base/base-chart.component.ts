import { Component, EventEmitter, Input, Output } from "@angular/core";
import { LocalFilterTypes } from "app/observations/models/generic-observation.model";

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
  @Output() handleChange: EventEmitter<any> = new EventEmitter();
  @Input() nanStatus: { selected: Boolean; highlighted: Boolean };
  @Input() isActive: Boolean;

  submitChange(data) {
    this.handleChange.emit(data);
  }

  private resetTimeout() {
    clearTimeout(this.pressTimer);
    this.pressTimer = null;
  }

  onMouseDown(event: any) {
    const self = this;
    this.pressTimer = window.setTimeout(function () {
      self.resetTimeout();
      self.submitChange([self.type, { value: event.data[0], altKey: true }]);
    }, this.longClickDur);
    return false;
  }

  onMouseUp(event: any) {
    if (this.pressTimer) {
      this.resetTimeout();
      this.submitChange([this.type, { value: event.data[0], altKey: event.event.event.altKey }]);
    }
    return false;
  }

  onClickNan(event: any) {
    this.submitChange([this.type, { value: "nan", altKey: event.altKey }]);
  }

  onInvert() {
    this.submitChange([this.type, { invert: true }]);
  }

  onReset() {
    this.submitChange([this.type, { reset: true }]);
  }
}
