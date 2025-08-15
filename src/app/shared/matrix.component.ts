import * as Enums from "../enums/enums";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { MatrixInformationModel } from "../models/matrix-information.model";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { AfterViewInit, Component, ElementRef, inject, input, OnChanges, SimpleChange, viewChild } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { BulletinModel } from "app/models/bulletin.model";

@Component({
  selector: "app-matrix",
  templateUrl: "matrix.component.html",
  standalone: true,
  imports: [TranslateModule],
})
export class MatrixComponent implements AfterViewInit, OnChanges {
  constantsService = inject(ConstantsService);

  readonly bulletin = input<BulletinModel>(undefined);
  readonly bulletinDaytimeDescription = input<BulletinDaytimeDescriptionModel>(undefined);
  readonly matrixInformation = input<MatrixInformationModel>(undefined);
  readonly snowpackStability = input<Enums.SnowpackStability>(undefined);
  readonly frequency = input<Enums.Frequency>(undefined);
  readonly avalancheSize = input<Enums.AvalancheSize>(undefined);
  readonly disabled = input<boolean>(undefined);

  readonly cell0 = viewChild<ElementRef>("0");
  readonly cell1 = viewChild<ElementRef>("1");
  readonly cell2 = viewChild<ElementRef>("2");
  readonly cell3 = viewChild<ElementRef>("3");
  readonly cell4 = viewChild<ElementRef>("4");
  readonly cell5 = viewChild<ElementRef>("5");
  readonly cell6 = viewChild<ElementRef>("6");
  readonly cell7 = viewChild<ElementRef>("7");
  readonly cell8 = viewChild<ElementRef>("8");
  readonly cell9 = viewChild<ElementRef>("9");
  readonly cell10 = viewChild<ElementRef>("10");
  readonly cell11 = viewChild<ElementRef>("11");
  readonly cell12 = viewChild<ElementRef>("12");
  readonly cell13 = viewChild<ElementRef>("13");
  readonly cell14 = viewChild<ElementRef>("14");
  readonly cell15 = viewChild<ElementRef>("15");
  readonly cell16 = viewChild<ElementRef>("16");
  readonly cell17 = viewChild<ElementRef>("17");
  readonly cell18 = viewChild<ElementRef>("18");
  readonly cell19 = viewChild<ElementRef>("19");
  readonly cell20 = viewChild<ElementRef>("20");
  readonly cell21 = viewChild<ElementRef>("21");
  readonly cell22 = viewChild<ElementRef>("22");
  readonly cell23 = viewChild<ElementRef>("23");
  readonly cell24 = viewChild<ElementRef>("24");
  readonly cell25 = viewChild<ElementRef>("25");
  readonly cell26 = viewChild<ElementRef>("26");
  readonly cell27 = viewChild<ElementRef>("27");
  readonly cell28 = viewChild<ElementRef>("28");
  readonly cell29 = viewChild<ElementRef>("29");
  readonly cell30 = viewChild<ElementRef>("30");
  readonly cell31 = viewChild<ElementRef>("31");
  readonly cell32 = viewChild<ElementRef>("32");
  readonly cell33 = viewChild<ElementRef>("33");
  readonly cell34 = viewChild<ElementRef>("34");
  readonly cell35 = viewChild<ElementRef>("35");
  readonly cell36 = viewChild<ElementRef>("36");
  readonly cell37 = viewChild<ElementRef>("37");
  readonly cell38 = viewChild<ElementRef>("38");
  readonly cell39 = viewChild<ElementRef>("39");
  readonly cell40 = viewChild<ElementRef>("40");
  readonly cell41 = viewChild<ElementRef>("41");
  readonly cell42 = viewChild<ElementRef>("42");
  readonly cell43 = viewChild<ElementRef>("43");
  readonly cell44 = viewChild<ElementRef>("44");
  readonly cell45 = viewChild<ElementRef>("45");
  readonly cell46 = viewChild<ElementRef>("46");

  ngAfterViewInit() {
    this.resetMatrix();
    this.initMatrix();
  }

  ngOnChanges(changes: Record<string, SimpleChange>) {
    this.resetMatrix();
    this.initMatrix();
  }

  resetMatrix() {
    for (let i = 0; i <= 46; i++) {
      this.setCellStyleInactive(String(i));
    }
  }

  initMatrix() {
    const index = this.getCell(this.matrixInformation());
    if (index != "0") this.setCellStyleActive(index);
  }

