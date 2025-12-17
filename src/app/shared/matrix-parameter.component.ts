import type { DangerSourceVariantModel } from "../danger-sources/models/danger-source-variant.model";
import * as Enums from "../enums/enums";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { DangerRatingComponent } from "./danger-rating.component";
import { SliderComponent, SliderOptions } from "./slider.component";

import { Component, inject, input, OnInit, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import type { BulletinDaytimeDescriptionModel } from "app/models/bulletin-daytime-description.model";
import { MatrixInformationModel } from "app/models/matrix-information.model";

@Component({
  selector: "app-matrix-parameter",
  templateUrl: "matrix-parameter.component.html",
  standalone: true,
  imports: [DangerRatingComponent, FormsModule, TranslateModule, SliderComponent],
})
export class MatrixParameterComponent implements OnInit {
  constantsService = inject(ConstantsService);
  translateService = inject(TranslateService);

  readonly bulletinDaytimeDescription = input<BulletinDaytimeDescriptionModel | DangerSourceVariantModel>(undefined);
  readonly matrixInformation = input<MatrixInformationModel>(undefined);
  readonly comparedMatrixInformation = input<MatrixInformationModel>(undefined);
  readonly isCompared = input<boolean>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly count = input<number>(undefined);
  readonly afternoon = input<boolean>(undefined);
  readonly changeMatrixEvent = output();
  readonly avalancheType = input<Enums.AvalancheType>(undefined);

  dangerRating = Enums.DangerRating;
  dangerRatingEnabled = false;
  modificatorEnum = Enums.DangerRatingModificator;

  public forLabelId(key: string): string {
    return this.count() + (this.afternoon() ? "_pm_" : "_am_") + key;
  }

  getSnowpackStabilityOptions(avalancheType: Enums.AvalancheType): SliderOptions {
    switch (avalancheType) {
      case Enums.AvalancheType.glide:
        return {
          floor: 75,
          ceil: 100,
          ticks: [75, 87, 100],
          getLegend: (value: number): string => {
            switch (value) {
              case 87:
                return this.translateService.instant("snowpackStability.very_poor");
              default:
                return "";
            }
          },
          getSelectionBarColor: (value: number): string => {
            if (value < 0) {
              return "lightgrey";
            }
            if (value < 25) {
              return "green";
            }
            if (value < 50) {
              return "yellow";
            }
            if (value < 75) {
              return "orange";
            }
            if (value >= 75) {
              return "red";
            }
            return "lightgrey";
          },
          onValueChange: (value: number) => {
            this.matrixInformation().snowpackStabilityValue = value;
            switch (true) {
              case value < 25:
                this.setSnowpackStability(Enums.SnowpackStability.good);
                break;
              case value < 50:
                this.setSnowpackStability(Enums.SnowpackStability.fair);
                break;
              case value < 75:
                this.setSnowpackStability(Enums.SnowpackStability.poor);
                break;
              default:
                this.setSnowpackStability(Enums.SnowpackStability.very_poor);
                break;
            }
            this.changeMatrixEvent.emit();
          },
        };
      case Enums.AvalancheType.loose:
        return {
          floor: 50,
          ceil: 100,
          ticks: [50, 62, 75, 87, 100],
          getLegend: (value: number): string => {
            switch (value) {
              case 62:
                return this.translateService.instant("snowpackStability.poor");
              case 87:
                return this.translateService.instant("snowpackStability.very_poor");
              default:
                return "";
            }
          },
          getSelectionBarColor: (value: number): string => {
            if (value < 0) {
              return "lightgrey";
            }
            if (value < 25) {
              return "green";
            }
            if (value < 50) {
              return "yellow";
            }
            if (value < 75) {
              return "orange";
            }
            if (value >= 75) {
              return "red";
            }
            return "lightgrey";
          },
          onValueChange: (value: number) => {
            this.matrixInformation().snowpackStabilityValue = value;
            switch (true) {
              case value < 25:
                this.setSnowpackStability(Enums.SnowpackStability.good);
                break;
              case value < 50:
                this.setSnowpackStability(Enums.SnowpackStability.fair);
                break;
              case value < 75:
                this.setSnowpackStability(Enums.SnowpackStability.poor);
                break;
              default:
                this.setSnowpackStability(Enums.SnowpackStability.very_poor);
                break;
            }
            this.changeMatrixEvent.emit();
          },
        };
      default:
        return {
          floor: 25,
          ceil: 100,
          ticks: [25, 37, 50, 62, 75, 87, 100],
          getLegend: (value: number): string => {
            switch (value) {
              case 37:
                return this.translateService.instant("snowpackStability.fair");
              case 62:
                return this.translateService.instant("snowpackStability.poor");
              case 87:
                return this.translateService.instant("snowpackStability.very_poor");
              default:
                return "";
            }
          },
          getSelectionBarColor: (value: number): string => {
            if (value < 0) {
              return "lightgrey";
            }
            if (value < 25) {
              return "green";
            }
            if (value < 50) {
              return "yellow";
            }
            if (value < 75) {
              return "orange";
            }
            if (value >= 75) {
              return "red";
            }
            return "lightgrey";
          },
          onValueChange: (value: number) => {
            this.matrixInformation().snowpackStabilityValue = value;
            switch (true) {
              case value < 25:
                this.setSnowpackStability(Enums.SnowpackStability.good);
                break;
              case value < 50:
                this.setSnowpackStability(Enums.SnowpackStability.fair);
                break;
              case value < 75:
                this.setSnowpackStability(Enums.SnowpackStability.poor);
                break;
              default:
                this.setSnowpackStability(Enums.SnowpackStability.very_poor);
                break;
            }
            this.changeMatrixEvent.emit();
          },
        };
    }
  }

  getFrequencyOptions(avalancheType: Enums.AvalancheType): SliderOptions {
    switch (avalancheType) {
      case Enums.AvalancheType.loose:
      case Enums.AvalancheType.glide:
        return {
          floor: 0,
          ceil: 75,
          ticks: [0, 12, 25, 37, 50, 62, 75],
          getLegend: (value: number): string => {
            switch (value) {
              case 12:
                return this.translateService.instant("frequency.none");
              case 37:
                return this.translateService.instant("frequency.few");
              case 62:
                return this.translateService.instant("frequency.some");
              default:
                return "";
            }
          },
          getSelectionBarColor: (value: number): string => {
            if (value < 0) {
              return "lightgrey";
            }
            if (value < 25) {
              return "green";
            }
            if (value < 50) {
              return "yellow";
            }
            if (value >= 50) {
              return "orange";
            }
            return "lightgrey";
          },
          onValueChange: (value: number) => {
            this.matrixInformation().frequencyValue = value;
            switch (true) {
              case value < 25:
                this.setFrequency(Enums.Frequency.none);
                break;
              case value < 50:
                this.setFrequency(Enums.Frequency.few);
                break;
              case value < 75:
                this.setFrequency(Enums.Frequency.some);
                break;
              default:
                if (this.avalancheType() === Enums.AvalancheType.slab || !this.avalancheType()) {
                  this.setFrequency(Enums.Frequency.many);
                } else {
                  this.matrixInformation().frequencyValue = 75;
                  this.setFrequency(Enums.Frequency.some);
                }
                break;
            }
            this.changeMatrixEvent.emit();
          },
        };
      default:
        return {
          floor: 0,
          ceil: 100,
          ticks: [0, 12, 25, 37, 50, 62, 75, 87, 100],
          getLegend: (value: number): string => {
            switch (value) {
              case 12:
                return this.translateService.instant("frequency.none");
              case 37:
                return this.translateService.instant("frequency.few");
              case 62:
                return this.translateService.instant("frequency.some");
              case 87:
                return this.translateService.instant("frequency.many");
              default:
                return "";
            }
          },
          getSelectionBarColor: (value: number): string => {
            if (value < 0) {
              return "lightgrey";
            }
            if (value < 25) {
              return "green";
            }
            if (value < 50) {
              return "yellow";
            }
            if (value < 75) {
              return "orange";
            }
            if (value >= 75 && this.avalancheType() === Enums.AvalancheType.slab) {
              return "red";
            }
            return "lightgrey";
          },
          onValueChange: (value: number) => {
            this.matrixInformation().frequencyValue = value;
            switch (true) {
              case value < 25:
                this.setFrequency(Enums.Frequency.none);
                break;
              case value < 50:
                this.setFrequency(Enums.Frequency.few);
                break;
              case value < 75:
                this.setFrequency(Enums.Frequency.some);
                break;
              default:
                if (this.avalancheType() === Enums.AvalancheType.slab || !this.avalancheType()) {
                  this.setFrequency(Enums.Frequency.many);
                } else {
                  this.matrixInformation().frequencyValue = 75;
                  this.setFrequency(Enums.Frequency.some);
                }
                break;
            }
            this.changeMatrixEvent.emit();
          },
        };
    }
  }

  avalancheSizeOptions: SliderOptions = {
    floor: 0,
    ceil: 100,
    ticks: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    getLegend: (value: number): string => {
      switch (value) {
        case 10:
          return this.translateService.instant("avalancheSize.small");
        case 30:
          return this.translateService.instant("avalancheSize.medium");
        case 50:
          return this.translateService.instant("avalancheSize.large");
        case 70:
          return this.translateService.instant("avalancheSize.very_large");
        case 90:
          return this.translateService.instant("avalancheSize.extreme");
        default:
          return "";
      }
    },
    getSelectionBarColor: (value: number): string => {
      if (value < 0) {
        return "lightgrey";
      }
      if (value < 20) {
        return "green";
      }
      if (value < 40) {
        return "yellow";
      }
      if (value < 60) {
        return "orange";
      }
      if (value < 80) {
        return "red";
      }
      if (value >= 80) {
        return "black";
      }
      return "lightgrey";
    },
    onValueChange: (value: number) => {
      this.matrixInformation().avalancheSizeValue = value;
      switch (true) {
        case value < 20:
          this.setAvalancheSize(Enums.AvalancheSize.small);
          break;
        case value < 40:
          this.setAvalancheSize(Enums.AvalancheSize.medium);
          break;
        case value < 60:
          this.setAvalancheSize(Enums.AvalancheSize.large);
          break;
        case value < 80:
          this.setAvalancheSize(Enums.AvalancheSize.very_large);
          break;
        default:
          this.setAvalancheSize(Enums.AvalancheSize.extreme);
          break;
      }
      this.changeMatrixEvent.emit();
    },
  };

  ngOnInit(): void {
    if (!this.isDangerRating(this.getDangerRating(this.matrixInformation()))) {
      this.dangerRatingEnabled = true;
    }
  }

  setSnowpackStability(snowpackStability: Enums.SnowpackStability) {
    this.dangerRatingEnabled = false;
    const matrixInformation = this.matrixInformation();
    matrixInformation.dangerRatingModificator = undefined;
    matrixInformation.snowpackStability = snowpackStability;
    this.updateDangerRating();
  }

  setFrequency(frequency: Enums.Frequency) {
    this.dangerRatingEnabled = false;
    const matrixInformation = this.matrixInformation();
    matrixInformation.dangerRatingModificator = undefined;
    matrixInformation.frequency = frequency;
    this.updateDangerRating();
  }

  setAvalancheSize(avalancheSize: Enums.AvalancheSize) {
    this.dangerRatingEnabled = false;
    const matrixInformation = this.matrixInformation();
    matrixInformation.dangerRatingModificator = undefined;
    matrixInformation.avalancheSize = avalancheSize;
    this.updateDangerRating();
  }

  isDangerRating(dangerRating: Enums.DangerRating) {
    return this.matrixInformation()?.dangerRating === dangerRating;
  }

  setDangerRating(event: Event, dangerRating: Enums.DangerRating) {
    event.stopPropagation();
    this.matrixInformation().dangerRating = dangerRating;
    this.bulletinDaytimeDescription().updateDangerRating();
  }

  overrideDangerRating(event: Event, dangerRating: Enums.DangerRating) {
    event.stopPropagation();
    if (!this.disabled() && this.dangerRatingEnabled) {
      this.setDangerRating(event, dangerRating);
    }
    this.changeMatrixEvent.emit();
  }

  setDangerRatingEnabled() {
    if (!this.dangerRatingEnabled) {
      this.dangerRatingEnabled = true;
      this.matrixInformation().dangerRatingModificator = undefined;
    } else {
      this.dangerRatingEnabled = false;
      this.updateDangerRating();
      this.matrixInformation().dangerRatingModificator = undefined;
    }
    this.changeMatrixEvent.emit();
  }

  private updateDangerRating() {
    const matrixInformation = this.matrixInformation();
    matrixInformation.dangerRating = this.getDangerRating(this.matrixInformation());
    this.bulletinDaytimeDescription().updateDangerRating();
  }

  private getDangerRating(matrixInformation: MatrixInformationModel): Enums.DangerRating {
    switch (matrixInformation.snowpackStability) {
      case Enums.SnowpackStability.very_poor:
        switch (matrixInformation.frequency) {
          case Enums.Frequency.many:
            switch (matrixInformation.avalancheSize) {
              case Enums.AvalancheSize.extreme:
                return Enums.DangerRating.very_high;
              case Enums.AvalancheSize.very_large:
                return Enums.DangerRating.very_high;
              case Enums.AvalancheSize.large:
                return Enums.DangerRating.high;
              case Enums.AvalancheSize.medium:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.small:
                return Enums.DangerRating.moderate;
              default:
                return Enums.DangerRating.missing;
            }
          case Enums.Frequency.some:
            switch (matrixInformation.avalancheSize) {
              case Enums.AvalancheSize.extreme:
                return Enums.DangerRating.very_high;
              case Enums.AvalancheSize.very_large:
                return Enums.DangerRating.high;
              case Enums.AvalancheSize.large:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.medium:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.small:
                return Enums.DangerRating.moderate;
              default:
                return Enums.DangerRating.missing;
            }
          case Enums.Frequency.few:
            switch (matrixInformation.avalancheSize) {
              case Enums.AvalancheSize.extreme:
                return Enums.DangerRating.high;
              case Enums.AvalancheSize.very_large:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.large:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.medium:
                return Enums.DangerRating.moderate;
              case Enums.AvalancheSize.small:
                return Enums.DangerRating.low;
              default:
                return Enums.DangerRating.missing;
            }
          case Enums.Frequency.none:
            switch (matrixInformation.avalancheSize) {
              case Enums.AvalancheSize.extreme:
              case Enums.AvalancheSize.very_large:
              case Enums.AvalancheSize.large:
              case Enums.AvalancheSize.medium:
              case Enums.AvalancheSize.small:
                return Enums.DangerRating.low;
              default:
                return Enums.DangerRating.missing;
            }
          default:
            return Enums.DangerRating.missing;
        }
      case Enums.SnowpackStability.poor:
        switch (matrixInformation.frequency) {
          case Enums.Frequency.many:
            switch (matrixInformation.avalancheSize) {
              case Enums.AvalancheSize.extreme:
                return Enums.DangerRating.very_high;
              case Enums.AvalancheSize.very_large:
                return Enums.DangerRating.high;
              case Enums.AvalancheSize.large:
                return Enums.DangerRating.high;
              case Enums.AvalancheSize.medium:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.small:
                return Enums.DangerRating.moderate;
              default:
                return Enums.DangerRating.missing;
            }
          case Enums.Frequency.some:
            switch (matrixInformation.avalancheSize) {
              case Enums.AvalancheSize.extreme:
                return Enums.DangerRating.high;
              case Enums.AvalancheSize.very_large:
                return Enums.DangerRating.high;
              case Enums.AvalancheSize.large:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.medium:
                return Enums.DangerRating.moderate;
              case Enums.AvalancheSize.small:
                return Enums.DangerRating.moderate;
              default:
                return Enums.DangerRating.missing;
            }
          case Enums.Frequency.few:
            switch (matrixInformation.avalancheSize) {
              case Enums.AvalancheSize.extreme:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.very_large:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.large:
                return Enums.DangerRating.moderate;
              case Enums.AvalancheSize.medium:
                return Enums.DangerRating.moderate;
              case Enums.AvalancheSize.small:
                return Enums.DangerRating.low;
              default:
                return Enums.DangerRating.missing;
            }
          case Enums.Frequency.none:
            switch (matrixInformation.avalancheSize) {
              case Enums.AvalancheSize.extreme:
              case Enums.AvalancheSize.very_large:
              case Enums.AvalancheSize.large:
              case Enums.AvalancheSize.medium:
              case Enums.AvalancheSize.small:
                return Enums.DangerRating.low;
              default:
                return Enums.DangerRating.missing;
            }
          default:
            return Enums.DangerRating.missing;
        }
      case Enums.SnowpackStability.fair:
        switch (matrixInformation.frequency) {
          case Enums.Frequency.many:
            switch (matrixInformation.avalancheSize) {
              case Enums.AvalancheSize.extreme:
                return Enums.DangerRating.high;
              case Enums.AvalancheSize.very_large:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.large:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.medium:
                return Enums.DangerRating.moderate;
              case Enums.AvalancheSize.small:
                return Enums.DangerRating.low;
              default:
                return Enums.DangerRating.missing;
            }
          case Enums.Frequency.some:
            switch (matrixInformation.avalancheSize) {
              case Enums.AvalancheSize.extreme:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.very_large:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.large:
                return Enums.DangerRating.moderate;
              case Enums.AvalancheSize.medium:
                return Enums.DangerRating.moderate;
              case Enums.AvalancheSize.small:
                return Enums.DangerRating.low;
              default:
                return Enums.DangerRating.missing;
            }
          case Enums.Frequency.few:
            switch (matrixInformation.avalancheSize) {
              case Enums.AvalancheSize.extreme:
                return Enums.DangerRating.considerable;
              case Enums.AvalancheSize.very_large:
                return Enums.DangerRating.moderate;
              case Enums.AvalancheSize.large:
                return Enums.DangerRating.moderate;
              case Enums.AvalancheSize.medium:
                return Enums.DangerRating.low;
              case Enums.AvalancheSize.small:
                return Enums.DangerRating.low;
              default:
                return Enums.DangerRating.missing;
            }
          case Enums.Frequency.none:
            switch (matrixInformation.avalancheSize) {
              case Enums.AvalancheSize.extreme:
              case Enums.AvalancheSize.very_large:
              case Enums.AvalancheSize.large:
              case Enums.AvalancheSize.medium:
              case Enums.AvalancheSize.small:
                return Enums.DangerRating.low;
              default:
                return Enums.DangerRating.missing;
            }
          default:
            return Enums.DangerRating.missing;
        }
      case Enums.SnowpackStability.good:
        return Enums.DangerRating.low;
      default:
        return Enums.DangerRating.missing;
    }
  }

  isDangerRatingModificator(modificator: Enums.DangerRatingModificator) {
    return this.matrixInformation()?.dangerRatingModificator === modificator;
  }

  setDangerRatingModificator(event: Event, modificator: Enums.DangerRatingModificator) {
    event.stopPropagation();
    this.matrixInformation().dangerRatingModificator = modificator;
    this.changeMatrixEvent.emit();
  }
}
