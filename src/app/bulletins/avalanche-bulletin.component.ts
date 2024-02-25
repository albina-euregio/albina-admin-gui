import { Component, OnDestroy, OnInit, Input, Output, EventEmitter } from "@angular/core";

import { CatalogOfPhrasesComponent } from "../catalog-of-phrases/catalog-of-phrases.component";
import { BehaviorSubject, debounceTime, Subject } from "rxjs";

import { environment } from "../../environments/environment";

// models
import { BulletinModel } from "../models/bulletin.model";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";

// services
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { CopyService } from "../providers/copy-service/copy.service";

import { MatDialog, MatDialogConfig } from "@angular/material/dialog";

// For iframe
import { Renderer2 } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import * as Enums from "../enums/enums";
import { LangTexts } from "../models/text.model";

@Component({
  selector: "app-avalanche-bulletin",
  templateUrl: "avalanche-bulletin.component.html",
})
export class AvalancheBulletinComponent implements OnInit, OnDestroy {
  @Input() bulletin: BulletinModel;
  @Input() disabled: boolean;
  @Input() isCompactMapLayout: boolean;
  @Input() isComparedBulletin: boolean;

  private readonly updateBulletinOnServerEventDebounce = new Subject<BulletinModel>();
  @Output() updateBulletinOnServerEvent = new EventEmitter<BulletinModel>();
  @Output() changeAvalancheProblemEvent = new EventEmitter<string>();
  @Output() deleteBulletinEvent = new EventEmitter<BulletinModel>();
  @Output() editMicroRegionsEvent = new EventEmitter<BulletinModel>();
  @Output() copyBulletinEvent = new EventEmitter<BulletinModel>();
  @Output() deselectBulletinEvent = new EventEmitter<BulletinModel>();
  @Output() setMapLayoutEvent = new EventEmitter<boolean>();

  dangerPattern = Object.values(Enums.DangerPattern);

  public showNotes: boolean;
  public editRegions: boolean;

  public isAccordionDangerRatingOpen: boolean;
  public isAccordionAvalancheProblemOpen: boolean;
  public isAccordionDangerDescriptionOpen: boolean;
  public isAccordionSnowpackStructureOpen: boolean;
  public isAccordionTendencyOpen: boolean;

  stopListening: Function;

  public config = {
    keyboard: true,
    class: "modal-md",
  };

  constructor(
    public bulletinsService: BulletinsService,
    private dialog: MatDialog,
    private renderer: Renderer2,
    private sanitizer: DomSanitizer,
    public authenticationService: AuthenticationService,
    private constantsService: ConstantsService,
    public regionsService: RegionsService,
    public copyService: CopyService,
  ) {
    this.showNotes = false;
    this.updateBulletinOnServerEventDebounce
      .pipe(debounceTime(1000))
      .subscribe((bulletin) => this.updateBulletinOnServerEvent.emit(bulletin));
  }

  ngOnInit() {
    if (!this.isComparedBulletin) {
      this.stopListening = this.renderer.listen("window", "message", this.getText.bind(this));
    }
  }

  ngOnDestroy() {
    if (!this.isComparedBulletin) {
      this.stopListening();
    }
  }

  updateBulletinOnServer() {
    this.updateBulletinOnServerEventDebounce.next(this.bulletin);
  }

  copyBulletin(event) {
    this.copyBulletinEvent.emit(this.bulletin);
  }

  deselectBulletin() {
    this.deselectBulletinEvent.emit(this.bulletin);
  }

  deleteBulletin() {
    this.deleteBulletinEvent.emit(this.bulletin);
  }

  editMicroRegions() {
    this.editMicroRegionsEvent.emit(this.bulletin);
  }

  setMapLayout(isCompact: boolean): void {
    this.setMapLayoutEvent.emit(isCompact);
  }

  setTendency(event: Event, tendency: Enums.Tendency) {
    event.stopPropagation();
    this.bulletin.tendency = tendency;
    this.updateBulletinOnServer();
  }

  isTendency(tendency: Enums.Tendency) {
    return tendency === this.bulletin.tendency;
  }

  isInternal(): boolean {
    const ownerRegion = this.bulletin.getOwnerRegion();
    return ownerRegion && this.authenticationService.isInternalRegion(ownerRegion)
  }

  showDialog(pmData: TextcatLegacyIn) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = "calc(100% - 10px)";
    dialogConfig.height = "calc(100% - 10px)";
    dialogConfig.maxHeight = "100%";
    dialogConfig.maxWidth = "100%";
    dialogConfig.data = {
      pmUrl: this.sanitizer.bypassSecurityTrustResourceUrl(environment.textcatUrl),
      pmData: JSON.stringify(pmData),
    };

