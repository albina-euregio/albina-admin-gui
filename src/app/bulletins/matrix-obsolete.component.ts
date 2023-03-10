import { Component, Input, ViewChild, ElementRef, SimpleChange, AfterViewInit, OnChanges } from "@angular/core";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { MatrixInformationObsoleteModel } from "../models/matrix-information-obsolete.model";
import { SettingsService } from "../providers/settings-service/settings.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import * as Enums from "../enums/enums";

@Component({
  selector: "app-matrix-obsolete",
  templateUrl: "matrix-obsolete.component.html"
})
export class MatrixObsoleteComponent implements AfterViewInit, OnChanges {

  @Input() bulletinDaytimeDescription: BulletinDaytimeDescriptionModel;
  @Input() matrixInformation: MatrixInformationObsoleteModel;
  @Input() disabled: boolean;

  @ViewChild("0") cell0: ElementRef;
  @ViewChild("1") cell1: ElementRef;
  @ViewChild("2") cell2: ElementRef;
  @ViewChild("3") cell3: ElementRef;
  @ViewChild("4") cell4: ElementRef;
  @ViewChild("5") cell5: ElementRef;
  @ViewChild("6") cell6: ElementRef;
  @ViewChild("7") cell7: ElementRef;
  @ViewChild("8") cell8: ElementRef;
  @ViewChild("9") cell9: ElementRef;
  @ViewChild("10") cell10: ElementRef;
  @ViewChild("11") cell11: ElementRef;
  @ViewChild("12") cell12: ElementRef;
  @ViewChild("13") cell13: ElementRef;
  @ViewChild("14") cell14: ElementRef;
  @ViewChild("15") cell15: ElementRef;
  @ViewChild("16") cell16: ElementRef;
  @ViewChild("17") cell17: ElementRef;
  @ViewChild("18") cell18: ElementRef;
  @ViewChild("19") cell19: ElementRef;
  @ViewChild("20") cell20: ElementRef;
  @ViewChild("21") cell21: ElementRef;
  @ViewChild("22") cell22: ElementRef;
  @ViewChild("23") cell23: ElementRef;
  @ViewChild("24") cell24: ElementRef;
  @ViewChild("25") cell25: ElementRef;
  @ViewChild("26") cell26: ElementRef;
  @ViewChild("27") cell27: ElementRef;
  @ViewChild("28") cell28: ElementRef;
  @ViewChild("29") cell29: ElementRef;
  @ViewChild("30") cell30: ElementRef;
  @ViewChild("31") cell31: ElementRef;
  @ViewChild("32") cell32: ElementRef;
  @ViewChild("33") cell33: ElementRef;
  @ViewChild("34") cell34: ElementRef;
  @ViewChild("35") cell35: ElementRef;
  @ViewChild("36") cell36: ElementRef;
  @ViewChild("37") cell37: ElementRef;
  @ViewChild("38") cell38: ElementRef;
  @ViewChild("39") cell39: ElementRef;
  @ViewChild("40") cell40: ElementRef;
  @ViewChild("41") cell41: ElementRef;
  @ViewChild("42") cell42: ElementRef;
  @ViewChild("43") cell43: ElementRef;
  @ViewChild("44") cell44: ElementRef;
  @ViewChild("45") cell45: ElementRef;
  @ViewChild("46") cell46: ElementRef;
  @ViewChild("47") cell47: ElementRef;
  @ViewChild("48") cell48: ElementRef;
  @ViewChild("49") cell49: ElementRef;
  @ViewChild("50") cell50: ElementRef;
  @ViewChild("51") cell51: ElementRef;
  @ViewChild("52") cell52: ElementRef;
  @ViewChild("53") cell53: ElementRef;
  @ViewChild("54") cell54: ElementRef;
  @ViewChild("55") cell55: ElementRef;
  @ViewChild("56") cell56: ElementRef;
  @ViewChild("57") cell57: ElementRef;
  @ViewChild("58") cell58: ElementRef;
  @ViewChild("59") cell59: ElementRef;
  @ViewChild("60") cell60: ElementRef;
  @ViewChild("61") cell61: ElementRef;
  @ViewChild("62") cell62: ElementRef;
  @ViewChild("63") cell63: ElementRef;
  @ViewChild("64") cell64: ElementRef;
  @ViewChild("65") cell65: ElementRef;
  @ViewChild("66") cell66: ElementRef;
  @ViewChild("67") cell67: ElementRef;
  @ViewChild("68") cell68: ElementRef;
  @ViewChild("69") cell69: ElementRef;
  @ViewChild("70") cell70: ElementRef;
  @ViewChild("71") cell71: ElementRef;
  @ViewChild("72") cell72: ElementRef;

