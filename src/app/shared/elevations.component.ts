import { CommonModule } from "@angular/common";
import { Component, Input, input, OnChanges, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-elevations",
  templateUrl: "elevations.component.html",
  standalone: true,
  imports: [TranslateModule, FormsModule, CommonModule],
})
export class ElevationsComponent implements OnChanges {
  @Input() elevationHigh?: number;
  @Input() treelineHigh?: boolean;
  @Input() elevationLow?: number;
  @Input() treelineLow?: boolean;

  readonly elevationsChange = output<void>();
  readonly disabled = input<boolean>(false);
  readonly singleton = input<boolean>(false);

  useElevationHigh = false;
  useElevationLow = false;
  isElevationHighEditing = false;
  isElevationLowEditing = false;
  localElevationHigh = undefined;
  localElevationLow = undefined;
  localTreelineHigh = false;
  localTreelineLow = false;

  ngOnChanges() {
    if (!this.isElevationHighEditing) {
      this.useElevationHigh = this.treelineHigh || this.elevationHigh !== null;
      this.localElevationHigh = this.elevationHigh;
      this.localTreelineHigh = this.treelineHigh;
    }
    if (!this.isElevationLowEditing) {
      this.useElevationLow = this.treelineLow || this.elevationLow !== null;
      this.localElevationLow = this.elevationLow;
      this.localTreelineLow = this.treelineLow;
    }
  }

  updateElevationHigh() {
    if (!this.localTreelineHigh) {
      if (this.localElevationHigh !== undefined && this.localElevationHigh !== "") {
        this.localElevationHigh = Math.round(this.localElevationHigh / 100) * 100;
        if (this.localElevationHigh > 9000) {
          this.localElevationHigh = 9000;
        } else if (this.localElevationHigh < 0) {
          this.localElevationHigh = 0;
        }
        this.elevationHigh = this.localElevationHigh;
      }
      this.isElevationHighEditing = false;
      this.elevationsChange.emit();
    }
  }

  updateElevationLow() {
    if (!this.localTreelineLow) {
      if (this.localElevationLow !== undefined && this.localElevationLow !== "") {
        this.localElevationLow = Math.round(this.localElevationLow / 100) * 100;
        if (this.localElevationLow > 9000) {
          this.localElevationLow = 9000;
        } else if (this.localElevationLow < 0) {
          this.localElevationLow = 0;
        }
        this.elevationLow = this.localElevationLow;
      }
      this.isElevationLowEditing = false;
      this.elevationsChange.emit();
    }
  }

  treelineHighClicked(event) {
    event.stopPropagation();
    if (this.treelineHigh) {
      this.isElevationHighEditing = true;
      this.treelineHigh = false;
      this.localElevationHigh = "";
      this.localTreelineHigh = false;
    } else {
      this.treelineHigh = true;
      this.elevationHigh = undefined;
      this.localElevationHigh = "";
      this.localTreelineHigh = true;
      this.isElevationHighEditing = false;
    }
    this.elevationsChange.emit();
  }

  treelineLowClicked(event) {
    event.stopPropagation();
    if (this.treelineLow) {
      this.isElevationLowEditing = true;
      this.localTreelineLow = false;
      this.localElevationLow = "";
      this.treelineLow = false;
    } else {
      this.treelineLow = true;
      this.elevationLow = undefined;
      this.localElevationLow = "";
      this.localTreelineLow = true;
      this.isElevationLowEditing = false;
    }
    this.elevationsChange.emit();
  }

  setUseElevationHigh(event) {
    if (!event.currentTarget.checked) {
      this.localElevationHigh = "";
      this.localTreelineHigh = false;
      this.treelineHigh = false;
      this.elevationHigh = undefined;
      this.isElevationHighEditing = false;
      this.useElevationHigh = false;
      this.elevationsChange.emit();
    } else {
      this.useElevationHigh = true;
      this.isElevationHighEditing = true;
    }
  }

  setUseElevationLow(event) {
    if (!event.currentTarget.checked) {
      this.localElevationLow = "";
      this.localTreelineLow = false;
      this.treelineLow = false;
      this.elevationLow = undefined;
      this.isElevationLowEditing = false;
      this.useElevationLow = false;
      this.elevationsChange.emit();
    } else {
      this.useElevationLow = true;
      this.isElevationLowEditing = true;
    }
  }
}