    this.dialog.open(CatalogOfPhrasesComponent, dialogConfig);
  }

  hideDialog() {
    this.dialog.closeAll();
  }

  toggleShowNotes() {
    this.showNotes = !this.showNotes;
  }

  onDangerPattern1Change(event: Enums.DangerPattern) {
    this.bulletin.dangerPattern1 = event;
    this.updateBulletinOnServer();
  }

  onDangerPattern2Change(event: Enums.DangerPattern) {
    this.bulletin.dangerPattern2 = event;
    this.updateBulletinOnServer();
  }

  showEditMicroRegionsButton(): boolean {
    return (
      !this.isComparedBulletin && 
      !this.editRegions &&
      this.isInternal() &&
      this.bulletinsService.getIsEditable()
    );
  }

  accordionChanged(event: boolean, groupName: string) {
    switch (groupName) {
      case "dangerRating":
        this.isAccordionDangerRatingOpen = event;
        break;
      case "avalancheProblem":
        this.isAccordionAvalancheProblemOpen = event;
        break;
      case "dangerDescription":
        this.isAccordionDangerDescriptionOpen = event;
        break;
      case "snowpackStructure":
        this.isAccordionSnowpackStructureOpen = event;
        break;
      case "tendency":
        this.isAccordionTendencyOpen = event;
        break;
      default:
        break;
    }
  }

  acceptSuggestions(event) {
    event.stopPropagation();
    const suggested = new Array<string>();
    for (const region of this.bulletin.getSuggestedRegions()) {
      if (region.startsWith(this.authenticationService.getActiveRegionId())) {
        this.bulletin.getSavedRegions().push(region);
      } else {
        suggested.push(region);
      }
    }
    this.bulletin.setSuggestedRegions(suggested);
    this.bulletin.addAdditionalAuthor(this.authenticationService.getAuthor().getName());

    this.updateBulletinOnServer();
  }

  rejectSuggestions(event) {
    event.stopPropagation();
    const suggested = new Array<string>();
    for (const region of this.bulletin.getSuggestedRegions()) {
      if (!region.startsWith(this.authenticationService.getActiveRegionId())) {
        suggested.push(region);
      }
    }
    this.bulletin.setSuggestedRegions(suggested);

    this.updateBulletinOnServer();
  }

  isCreator(bulletin: BulletinModel): boolean {
    const ownerRegion = bulletin.getOwnerRegion();
    return ownerRegion !== undefined && ownerRegion?.startsWith(this.authenticationService.getActiveRegionId());
  }

  daytimeDependencyChanged(event, value) {
    event.stopPropagation();
    if (this.bulletinsService.getIsEditable() && this.isCreator(this.bulletin)) {
      this.bulletin.setHasDaytimeDependency(value);

      if (this.bulletin.hasDaytimeDependency) {
        this.bulletin.afternoon.setDangerRatingAbove(this.bulletin.forenoon.getDangerRatingAbove());
        const avalancheProblem1 = this.bulletin.forenoon.getAvalancheProblem1();
        if (avalancheProblem1) {
          this.bulletin.afternoon.setAvalancheProblem1(new AvalancheProblemModel(avalancheProblem1));
        }
        const avalancheProblem2 = this.bulletin.forenoon.getAvalancheProblem2();
        if (avalancheProblem2) {
          this.bulletin.afternoon.setAvalancheProblem2(new AvalancheProblemModel(avalancheProblem2));
        }
        const avalancheProblem3 = this.bulletin.forenoon.getAvalancheProblem3();
        if (avalancheProblem3) {
          this.bulletin.afternoon.setAvalancheProblem3(new AvalancheProblemModel(avalancheProblem3));
        }
        const avalancheProblem4 = this.bulletin.forenoon.getAvalancheProblem4();
        if (avalancheProblem4) {
          this.bulletin.afternoon.setAvalancheProblem4(new AvalancheProblemModel(avalancheProblem4));
        }
        const avalancheProblem5 = this.bulletin.forenoon.getAvalancheProblem5();
        if (avalancheProblem5) {
          this.bulletin.afternoon.setAvalancheProblem5(new AvalancheProblemModel(avalancheProblem5));
        }
        if (this.bulletin.forenoon.hasElevationDependency) {
          this.bulletin.afternoon.setHasElevationDependency(true);
          this.bulletin.afternoon.setDangerRatingBelow(this.bulletin.forenoon.getDangerRatingBelow());
        }
      } else {
        this.bulletin.afternoon.setDangerRatingAbove(
          new BehaviorSubject<Enums.DangerRating>(Enums.DangerRating.missing),
        );
        this.bulletin.afternoon.setAvalancheProblem1(undefined);
        this.bulletin.afternoon.setAvalancheProblem2(undefined);
        this.bulletin.afternoon.setAvalancheProblem3(undefined);
        this.bulletin.afternoon.setAvalancheProblem4(undefined);
        this.bulletin.afternoon.setAvalancheProblem5(undefined);
        this.bulletin.afternoon.setHasElevationDependency(false);
        this.bulletin.afternoon.setDangerRatingBelow(
          new BehaviorSubject<Enums.DangerRating>(Enums.DangerRating.missing),
        );
      }
      this.bulletin.getForenoon().updateDangerRating();
      this.bulletin.getAfternoon().updateDangerRating();

      this.updateBulletinOnServer();
    }
  }

  hasSuggestions(bulletin: BulletinModel): boolean {
    for (const region of bulletin.getSuggestedRegions()) {
      if (region.startsWith(this.authenticationService.getActiveRegionId())) {
        return true;
      }
    }
    return false;
  }

  getText(e: MessageEvent) {
    e.preventDefault();
    if (
      e.data.type !== "webpackInvalid" &&
      e.data.type !== "webpackOk" &&
      e.data.source !== "react-devtools-content-script"
    ) {
      const pmData: TextcatLegacyOut = JSON.parse(e.data);
      if (pmData.textDef === undefined || pmData.textDef === "") {
        this.bulletin[`${pmData.textField}Textcat`] = "";
        this.bulletin[`${pmData.textField}$`] = {} as LangTexts;
      } else {
        this.bulletin[`${pmData.textField}Textcat`] = pmData.textDef;
        this.bulletin[`${pmData.textField}$`] = convertTextcatToLangTexts(pmData);
      }
      this.hideDialog();
      this.updateBulletinOnServer();
    }
  }

  createAvalancheProblem(isAfternoon: boolean) {
    let daytime;
    if (isAfternoon) {
      daytime = this.bulletin.afternoon;
    } else {
      daytime = this.bulletin.forenoon;
    }
    let lastAvalancheProblem = daytime.avalancheProblem1;
    let count = 1;
    while (lastAvalancheProblem !== undefined) {
      count += 1;
      switch (count) {
        case 2:
          lastAvalancheProblem = daytime.avalancheProblem2;
          break;
        case 3:
          lastAvalancheProblem = daytime.avalancheProblem3;
          break;
        case 4:
          lastAvalancheProblem = daytime.avalancheProblem4;
          break;
        case 5:
          lastAvalancheProblem = daytime.avalancheProblem5;
          break;
        default:
          break;
      }
      if (count > 5) {
        break;
      }
    }
    switch (count) {
      case 1:
        daytime.avalancheProblem1 = new AvalancheProblemModel();
        break;
      case 2:
        daytime.avalancheProblem2 = new AvalancheProblemModel();
        break;
      case 3:
        daytime.avalancheProblem3 = new AvalancheProblemModel();
        break;
      case 4:
        daytime.avalancheProblem4 = new AvalancheProblemModel();
        break;
      case 5:
        daytime.avalancheProblem5 = new AvalancheProblemModel();
        break;
      default:
        break;
    }
    this.updateBulletinOnServer();
  }

  hasFiveAvalancheProblems(isAfternoon: boolean) {
    const daytime = isAfternoon ? this.bulletin.afternoon : this.bulletin.forenoon;
    return daytime.avalancheProblem5 !== undefined;
  }

  getRegionNames(bulletin): string {
    const regionNames = bulletin.savedRegions.map((regionCode) => this.regionsService.getRegionName(regionCode));
    return regionNames.join(", ");
  }
}

export type TextcatTextfield =
  | "highlights"
  | "avActivityHighlights"
  | "avActivityComment"
  | "snowpackStructureHighlights"
  | "snowpackStructureComment"
  | "tendencyComment"
  | "text";

// alias pmData, alias inputDef
export interface TextcatLegacyIn {
  textDef: string;
  textField: TextcatTextfield;
  currentLang: string;
  region: string;
}

// alias pmData, alias outputText
interface TextcatLegacyOut {
  textDef: string;
  textField: TextcatTextfield;
  textDe: string;
  textDe_AT: string;
  textDe_CH: string;
  textIt: string;
  textEn: string;
  textEs: string;
  textFr: string;
  textCa: string;
  textOc: string;
}

function convertTextcatToLangTexts(pmData: TextcatLegacyOut): LangTexts {
  return {
    it: pmData.textIt,
    de: pmData.textDe_AT,
    en: pmData.textEn,
    fr: pmData.textFr,
    es: pmData.textEs,
    ca: pmData.textCa,
    oc: pmData.textOc,
  };
}
