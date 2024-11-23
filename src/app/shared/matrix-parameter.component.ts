import { OnChanges, Component, Input, input, output } from "@angular/core";
import { MatrixInformationModel } from "app/models/matrix-information.model";
import type { BulletinDaytimeDescriptionModel } from "app/models/bulletin-daytime-description.model";
import { ConstantsService } from "../providers/constants-service/constants.service";
import * as Enums from "../enums/enums";
import type { ChangeContext, Options } from "@angular-slider/ngx-slider";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import type { DangerSourceVariantModel } from "../danger-sources/models/danger-source-variant.model";
import { NgxSliderModule } from "@angular-slider/ngx-slider";
import { NgIf, NgFor } from "@angular/common";
import { DangerRatingComponent } from "./danger-rating.component";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-matrix-parameter",
  templateUrl: "matrix-parameter.component.html",
  standalone: true,
  imports: [NgxSliderModule, NgIf, DangerRatingComponent, NgFor, FormsModule, TranslateModule],
})
export class MatrixParameterComponent implements OnChanges {
  readonly bulletinDaytimeDescription = input<BulletinDaytimeDescriptionModel | DangerSourceVariantModel>(undefined);
  @Input() matrixInformation: MatrixInformationModel;
  @Input() disabled: boolean;
  readonly count = input<number>(undefined);
  readonly afternoon = input<boolean>(undefined);
  readonly changeMatrixEvent = output<string>();

  dangerRating = Enums.DangerRating;
  dangerRatingEnabled: boolean;
  modificatorEnum = Enums.DangerRatingModificator;

  public forLabelId(key: string): string {
    return this.count() + (this.afternoon() ? "_pm_" : "_am_") + key;
  }