  private selectCell(cell) {
    this.matrixInformation().dangerRating = this.getDangerRating(cell);
    this.matrixInformation().avalancheSize = this.getAvalancheSize(cell);
    this.matrixInformation().snowpackStability = this.getSnowpackStability(cell);
    this.matrixInformation().frequency = this.getFrequency(cell);
    this.setCellStyleActive(cell);
  }

  private deselectCell(cell) {
    this.matrixInformation().dangerRating = this.getDangerRating(Enums.DangerRating.missing);
    this.matrixInformation().avalancheSize = undefined;
    this.matrixInformation().snowpackStability = undefined;
    this.matrixInformation().frequency = undefined;
    this.setCellStyleInactive(cell);
  }

  private setCellStyleActive(cell) {
    if (cell !== undefined && cell !== null) {
      const element = this.getElement(cell);
      if (element) {
        element.nativeElement.style.fill = this.getColor(cell);
      }
    }
  }

  private setCellStyleInactive(cell) {
    if (cell !== undefined && cell !== null) {
      const element = this.getElement(cell);
      if (element) {
        element.nativeElement.style.fill = this.getGrayscaleColor(cell);
      }
    }
  }

  public selectDangerRating(event) {
    this.selectDangerRatingById(event.currentTarget.id);
  }

  public selectDangerRatingById(id) {
    if (!this.disabled()) {
      const oldCell = this.getCell(this.matrixInformation());
      this.setCellStyleInactive(oldCell);

      if (oldCell !== id) {
        this.selectCell(id);
      } else {
        this.deselectCell(id);
      }

      this.bulletinDaytimeDescription().updateDangerRating();
    }
  }

  private getElement(id) {
    switch (id) {
      case "0":
        return this.cell0();
      case "1":
        return this.cell1();
      case "2":
        return this.cell2();
      case "3":
        return this.cell3();
      case "4":
        return this.cell4();
      case "5":
        return this.cell5();
      case "6":
        return this.cell6();
      case "7":
        return this.cell7();
      case "8":
        return this.cell8();
      case "9":
        return this.cell9();
      case "10":
        return this.cell10();
      case "11":
        return this.cell11();
      case "12":
        return this.cell12();
      case "13":
        return this.cell13();
      case "14":
        return this.cell14();
      case "15":
        return this.cell15();
      case "16":
        return this.cell16();
      case "17":
        return this.cell17();
      case "18":
        return this.cell18();
      case "19":
        return this.cell19();
      case "20":
        return this.cell20();
      case "21":
        return this.cell21();
      case "22":
        return this.cell22();
      case "23":
        return this.cell23();
      case "24":
        return this.cell24();
      case "25":
        return this.cell25();
      case "26":
        return this.cell26();
      case "27":
        return this.cell27();
      case "28":
        return this.cell28();
      case "29":
        return this.cell29();
      case "30":
        return this.cell30();
      case "31":
        return this.cell31();
      case "32":
        return this.cell32();
      case "33":
        return this.cell33();
      case "34":
        return this.cell34();
      case "35":
        return this.cell35();
      case "36":
        return this.cell36();
      case "37":
        return this.cell37();
      case "38":
        return this.cell38();
      case "39":
        return this.cell39();
      case "40":
        return this.cell40();
      case "41":
        return this.cell41();
      case "42":
        return this.cell42();
      case "43":
        return this.cell43();
      case "44":
        return this.cell44();
      case "45":
        return this.cell45();
      case "46":
        return this.cell46();

      default:
        return undefined;
    }
  }

  private getDangerRating(id): Enums.DangerRating {
    switch (id) {
      case "15":
      case "30":
      case "35":
      case "40":
      case "44":
      case "45":
      case "46":
        return Enums.DangerRating.low;

      case "5":
      case "10":
      case "14":
      case "20":
      case "24":
      case "25":
      case "28":
      case "29":
      case "34":
      case "38":
      case "39":
      case "42":
      case "43":
        return Enums.DangerRating.moderate;

      case "4":
      case "8":
      case "9":
      case "12":
      case "13":
      case "19":
      case "23":
      case "26":
      case "27":
      case "32":
      case "33":
      case "36":
      case "37":
      case "41":
        return Enums.DangerRating.considerable;

      case "3":
      case "7":
      case "11":
      case "17":
      case "18":
      case "21":
      case "22":
      case "31":
        return Enums.DangerRating.high;

      case "1":
      case "2":
      case "6":
      case "16":
        return Enums.DangerRating.very_high;

      default:
        return undefined;
    }
  }

