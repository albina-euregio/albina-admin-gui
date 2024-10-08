import { Component, Input, Output, EventEmitter, ViewChild, TemplateRef, HostListener } from "@angular/core";

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

// For iframe
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

import * as Enums from "../enums/enums";
import { LangTexts } from "../models/text.model";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { UndoRedoService } from "app/providers/undo-redo-service/undo-redo.service";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { NgIf, NgFor, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { AvalancheProblemComponent } from "./avalanche-problem.component";
import { BulletinTextComponent } from "./bulletin-text.component";

@Component({
  selector: "app-avalanche-bulletin",
  templateUrl: "avalanche-bulletin.component.html",
  standalone: true,
  imports: [
    BsDropdownModule,
    NgIf,
    FormsModule,
    NgFor,
    AccordionModule,
    AvalancheProblemComponent,
    BulletinTextComponent,
    DatePipe,
    TranslateModule,
  ],
})
export class AvalancheBulletinComponent {
  @Input() bulletin: BulletinModel;
  @Input() disabled: boolean;
  @Input() isCompactMapLayout: boolean;
  @Input() isBulletinSidebarVisible: boolean;
  @Input() isComparedBulletin: boolean;

  @Output() updateBulletinOnServerEvent = new EventEmitter<BulletinModel>();
  @Output() changeAvalancheProblemEvent = new EventEmitter<string>();
  @Output() deleteBulletinEvent = new EventEmitter<BulletinModel>();
  @Output() editMicroRegionsEvent = new EventEmitter<BulletinModel>();
  @Output() copyBulletinEvent = new EventEmitter<BulletinModel>();
  @Output() deselectBulletinEvent = new EventEmitter<BulletinModel>();
  @Output() toggleBulletinSidebarEvent = new EventEmitter<void>();
  @Output() undoRedoEvent = new EventEmitter<"undo" | "redo">();

  dangerPattern: Enums.DangerPattern[] = Object.values(Enums.DangerPattern);
  tendency: Enums.Tendency[] = Object.values(Enums.Tendency);
  strategicMindset: Enums.StrategicMindset[] = Object.values(Enums.StrategicMindset);

  public editRegions: boolean;

  public isAccordionDangerRatingOpen: boolean;
  public isAccordionAvalancheProblemOpen: boolean;
  public isAccordionDangerDescriptionOpen: boolean;
  public isAccordionSnowpackStructureOpen: boolean;
  public isAccordionTendencyOpen: boolean;

  public catalogOfPhrasesModalRef: BsModalRef;
  public pmUrl: SafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(environment.textcatUrl);
  public pmData: TextcatLegacyIn | undefined;
  @ViewChild("catalogOfPhrasesTemplate") catalogOfPhrasesTemplate: TemplateRef<any>;

  public removeDaytimeDependencyModalRef: BsModalRef;
  @ViewChild("removeDaytimeDependencyTemplate") removeDaytimeDependencyTemplate: TemplateRef<any>;

  public strategicMindsetModalRef: BsModalRef;
  @ViewChild("strategicMindsetTemplate") strategicMindsetTemplate: TemplateRef<any>;

  stopListening: Function;

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-md",
  };

  constructor(
    public bulletinsService: BulletinsService,
    private sanitizer: DomSanitizer,
    public authenticationService: AuthenticationService,
    private modalService: BsModalService,
    public constantsService: ConstantsService,
    public regionsService: RegionsService,
    public copyService: CopyService,
    public translateService: TranslateService,
    public undoRedoService: UndoRedoService,
  ) {}

  updateBulletinOnServer() {
    this.updateBulletinOnServerEvent.next(this.bulletin);
  }

  copyBulletin() {
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
    return ownerRegion && this.authenticationService.isInternalRegion(ownerRegion);
  }

  showDialog(pmData: TextcatLegacyIn) {
    this.pmData = pmData;
    this.catalogOfPhrasesModalRef = this.modalService.show(this.catalogOfPhrasesTemplate, {
      animated: false,
      keyboard: true,
      class: "modal-fullscreen",
    });
  }

  initCatalogOfPhrases($event: Event) {
    const iframe = $event.target as HTMLIFrameElement;
    iframe.contentWindow.postMessage(JSON.stringify(this.pmData), "*");
  }

  hideDialog() {
    this.catalogOfPhrasesModalRef.hide();
    this.pmData = undefined;
  }

  onDangerPattern1Change(event: Enums.DangerPattern) {
    this.bulletin.dangerPattern1 = event;
    this.updateBulletinOnServer();
  }

  onDangerPattern2Change(event: Enums.DangerPattern) {
    this.bulletin.dangerPattern2 = event;
    this.updateBulletinOnServer();
  }

  onStrategicMindsetChange(event: Enums.StrategicMindset) {
    this.bulletin.strategicMindset = event;
    this.updateBulletinOnServer();
  }

  showEditMicroRegionsButton(): boolean {
    return !this.isComparedBulletin && !this.editRegions && this.isInternal() && this.bulletinsService.getIsEditable();
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

  acceptSuggestions(event: Event) {
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
    this.bulletin.addAdditionalAuthor(this.authenticationService.getCurrentAuthor().getName());

    this.updateBulletinOnServer();
  }

  rejectSuggestions(event: Event) {
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
      if (value) {
        this.bulletin.setHasDaytimeDependency(value);

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
        this.bulletin.getForenoon().updateDangerRating();
        this.bulletin.getAfternoon().updateDangerRating();

        this.updateBulletinOnServer();
      } else {
        this.openRemoveDaytimeDependencyModal(this.removeDaytimeDependencyTemplate);
      }
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

  @HostListener("window:message", ["$event"])
  getText(e0: Event) {
    const e = e0 as MessageEvent;
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
    this.isAccordionAvalancheProblemOpen = true;
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

  openRemoveDaytimeDependencyModal(template: TemplateRef<any>) {
    this.removeDaytimeDependencyModalRef = this.modalService.show(template, this.config);
  }

  removeDaytimeDependencyModalConfirm(event, earlier: boolean): void {
    event.stopPropagation();
    this.removeDaytimeDependencyModalRef.hide();
    this.bulletin.setHasDaytimeDependency(false);

    if (!earlier) {
      this.bulletin.forenoon.setDangerRatingAbove(this.bulletin.afternoon.getDangerRatingAbove());
      this.bulletin.forenoon.setAvalancheProblem1(this.bulletin.afternoon.getAvalancheProblem1());
      this.bulletin.forenoon.setAvalancheProblem2(this.bulletin.afternoon.getAvalancheProblem2());
      this.bulletin.forenoon.setAvalancheProblem3(this.bulletin.afternoon.getAvalancheProblem3());
      this.bulletin.forenoon.setAvalancheProblem4(this.bulletin.afternoon.getAvalancheProblem4());
      this.bulletin.forenoon.setAvalancheProblem5(this.bulletin.afternoon.getAvalancheProblem5());
      this.bulletin.forenoon.setHasElevationDependency(this.bulletin.afternoon.getHasElevationDependency());
      this.bulletin.forenoon.setDangerRatingBelow(this.bulletin.afternoon.getDangerRatingBelow());
    }
    this.bulletin.afternoon.setDangerRatingAbove(Enums.DangerRating.missing);
    this.bulletin.afternoon.setAvalancheProblem1(undefined);
    this.bulletin.afternoon.setAvalancheProblem2(undefined);
    this.bulletin.afternoon.setAvalancheProblem3(undefined);
    this.bulletin.afternoon.setAvalancheProblem4(undefined);
    this.bulletin.afternoon.setAvalancheProblem5(undefined);
    this.bulletin.afternoon.setHasElevationDependency(false);
    this.bulletin.afternoon.setDangerRatingBelow(Enums.DangerRating.missing);

    this.bulletin.getForenoon().updateDangerRating();
    this.bulletin.getAfternoon().updateDangerRating();

    this.updateBulletinOnServer();
  }

  removeDaytimeDependencyModalDecline(): void {
    this.removeDaytimeDependencyModalRef.hide();
  }

  openStrategicMindsetInfoModal(template: TemplateRef<any>) {
    this.strategicMindsetModalRef = this.modalService.show(template, {
      animated: false,
      keyboard: true,
      class: "modal-xl",
    });
  }

  closeStrategicMindsetInfoModal(): void {
    this.strategicMindsetModalRef.hide();
  }

  toggleBulletinSidebar() {
    this.toggleBulletinSidebarEvent.emit();
  }

  @HostListener("document:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === "z") {
      this.undoRedoEvent.emit("undo");
    } else if (event.ctrlKey && event.key === "y") {
      this.undoRedoEvent.emit("redo");
    }
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
