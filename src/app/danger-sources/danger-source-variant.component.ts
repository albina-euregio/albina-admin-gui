import { Component, Input, Output, EventEmitter, ViewChild, TemplateRef, HostListener } from "@angular/core";

import { debounceTime, Subject } from "rxjs";

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
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-danger-source-variant",
  templateUrl: "danger-source-variant.component.html",
})
export class DangerSourceVariantComponent {
  @Input() variant: DangerSourceVariantModel;
  @Input() disabled: boolean;
  @Input() isCompactMapLayout: boolean;
  @Input() isVariantsSidebarVisible: boolean;
  @Input() isComparedVariant: boolean;

  private readonly updateVariantOnServerEventDebounce = new Subject<BulletinModel>();
  @Output() updateBulletinOnServerEvent = new EventEmitter<BulletinModel>();
  @Output() changeAvalancheProblemEvent = new EventEmitter<string>();
  @Output() deleteBulletinEvent = new EventEmitter<BulletinModel>();
  @Output() editMicroRegionsEvent = new EventEmitter<BulletinModel>();
  @Output() copyBulletinEvent = new EventEmitter<BulletinModel>();
  @Output() deselectBulletinEvent = new EventEmitter<BulletinModel>();
  @Output() toggleBulletinSidebarEvent = new EventEmitter<void>();

  dangerPattern: Enums.DangerPattern[] = Object.values(Enums.DangerPattern);
  tendency: Enums.Tendency[] = Object.values(Enums.Tendency);
  strategicMindset: Enums.StrategicMindset[] = Object.values(Enums.StrategicMindset);

  public editRegions: boolean;

  public isAccordionDangerRatingOpen: boolean;
  public isAccordionAvalancheProblemOpen: boolean;
  public isAccordionDangerDescriptionOpen: boolean;
  public isAccordionSnowpackStructureOpen: boolean;
  public isAccordionTendencyOpen: boolean;