  languageCode = Enums.LanguageCode;

  constructor(
    public settingsService: SettingsService,
    public constantsService: ConstantsService) {
  }

  ngAfterViewInit() {
    this.resetMatrix();
    this.initMatrix();
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    this.resetMatrix();
    this.initMatrix();
  }

  resetMatrix() {
    for (let i = 0; i <= 72; i++) {
      this.setCellStyleInactive("" + i);
    }
  }

  initMatrix() {
    this.selectArtificialCell(this.getArtificialCell(this.matrixInformation));
    this.selectNaturalCell(this.getNaturalCell(this.matrixInformation));
  }

  private selectArtificialCell(cell) {
    this.matrixInformation.setArtificialDangerRating(Enums.DangerRating[this.getDangerRating(cell)]);
    this.matrixInformation.setArtificialAvalancheReleaseProbability(Enums.ArtificialAvalancheReleaseProbability[this.getArtificialAvalancheReleaseProbability(cell)]);
    this.matrixInformation.setArtificialHazardSiteDistribution(Enums.HazardSiteDistribution[this.getArtificialHazardSiteDistribution(cell)]);
    this.matrixInformation.setArtificialAvalancheSize(Enums.AvalancheSize[this.getAvalancheSize(cell)]);
    this.setCellStyleActive(cell);
  }

  private deselectArtificialCell(cell) {
    this.matrixInformation.setArtificialDangerRating(Enums.DangerRating[this.getDangerRating(Enums.DangerRating.missing)]);
    this.matrixInformation.setArtificialAvalancheReleaseProbability(undefined);
    this.matrixInformation.setArtificialHazardSiteDistribution(undefined);
    this.matrixInformation.setArtificialAvalancheSize(undefined);
    this.setCellStyleInactive(cell);
  }

  private selectNaturalCell(cell) {
    this.matrixInformation.setNaturalDangerRating(Enums.DangerRating[this.getDangerRating(cell)]);
    this.matrixInformation.setNaturalAvalancheReleaseProbability(Enums.NaturalAvalancheReleaseProbability[this.getNaturalAvalancheReleaseProbability(cell)]);
    this.matrixInformation.setNaturalHazardSiteDistribution(Enums.HazardSiteDistribution[this.getNaturalHazardSiteDistribution(cell)]);
    this.setCellStyleActive(cell);
  }

  private deselectNaturalCell(cell) {
    this.matrixInformation.setNaturalDangerRating(Enums.DangerRating[this.getDangerRating(Enums.DangerRating.missing)]);
    this.matrixInformation.setNaturalAvalancheReleaseProbability(undefined);
    this.matrixInformation.setNaturalHazardSiteDistribution(undefined);
    this.setCellStyleInactive(cell);
  }

  private setCellStyleActive(cell) {
    if (cell !== undefined && cell !== null) {
      const element = this.getElement(cell);
      if (element && element !== undefined) {
        element.nativeElement.style.fill = this.getColor(cell);
      }
    }
  }

  private setCellStyleInactive(cell) {
    if (cell !== undefined && cell !== null) {
      const element = this.getElement(cell);
      if (element !== undefined && element !== null) {
        element.nativeElement.style.fill = this.getGrayscaleColor(cell);
      }
    }
  }

  public selectArtificialDangerRating(event) {
    this.selectArtificialDangerRatingById(event.currentTarget.id);
  }