  private getAvalancheSize(id): Enums.AvalancheSize {
    if (id == 46) {
      return Enums.AvalancheSize.small;
    } else if (id % 5 == 1) {
      return Enums.AvalancheSize.extreme;
    } else if (id % 5 == 2) {
      return Enums.AvalancheSize.very_large;
    } else if (id % 5 == 3) {
      return Enums.AvalancheSize.large;
    } else if (id % 5 == 4) {
      return Enums.AvalancheSize.medium;
    } else if (id % 5 == 0) {
      return Enums.AvalancheSize.small;
    } else {
      return undefined;
    }
  }

  private getSnowpackStability(id): Enums.SnowpackStability {
    if (id > 0 && id <= 15) {
      return Enums.SnowpackStability.very_poor;
    } else if (id > 15 && id <= 30) {
      return Enums.SnowpackStability.poor;
    } else if (id > 30 && id <= 45) {
      return Enums.SnowpackStability.fair;
    } else if (id == 46) {
      return Enums.SnowpackStability.good;
    } else {
      return undefined;
    }
  }

  private getFrequency(id): Enums.Frequency {
    if (id == 46) {
      return Enums.Frequency.none;
    } else if (id % 15 > 0 && id % 15 <= 5) {
      return Enums.Frequency.many;
    } else if (id % 15 > 5 && id % 15 <= 10) {
      return Enums.Frequency.some;
    } else if (id % 15 == 0 || (id % 15 > 10 && id % 15 <= 15)) {
      return Enums.Frequency.few;
    } else {
      return undefined;
    }
  }

  private getColor(id): string {
    switch (this.getDangerRating(id)) {
      case Enums.DangerRating.low:
        return this.constantsService.colorDangerRatingLow;
      case Enums.DangerRating.moderate:
        return this.constantsService.colorDangerRatingModerate;
      case Enums.DangerRating.considerable:
        return this.constantsService.colorDangerRatingConsiderable;
      case Enums.DangerRating.high:
        return this.constantsService.colorDangerRatingHigh;
      case Enums.DangerRating.very_high:
        return this.constantsService.colorDangerRatingVeryHigh;
      default:
        return "#FFFFFF";
    }
  }

  private getGrayscaleColor(id): string {
    // white fields in the matrix
    if (id == 26 || id == 31 || id == 32 || id == 36 || id == 37 || id == 41 || id == 42) {
      return "#FFFFFF";
    }
    switch (this.getDangerRating(id)) {
      case Enums.DangerRating.low:
        return this.constantsService.colorDangerRatingLowBw;
      case Enums.DangerRating.moderate:
        return this.constantsService.colorDangerRatingModerateBw;
      case Enums.DangerRating.considerable:
        return this.constantsService.colorDangerRatingConsiderableBw;
      case Enums.DangerRating.high:
        return this.constantsService.colorDangerRatingHighBw;
      case Enums.DangerRating.very_high:
        return this.constantsService.colorDangerRatingVeryHighBw;
      default:
        return "#FFFFFF";
    }
  }

  private getCell(matrixInformation: MatrixInformationModel): string {
    let snowpackStabilityFactor = 0;
    let frequencyFactor = 0;
    let avalancheSizeFactor = 0;

    switch (matrixInformation.snowpackStability) {
      case Enums.SnowpackStability.very_poor:
        snowpackStabilityFactor = 0;
        break;
      case Enums.SnowpackStability.poor:
        snowpackStabilityFactor = 1;
        break;
      case Enums.SnowpackStability.fair:
        snowpackStabilityFactor = 2;
        break;
      case Enums.SnowpackStability.good:
        return "0";
      default:
        return "0";
    }

    switch (matrixInformation.frequency) {
      case Enums.Frequency.many:
        frequencyFactor = 0;
        break;
      case Enums.Frequency.some:
        frequencyFactor = 1;
        break;
      case Enums.Frequency.few:
        frequencyFactor = 2;
        break;
      case Enums.Frequency.none:
        return "46";
      default:
        return "0";
    }

    switch (matrixInformation.avalancheSize) {
      case Enums.AvalancheSize.extreme:
        avalancheSizeFactor = 1;
        break;
      case Enums.AvalancheSize.very_large:
        avalancheSizeFactor = 2;
        break;
      case Enums.AvalancheSize.large:
        avalancheSizeFactor = 3;
        break;
      case Enums.AvalancheSize.medium:
        avalancheSizeFactor = 4;
        break;
      case Enums.AvalancheSize.small:
        avalancheSizeFactor = 5;
        break;
      default:
        return "0";
    }

    return String(snowpackStabilityFactor * 15 + frequencyFactor * 5 + avalancheSizeFactor);
  }
}
