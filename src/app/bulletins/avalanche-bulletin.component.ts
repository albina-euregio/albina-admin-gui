import { Component, ViewChild, TemplateRef, OnDestroy, OnInit, Input, Output, EventEmitter } from "@angular/core";

import { CatalogOfPhrasesComponent } from "../catalog-of-phrases/catalog-of-phrases.component";
import { BehaviorSubject } from "rxjs";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal";

import { environment } from "../../environments/environment";

// models
import { BulletinModel } from "../models/bulletin.model";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";

// services
import { TranslateService } from "@ngx-translate/core";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { SettingsService } from "../providers/settings-service/settings.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { CopyService } from "../providers/copy-service/copy.service";

import { MatDialog, MatDialogConfig } from "@angular/material/dialog";

// For iframe
import { Renderer2 } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import * as Enums from "../enums/enums";
import {LangTexts, concatenateLangTexts, LANGUAGES} from "../models/text.model";

@Component({
  selector: "app-avalanche-bulletin",
  templateUrl: "avalanche-bulletin.component.html",
})
export class AvalancheBulletinComponent implements OnInit, OnDestroy {
  @Input() bulletin: BulletinModel;
  @Input() disabled: boolean;
  @Input() isCompactMapLayout: boolean;
  @Input() isComparedBulletin: boolean;

  @Output() updateBulletinOnServerEvent = new EventEmitter<BulletinModel>();
  @Output() changeAvalancheProblemEvent = new EventEmitter<string>();
  @Output() deleteBulletinEvent = new EventEmitter<BulletinModel>();
  @Output() editMicroRegionsEvent = new EventEmitter<BulletinModel>();
  @Output() copyBulletinEvent = new EventEmitter<BulletinModel>();
  @Output() deselectBulletinEvent = new EventEmitter<BulletinModel>();
  @Output() setMapLayoutEvent = new EventEmitter<boolean>();

  public dangerPattern = Enums.DangerPattern;

  public showNotes: boolean;
  public editRegions: boolean;

  public isAccordionDangerRatingOpen: boolean;
  public isAccordionAvalancheProblemOpen: boolean;
  public isAccordionDangerDescriptionOpen: boolean;
  public isAccordionSnowpackStructureOpen: boolean;
  public isAccordionTendencyOpen: boolean;

  public showTranslationsHighlights: boolean;
  public showTranslationsAvActivityHighlights: boolean;
  public showTranslationsAvActivityComment: boolean;
  public showTranslationsSnowpackStructureComment: boolean;
  public showTranslationsTendencyComment: boolean;

  public loadAvActivityCommentExampleTextModalRef: BsModalRef;
  @ViewChild("loadAvActivityCommentExampleTextTemplate") loadAvActivityCommentExampleTextTemplate: TemplateRef<any>;