  public selectArtificialDangerRatingById(id) {
    if (!this.disabled) {
      const oldCell = this.getArtificialCell(this.matrixInformation);
      this.setCellStyleInactive(oldCell);

      if (oldCell !== id) {
        this.selectArtificialCell(id);
      } else {
        this.deselectArtificialCell(id);
      }

      const naturalCell = this.getNaturalCell(this.matrixInformation);
      this.deselectNaturalCell(naturalCell);

      this.bulletinDaytimeDescription.updateDangerRating();
    }
  }

  public selectNaturalDangerRating(event) {
    this.selectNaturalDangerRatingById(event.currentTarget.id);
  }

  public selectNaturalDangerRatingById(id) {
    if (!this.disabled) {
      const oldCell = this.getNaturalCell(this.matrixInformation);

      this.setCellStyleInactive(oldCell);

      if (oldCell !== id) {
        this.selectNaturalCell(id);
      } else {
        this.deselectNaturalCell(id);
      }

      const artificialCell = this.getArtificialCell(this.matrixInformation);
      this.deselectArtificialCell(artificialCell);

      this.bulletinDaytimeDescription.updateDangerRating();
    }
  }

  private getElement(id) {
    switch (id) {
      case "0":
        return this.cell0;
      case "1":
        return this.cell1;
      case "2":
        return this.cell2;
      case "3":
        return this.cell3;
      case "4":
        return this.cell4;
      case "5":
        return this.cell5;
      case "6":
        return this.cell6;
      case "7":
        return this.cell7;
      case "8":
        return this.cell8;
      case "9":
        return this.cell9;
      case "10":
        return this.cell10;
      case "11":
        return this.cell11;
      case "12":
        return this.cell12;
      case "13":
        return this.cell13;
      case "14":
        return this.cell14;
      case "15":
        return this.cell15;
      case "16":
        return this.cell16;
      case "17":
        return this.cell17;
      case "18":
        return this.cell18;
      case "19":
        return this.cell19;
      case "20":
        return this.cell20;
      case "21":
        return this.cell21;
      case "22":
        return this.cell22;
      case "23":
        return this.cell23;
      case "24":
        return this.cell24;
      case "25":
        return this.cell25;
      case "26":
        return this.cell26;
      case "27":
        return this.cell27;
      case "28":
        return this.cell28;
      case "29":
        return this.cell29;
      case "30":
        return this.cell30;
      case "31":
        return this.cell31;
      case "32":
        return this.cell32;
      case "33":
        return this.cell33;
      case "34":
        return this.cell34;
      case "35":
        return this.cell35;
      case "36":
        return this.cell36;
      case "37":
        return this.cell37;
      case "38":
        return this.cell38;
      case "39":
        return this.cell39;
      case "40":
        return this.cell40;
      case "41":
        return this.cell41;
      case "42":
        return this.cell42;
      case "43":
        return this.cell43;
      case "44":
        return this.cell44;
      case "45":
        return this.cell45;
      case "46":
        return this.cell46;
      case "47":
        return this.cell47;
      case "48":
        return this.cell48;
      case "49":
        return this.cell49;
      case "50":
        return this.cell50;
      case "51":
        return this.cell51;
      case "52":
        return this.cell52;
      case "53":
        return this.cell53;
      case "54":
        return this.cell54;
      case "55":
        return this.cell55;
      case "56":
        return this.cell56;
      case "57":
        return this.cell57;
      case "58":
        return this.cell58;
      case "59":
        return this.cell59;
      case "60":
        return this.cell60;
      case "61":
        return this.cell61;
      case "62":
        return this.cell62;
      case "63":
        return this.cell63;
      case "64":
        return this.cell64;
      case "65":
        return this.cell65;
      case "66":
        return this.cell66;
      case "67":
        return this.cell67;
      case "68":
        return this.cell68;
      case "69":
        return this.cell69;
      case "70":
        return this.cell70;
      case "71":
        return this.cell71;
      case "72":
        return this.cell72;

      default:
        return undefined;
    }
  }