  public removeDaytimeDependencyModalRef: BsModalRef;
  @ViewChild("removeDaytimeDependencyTemplate") removeDaytimeDependencyTemplate: TemplateRef<any>;

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
  ) {
    this.updateVariantOnServerEventDebounce
      .pipe(debounceTime(1000))
      .subscribe((bulletin) => this.updateBulletinOnServerEvent.emit(bulletin));
  }

  updateBulletinOnServer() {
    this.updateVariantOnServerEventDebounce.next(this.variant);
  }

  copyBulletin(event) {
    this.copyBulletinEvent.emit(this.variant);
  }

  deselectBulletin() {
    this.deselectBulletinEvent.emit(this.variant);
  }

  deleteBulletin() {
    this.deleteBulletinEvent.emit(this.variant);
  }

  editMicroRegions() {
    this.editMicroRegionsEvent.emit(this.variant);
  }

  setTendency(event: Event, tendency: Enums.Tendency) {
    event.stopPropagation();
    this.variant.tendency = tendency;
    this.updateBulletinOnServer();
  }

  isTendency(tendency: Enums.Tendency) {
    return tendency === this.variant.tendency;
  }

  isInternal(): boolean {
    const ownerRegion = this.variant.getOwnerRegion();
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
    this.variant.dangerPattern1 = event;
    this.updateBulletinOnServer();
  }

  onDangerPattern2Change(event: Enums.DangerPattern) {
    this.variant.dangerPattern2 = event;
    this.updateBulletinOnServer();
  }

  onStrategicMindsetChange(event: Enums.StrategicMindset) {
    this.variant.strategicMindset = event;
    this.updateBulletinOnServer();
  }

  showEditMicroRegionsButton(): boolean {
    return !this.isComparedVariant && !this.editRegions && this.isInternal() && this.bulletinsService.getIsEditable();
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
    for (const region of this.variant.getSuggestedRegions()) {
      if (region.startsWith(this.authenticationService.getActiveRegionId())) {
        this.variant.getSavedRegions().push(region);
      } else {
        suggested.push(region);
      }
    }
    this.variant.setSuggestedRegions(suggested);
    this.variant.addAdditionalAuthor(this.authenticationService.getCurrentAuthor().getName());

    this.updateBulletinOnServer();
  }

  rejectSuggestions(event) {
    event.stopPropagation();
    const suggested = new Array<string>();
    for (const region of this.variant.getSuggestedRegions()) {
      if (!region.startsWith(this.authenticationService.getActiveRegionId())) {
        suggested.push(region);
      }
    }
    this.variant.setSuggestedRegions(suggested);

    this.updateBulletinOnServer();
  }

  isCreator(bulletin: BulletinModel): boolean {
    const ownerRegion = bulletin.getOwnerRegion();
    return ownerRegion !== undefined && ownerRegion?.startsWith(this.authenticationService.getActiveRegionId());
  }

  daytimeDependencyChanged(event, value) {
    event.stopPropagation();
    if (this.bulletinsService.getIsEditable() && this.isCreator(this.variant)) {
      if (value) {
        this.variant.setHasDaytimeDependency(value);

        this.variant.afternoon.setDangerRatingAbove(this.variant.forenoon.getDangerRatingAbove());
        const avalancheProblem1 = this.variant.forenoon.getAvalancheProblem1();
        if (avalancheProblem1) {
          this.variant.afternoon.setAvalancheProblem1(new AvalancheProblemModel(avalancheProblem1));
        }
        const avalancheProblem2 = this.variant.forenoon.getAvalancheProblem2();
        if (avalancheProblem2) {
          this.variant.afternoon.setAvalancheProblem2(new AvalancheProblemModel(avalancheProblem2));
        }
        const avalancheProblem3 = this.variant.forenoon.getAvalancheProblem3();
        if (avalancheProblem3) {
          this.variant.afternoon.setAvalancheProblem3(new AvalancheProblemModel(avalancheProblem3));
        }
        const avalancheProblem4 = this.variant.forenoon.getAvalancheProblem4();
        if (avalancheProblem4) {
          this.variant.afternoon.setAvalancheProblem4(new AvalancheProblemModel(avalancheProblem4));
        }
        const avalancheProblem5 = this.variant.forenoon.getAvalancheProblem5();
        if (avalancheProblem5) {
          this.variant.afternoon.setAvalancheProblem5(new AvalancheProblemModel(avalancheProblem5));
        }
        if (this.variant.forenoon.hasElevationDependency) {
          this.variant.afternoon.setHasElevationDependency(true);
          this.variant.afternoon.setDangerRatingBelow(this.variant.forenoon.getDangerRatingBelow());
        }
        this.variant.getForenoon().updateDangerRating();
        this.variant.getAfternoon().updateDangerRating();

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
  getText(e: MessageEvent) {
    e.preventDefault();
    if (
      e.data.type !== "webpackInvalid" &&
      e.data.type !== "webpackOk" &&
      e.data.source !== "react-devtools-content-script"
    ) {
      const pmData: TextcatLegacyOut = JSON.parse(e.data);
      if (pmData.textDef === undefined || pmData.textDef === "") {
        this.variant[`${pmData.textField}Textcat`] = "";
        this.variant[`${pmData.textField}$`] = {} as LangTexts;
      } else {
        this.variant[`${pmData.textField}Textcat`] = pmData.textDef;
        this.variant[`${pmData.textField}$`] = convertTextcatToLangTexts(pmData);
      }
      this.hideDialog();
      this.updateBulletinOnServer();
    }
  }

  createAvalancheProblem(isAfternoon: boolean) {
    this.isAccordionAvalancheProblemOpen = true;
    let daytime;
    if (isAfternoon) {
      daytime = this.variant.afternoon;
    } else {
      daytime = this.variant.forenoon;
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
    const daytime = isAfternoon ? this.variant.afternoon : this.variant.forenoon;
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
    this.variant.setHasDaytimeDependency(false);

    if (!earlier) {
      this.variant.forenoon.setDangerRatingAbove(this.variant.afternoon.getDangerRatingAbove());
      this.variant.forenoon.setAvalancheProblem1(this.variant.afternoon.getAvalancheProblem1());
      this.variant.forenoon.setAvalancheProblem2(this.variant.afternoon.getAvalancheProblem2());
      this.variant.forenoon.setAvalancheProblem3(this.variant.afternoon.getAvalancheProblem3());
      this.variant.forenoon.setAvalancheProblem4(this.variant.afternoon.getAvalancheProblem4());
      this.variant.forenoon.setAvalancheProblem5(this.variant.afternoon.getAvalancheProblem5());
      this.variant.forenoon.setHasElevationDependency(this.variant.afternoon.getHasElevationDependency());
      this.variant.forenoon.setDangerRatingBelow(this.variant.afternoon.getDangerRatingBelow());
    }
    this.variant.afternoon.setDangerRatingAbove(Enums.DangerRating.missing);
    this.variant.afternoon.setAvalancheProblem1(undefined);
    this.variant.afternoon.setAvalancheProblem2(undefined);
    this.variant.afternoon.setAvalancheProblem3(undefined);
    this.variant.afternoon.setAvalancheProblem4(undefined);
    this.variant.afternoon.setAvalancheProblem5(undefined);
    this.variant.afternoon.setHasElevationDependency(false);
    this.variant.afternoon.setDangerRatingBelow(Enums.DangerRating.missing);

    this.variant.getForenoon().updateDangerRating();
    this.variant.getAfternoon().updateDangerRating();

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
