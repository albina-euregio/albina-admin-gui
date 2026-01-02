import { CommonModule } from "@angular/common";
import { Component, input, OnChanges, output, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-elevations",
  templateUrl: "elevations.component.html",
  standalone: true,
  imports: [TranslateModule, FormsModule, CommonModule],
})
export class ElevationsComponent implements OnChanges {
  elevationHigh = model<number>(undefined);
  treelineHigh = model<boolean>(false);
  elevationLow = model<number>(undefined);
  treelineLow = model<boolean>(false);

  readonly elevationsChange = output<void>();
  readonly disabled = input<boolean>(false);
  readonly singleton = input<boolean>(false);

  useElevationHigh = false;
  useElevationLow = false;
  isElevationHighEditing = false;
  isElevationLowEditing = false;

  ngOnChanges() {
    if (!this.isElevationHighEditing) {
      this.useElevationHigh = this.treelineHigh() || this.elevationHigh() !== undefined;
    }
    if (!this.isElevationLowEditing) {
      this.useElevationLow = this.treelineLow() || this.elevationLow() !== undefined;
    }
  }

  updateElevationHigh() {
    if (!this.treelineHigh) {
      if (this.elevationHigh !== undefined) {
        this.elevationHigh.set(Math.round(this.elevationHigh() / 100) * 100);
        if (this.elevationHigh() > 9000) {
          this.elevationHigh.set(9000);
        } else if (this.elevationHigh() < 0) {
          this.elevationHigh.set(0);
        }
      }
      this.isElevationHighEditing = false;
      this.elevationsChange.emit();
    }
  }

  updateElevationLow() {
    if (!this.treelineLow()) {
      if (this.elevationLow() !== undefined) {
        this.elevationLow.set(Math.round(this.elevationLow() / 100) * 100);
        if (this.elevationLow() > 9000) {
          this.elevationLow.set(9000);
        } else if (this.elevationLow() < 0) {
          this.elevationLow.set(0);
        }
      }
      this.isElevationLowEditing = false;
      this.elevationsChange.emit();
    }
  }

  treelineHighClicked(event) {
    event.stopPropagation();
    if (this.treelineHigh) {
      this.isElevationHighEditing = true;
      this.treelineHigh.set(false);
    } else {
      this.treelineHigh.set(true);
      this.elevationHigh.set(undefined);
      this.isElevationHighEditing = false;
    }
    this.elevationsChange.emit();
  }

  treelineLowClicked(event) {
    event.stopPropagation();
    if (this.treelineLow) {
      this.isElevationLowEditing = true;
      //this.treelineLow.set(false);
    } else {
      //this.treelineLow.set(true);
      this.elevationLow.set(undefined);
      this.isElevationLowEditing = false;
    }
    this.elevationsChange.emit();
  }

  setUseElevationHigh(event) {
    if (!event.currentTarget.checked) {
      this.treelineHigh.set(false);
      this.elevationHigh.set(undefined);
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
      this.treelineLow.set(false);
      this.elevationLow.set(undefined);
      this.isElevationLowEditing = false;
      this.useElevationLow = false;
      this.elevationsChange.emit();
    } else {
      this.useElevationLow = true;
      this.isElevationLowEditing = true;
    }
  }
}