  private getDangerRating(id) {
    switch (id) {
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "9":
      case "10":
      case "13":
      case "17":
      case "21":
      case "29":
      case "57":
        return Enums.DangerRating.low;

      case "7":
      case "11":
      case "14":
      case "15":
      case "18":
      case "19":
      case "22":
      case "25":
      case "30":
      case "31":
      case "33":
      case "34":
      case "37":
      case "58":
      case "59":
      case "62":
        return Enums.DangerRating.moderate;

      case "8":
      case "12":
      case "16":
      case "20":
      case "23":
      case "26":
      case "27":
      case "32":
      case "35":
      case "38":
      case "39":
      case "41":
      case "45":
      case "49":
      case "60":
      case "61":
      case "63":
      case "66":
        return Enums.DangerRating.considerable;

      case "24":
      case "28":
      case "36":
      case "40":
      case "42":
      case "43":
      case "44":
      case "46":
      case "47":
      case "48":
      case "50":
      case "51":
      case "52":
      case "53":
      case "54":
      case "64":
      case "65":
      case "67":
      case "68":
      case "70":
        return Enums.DangerRating.high;

      case "55":
      case "56":
      case "69":
      case "71":
      case "72":
        return Enums.DangerRating.very_high;

      default:
        return "#FFFFFF";
    }
  }

  private getAvalancheSize(id) {
    switch (id) {
      case "1":
      case "5":
      case "9":
      case "13":
      case "17":
      case "21":
      case "25":
      case "29":
      case "33":
      case "37":
      case "41":
      case "45":
      case "49":
      case "53":
        return Enums.AvalancheSize.small;

      case "2":
      case "6":
      case "10":
      case "14":
      case "18":
      case "22":
      case "26":
      case "30":
      case "34":
      case "38":
      case "42":
      case "46":
      case "50":
      case "54":
        return Enums.AvalancheSize.medium;

      case "3":
      case "7":
      case "11":
      case "15":
      case "19":
      case "23":
      case "27":
      case "31":
      case "35":
      case "39":
      case "43":
      case "47":
      case "51":
      case "55":
        return Enums.AvalancheSize.large;

      case "4":
      case "8":
      case "12":
      case "16":
      case "20":
      case "24":
      case "28":
      case "32":
      case "36":
      case "40":
      case "44":
      case "48":
      case "52":
      case "56":
        return Enums.AvalancheSize.very_large;

      default:
        return undefined;
    }
  }

  private getArtificialAvalancheReleaseProbability(id) {
    if ((id > 0 && id <= 4) || (id > 12 && id <= 16) || (id > 28 && id <= 32)) {
      return Enums.ArtificialAvalancheReleaseProbability.one;
    } else if ((id > 4 && id <= 8) || (id > 16 && id <= 20) || (id > 32 && id <= 36)) {
      return Enums.ArtificialAvalancheReleaseProbability.two;
    } else if ((id > 8 && id <= 12) || (id > 20 && id <= 24) || (id > 36 && id <= 40) || (id > 44 && id <= 48)) {
      return Enums.ArtificialAvalancheReleaseProbability.three;
    } else if ((id > 24 && id <= 28) || (id > 40 && id <= 44) || (id > 48 && id <= 56)) {
      return Enums.ArtificialAvalancheReleaseProbability.four;
    } else {
      return undefined;
    }
  }

  private getArtificialHazardSiteDistribution(id) {
    if (id > 0 && id <= 12) {
      return Enums.HazardSiteDistribution.single;
    } else if (id > 12 && id <= 28) {
      return Enums.HazardSiteDistribution.some;
    } else if (id > 28 && id <= 44) {
      return Enums.HazardSiteDistribution.many;
    } else if (id > 44 && id <= 52) {
      return Enums.HazardSiteDistribution.many_most;
    } else if (id > 52 && id <= 56) {
      return Enums.HazardSiteDistribution.moderately_steep;
    } else {
      return undefined;
    }
  }

  private getNaturalAvalancheReleaseProbability(id) {
    id = +id;
    if (id === 57 || id === 59 || id === 62 || id === 66) {
      return Enums.NaturalAvalancheReleaseProbability.one;
    } else if (id === 58 || id === 60 || id === 63 || id === 67 || id === 70) {
      return Enums.NaturalAvalancheReleaseProbability.two;
    } else if (id === 61 || id === 64 || id === 68 || id === 71) {
      return Enums.NaturalAvalancheReleaseProbability.three;
    } else if (id === 65 || id === 69 || id === 72) {
      return Enums.NaturalAvalancheReleaseProbability.four;
    } else {
      return undefined;
    }
  }