  snowpackStabilityOptions: Options = {
    floor: 25,
    ceil: 100,
    showTicksValues: false,
    showTicks: true,
    showSelectionBar: true,
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
    getPointerColor: (value: number): string => {
      if (value < 0) {
        return "grey";
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
      return "grey";
    },
  };

  frequencyOptions: Options = {
    floor: 25,
    ceil: 100,
    showTicksValues: false,
    showTicks: true,
    showSelectionBar: true,
    getLegend: (value: number): string => {
      switch (value) {
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
      if (value >= 75) {
        return "red";
      }
      return "lightgrey";
    },
    getPointerColor: (value: number): string => {
      if (value < 0) {
        return "grey";
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
      return "grey";
    },
  };

  avalancheSizeOptions: Options = {
    floor: 0,
    ceil: 100,
    showTicksValues: false,
    showTicks: true,
    showSelectionBar: true,
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
    getPointerColor: (value: number): string => {
      if (value < 0) {
        return "grey";
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
      return "grey";
    },
  };

  constructor(
    public constantsService: ConstantsService,
    public translateService: TranslateService,
  ) {
    this.dangerRatingEnabled = false;
  }

  ngOnChanges(): void {
    this.snowpackStabilityOptions = Object.assign({}, this.snowpackStabilityOptions, { disabled: this.disabled });
    this.frequencyOptions = Object.assign({}, this.frequencyOptions, { disabled: this.disabled });
    this.avalancheSizeOptions = Object.assign({}, this.avalancheSizeOptions, { disabled: this.disabled });
  }

  onSnowpackStabilityValueChange(changeContext: ChangeContext): void {
    switch (true) {
      case changeContext.value < 25:
        this.setSnowpackStability(Enums.SnowpackStability.good);
        break;
      case changeContext.value < 50:
        this.setSnowpackStability(Enums.SnowpackStability.fair);
        break;
      case changeContext.value < 75:
        this.setSnowpackStability(Enums.SnowpackStability.poor);
        break;
      default:
        this.setSnowpackStability(Enums.SnowpackStability.very_poor);
        break;
    }
    this.changeMatrixEvent.emit();
  }

  onFrequencyValueChange(changeContext: ChangeContext): void {
    switch (true) {
      case changeContext.value < 25:
        this.setFrequency(Enums.Frequency.none);
        break;
      case changeContext.value < 50:
        this.setFrequency(Enums.Frequency.few);
        break;
      case changeContext.value < 75:
        this.setFrequency(Enums.Frequency.some);
        break;
      default:
        this.setFrequency(Enums.Frequency.many);
        break;
    }
    this.changeMatrixEvent.emit();
  }

  onAvalancheSizeValueChange(changeContext: ChangeContext): void {
    switch (true) {
      case changeContext.value < 20:
        this.setAvalancheSize(Enums.AvalancheSize.small);
        break;
      case changeContext.value < 40:
        this.setAvalancheSize(Enums.AvalancheSize.medium);
        break;
      case changeContext.value < 60:
        this.setAvalancheSize(Enums.AvalancheSize.large);
        break;
      case changeContext.value < 80:
        this.setAvalancheSize(Enums.AvalancheSize.very_large);
        break;
      default:
        this.setAvalancheSize(Enums.AvalancheSize.extreme);
        break;
    }
    this.changeMatrixEvent.emit();
  }

  setSnowpackStability(snowpackStability: Enums.SnowpackStability) {
    this.dangerRatingEnabled = false;
    this.matrixInformation.dangerRatingModificator = undefined;
    this.matrixInformation.setSnowpackStability(snowpackStability);
    this.updateDangerRating();
  }

  setFrequency(frequency: Enums.Frequency) {
    this.dangerRatingEnabled = false;
    this.matrixInformation.dangerRatingModificator = undefined;
    this.matrixInformation.setFrequency(frequency);
    this.updateDangerRating();
  }

  setAvalancheSize(avalancheSize: Enums.AvalancheSize) {
    this.dangerRatingEnabled = false;
    this.matrixInformation.dangerRatingModificator = undefined;
    this.matrixInformation.setAvalancheSize(avalancheSize);
    this.updateDangerRating();
  }

  isDangerRating(dangerRating: Enums.DangerRating) {
    return this.matrixInformation?.dangerRating === dangerRating;
  }

  setDangerRating(event: Event, dangerRating: Enums.DangerRating) {
    event.stopPropagation();
    this.matrixInformation.setDangerRating(dangerRating);
    this.bulletinDaytimeDescription().updateDangerRating();
  }

  overrideDangerRating(event: Event, dangerRating: Enums.DangerRating) {
    event.stopPropagation();
    if (!this.disabled && this.dangerRatingEnabled) {
      this.setDangerRating(event, dangerRating);
    }
    this.changeMatrixEvent.emit();
  }

  setDangerRatingEnabled(event: Event) {
    if (!this.dangerRatingEnabled) {
      this.dangerRatingEnabled = true;
      this.matrixInformation.dangerRatingModificator = undefined;
    } else {
      this.dangerRatingEnabled = false;
      this.updateDangerRating();
      this.matrixInformation.dangerRatingModificator = undefined;
    }
    this.changeMatrixEvent.emit();
  }

  private updateDangerRating() {
    switch (this.matrixInformation.getSnowpackStability()) {
      case Enums.SnowpackStability.very_poor:
        switch (this.matrixInformation.getFrequency()) {
          case Enums.Frequency.many:
            switch (this.matrixInformation.getAvalancheSize()) {
              case Enums.AvalancheSize.extreme:
                this.matrixInformation.setDangerRating(Enums.DangerRating.very_high);
                break;
              case Enums.AvalancheSize.very_large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.very_high);
                break;
              case Enums.AvalancheSize.large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.high);
                break;
              case Enums.AvalancheSize.medium:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.small:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              default:
                this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
                break;
            }
            break;
          case Enums.Frequency.some:
            switch (this.matrixInformation.getAvalancheSize()) {
              case Enums.AvalancheSize.extreme:
                this.matrixInformation.setDangerRating(Enums.DangerRating.very_high);
                break;
              case Enums.AvalancheSize.very_large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.high);
                break;
              case Enums.AvalancheSize.large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.medium:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.small:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              default:
                this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
                break;
            }
            break;
          case Enums.Frequency.few:
            switch (this.matrixInformation.getAvalancheSize()) {
              case Enums.AvalancheSize.extreme:
                this.matrixInformation.setDangerRating(Enums.DangerRating.high);
                break;
              case Enums.AvalancheSize.very_large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.medium:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              case Enums.AvalancheSize.small:
                this.matrixInformation.setDangerRating(Enums.DangerRating.low);
                break;
              default:
                this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
                break;
            }
            break;
          default:
            this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
            break;
        }
        break;
      case Enums.SnowpackStability.poor:
        switch (this.matrixInformation.getFrequency()) {
          case Enums.Frequency.many:
            switch (this.matrixInformation.getAvalancheSize()) {
              case Enums.AvalancheSize.extreme:
                this.matrixInformation.setDangerRating(Enums.DangerRating.very_high);
                break;
              case Enums.AvalancheSize.very_large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.high);
                break;
              case Enums.AvalancheSize.large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.high);
                break;
              case Enums.AvalancheSize.medium:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.small:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              default:
                this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
                break;
            }
            break;
          case Enums.Frequency.some:
            switch (this.matrixInformation.getAvalancheSize()) {
              case Enums.AvalancheSize.extreme:
                this.matrixInformation.setDangerRating(Enums.DangerRating.high);
                break;
              case Enums.AvalancheSize.very_large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.high);
                break;
              case Enums.AvalancheSize.large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.medium:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              case Enums.AvalancheSize.small:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              default:
                this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
                break;
            }
            break;
          case Enums.Frequency.few:
            switch (this.matrixInformation.getAvalancheSize()) {
              case Enums.AvalancheSize.extreme:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.very_large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              case Enums.AvalancheSize.medium:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              case Enums.AvalancheSize.small:
                this.matrixInformation.setDangerRating(Enums.DangerRating.low);
                break;
              default:
                this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
                break;
            }
            break;
          default:
            this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
            break;
        }
        break;
      case Enums.SnowpackStability.fair:
        switch (this.matrixInformation.getFrequency()) {
          case Enums.Frequency.many:
            switch (this.matrixInformation.getAvalancheSize()) {
              case Enums.AvalancheSize.extreme:
                this.matrixInformation.setDangerRating(Enums.DangerRating.high);
                break;
              case Enums.AvalancheSize.very_large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.medium:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              case Enums.AvalancheSize.small:
                this.matrixInformation.setDangerRating(Enums.DangerRating.low);
                break;
              default:
                this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
                break;
            }
            break;
          case Enums.Frequency.some:
            switch (this.matrixInformation.getAvalancheSize()) {
              case Enums.AvalancheSize.extreme:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.very_large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              case Enums.AvalancheSize.medium:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              case Enums.AvalancheSize.small:
                this.matrixInformation.setDangerRating(Enums.DangerRating.low);
                break;
              default:
                this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
                break;
            }
            break;
          case Enums.Frequency.few:
            switch (this.matrixInformation.getAvalancheSize()) {
              case Enums.AvalancheSize.extreme:
                this.matrixInformation.setDangerRating(Enums.DangerRating.considerable);
                break;
              case Enums.AvalancheSize.very_large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              case Enums.AvalancheSize.large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.moderate);
                break;
              case Enums.AvalancheSize.medium:
                this.matrixInformation.setDangerRating(Enums.DangerRating.low);
                break;
              case Enums.AvalancheSize.small:
                this.matrixInformation.setDangerRating(Enums.DangerRating.low);
                break;
              default:
                this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
                break;
            }
            break;
          case Enums.Frequency.none:
            switch (this.matrixInformation.getAvalancheSize()) {
              case Enums.AvalancheSize.extreme:
                this.matrixInformation.setDangerRating(Enums.DangerRating.low);
                break;
              case Enums.AvalancheSize.very_large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.low);
                break;
              case Enums.AvalancheSize.large:
                this.matrixInformation.setDangerRating(Enums.DangerRating.low);
                break;
              case Enums.AvalancheSize.medium:
                this.matrixInformation.setDangerRating(Enums.DangerRating.low);
                break;
              case Enums.AvalancheSize.small:
                this.matrixInformation.setDangerRating(Enums.DangerRating.low);
                break;
              default:
                this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
                break;
            }
            break;
          default:
            this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
            break;
        }
        break;
      case Enums.SnowpackStability.good:
        this.matrixInformation.setDangerRating(Enums.DangerRating.low);
        break;
      default:
        this.matrixInformation.setDangerRating(Enums.DangerRating.missing);
        break;
    }
    this.bulletinDaytimeDescription().updateDangerRating();
  }

  isDangerRatingModificator(modificator: Enums.DangerRatingModificator) {
    return this.matrixInformation?.dangerRatingModificator === modificator;
  }

  setDangerRatingModificator(event: Event, modificator: Enums.DangerRatingModificator) {
    event.stopPropagation();
    this.matrixInformation.setDangerRatingModificator(modificator);
    this.changeMatrixEvent.emit();
  }
}