  public loadSnowpackStructureCommentExampleTextModalRef: BsModalRef;
  @ViewChild("loadSnowpackStructureCommentExampleTextTemplate")
  loadSnowpackStructureCommentExampleTextTemplate: TemplateRef<any>;

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
    private translateService: TranslateService,
    public settingsService: SettingsService,
    private constantsService: ConstantsService,
    public regionsService: RegionsService,
    public copyService: CopyService,
    private modalService: BsModalService,
  ) {
    this.showNotes = false;
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
    this.updateBulletinOnServerEvent.emit(this.bulletin);
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

  isForeign(): boolean {
    const ownerRegion = this.bulletin.getOwnerRegion();
    return (
      ownerRegion !== undefined &&
      (ownerRegion.startsWith(this.constantsService.codeTyrol) ||
        ownerRegion.startsWith(this.constantsService.codeSouthTyrol) ||
        ownerRegion.startsWith(this.constantsService.codeTrentino)) &&
      !this.isCreator(this.bulletin)
    );
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

  onDangerPattern1Change(event) {
    this.bulletin.setDangerPattern1(event);
    this.updateBulletinOnServer();
  }

  onDangerPattern2Change(event) {
    this.bulletin.setDangerPattern2(event);
    this.updateBulletinOnServer();
  }

  onNotesFocusOut(event) {
    this.updateBulletinOnServer();
  }

  setShowTranslations(name: string) {
    switch (name) {
      case "highlights":
        this.showTranslationsHighlights = !this.showTranslationsHighlights;
        break;
      case "avActivityHighlights":
        this.showTranslationsAvActivityHighlights = !this.showTranslationsAvActivityHighlights;
        break;
      case "avActivityComment":
        this.showTranslationsAvActivityComment = !this.showTranslationsAvActivityComment;
        break;
      case "snowpackStructureComment":
        this.showTranslationsSnowpackStructureComment = !this.showTranslationsSnowpackStructureComment;
        break;
      case "tendencyComment":
        this.showTranslationsTendencyComment = !this.showTranslationsTendencyComment;
        break;
      default:
        break;
    }
  }

  get translationLanguages() {
    return LANGUAGES.filter(l => l !== this.settingsService.getLangString());
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

      this.updateBulletinOnServerEvent.emit(this.bulletin);
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

  openTextcat($event: Event | undefined, field: TextcatTextfield, textDef: string) {
    this.copyService.resetCopyTextcat();
    $event?.preventDefault();
    const regions = {
      [this.constantsService.codeSwitzerland]: "Switzerland",
      [this.constantsService.codeTyrol]: "Tyrol",
      [this.constantsService.codeSouthTyrol]: "South Tyrol",
      [this.constantsService.codeTrentino]: "Trentino",
      [this.constantsService.codeAran]: "Aran",
      [this.constantsService.codeAndorra]: "Andorra",
    };
    const activeRegion = this.authenticationService.getActiveRegionId();
    this.showDialog({
      textField: field,
      textDef: textDef || "",
      currentLang: this.translateService.currentLang,
      region: regions[activeRegion] || "",
    });
  }

  copyTextcat(event, field: TextcatTextfield) {
    switch (field) {
      case "highlights":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.bulletin.getHighlightsTextcat());
        this.copyService.setFromLangTexts(this.bulletin.highlights$);
        break;
      case "avActivityHighlights":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.bulletin.getAvActivityHighlightsTextcat());
        this.copyService.setFromLangTexts(this.bulletin.avActivityHighlights$);
        break;
      case "avActivityComment":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.bulletin.getAvActivityCommentTextcat());
        this.copyService.setFromLangTexts(this.bulletin.avActivityComment$);
        break;
      case "snowpackStructureComment":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.bulletin.getSnowpackStructureCommentTextcat());
        this.copyService.setFromLangTexts(this.bulletin.snowpackStructureComment$);
        break;
      case "tendencyComment":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.bulletin.getTendencyCommentTextcat());
        this.copyService.setFromLangTexts(this.bulletin.tendencyComment$);
        break;
      default:
        break;
    }
  }

  concatTextcat(text1: string | undefined, text2: string | undefined) {
    if (!text1) return text2;
    if (!text2) return text1;
    return text1.slice(0, -1).concat(",", text2.substring(1));
  }

  pasteTextcat(event, field: TextcatTextfield) {
    switch (field) {
      case "highlights":
        this.bulletin.highlightsTextcat = this.concatTextcat(
          this.bulletin.highlightsTextcat,
          this.copyService.getTextTextcat(),
        );
        this.bulletin.highlights$ = concatenateLangTexts(this.bulletin.highlights$, this.copyService.toLangTexts);
        break;
      case "avActivityHighlights":
        this.bulletin.avActivityHighlightsTextcat = this.concatTextcat(
          this.bulletin.avActivityHighlightsTextcat,
          this.copyService.getTextTextcat(),
        );
        this.bulletin.avActivityHighlights$ = concatenateLangTexts(
          this.bulletin.avActivityHighlights$,
          this.copyService.toLangTexts,
        );
        break;
      case "avActivityComment":
        this.bulletin.avActivityCommentTextcat = this.concatTextcat(
          this.bulletin.avActivityCommentTextcat,
          this.copyService.getTextTextcat(),
        );
        this.bulletin.avActivityComment$ = concatenateLangTexts(
          this.bulletin.avActivityComment$,
          this.copyService.toLangTexts,
        );
        break;
      case "snowpackStructureComment":
        this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(
          this.bulletin.snowpackStructureCommentTextcat,
          this.copyService.getTextTextcat(),
        );
        this.bulletin.snowpackStructureComment$ = concatenateLangTexts(
          this.bulletin.snowpackStructureComment$,
          this.copyService.toLangTexts,
        );
        break;
      case "tendencyComment":
        this.bulletin.tendencyCommentTextcat = this.concatTextcat(
          this.bulletin.tendencyCommentTextcat,
          this.copyService.getTextTextcat(),
        );
        this.bulletin.tendencyComment$ = concatenateLangTexts(
          this.bulletin.tendencyComment$,
          this.copyService.toLangTexts,
        );
        break;
      default:
        break;
    }
    this.copyService.resetCopyTextcat();
    this.updateBulletinOnServer();
  }

  deleteTextcat(event, field: TextcatTextfield) {
    switch (field) {
      case "highlights":
        this.bulletin.highlightsTextcat = undefined;
        this.bulletin.highlights$ = {} as LangTexts;
        break;
      case "avActivityHighlights":
        this.bulletin.avActivityHighlightsTextcat = undefined;
        this.bulletin.avActivityHighlights$ = {} as LangTexts;
        break;
      case "avActivityComment":
        this.bulletin.avActivityCommentTextcat = undefined;
        this.bulletin.avActivityComment$ = {} as LangTexts;
        break;
      case "snowpackStructureComment":
        this.bulletin.snowpackStructureCommentTextcat = undefined;
        this.bulletin.snowpackStructureComment$ = {} as LangTexts;
        break;
      case "tendencyComment":
        this.bulletin.tendencyCommentTextcat = undefined;
        this.bulletin.tendencyComment$ = {} as LangTexts;
        break;
      default:
        break;
    }
    this.updateBulletinOnServer();
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
        this.bulletin[pmData.textField + "Textcat"] = "";
        this.bulletin[pmData.textField + "$"] = {} as LangTexts;
      } else {
        this.bulletin[pmData.textField + "Textcat"] = pmData.textDef;
        this.bulletin[pmData.textField + "$"] = convertTextcatToLangTexts(pmData);
      }
      this.hideDialog();
      this.updateBulletinOnServer();
    }
  }

  openLoadAvActivityCommentExampleTextModal(template: TemplateRef<any>) {
    this.loadAvActivityCommentExampleTextModalRef = this.modalService.show(template, this.config);
  }

  loadAvActivityCommentExampleText(avalancheProblem) {
    switch (avalancheProblem) {
      case "newSnow":
        this.bulletin.avActivityCommentTextcat = this.concatTextcat(
          this.bulletin.avActivityCommentTextcat,
          this.constantsService.avActivityCommentNewSnowTextcat,
        );
        break;
      case "windSlab":
        this.bulletin.avActivityCommentTextcat = this.concatTextcat(
          this.bulletin.avActivityCommentTextcat,
          this.constantsService.avActivityCommentWindSlabTextcat,
        );
        break;
      case "persistentWeakLayers":
        this.bulletin.avActivityCommentTextcat = this.concatTextcat(
          this.bulletin.avActivityCommentTextcat,
          this.constantsService.avActivityCommentPersistentWeakLayersTextcat,
        );
        break;
      case "wetSnow":
        this.bulletin.avActivityCommentTextcat = this.concatTextcat(
          this.bulletin.avActivityCommentTextcat,
          this.constantsService.avActivityCommentWetSnowTextcat,
        );
        break;
      case "glidingSnow":
        this.bulletin.avActivityCommentTextcat = this.concatTextcat(
          this.bulletin.avActivityCommentTextcat,
          this.constantsService.avActivityCommentGlidingSnowTextcat,
        );
        break;
      case "favourableSituation":
        this.bulletin.avActivityCommentTextcat = this.concatTextcat(
          this.bulletin.avActivityCommentTextcat,
          this.constantsService.avActivityCommentFavourableSituationTextcat,
        );
        break;
      default:
        break;
    }
    this.openTextcat(undefined, "avActivityComment", this.bulletin.avActivityCommentTextcat);
    this.loadAvActivityCommentExampleTextModalRef.hide();
  }

  loadAvActivityCommentExampleTextCancel() {
    this.loadAvActivityCommentExampleTextModalRef.hide();
  }

  openLoadSnowpackStructureCommentExampleTextModal(template: TemplateRef<any>) {
    this.loadSnowpackStructureCommentExampleTextModalRef = this.modalService.show(template, this.config);
  }

  loadSnowpackStructureCommentExampleText(avalancheProblem) {
    switch (avalancheProblem) {
      case "newSnow":
        this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(
          this.bulletin.snowpackStructureCommentTextcat,
          this.constantsService.snowpackStructureCommentNewSnowTextcat,
        );
        break;
      case "windSlab":
        this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(
          this.bulletin.snowpackStructureCommentTextcat,
          this.constantsService.snowpackStructureCommentWindSlabTextcat,
        );
        break;
      case "persistentWeakLayers":
        this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(
          this.bulletin.snowpackStructureCommentTextcat,
          this.constantsService.snowpackStructureCommentPersistentWeakLayersTextcat,
        );
        break;
      case "wetSnow":
        this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(
          this.bulletin.snowpackStructureCommentTextcat,
          this.constantsService.snowpackStructureCommentWetSnowTextcat,
        );
        break;
      case "glidingSnow":
        this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(
          this.bulletin.snowpackStructureCommentTextcat,
          this.constantsService.snowpackStructureCommentGlidingSnowTextcat,
        );
        break;
      case "favourableSituation":
        this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(
          this.bulletin.snowpackStructureCommentTextcat,
          this.constantsService.snowpackStructureCommentFavourableSituationTextcat,
        );
        break;
      default:
        break;
    }
    this.openTextcat(undefined, "snowpackStructureComment", this.bulletin.snowpackStructureCommentTextcat);
    this.loadSnowpackStructureCommentExampleTextModalRef.hide();
  }

  loadSnowpackStructureCommentExampleTextCancel() {
    this.loadSnowpackStructureCommentExampleTextModalRef.hide();
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

type TextcatTextfield =
  | "highlights"
  | "avActivityHighlights"
  | "avActivityComment"
  | "snowpackStructureHighlights"
  | "snowpackStructureComment"
  | "tendencyComment"
  | "text";

// alias pmData, alias inputDef
interface TextcatLegacyIn {
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