  private getNaturalHazardSiteDistribution(id) {
    if (id > 56 && id <= 58) {
      return Enums.HazardSiteDistribution.single;
    } else if (id > 58 && id <= 61) {
      return Enums.HazardSiteDistribution.some;
    } else if (id > 61 && id <= 65) {
      return Enums.HazardSiteDistribution.many;
    } else if (id > 65 && id <= 69) {
      return Enums.HazardSiteDistribution.many_most;
    } else if (id > 69 && id <= 72) {
      return Enums.HazardSiteDistribution.moderately_steep;
    } else {
      return undefined;
    }
  }

  private getColor(id) {
    switch (id) {
      // no snow
      case "0":
        return this.constantsService.colorDangerRatingNoSnow;

      // low
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "9":
      case "10":
      case "13":
      case "17":
      case "21":
      case "29":
      case "57":
        return this.constantsService.colorDangerRatingLow;

      // moderate
      case "7":
      case "11":
      case "14":
      case "15":
      case "18":
      case "19":
      case "22":
      case "25":
      case "30":
      case "31":
      case "33":
      case "34":
      case "37":
      case "58":
      case "59":
      case "62":
        return this.constantsService.colorDangerRatingModerate;

      // considerable
      case "8":
      case "12":
      case "16":
      case "20":
      case "23":
      case "26":
      case "27":
      case "32":
      case "35":
      case "38":
      case "39":
      case "41":
      case "45":
      case "49":
      case "60":
      case "61":
      case "63":
      case "66":
        return this.constantsService.colorDangerRatingConsiderable;

      // high
      case "24":
      case "28":
      case "36":
      case "40":
      case "42":
      case "43":
      case "44":
      case "46":
      case "47":
      case "48":
      case "50":
      case "51":
      case "52":
      case "53":
      case "54":
      case "64":
      case "65":
      case "67":
      case "68":
      case "70":
        return this.constantsService.colorDangerRatingHigh;

      // very_high
      case "55":
      case "56":
      case "69":
      case "71":
      case "72":
        return this.constantsService.colorDangerRatingVeryHigh;

      default:
        return "#000000";
    }
  }

  private getGrayscaleColor(id) {
    switch (id) {
      // no snow
      case "0":
        return "#FFFFFF";

      // low
      case "1":
      case "2":
      case "3":
      case "5":
      case "6":
      case "13":
      case "17":
      case "21":
      case "57":
        return "#EFEFEF";

      // moderate
      case "7":
      case "14":
      case "15":
      case "18":
      case "19":
      case "22":
      case "25":
      case "30":
      case "31":
      case "33":
      case "34":
      case "37":
      case "58":
      case "59":
      case "62":
        return "#D4D4D4";

      // considerable
      case "16":
      case "23":
      case "26":
      case "27":
      case "35":
      case "38":
      case "39":
      case "60":
      case "63":
        return "#A5A5A5";

      // high
      case "24":
      case "28":
      case "36":
      case "40":
      case "42":
      case "43":
      case "44":
      case "46":
      case "47":
      case "48":
      case "50":
      case "51":
      case "52":
      case "54":
      case "64":
      case "67":
      case "68":
        return "#4C4C4C";

      // very_high
      case "55":
      case "56":
      case "69":
      case "71":
      case "72":
        return "#262626";

      // white
      case "4":
      case "8":
      case "9":
      case "10":
      case "11":
      case "12":
      case "20":
      case "29":
      case "32":
      case "41":
      case "45":
      case "49":
      case "53":
      case "61":
      case "65":
      case "66":
      case "70":
        return "#FFFFFF";

      default:
        return "#FFFFFF";
    }
  }

