import { Component, ViewChild, TemplateRef, OnDestroy, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { DatePipe } from "@angular/common";


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
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { Subscription } from "rxjs";

import * as Enums from "../enums/enums";
import { LangTexts, concatenateLangTexts } from "../models/text.model";

declare var L: any;

@Component({
  selector: "app-avalanche-bulletin",
  templateUrl: "avalanche-bulletin.component.html"
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
  public tendency = Enums.Tendency;
  
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
  @ViewChild("loadSnowpackStructureCommentExampleTextTemplate") loadSnowpackStructureCommentExampleTextTemplate: TemplateRef<any>;

  stopListening: Function;

  // tra le proprietà del componente
  eventSubscriber: Subscription;

  public config = {
    keyboard: true,
    class: "modal-md"
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
    private datePipe: DatePipe
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

  setTendency(event, tendency) {
    event.stopPropagation();
    this.bulletin.tendency = tendency;
    this.updateBulletinOnServer();
  }

  isTendency(tendency) {
    return tendency === this.bulletin.tendency;
  }

  isForeign(): boolean {
    if (
      (this.bulletin.getOwnerRegion() !== undefined) &&
      (this.bulletin.getOwnerRegion().startsWith(this.constantsService.codeTyrol) || this.bulletin.getOwnerRegion().startsWith(this.constantsService.codeSouthTyrol) || this.bulletin.getOwnerRegion().startsWith(this.constantsService.codeTrentino)) &&
      (!this.isCreator(this.bulletin)))
    {
      return true;
    }
    return false;
  }

  showDialog(pmData: TextcatLegacyIn) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = "calc(100% - 10px)";
    dialogConfig.height = "calc(100% - 10px)";
    dialogConfig.maxHeight = "100%";
    dialogConfig.maxWidth = "100%";
    dialogConfig.data = {
      pmUrl: this.sanitizer.bypassSecurityTrustResourceUrl(environment.textcatUrl),
      pmData: JSON.stringify(pmData)
    };

    this.dialog.open(CatalogOfPhrasesComponent, dialogConfig);
  }

  hideDialog() {
    this.dialog.closeAll();
  }

  toggleShowNotes() {
    if (this.showNotes)
      this.showNotes = false;
    else
      this.showNotes = true;
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
        if (this.showTranslationsHighlights) {
          this.showTranslationsHighlights = false;
        } else {
          this.showTranslationsHighlights = true;
        }
        break;
      case "avActivityHighlights":
        if (this.showTranslationsAvActivityHighlights) {
          this.showTranslationsAvActivityHighlights = false;
        } else {
          this.showTranslationsAvActivityHighlights = true;
        }
        break;
      case "avActivityComment":
        if (this.showTranslationsAvActivityComment) {
          this.showTranslationsAvActivityComment = false;
        } else {
          this.showTranslationsAvActivityComment = true;
        }
        break;
      case "snowpackStructureComment":
        if (this.showTranslationsSnowpackStructureComment) {
          this.showTranslationsSnowpackStructureComment = false;
        } else {
          this.showTranslationsSnowpackStructureComment = true;
        }
        break;
      case "tendencyComment":
        if (this.showTranslationsTendencyComment) {
          this.showTranslationsTendencyComment = false;
        } else {
          this.showTranslationsTendencyComment = true;
        }
        break;
      default:
        break;
    }
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
    const suggested = new Array<String>();
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
    const suggested = new Array<String>();
    for (const region of this.bulletin.getSuggestedRegions()) {
      if (!region.startsWith(this.authenticationService.getActiveRegionId())) {
        suggested.push(region);
      }
    }
    this.bulletin.setSuggestedRegions(suggested);

    this.updateBulletinOnServer();
  }

  isCreator(bulletin: BulletinModel): boolean {
    if (bulletin.getOwnerRegion() !== undefined && bulletin.getOwnerRegion().startsWith(this.authenticationService.getActiveRegionId())) {
      return true;
    }
    return false;
  }

  daytimeDependencyChanged(event, value) {
    event.stopPropagation();
    if (this.bulletinsService.getIsEditable() && this.isCreator(this.bulletin)) {
      this.bulletin.setHasDaytimeDependency(value);

      if (this.bulletin.hasDaytimeDependency) {
        this.bulletin.afternoon.setDangerRatingAbove(this.bulletin.forenoon.getDangerRatingAbove());
        if (this.bulletin.forenoon.getAvalancheProblem1() && this.bulletin.forenoon.getAvalancheProblem1() !== undefined) {
          this.bulletin.afternoon.setAvalancheProblem1(new AvalancheProblemModel(this.bulletin.forenoon.getAvalancheProblem1()));
        }
        if (this.bulletin.forenoon.getAvalancheProblem2() && this.bulletin.forenoon.getAvalancheProblem2() !== undefined) {
          this.bulletin.afternoon.setAvalancheProblem2(new AvalancheProblemModel(this.bulletin.forenoon.getAvalancheProblem2()));
        }
        if (this.bulletin.forenoon.getAvalancheProblem3() && this.bulletin.forenoon.getAvalancheProblem3() !== undefined) {
          this.bulletin.afternoon.setAvalancheProblem3(new AvalancheProblemModel(this.bulletin.forenoon.getAvalancheProblem3()));
        }
        if (this.bulletin.forenoon.getAvalancheProblem4() && this.bulletin.forenoon.getAvalancheProblem4() !== undefined) {
          this.bulletin.afternoon.setAvalancheProblem4(new AvalancheProblemModel(this.bulletin.forenoon.getAvalancheProblem4()));
        }
        if (this.bulletin.forenoon.getAvalancheProblem5() && this.bulletin.forenoon.getAvalancheProblem5() !== undefined) {
          this.bulletin.afternoon.setAvalancheProblem5(new AvalancheProblemModel(this.bulletin.forenoon.getAvalancheProblem5()));
        }
        if (this.bulletin.forenoon.hasElevationDependency) {
          this.bulletin.afternoon.setHasElevationDependency(true);
          this.bulletin.afternoon.setDangerRatingBelow(this.bulletin.forenoon.getDangerRatingBelow());
        }
      } else {
        this.bulletin.afternoon.setDangerRatingAbove(new BehaviorSubject<Enums.DangerRating>(Enums.DangerRating.missing));
        this.bulletin.afternoon.setAvalancheProblem1(undefined);
        this.bulletin.afternoon.setAvalancheProblem2(undefined);
        this.bulletin.afternoon.setAvalancheProblem3(undefined);
        this.bulletin.afternoon.setAvalancheProblem4(undefined);
        this.bulletin.afternoon.setAvalancheProblem5(undefined);
        this.bulletin.afternoon.setHasElevationDependency(false);
        this.bulletin.afternoon.setDangerRatingBelow(new BehaviorSubject<Enums.DangerRating>(Enums.DangerRating.missing));
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
    this.showDialog({
        textField: field,
        textDef: textDef || "",
        currentLang: this.translateService.currentLang,
        region: this.authenticationService.getTextcatRegionCode()
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

  concatTextcat(text1: string, text2: string) {
    return text1.slice(0, -1).concat(",", text2.substring(1));
  }

  pasteTextcat(event, field: TextcatTextfield) {
    switch (field) {
      case "highlights":
        if (this.bulletin.highlightsTextcat !== undefined) {
          this.bulletin.highlightsTextcat = this.concatTextcat(this.bulletin.highlightsTextcat, this.copyService.getTextTextcat());
        } else {
          this.bulletin.highlightsTextcat = this.copyService.getTextTextcat();
        }
        this.bulletin.highlights$ = concatenateLangTexts(this.bulletin.highlights$, this.copyService.toLangTexts);        break;
      case "avActivityHighlights":
        if (this.bulletin.avActivityHighlightsTextcat !== undefined) {
          this.bulletin.avActivityHighlightsTextcat = this.concatTextcat(this.bulletin.avActivityHighlightsTextcat, this.copyService.getTextTextcat());
        } else {
          this.bulletin.avActivityHighlightsTextcat = this.copyService.getTextTextcat();
        }
        this.bulletin.avActivityHighlights$ = concatenateLangTexts(this.bulletin.avActivityHighlights$, this.copyService.toLangTexts);        break;
      case "avActivityComment":
        if (this.bulletin.avActivityCommentTextcat !== undefined) {
          this.bulletin.avActivityCommentTextcat = this.concatTextcat(this.bulletin.avActivityCommentTextcat, this.copyService.getTextTextcat());
        } else {
          this.bulletin.avActivityCommentTextcat = this.copyService.getTextTextcat();
        }
        this.bulletin.avActivityComment$ = concatenateLangTexts(this.bulletin.avActivityComment$, this.copyService.toLangTexts);
        break;
      case "snowpackStructureComment":
        if (this.bulletin.snowpackStructureCommentTextcat !== undefined) {
          this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(this.bulletin.snowpackStructureCommentTextcat, this.copyService.getTextTextcat());
        } else {
          this.bulletin.snowpackStructureCommentTextcat = this.copyService.getTextTextcat();
        }
        this.bulletin.snowpackStructureComment$ = concatenateLangTexts(this.bulletin.snowpackStructureComment$, this.copyService.toLangTexts);
        break;
      case "tendencyComment":
        if (this.bulletin.tendencyCommentTextcat !== undefined) {
          this.bulletin.tendencyCommentTextcat = this.concatTextcat(this.bulletin.tendencyCommentTextcat, this.copyService.getTextTextcat());
        } else {
          this.bulletin.tendencyCommentTextcat = this.copyService.getTextTextcat();
        }
        this.bulletin.tendencyComment$ = concatenateLangTexts(this.bulletin.tendencyComment$, this.copyService.toLangTexts);
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
    if (e.data.type !== "webpackInvalid" && e.data.type !== "webpackOk" && e.data.source !== "react-devtools-content-script") {
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
        if (this.bulletin.avActivityCommentTextcat !== undefined) {
          this.bulletin.avActivityCommentTextcat = this.concatTextcat(this.bulletin.avActivityCommentTextcat, this.constantsService.avActivityCommentNewSnowTextcat);
        } else {
          this.bulletin.avActivityCommentTextcat = this.constantsService.avActivityCommentNewSnowTextcat;
        }
        break;
      case "windSlab":
        if (this.bulletin.avActivityCommentTextcat !== undefined) {
          this.bulletin.avActivityCommentTextcat = this.concatTextcat(this.bulletin.avActivityCommentTextcat, this.constantsService.avActivityCommentWindSlabTextcat);
        } else {
          this.bulletin.avActivityCommentTextcat = this.constantsService.avActivityCommentWindSlabTextcat;
        }
        break;
      case "persistentWeakLayers":
        if (this.bulletin.avActivityCommentTextcat !== undefined) {
          this.bulletin.avActivityCommentTextcat = this.concatTextcat(this.bulletin.avActivityCommentTextcat, this.constantsService.avActivityCommentPersistentWeakLayersTextcat);
        } else {
          this.bulletin.avActivityCommentTextcat = this.constantsService.avActivityCommentPersistentWeakLayersTextcat;
        }
        break;
      case "wetSnow":
        if (this.bulletin.avActivityCommentTextcat !== undefined) {
          this.bulletin.avActivityCommentTextcat = this.concatTextcat(this.bulletin.avActivityCommentTextcat, this.constantsService.avActivityCommentWetSnowTextcat);
        } else {
          this.bulletin.avActivityCommentTextcat = this.constantsService.avActivityCommentWetSnowTextcat;
        }
        break;
      case "glidingSnow":
        if (this.bulletin.avActivityCommentTextcat !== undefined) {
          this.bulletin.avActivityCommentTextcat = this.concatTextcat(this.bulletin.avActivityCommentTextcat, this.constantsService.avActivityCommentGlidingSnowTextcat);
        } else {
          this.bulletin.avActivityCommentTextcat = this.constantsService.avActivityCommentGlidingSnowTextcat;
        }
        break;
      case "favourableSituation":
        if (this.bulletin.avActivityCommentTextcat !== undefined) {
          this.bulletin.avActivityCommentTextcat = this.concatTextcat(this.bulletin.avActivityCommentTextcat, this.constantsService.avActivityCommentFavourableSituationTextcat);
        } else {
          this.bulletin.avActivityCommentTextcat = this.constantsService.avActivityCommentFavourableSituationTextcat;
        }
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
        if (this.bulletin.snowpackStructureCommentTextcat !== undefined) {
          this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(this.bulletin.snowpackStructureCommentTextcat, this.constantsService.snowpackStructureCommentNewSnowTextcat);
        } else {
          this.bulletin.snowpackStructureCommentTextcat = this.constantsService.snowpackStructureCommentNewSnowTextcat;
        }
        break;
      case "windSlab":
        if (this.bulletin.snowpackStructureCommentTextcat !== undefined) {
          this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(this.bulletin.snowpackStructureCommentTextcat, this.constantsService.snowpackStructureCommentWindSlabTextcat);
        } else {
          this.bulletin.snowpackStructureCommentTextcat = this.constantsService.snowpackStructureCommentWindSlabTextcat;
        }
        break;
      case "persistentWeakLayers":
        if (this.bulletin.snowpackStructureCommentTextcat !== undefined) {
          this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(this.bulletin.snowpackStructureCommentTextcat, this.constantsService.snowpackStructureCommentPersistentWeakLayersTextcat);
        } else {
          this.bulletin.snowpackStructureCommentTextcat = this.constantsService.snowpackStructureCommentPersistentWeakLayersTextcat;
        }
        break;
      case "wetSnow":
        if (this.bulletin.snowpackStructureCommentTextcat !== undefined) {
          this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(this.bulletin.snowpackStructureCommentTextcat, this.constantsService.snowpackStructureCommentWetSnowTextcat);
        } else {
          this.bulletin.snowpackStructureCommentTextcat = this.constantsService.snowpackStructureCommentWetSnowTextcat;
        }
        break;
      case "glidingSnow":
        if (this.bulletin.snowpackStructureCommentTextcat !== undefined) {
          this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(this.bulletin.snowpackStructureCommentTextcat, this.constantsService.snowpackStructureCommentGlidingSnowTextcat);
        } else {
          this.bulletin.snowpackStructureCommentTextcat = this.constantsService.snowpackStructureCommentGlidingSnowTextcat;
        }
        break;
      case "favourableSituation":
        if (this.bulletin.snowpackStructureCommentTextcat !== undefined) {
          this.bulletin.snowpackStructureCommentTextcat = this.concatTextcat(this.bulletin.snowpackStructureCommentTextcat, this.constantsService.snowpackStructureCommentFavourableSituationTextcat);
        } else {
          this.bulletin.snowpackStructureCommentTextcat = this.constantsService.snowpackStructureCommentFavourableSituationTextcat;
        }
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
    let daytime;
    if (isAfternoon) {
      daytime = this.bulletin.afternoon;
    } else {
      daytime = this.bulletin.forenoon;
    }
    if (daytime.avalancheProblem5 === undefined) {
      return false;
    } else {
      return true;
    }
  }

  getRegionNames(bulletin): string {
    const regionNames = bulletin.savedRegions.map(
      regionCode => this.regionsService.getRegionName(regionCode)
    );
    return regionNames.join(', ');
  }
}

type TextcatTextfield = 
|"highlights"
|"avActivityHighlights"
|"avActivityComment"
|"snowpackStructureHighlights"
|"snowpackStructureComment"
|"tendencyComment"
|"text"

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