  private getArtificialCell(matrixInformation: MatrixInformationObsoleteModel) {
    switch (+Enums.HazardSiteDistribution[matrixInformation.getArtificialHazardSiteDistribution()]) {

      case Enums.HazardSiteDistribution.single:
        switch (+Enums.ArtificialAvalancheReleaseProbability[matrixInformation.getArtificialAvalancheReleaseProbability()]) {
          case Enums.ArtificialAvalancheReleaseProbability.one:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "1";
              case Enums.AvalancheSize.medium:
                return "2";
              case Enums.AvalancheSize.large:
                return "3";
              case Enums.AvalancheSize.very_large:
                return "4";
              default:
                return undefined;
            }
          case Enums.ArtificialAvalancheReleaseProbability.two:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "5";
              case Enums.AvalancheSize.medium:
                return "6";
              case Enums.AvalancheSize.large:
                return "7";
              case Enums.AvalancheSize.very_large:
                return "8";
              default:
                return undefined;
            }
          case Enums.ArtificialAvalancheReleaseProbability.three:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "9";
              case Enums.AvalancheSize.medium:
                return "10";
              case Enums.AvalancheSize.large:
                return "11";
              case Enums.AvalancheSize.very_large:
                return "12";
              default:
                return undefined;
            }
          default:
            return undefined;
        }

      case Enums.HazardSiteDistribution.some:
        switch (+Enums.ArtificialAvalancheReleaseProbability[matrixInformation.getArtificialAvalancheReleaseProbability()]) {
          case Enums.ArtificialAvalancheReleaseProbability.one:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "13";
              case Enums.AvalancheSize.medium:
                return "14";
              case Enums.AvalancheSize.large:
                return "15";
              case Enums.AvalancheSize.very_large:
                return "16";
              default:
                return undefined;
            }
          case Enums.ArtificialAvalancheReleaseProbability.two:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "17";
              case Enums.AvalancheSize.medium:
                return "18";
              case Enums.AvalancheSize.large:
                return "19";
              case Enums.AvalancheSize.very_large:
                return "20";
              default:
                return undefined;
            }
          case Enums.ArtificialAvalancheReleaseProbability.three:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "21";
              case Enums.AvalancheSize.medium:
                return "22";
              case Enums.AvalancheSize.large:
                return "23";
              case Enums.AvalancheSize.very_large:
                return "24";
              default:
                return undefined;
            }
          case Enums.ArtificialAvalancheReleaseProbability.four:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "25";
              case Enums.AvalancheSize.medium:
                return "26";
              case Enums.AvalancheSize.large:
                return "27";
              case Enums.AvalancheSize.very_large:
                return "28";
              default:
                return undefined;
            }
          default:
            return undefined;
        }

      case Enums.HazardSiteDistribution.many:
        switch (+Enums.ArtificialAvalancheReleaseProbability[matrixInformation.getArtificialAvalancheReleaseProbability()]) {
          case Enums.ArtificialAvalancheReleaseProbability.one:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "29";
              case Enums.AvalancheSize.medium:
                return "30";
              case Enums.AvalancheSize.large:
                return "31";
              case Enums.AvalancheSize.very_large:
                return "32";
              default:
                return undefined;
            }
          case Enums.ArtificialAvalancheReleaseProbability.two:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "33";
              case Enums.AvalancheSize.medium:
                return "34";
              case Enums.AvalancheSize.large:
                return "35";
              case Enums.AvalancheSize.very_large:
                return "36";
              default:
                return undefined;
            }
          case Enums.ArtificialAvalancheReleaseProbability.three:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "37";
              case Enums.AvalancheSize.medium:
                return "38";
              case Enums.AvalancheSize.large:
                return "39";
              case Enums.AvalancheSize.very_large:
                return "40";
              default:
                return undefined;
            }
          case Enums.ArtificialAvalancheReleaseProbability.four:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "41";
              case Enums.AvalancheSize.medium:
                return "42";
              case Enums.AvalancheSize.large:
                return "43";
              case Enums.AvalancheSize.very_large:
                return "44";
              default:
                return undefined;
            }
          default:
            return undefined;
        }

      case Enums.HazardSiteDistribution.many_most:
        switch (+Enums.ArtificialAvalancheReleaseProbability[matrixInformation.getArtificialAvalancheReleaseProbability()]) {
          case Enums.ArtificialAvalancheReleaseProbability.three:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "45";
              case Enums.AvalancheSize.medium:
                return "46";
              case Enums.AvalancheSize.large:
                return "47";
              case Enums.AvalancheSize.very_large:
                return "48";
              default:
                return undefined;
            }
          case Enums.ArtificialAvalancheReleaseProbability.four:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "49";
              case Enums.AvalancheSize.medium:
                return "50";
              case Enums.AvalancheSize.large:
                return "51";
              case Enums.AvalancheSize.very_large:
                return "52";
              default:
                return undefined;
            }
          default:
            return undefined;
        }

      case Enums.HazardSiteDistribution.moderately_steep:
        switch (+Enums.ArtificialAvalancheReleaseProbability[matrixInformation.getArtificialAvalancheReleaseProbability()]) {
          case Enums.ArtificialAvalancheReleaseProbability.four:
            switch (+Enums.AvalancheSize[matrixInformation.getArtificialAvalancheSize()]) {
              case Enums.AvalancheSize.small:
                return "53";
              case Enums.AvalancheSize.medium:
                return "54";
              case Enums.AvalancheSize.large:
                return "55";
              case Enums.AvalancheSize.very_large:
                return "56";
              default:
                return undefined;
            }
          default:
            return undefined;
        }

      default:
        return undefined;
    }
  }

  private getNaturalCell(matrixInformation: MatrixInformationObsoleteModel) {
    switch (+Enums.HazardSiteDistribution[matrixInformation.getNaturalHazardSiteDistribution()]) {

      case Enums.HazardSiteDistribution.single:
        switch (+Enums.NaturalAvalancheReleaseProbability[matrixInformation.getNaturalAvalancheReleaseProbability()]) {
          case Enums.NaturalAvalancheReleaseProbability.one:
            return "57";
          case Enums.NaturalAvalancheReleaseProbability.two:
            return "58";
          default:
            return undefined;
        }

      case Enums.HazardSiteDistribution.some:
        switch (+Enums.NaturalAvalancheReleaseProbability[matrixInformation.getNaturalAvalancheReleaseProbability()]) {
          case Enums.NaturalAvalancheReleaseProbability.one:
            return "59";
          case Enums.NaturalAvalancheReleaseProbability.two:
            return "60";
          case Enums.NaturalAvalancheReleaseProbability.three:
            return "61";
          default:
            return undefined;
        }

      case Enums.HazardSiteDistribution.many:
        switch (+Enums.NaturalAvalancheReleaseProbability[matrixInformation.getNaturalAvalancheReleaseProbability()]) {
          case Enums.NaturalAvalancheReleaseProbability.one:
            return "62";
          case Enums.NaturalAvalancheReleaseProbability.two:
            return "63";
          case Enums.NaturalAvalancheReleaseProbability.three:
            return "64";
          case Enums.NaturalAvalancheReleaseProbability.four:
            return "65";
          default:
            return undefined;
        }

      case Enums.HazardSiteDistribution.many_most:
        switch (+Enums.NaturalAvalancheReleaseProbability[matrixInformation.getNaturalAvalancheReleaseProbability()]) {
          case Enums.NaturalAvalancheReleaseProbability.one:
            return "66";
          case Enums.NaturalAvalancheReleaseProbability.two:
            return "67";
          case Enums.NaturalAvalancheReleaseProbability.three:
            return "68";
          case Enums.NaturalAvalancheReleaseProbability.four:
            return "69";
          default:
            return undefined;
        }

      case Enums.HazardSiteDistribution.moderately_steep:
        switch (+Enums.NaturalAvalancheReleaseProbability[matrixInformation.getNaturalAvalancheReleaseProbability()]) {
          case Enums.NaturalAvalancheReleaseProbability.two:
            return "70";
          case Enums.NaturalAvalancheReleaseProbability.three:
            return "71";
          case Enums.NaturalAvalancheReleaseProbability.four:
            return "72";
          default:
            return undefined;
        }

      default:
        return undefined;
    }
  }
}
