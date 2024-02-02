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

declare var L: any;

@Component({
  selector: "app-avalanche-bulletin",
  templateUrl: "avalanche-bulletin.component.html"
})
export class AvalancheBulletinComponent implements OnInit, OnDestroy {

  @Input() bulletin: BulletinModel;
  @Input() disabled: boolean;
  @Input() isCompactMapLayout: boolean;
  
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

  public activeHighlightsTextcat: string;
  public activeHighlightsDe: string;
  public activeHighlightsIt: string;
  public activeHighlightsEn: string;
  public activeHighlightsFr: string;
  public activeHighlightsEs: string;
  public activeHighlightsCa: string;
  public activeHighlightsOc: string;

  public activeAvActivityHighlightsTextcat: string;
  public activeAvActivityHighlightsDe: string;
  public activeAvActivityHighlightsIt: string;
  public activeAvActivityHighlightsEn: string;
  public activeAvActivityHighlightsFr: string;
  public activeAvActivityHighlightsEs: string;
  public activeAvActivityHighlightsCa: string;
  public activeAvActivityHighlightsOc: string;
  public activeAvActivityHighlightsNotes: string;

  public activeAvActivityCommentTextcat: string;
  public activeAvActivityCommentDe: string;
  public activeAvActivityCommentIt: string;
  public activeAvActivityCommentEn: string;
  public activeAvActivityCommentFr: string;
  public activeAvActivityCommentEs: string;
  public activeAvActivityCommentCa: string;
  public activeAvActivityCommentOc: string;
  public activeAvActivityCommentNotes: string;

  public activeSnowpackStructureHighlightsTextcat: string;
  public activeSnowpackStructureHighlightsDe: string;
  public activeSnowpackStructureHighlightsIt: string;
  public activeSnowpackStructureHighlightsEn: string;
  public activeSnowpackStructureHighlightsFr: string;
  public activeSnowpackStructureHighlightsEs: string;
  public activeSnowpackStructureHighlightsCa: string;
  public activeSnowpackStructureHighlightsOc: string;
  public activeSnowpackStructureHighlightsNotes: string;

  public activeSnowpackStructureCommentTextcat: string;
  public activeSnowpackStructureCommentDe: string;
  public activeSnowpackStructureCommentIt: string;
  public activeSnowpackStructureCommentEn: string;
  public activeSnowpackStructureCommentFr: string;
  public activeSnowpackStructureCommentEs: string;
  public activeSnowpackStructureCommentCa: string;
  public activeSnowpackStructureCommentOc: string;
  public activeSnowpackStructureCommentNotes: string;

  public activeTendencyCommentTextcat: string;
  public activeTendencyCommentDe: string;
  public activeTendencyCommentIt: string;
  public activeTendencyCommentEn: string;
  public activeTendencyCommentFr: string;
  public activeTendencyCommentEs: string;
  public activeTendencyCommentCa: string;
  public activeTendencyCommentOc: string;
  public activeTendencyCommentNotes: string;

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

  public pmUrl: SafeUrl;

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
    this.stopListening = this.renderer.listen("window", "message", this.getText.bind(this));

    // for reload iframe on change language
    this.eventSubscriber = this.settingsService.getChangeEmitter().subscribe(
      () => this.pmUrl = this.getTextcatUrl()
    );

    // setting pm language for iframe
    this.pmUrl = this.getTextcatUrl();

    this.initComponent();
  }

  initComponent() {
    this.activeHighlightsTextcat = this.bulletin.getHighlightsTextcat();
    this.activeHighlightsDe = this.bulletin.getHighlightsIn(Enums.LanguageCode.de);
    this.activeHighlightsIt = this.bulletin.getHighlightsIn(Enums.LanguageCode.it);
    this.activeHighlightsEn = this.bulletin.getHighlightsIn(Enums.LanguageCode.en);
    this.activeHighlightsFr = this.bulletin.getHighlightsIn(Enums.LanguageCode.fr);
    this.activeHighlightsEs = this.bulletin.getHighlightsIn(Enums.LanguageCode.es);
    this.activeHighlightsCa = this.bulletin.getHighlightsIn(Enums.LanguageCode.ca);
    this.activeHighlightsOc = this.bulletin.getHighlightsIn(Enums.LanguageCode.oc);

    this.activeAvActivityHighlightsTextcat = this.bulletin.getAvActivityHighlightsTextcat();
    this.activeAvActivityHighlightsDe = this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.de);
    this.activeAvActivityHighlightsIt = this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.it);
    this.activeAvActivityHighlightsEn = this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.en);
    this.activeAvActivityHighlightsFr = this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.fr);
    this.activeAvActivityHighlightsEs = this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.es);
    this.activeAvActivityHighlightsCa = this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.ca);
    this.activeAvActivityHighlightsOc = this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.oc);
    this.activeAvActivityHighlightsNotes = this.bulletin.getAvActivityHighlightsNotes();

    this.activeAvActivityCommentTextcat = this.bulletin.getAvActivityCommentTextcat();
    this.activeAvActivityCommentDe = this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.de);
    this.activeAvActivityCommentIt = this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.it);
    this.activeAvActivityCommentEn = this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.en);
    this.activeAvActivityCommentFr = this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.fr);
    this.activeAvActivityCommentEs = this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.es);
    this.activeAvActivityCommentCa = this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.ca);
    this.activeAvActivityCommentOc = this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.oc);
    this.activeAvActivityCommentNotes = this.bulletin.getAvActivityCommentNotes();

    this.activeSnowpackStructureHighlightsTextcat = this.bulletin.getSnowpackStructureHighlightsTextcat();
    this.activeSnowpackStructureHighlightsDe = this.bulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.de);
    this.activeSnowpackStructureHighlightsIt = this.bulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.it);
    this.activeSnowpackStructureHighlightsEn = this.bulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.en);
    this.activeSnowpackStructureHighlightsFr = this.bulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.fr);
    this.activeSnowpackStructureHighlightsEs = this.bulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.es);
    this.activeSnowpackStructureHighlightsCa = this.bulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.ca);
    this.activeSnowpackStructureHighlightsOc = this.bulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.oc);
    this.activeSnowpackStructureHighlightsNotes = this.bulletin.getSnowpackStructureHighlightsNotes();

    this.activeSnowpackStructureCommentTextcat = this.bulletin.getSnowpackStructureCommentTextcat();
    this.activeSnowpackStructureCommentDe = this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.de);
    this.activeSnowpackStructureCommentIt = this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.it);
    this.activeSnowpackStructureCommentEn = this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.en);
    this.activeSnowpackStructureCommentFr = this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.fr);
    this.activeSnowpackStructureCommentEs = this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.es);
    this.activeSnowpackStructureCommentCa = this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.ca);
    this.activeSnowpackStructureCommentOc = this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.oc);
    this.activeSnowpackStructureCommentNotes = this.bulletin.getSnowpackStructureCommentNotes();

    this.activeTendencyCommentTextcat = this.bulletin.getTendencyCommentTextcat();
    this.activeTendencyCommentDe = this.bulletin.getTendencyCommentIn(Enums.LanguageCode.de);
    this.activeTendencyCommentIt = this.bulletin.getTendencyCommentIn(Enums.LanguageCode.it);
    this.activeTendencyCommentEn = this.bulletin.getTendencyCommentIn(Enums.LanguageCode.en);
    this.activeTendencyCommentFr = this.bulletin.getTendencyCommentIn(Enums.LanguageCode.fr);
    this.activeTendencyCommentEs = this.bulletin.getTendencyCommentIn(Enums.LanguageCode.es);
    this.activeTendencyCommentCa = this.bulletin.getTendencyCommentIn(Enums.LanguageCode.ca);
    this.activeTendencyCommentOc = this.bulletin.getTendencyCommentIn(Enums.LanguageCode.oc);
    this.activeTendencyCommentNotes = this.bulletin.getTendencyCommentNotes();
  }

  ngOnChanges() {
    this.initComponent();
  }

  ngOnDestroy() {
    this.stopListening();
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

  showDialog(pmData) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = "calc(100% - 10px)";
    dialogConfig.height = "calc(100% - 10px)";
    dialogConfig.maxHeight = "100%";
    dialogConfig.maxWidth = "100%";
    dialogConfig.data = {
      pmUrl: this.pmUrl,
      pmData: pmData
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

  private getTextcatUrl(): SafeUrl {
    // lang
    const l = this.settingsService.getLangString() === "it" ? "it" : "de"; // only de+it are supported
    const r = this.authenticationService.getActiveRegionCode();
    const url = environment.textcatUrl + "?l=" +  l + "&r=" + r;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
    this.setTexts();
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

  private setTexts() {
    if (this.bulletin && !this.disabled) {
      this.bulletin.setHighlightsTextcat(this.activeHighlightsTextcat);
      this.bulletin.setHighlightsIn(this.activeHighlightsDe, Enums.LanguageCode.de);
      this.bulletin.setHighlightsIn(this.activeHighlightsIt, Enums.LanguageCode.it);
      this.bulletin.setHighlightsIn(this.activeHighlightsEn, Enums.LanguageCode.en);
      this.bulletin.setHighlightsIn(this.activeHighlightsFr, Enums.LanguageCode.fr);
      this.bulletin.setHighlightsIn(this.activeHighlightsEs, Enums.LanguageCode.es);
      this.bulletin.setHighlightsIn(this.activeHighlightsCa, Enums.LanguageCode.ca);
      this.bulletin.setHighlightsIn(this.activeHighlightsOc, Enums.LanguageCode.oc);

      this.bulletin.setAvActivityHighlightsTextcat(this.activeAvActivityHighlightsTextcat);
      this.bulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsDe, Enums.LanguageCode.de);
      this.bulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsIt, Enums.LanguageCode.it);
      this.bulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsEn, Enums.LanguageCode.en);
      this.bulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsFr, Enums.LanguageCode.fr);
      this.bulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsEs, Enums.LanguageCode.es);
      this.bulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsCa, Enums.LanguageCode.ca);
      this.bulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsOc, Enums.LanguageCode.oc);
      this.bulletin.setAvActivityHighlightsNotes(this.activeAvActivityHighlightsNotes);

      this.bulletin.setAvActivityCommentTextcat(this.activeAvActivityCommentTextcat);
      this.bulletin.setAvActivityCommentIn(this.activeAvActivityCommentDe, Enums.LanguageCode.de);
      this.bulletin.setAvActivityCommentIn(this.activeAvActivityCommentIt, Enums.LanguageCode.it);
      this.bulletin.setAvActivityCommentIn(this.activeAvActivityCommentEn, Enums.LanguageCode.en);
      this.bulletin.setAvActivityCommentIn(this.activeAvActivityCommentFr, Enums.LanguageCode.fr);
      this.bulletin.setAvActivityCommentIn(this.activeAvActivityCommentEs, Enums.LanguageCode.es);
      this.bulletin.setAvActivityCommentIn(this.activeAvActivityCommentCa, Enums.LanguageCode.ca);
      this.bulletin.setAvActivityCommentIn(this.activeAvActivityCommentOc, Enums.LanguageCode.oc);
      this.bulletin.setAvActivityCommentNotes(this.activeAvActivityCommentNotes);

      this.bulletin.setSnowpackStructureHighlightsTextcat(this.activeSnowpackStructureHighlightsTextcat);
      this.bulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsDe, Enums.LanguageCode.de);
      this.bulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsIt, Enums.LanguageCode.it);
      this.bulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsEn, Enums.LanguageCode.en);
      this.bulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsFr, Enums.LanguageCode.fr);
      this.bulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsEs, Enums.LanguageCode.es);
      this.bulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsCa, Enums.LanguageCode.ca);
      this.bulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsOc, Enums.LanguageCode.oc);
      this.bulletin.setSnowpackStructureHighlightsNotes(this.activeSnowpackStructureHighlightsNotes);

      this.bulletin.setSnowpackStructureCommentTextcat(this.activeSnowpackStructureCommentTextcat);
      this.bulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentDe, Enums.LanguageCode.de);
      this.bulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentIt, Enums.LanguageCode.it);
      this.bulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentEn, Enums.LanguageCode.en);
      this.bulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentFr, Enums.LanguageCode.fr);
      this.bulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentEs, Enums.LanguageCode.es);
      this.bulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentCa, Enums.LanguageCode.ca);
      this.bulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentOc, Enums.LanguageCode.oc);
      this.bulletin.setSnowpackStructureCommentNotes(this.activeSnowpackStructureCommentNotes);

      this.bulletin.setTendencyCommentTextcat(this.activeTendencyCommentTextcat);
      this.bulletin.setTendencyCommentIn(this.activeTendencyCommentDe, Enums.LanguageCode.de);
      this.bulletin.setTendencyCommentIn(this.activeTendencyCommentIt, Enums.LanguageCode.it);
      this.bulletin.setTendencyCommentIn(this.activeTendencyCommentEn, Enums.LanguageCode.en);
      this.bulletin.setTendencyCommentIn(this.activeTendencyCommentFr, Enums.LanguageCode.fr);
      this.bulletin.setTendencyCommentIn(this.activeTendencyCommentEs, Enums.LanguageCode.es);
      this.bulletin.setTendencyCommentIn(this.activeTendencyCommentCa, Enums.LanguageCode.ca);
      this.bulletin.setTendencyCommentIn(this.activeTendencyCommentOc, Enums.LanguageCode.oc);
      this.bulletin.setTendencyCommentNotes(this.activeTendencyCommentNotes);

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

  openTextcat($event: Event, field: TextcatTextfield, l, textDef: string) {
    this.copyService.resetCopyTextcat();
    $event.preventDefault();

    // make Json to send to pm
    const pmData = JSON.stringify({
      textField: field,
      textDef: textDef || "",
      currentLang: this.translateService.currentLang,
      region: this.authenticationService.getTextcatRegionCode()
    } satisfies TextcatLegacyIn);

    this.showDialog(pmData);
  }

  copyTextcat(event, field) {
    this.setTexts();
    switch (field) {
      case "highlights":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.bulletin.getHighlightsTextcat());
        this.copyService.setTextDe(this.bulletin.getHighlightsIn(Enums.LanguageCode.de));
        this.copyService.setTextIt(this.bulletin.getHighlightsIn(Enums.LanguageCode.it));
        this.copyService.setTextEn(this.bulletin.getHighlightsIn(Enums.LanguageCode.en));
        this.copyService.setTextFr(this.bulletin.getHighlightsIn(Enums.LanguageCode.fr));
        this.copyService.setTextEs(this.bulletin.getHighlightsIn(Enums.LanguageCode.es));
        this.copyService.setTextCa(this.bulletin.getHighlightsIn(Enums.LanguageCode.ca));
        this.copyService.setTextOc(this.bulletin.getHighlightsIn(Enums.LanguageCode.oc));
        break;
      case "avActivityHighlights":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.bulletin.getAvActivityHighlightsTextcat());
        this.copyService.setTextDe(this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.de));
        this.copyService.setTextIt(this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.it));
        this.copyService.setTextEn(this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.en));
        this.copyService.setTextFr(this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.fr));
        this.copyService.setTextEs(this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.es));
        this.copyService.setTextCa(this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.ca));
        this.copyService.setTextOc(this.bulletin.getAvActivityHighlightsIn(Enums.LanguageCode.oc));
        break;
      case "avActivityComment":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.bulletin.getAvActivityCommentTextcat());
        this.copyService.setTextDe(this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.de));
        this.copyService.setTextIt(this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.it));
        this.copyService.setTextEn(this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.en));
        this.copyService.setTextFr(this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.fr));
        this.copyService.setTextEs(this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.es));
        this.copyService.setTextCa(this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.ca));
        this.copyService.setTextOc(this.bulletin.getAvActivityCommentIn(Enums.LanguageCode.oc));
        break;
      case "snowpackStructureComment":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.bulletin.getSnowpackStructureCommentTextcat());
        this.copyService.setTextDe(this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.de));
        this.copyService.setTextIt(this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.it));
        this.copyService.setTextEn(this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.en));
        this.copyService.setTextFr(this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.fr));
        this.copyService.setTextEs(this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.es));
        this.copyService.setTextCa(this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.ca));
        this.copyService.setTextOc(this.bulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.oc));
        break;
      case "tendencyComment":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.bulletin.getTendencyCommentTextcat());
        this.copyService.setTextDe(this.bulletin.getTendencyCommentIn(Enums.LanguageCode.de));
        this.copyService.setTextIt(this.bulletin.getTendencyCommentIn(Enums.LanguageCode.it));
        this.copyService.setTextEn(this.bulletin.getTendencyCommentIn(Enums.LanguageCode.en));
        this.copyService.setTextFr(this.bulletin.getTendencyCommentIn(Enums.LanguageCode.fr));
        this.copyService.setTextEs(this.bulletin.getTendencyCommentIn(Enums.LanguageCode.es));
        this.copyService.setTextCa(this.bulletin.getTendencyCommentIn(Enums.LanguageCode.ca));
        this.copyService.setTextOc(this.bulletin.getTendencyCommentIn(Enums.LanguageCode.oc));
        break;
      default:
        break;
    }
  }

  concatTextcat(text1, text2) {
    return text1.slice(0, -1).concat(",", text2.substring(1));
  }

  pasteTextcat(event, field) {
    switch (field) {
      case "highlights":
        if (this.activeHighlightsTextcat !== undefined) {
          this.activeHighlightsTextcat = this.concatTextcat(this.activeHighlightsTextcat, this.copyService.getTextTextcat());
        } else {
          this.activeHighlightsTextcat = this.copyService.getTextTextcat();
        }
        if (this.activeHighlightsDe !== undefined) {
          this.activeHighlightsDe = this.activeHighlightsDe + " " + this.copyService.getTextDe();
        } else {
          this.activeHighlightsDe = this.copyService.getTextDe();
        }
        if (this.activeHighlightsIt !== undefined) {
          this.activeHighlightsIt = this.activeHighlightsIt + " " + this.copyService.getTextIt();
        } else {
          this.activeHighlightsIt = this.copyService.getTextIt();
        }
        if (this.activeHighlightsEn !== undefined) {
          this.activeHighlightsEn = this.activeHighlightsEn + " " + this.copyService.getTextEn();
        } else {
          this.activeHighlightsEn = this.copyService.getTextEn();
        }
        if (this.activeHighlightsFr !== undefined) {
          this.activeHighlightsFr = this.activeHighlightsFr + " " + this.copyService.getTextFr();
        } else {
          this.activeHighlightsFr = this.copyService.getTextFr();
        }
        if (this.activeHighlightsEs !== undefined) {
          this.activeHighlightsEs = this.activeHighlightsEs + " " + this.copyService.getTextEs();
        } else {
          this.activeHighlightsEs = this.copyService.getTextEs();
        }
        if (this.activeHighlightsCa !== undefined) {
          this.activeHighlightsCa = this.activeHighlightsCa + " " + this.copyService.getTextCa();
        } else {
          this.activeHighlightsCa = this.copyService.getTextCa();
        }
        if (this.activeHighlightsOc !== undefined) {
          this.activeHighlightsOc = this.activeHighlightsOc + " " + this.copyService.getTextOc();
        } else {
          this.activeHighlightsOc = this.copyService.getTextOc();
        }
        break;
      case "avActivityHighlights":
        if (this.activeAvActivityHighlightsTextcat !== undefined) {
          this.activeAvActivityHighlightsTextcat = this.concatTextcat(this.activeAvActivityHighlightsTextcat, this.copyService.getTextTextcat());
        } else {
          this.activeAvActivityHighlightsTextcat = this.copyService.getTextTextcat();
        }
        if (this.activeAvActivityHighlightsDe !== undefined) {
          this.activeAvActivityHighlightsDe = this.activeAvActivityHighlightsDe + " " + this.copyService.getTextDe();
        } else {
          this.activeAvActivityHighlightsDe = this.copyService.getTextDe();
        }
        if (this.activeAvActivityHighlightsIt !== undefined) {
          this.activeAvActivityHighlightsIt = this.activeAvActivityHighlightsIt + " " + this.copyService.getTextIt();
        } else {
          this.activeAvActivityHighlightsIt = this.copyService.getTextIt();
        }
        if (this.activeAvActivityHighlightsEn !== undefined) {
          this.activeAvActivityHighlightsEn = this.activeAvActivityHighlightsEn + " " + this.copyService.getTextEn();
        } else {
          this.activeAvActivityHighlightsEn = this.copyService.getTextEn();
        }
        if (this.activeAvActivityHighlightsFr !== undefined) {
          this.activeAvActivityHighlightsFr = this.activeAvActivityHighlightsFr + " " + this.copyService.getTextFr();
        } else {
          this.activeAvActivityHighlightsFr = this.copyService.getTextFr();
        }
        if (this.activeAvActivityHighlightsEs !== undefined) {
          this.activeAvActivityHighlightsEs = this.activeAvActivityHighlightsEs + " " + this.copyService.getTextEs();
        } else {
          this.activeAvActivityHighlightsEs = this.copyService.getTextEs();
        }
        if (this.activeAvActivityHighlightsCa !== undefined) {
          this.activeAvActivityHighlightsCa = this.activeAvActivityHighlightsCa + " " + this.copyService.getTextCa();
        } else {
          this.activeAvActivityHighlightsCa = this.copyService.getTextCa();
        }
        if (this.activeAvActivityHighlightsOc !== undefined) {
          this.activeAvActivityHighlightsOc = this.activeAvActivityHighlightsOc + " " + this.copyService.getTextOc();
        } else {
          this.activeAvActivityHighlightsOc = this.copyService.getTextOc();
        }
        break;
      case "avActivityComment":
        if (this.activeAvActivityCommentTextcat !== undefined) {
          this.activeAvActivityCommentTextcat = this.concatTextcat(this.activeAvActivityCommentTextcat, this.copyService.getTextTextcat());
        } else {
          this.activeAvActivityCommentTextcat = this.copyService.getTextTextcat();
        }
        if (this.activeAvActivityCommentDe !== undefined) {
          this.activeAvActivityCommentDe = this.activeAvActivityCommentDe + " " + this.copyService.getTextDe();
        } else {
          this.activeAvActivityCommentDe = this.copyService.getTextDe();
        }
        if (this.activeAvActivityCommentIt !== undefined) {
          this.activeAvActivityCommentIt = this.activeAvActivityCommentIt + " " + this.copyService.getTextIt();
        } else {
          this.activeAvActivityCommentIt = this.copyService.getTextIt();
        }
        if (this.activeAvActivityCommentEn !== undefined) {
          this.activeAvActivityCommentEn = this.activeAvActivityCommentEn + " " + this.copyService.getTextEn();
        } else {
          this.activeAvActivityCommentEn = this.copyService.getTextEn();
        }
        if (this.activeAvActivityCommentFr !== undefined) {
          this.activeAvActivityCommentFr = this.activeAvActivityCommentFr + " " + this.copyService.getTextFr();
        } else {
          this.activeAvActivityCommentFr = this.copyService.getTextFr();
        }
        if (this.activeAvActivityCommentEs !== undefined) {
          this.activeAvActivityCommentEs = this.activeAvActivityCommentEs + " " + this.copyService.getTextEs();
        } else {
          this.activeAvActivityCommentEs = this.copyService.getTextEs();
        }
        if (this.activeAvActivityCommentCa !== undefined) {
          this.activeAvActivityCommentCa = this.activeAvActivityCommentCa + " " + this.copyService.getTextCa();
        } else {
          this.activeAvActivityCommentCa = this.copyService.getTextCa();
        }
        if (this.activeAvActivityCommentOc !== undefined) {
          this.activeAvActivityCommentOc = this.activeAvActivityCommentOc + " " + this.copyService.getTextOc();
        } else {
          this.activeAvActivityCommentOc = this.copyService.getTextOc();
        }
        break;
      case "snowpackStructureComment":
        if (this.activeSnowpackStructureCommentTextcat !== undefined) {
          this.activeSnowpackStructureCommentTextcat = this.concatTextcat(this.activeSnowpackStructureCommentTextcat, this.copyService.getTextTextcat());
        } else {
          this.activeSnowpackStructureCommentTextcat = this.copyService.getTextTextcat();
        }
        if (this.activeSnowpackStructureCommentDe !== undefined) {
          this.activeSnowpackStructureCommentDe = this.activeSnowpackStructureCommentDe + " " + this.copyService.getTextDe();
        } else {
          this.activeSnowpackStructureCommentDe = this.copyService.getTextDe();
        }
        if (this.activeSnowpackStructureCommentIt !== undefined) {
          this.activeSnowpackStructureCommentIt = this.activeSnowpackStructureCommentIt + " " + this.copyService.getTextIt();
        } else {
          this.activeSnowpackStructureCommentIt = this.copyService.getTextIt();
        }
        if (this.activeSnowpackStructureCommentEn !== undefined) {
          this.activeSnowpackStructureCommentEn = this.activeSnowpackStructureCommentEn + " " + this.copyService.getTextEn();
        } else {
          this.activeSnowpackStructureCommentEn = this.copyService.getTextEn();
        }
        if (this.activeSnowpackStructureCommentFr !== undefined) {
          this.activeSnowpackStructureCommentFr = this.activeSnowpackStructureCommentFr + " " + this.copyService.getTextFr();
        } else {
          this.activeSnowpackStructureCommentFr = this.copyService.getTextFr();
        }
        if (this.activeSnowpackStructureCommentEs !== undefined) {
          this.activeSnowpackStructureCommentEs = this.activeSnowpackStructureCommentEs + " " + this.copyService.getTextEs();
        } else {
          this.activeSnowpackStructureCommentEs = this.copyService.getTextEs();
        }
        if (this.activeSnowpackStructureCommentCa !== undefined) {
          this.activeSnowpackStructureCommentCa = this.activeSnowpackStructureCommentCa + " " + this.copyService.getTextCa();
        } else {
          this.activeSnowpackStructureCommentCa = this.copyService.getTextCa();
        }
        if (this.activeSnowpackStructureCommentOc !== undefined) {
          this.activeSnowpackStructureCommentOc = this.activeSnowpackStructureCommentOc + " " + this.copyService.getTextOc();
        } else {
          this.activeSnowpackStructureCommentOc = this.copyService.getTextOc();
        }
        break;
      case "tendencyComment":
        if (this.activeTendencyCommentTextcat !== undefined) {
          this.activeTendencyCommentTextcat = this.concatTextcat(this.activeTendencyCommentTextcat, this.copyService.getTextTextcat());
        } else {
          this.activeTendencyCommentTextcat = this.copyService.getTextTextcat();
        }
        if (this.activeTendencyCommentDe !== undefined) {
          this.activeTendencyCommentDe = this.activeTendencyCommentDe + " " + this.copyService.getTextDe();
        } else {
          this.activeTendencyCommentDe = this.copyService.getTextDe();
        }
        if (this.activeTendencyCommentIt !== undefined) {
          this.activeTendencyCommentIt = this.activeTendencyCommentIt + " " + this.copyService.getTextIt();
        } else {
          this.activeTendencyCommentIt = this.copyService.getTextIt();
        }
        if (this.activeTendencyCommentEn !== undefined) {
          this.activeTendencyCommentEn = this.activeTendencyCommentEn + " " + this.copyService.getTextEn();
        } else {
          this.activeTendencyCommentEn = this.copyService.getTextEn();
        }
        if (this.activeTendencyCommentFr !== undefined) {
          this.activeTendencyCommentFr = this.activeTendencyCommentFr + " " + this.copyService.getTextFr();
        } else {
          this.activeTendencyCommentFr = this.copyService.getTextFr();
        }
        if (this.activeTendencyCommentEs !== undefined) {
          this.activeTendencyCommentEs = this.activeTendencyCommentEs + " " + this.copyService.getTextEs();
        } else {
          this.activeTendencyCommentEs = this.copyService.getTextEs();
        }
        if (this.activeTendencyCommentCa !== undefined) {
          this.activeTendencyCommentCa = this.activeTendencyCommentCa + " " + this.copyService.getTextCa();
        } else {
          this.activeTendencyCommentCa = this.copyService.getTextCa();
        }
        if (this.activeTendencyCommentOc !== undefined) {
          this.activeTendencyCommentOc = this.activeTendencyCommentOc + " " + this.copyService.getTextOc();
        } else {
          this.activeTendencyCommentOc = this.copyService.getTextOc();
        }
        break;
      default:
        break;
    }
    this.copyService.resetCopyTextcat();
    this.setTexts();
  }

  deleteTextcat(event, field) {
    switch (field) {
      case "highlights":
        this.activeHighlightsTextcat = undefined;
        this.activeHighlightsDe = undefined;
        this.activeHighlightsIt = undefined;
        this.activeHighlightsEn = undefined;
        this.activeHighlightsFr = undefined;
        this.activeHighlightsEs = undefined;
        this.activeHighlightsCa = undefined;
        this.activeHighlightsOc = undefined;
        break;
      case "avActivityHighlights":
        this.activeAvActivityHighlightsTextcat = undefined;
        this.activeAvActivityHighlightsDe = undefined;
        this.activeAvActivityHighlightsIt = undefined;
        this.activeAvActivityHighlightsEn = undefined;
        this.activeAvActivityHighlightsFr = undefined;
        this.activeAvActivityHighlightsEs = undefined;
        this.activeAvActivityHighlightsCa = undefined;
        this.activeAvActivityHighlightsOc = undefined;
        break;
      case "avActivityComment":
        this.activeAvActivityCommentTextcat = undefined;
        this.activeAvActivityCommentDe = undefined;
        this.activeAvActivityCommentIt = undefined;
        this.activeAvActivityCommentEn = undefined;
        this.activeAvActivityCommentFr = undefined;
        this.activeAvActivityCommentEs = undefined;
        this.activeAvActivityCommentCa = undefined;
        this.activeAvActivityCommentOc = undefined;
        break;
      case "snowpackStructureComment":
        this.activeSnowpackStructureCommentTextcat = undefined;
        this.activeSnowpackStructureCommentDe = undefined;
        this.activeSnowpackStructureCommentIt = undefined;
        this.activeSnowpackStructureCommentEn = undefined;
        this.activeSnowpackStructureCommentFr = undefined;
        this.activeSnowpackStructureCommentEs = undefined;
        this.activeSnowpackStructureCommentCa = undefined;
        this.activeSnowpackStructureCommentOc = undefined;
        break;
      case "tendencyComment":
        this.activeTendencyCommentTextcat = undefined;
        this.activeTendencyCommentDe = undefined;
        this.activeTendencyCommentIt = undefined;
        this.activeTendencyCommentEn = undefined;
        this.activeTendencyCommentFr = undefined;
        this.activeTendencyCommentEs = undefined;
        this.activeTendencyCommentCa = undefined;
        this.activeTendencyCommentOc = undefined;
        break;
      default:
        break;
    }
    this.setTexts();
  }

  getText(e) {
    e.preventDefault();
    if (e.data.type !== "webpackInvalid" && e.data.type !== "webpackOk" && e.data.source !== "react-devtools-content-script") {
      const pmData: TextcatLegacyOut = JSON.parse(e.data);

      if (pmData.textDef === undefined || pmData.textDef === "") {
        this[pmData.textField + "Textcat"] = "";
        this[pmData.textField + "It"] = undefined;
        this[pmData.textField + "De"] = undefined;
        this[pmData.textField + "En"] = undefined;
        this[pmData.textField + "Fr"] = undefined;
        this[pmData.textField + "Es"] = undefined;
        this[pmData.textField + "Ca"] = undefined;
        this[pmData.textField + "Oc"] = undefined;
        this.setTexts();
        this.hideDialog();
      } else {
        this[pmData.textField + "Textcat"] = pmData.textDef;
        this[pmData.textField + "It"] = pmData.textIt;
        this[pmData.textField + "De"] = pmData.textDe_AT;
        this[pmData.textField + "En"] = pmData.textEn;
        this[pmData.textField + "Fr"] = pmData.textFr;
        this[pmData.textField + "Es"] = pmData.textEs;
        this[pmData.textField + "Ca"] = pmData.textCa;
        this[pmData.textField + "Oc"] = pmData.textOc;
        this.setTexts();
        this.hideDialog();
      }
      if (this.bulletin !== null && this.bulletin !== undefined) {
        this.updateBulletinOnServer();
      }
    }
  };

  openLoadAvActivityCommentExampleTextModal(template: TemplateRef<any>) {
    this.loadAvActivityCommentExampleTextModalRef = this.modalService.show(template, this.config);
  }

  loadAvActivityCommentExampleText(avalancheProblem) {
    switch (avalancheProblem) {
      case "newSnow":
        if (this.activeAvActivityCommentTextcat !== undefined) {
          this.activeAvActivityCommentTextcat = this.activeAvActivityCommentTextcat + "." + this.constantsService.avActivityCommentNewSnowTextcat;
        } else {
          this.activeAvActivityCommentTextcat = this.constantsService.avActivityCommentNewSnowTextcat;
        }
        if (this.activeAvActivityCommentDe !== undefined) {
          this.activeAvActivityCommentDe = this.activeAvActivityCommentDe + " " + this.constantsService.avActivityCommentNewSnowDe;
        } else {
          this.activeAvActivityCommentDe = this.constantsService.avActivityCommentNewSnowDe;
        }
        if (this.activeAvActivityCommentIt !== undefined) {
          this.activeAvActivityCommentIt = this.activeAvActivityCommentIt + " " + this.constantsService.avActivityCommentNewSnowIt;
        } else {
          this.activeAvActivityCommentIt = this.constantsService.avActivityCommentNewSnowIt;
        }
        if (this.activeAvActivityCommentEn !== undefined) {
          this.activeAvActivityCommentEn = this.activeAvActivityCommentEn + " " + this.constantsService.avActivityCommentNewSnowEn;
        } else {
          this.activeAvActivityCommentEn = this.constantsService.avActivityCommentNewSnowEn;
        }
        if (this.activeAvActivityCommentFr !== undefined) {
          this.activeAvActivityCommentFr = this.activeAvActivityCommentFr + " " + this.constantsService.avActivityCommentNewSnowFr;
        } else {
          this.activeAvActivityCommentFr = this.constantsService.avActivityCommentNewSnowFr;
        }
        if (this.activeAvActivityCommentEs !== undefined) {
          this.activeAvActivityCommentEs = this.activeAvActivityCommentEs + " " + this.constantsService.avActivityCommentNewSnowEs;
        } else {
          this.activeAvActivityCommentEs = this.constantsService.avActivityCommentNewSnowEs;
        }
        if (this.activeAvActivityCommentCa !== undefined) {
          this.activeAvActivityCommentCa = this.activeAvActivityCommentCa + " " + this.constantsService.avActivityCommentNewSnowCa;
        } else {
          this.activeAvActivityCommentCa = this.constantsService.avActivityCommentNewSnowCa;
        }
        if (this.activeAvActivityCommentOc !== undefined) {
          this.activeAvActivityCommentOc = this.activeAvActivityCommentOc + " " + this.constantsService.avActivityCommentNewSnowOc;
        } else {
          this.activeAvActivityCommentOc = this.constantsService.avActivityCommentNewSnowOc;
        }
        break;
      case "windSlab":
        if (this.activeAvActivityCommentTextcat !== undefined) {
          this.activeAvActivityCommentTextcat = this.activeAvActivityCommentTextcat + "." + this.constantsService.avActivityCommentWindSlabTextcat;
        } else {
          this.activeAvActivityCommentTextcat = this.constantsService.avActivityCommentWindSlabTextcat;
        }
        if (this.activeAvActivityCommentDe !== undefined) {
          this.activeAvActivityCommentDe = this.activeAvActivityCommentDe + " " + this.constantsService.avActivityCommentWindSlabDe;
        } else {
          this.activeAvActivityCommentDe = this.constantsService.avActivityCommentWindSlabDe;
        }
        if (this.activeAvActivityCommentIt !== undefined) {
          this.activeAvActivityCommentIt = this.activeAvActivityCommentIt + " " + this.constantsService.avActivityCommentWindSlabIt;
        } else {
          this.activeAvActivityCommentIt = this.constantsService.avActivityCommentWindSlabIt;
        }
        if (this.activeAvActivityCommentEn !== undefined) {
          this.activeAvActivityCommentEn = this.activeAvActivityCommentEn + " " + this.constantsService.avActivityCommentWindSlabEn;
        } else {
          this.activeAvActivityCommentEn = this.constantsService.avActivityCommentWindSlabEn;
        }
        if (this.activeAvActivityCommentFr !== undefined) {
          this.activeAvActivityCommentFr = this.activeAvActivityCommentFr + " " + this.constantsService.avActivityCommentWindSlabFr;
        } else {
          this.activeAvActivityCommentFr = this.constantsService.avActivityCommentWindSlabFr;
        }
        if (this.activeAvActivityCommentEs !== undefined) {
          this.activeAvActivityCommentEs = this.activeAvActivityCommentEs + " " + this.constantsService.avActivityCommentWindSlabEs;
        } else {
          this.activeAvActivityCommentEs = this.constantsService.avActivityCommentWindSlabEs;
        }
        if (this.activeAvActivityCommentCa !== undefined) {
          this.activeAvActivityCommentCa = this.activeAvActivityCommentCa + " " + this.constantsService.avActivityCommentWindSlabCa;
        } else {
          this.activeAvActivityCommentCa = this.constantsService.avActivityCommentWindSlabCa;
        }
        if (this.activeAvActivityCommentOc !== undefined) {
          this.activeAvActivityCommentOc = this.activeAvActivityCommentOc + " " + this.constantsService.avActivityCommentWindSlabOc;
        } else {
          this.activeAvActivityCommentOc = this.constantsService.avActivityCommentWindSlabOc;
        }
        break;
      case "persistentWeakLayers":
        if (this.activeAvActivityCommentTextcat !== undefined) {
          this.activeAvActivityCommentTextcat = this.activeAvActivityCommentTextcat + "." + this.constantsService.avActivityCommentPersistentWeakLayersTextcat;
        } else {
          this.activeAvActivityCommentTextcat = this.constantsService.avActivityCommentPersistentWeakLayersTextcat;
        }
        if (this.activeAvActivityCommentDe !== undefined) {
          this.activeAvActivityCommentDe = this.activeAvActivityCommentDe + " " + this.constantsService.avActivityCommentPersistentWeakLayersDe;
        } else {
          this.activeAvActivityCommentDe = this.constantsService.avActivityCommentPersistentWeakLayersDe;
        }
        if (this.activeAvActivityCommentIt !== undefined) {
          this.activeAvActivityCommentIt = this.activeAvActivityCommentIt + " " + this.constantsService.avActivityCommentPersistentWeakLayersIt;
        } else {
          this.activeAvActivityCommentIt = this.constantsService.avActivityCommentPersistentWeakLayersIt;
        }
        if (this.activeAvActivityCommentEn !== undefined) {
          this.activeAvActivityCommentEn = this.activeAvActivityCommentEn + " " + this.constantsService.avActivityCommentPersistentWeakLayersEn;
        } else {
          this.activeAvActivityCommentEn = this.constantsService.avActivityCommentPersistentWeakLayersEn;
        }
        if (this.activeAvActivityCommentFr !== undefined) {
          this.activeAvActivityCommentFr = this.activeAvActivityCommentFr + " " + this.constantsService.avActivityCommentPersistentWeakLayersFr;
        } else {
          this.activeAvActivityCommentFr = this.constantsService.avActivityCommentPersistentWeakLayersFr;
        }
        if (this.activeAvActivityCommentEs !== undefined) {
          this.activeAvActivityCommentEs = this.activeAvActivityCommentEs + " " + this.constantsService.avActivityCommentPersistentWeakLayersEs;
        } else {
          this.activeAvActivityCommentEs = this.constantsService.avActivityCommentPersistentWeakLayersEs;
        }
        if (this.activeAvActivityCommentCa !== undefined) {
          this.activeAvActivityCommentCa = this.activeAvActivityCommentCa + " " + this.constantsService.avActivityCommentPersistentWeakLayersCa;
        } else {
          this.activeAvActivityCommentCa = this.constantsService.avActivityCommentPersistentWeakLayersCa;
        }
        if (this.activeAvActivityCommentOc !== undefined) {
          this.activeAvActivityCommentOc = this.activeAvActivityCommentOc + " " + this.constantsService.avActivityCommentPersistentWeakLayersOc;
        } else {
          this.activeAvActivityCommentOc = this.constantsService.avActivityCommentPersistentWeakLayersOc;
        }
        break;
      case "wetSnow":
        if (this.activeAvActivityCommentTextcat !== undefined) {
          this.activeAvActivityCommentTextcat = this.activeAvActivityCommentTextcat + "." + this.constantsService.avActivityCommentWetSnowTextcat;
        } else {
          this.activeAvActivityCommentTextcat = this.constantsService.avActivityCommentWetSnowTextcat;
        }
        if (this.activeAvActivityCommentDe !== undefined) {
          this.activeAvActivityCommentDe = this.activeAvActivityCommentDe + " " + this.constantsService.avActivityCommentWetSnowDe;
        } else {
          this.activeAvActivityCommentDe = this.constantsService.avActivityCommentWetSnowDe;
        }
        if (this.activeAvActivityCommentIt !== undefined) {
          this.activeAvActivityCommentIt = this.activeAvActivityCommentIt + " " + this.constantsService.avActivityCommentWetSnowIt;
        } else {
          this.activeAvActivityCommentIt = this.constantsService.avActivityCommentWetSnowIt;
        }
        if (this.activeAvActivityCommentEn !== undefined) {
          this.activeAvActivityCommentEn = this.activeAvActivityCommentEn + " " + this.constantsService.avActivityCommentWetSnowEn;
        } else {
          this.activeAvActivityCommentEn = this.constantsService.avActivityCommentWetSnowEn;
        }
        if (this.activeAvActivityCommentFr !== undefined) {
          this.activeAvActivityCommentFr = this.activeAvActivityCommentFr + " " + this.constantsService.avActivityCommentWetSnowFr;
        } else {
          this.activeAvActivityCommentFr = this.constantsService.avActivityCommentWetSnowFr;
        }
        if (this.activeAvActivityCommentEs !== undefined) {
          this.activeAvActivityCommentEs = this.activeAvActivityCommentEs + " " + this.constantsService.avActivityCommentWetSnowEs;
        } else {
          this.activeAvActivityCommentEs = this.constantsService.avActivityCommentWetSnowEs;
        }
        if (this.activeAvActivityCommentCa !== undefined) {
          this.activeAvActivityCommentCa = this.activeAvActivityCommentCa + " " + this.constantsService.avActivityCommentWetSnowCa;
        } else {
          this.activeAvActivityCommentCa = this.constantsService.avActivityCommentWetSnowCa;
        }
        if (this.activeAvActivityCommentOc !== undefined) {
          this.activeAvActivityCommentOc = this.activeAvActivityCommentOc + " " + this.constantsService.avActivityCommentWetSnowOc;
        } else {
          this.activeAvActivityCommentOc = this.constantsService.avActivityCommentWetSnowOc;
        }
        break;
      case "glidingSnow":
        if (this.activeAvActivityCommentTextcat !== undefined) {
          this.activeAvActivityCommentTextcat = this.activeAvActivityCommentTextcat + "." + this.constantsService.avActivityCommentGlidingSnowTextcat;
        } else {
          this.activeAvActivityCommentTextcat = this.constantsService.avActivityCommentGlidingSnowTextcat;
        }
        if (this.activeAvActivityCommentDe !== undefined) {
          this.activeAvActivityCommentDe = this.activeAvActivityCommentDe + " " + this.constantsService.avActivityCommentGlidingSnowDe;
        } else {
          this.activeAvActivityCommentDe = this.constantsService.avActivityCommentGlidingSnowDe;
        }
        if (this.activeAvActivityCommentIt !== undefined) {
          this.activeAvActivityCommentIt = this.activeAvActivityCommentIt + " " + this.constantsService.avActivityCommentGlidingSnowIt;
        } else {
          this.activeAvActivityCommentIt = this.constantsService.avActivityCommentGlidingSnowIt;
        }
        if (this.activeAvActivityCommentEn !== undefined) {
          this.activeAvActivityCommentEn = this.activeAvActivityCommentEn + " " + this.constantsService.avActivityCommentGlidingSnowEn;
        } else {
          this.activeAvActivityCommentEn = this.constantsService.avActivityCommentGlidingSnowEn;
        }
        if (this.activeAvActivityCommentFr !== undefined) {
          this.activeAvActivityCommentFr = this.activeAvActivityCommentFr + " " + this.constantsService.avActivityCommentGlidingSnowFr;
        } else {
          this.activeAvActivityCommentFr = this.constantsService.avActivityCommentGlidingSnowFr;
        }
        if (this.activeAvActivityCommentEs !== undefined) {
          this.activeAvActivityCommentEs = this.activeAvActivityCommentEs + " " + this.constantsService.avActivityCommentGlidingSnowEs;
        } else {
          this.activeAvActivityCommentEs = this.constantsService.avActivityCommentGlidingSnowEs;
        }
        if (this.activeAvActivityCommentCa !== undefined) {
          this.activeAvActivityCommentCa = this.activeAvActivityCommentCa + " " + this.constantsService.avActivityCommentGlidingSnowCa;
        } else {
          this.activeAvActivityCommentCa = this.constantsService.avActivityCommentGlidingSnowCa;
        }
        if (this.activeAvActivityCommentOc !== undefined) {
          this.activeAvActivityCommentOc = this.activeAvActivityCommentOc + " " + this.constantsService.avActivityCommentGlidingSnowOc;
        } else {
          this.activeAvActivityCommentOc = this.constantsService.avActivityCommentGlidingSnowOc;
        }
        break;
      case "favourableSituation":
        if (this.activeAvActivityCommentTextcat !== undefined) {
          this.activeAvActivityCommentTextcat = this.activeAvActivityCommentTextcat + "." + this.constantsService.avActivityCommentFavourableSituationTextcat;
        } else {
          this.activeAvActivityCommentTextcat = this.constantsService.avActivityCommentFavourableSituationTextcat;
        }
        if (this.activeAvActivityCommentDe !== undefined) {
          this.activeAvActivityCommentDe = this.activeAvActivityCommentDe + " " + this.constantsService.avActivityCommentFavourableSituationDe;
        } else {
          this.activeAvActivityCommentDe = this.constantsService.avActivityCommentFavourableSituationDe;
        }
        if (this.activeAvActivityCommentIt !== undefined) {
          this.activeAvActivityCommentIt = this.activeAvActivityCommentIt + " " + this.constantsService.avActivityCommentFavourableSituationIt;
        } else {
          this.activeAvActivityCommentIt = this.constantsService.avActivityCommentFavourableSituationIt;
        }
        if (this.activeAvActivityCommentEn !== undefined) {
          this.activeAvActivityCommentEn = this.activeAvActivityCommentEn + " " + this.constantsService.avActivityCommentFavourableSituationEn;
        } else {
          this.activeAvActivityCommentEn = this.constantsService.avActivityCommentFavourableSituationEn;
        }
        if (this.activeAvActivityCommentFr !== undefined) {
          this.activeAvActivityCommentFr = this.activeAvActivityCommentFr + " " + this.constantsService.avActivityCommentFavourableSituationFr;
        } else {
          this.activeAvActivityCommentFr = this.constantsService.avActivityCommentFavourableSituationFr;
        }
        if (this.activeAvActivityCommentEs !== undefined) {
          this.activeAvActivityCommentEs = this.activeAvActivityCommentEs + " " + this.constantsService.avActivityCommentFavourableSituationEs;
        } else {
          this.activeAvActivityCommentEs = this.constantsService.avActivityCommentFavourableSituationEs;
        }
        if (this.activeAvActivityCommentCa !== undefined) {
          this.activeAvActivityCommentCa = this.activeAvActivityCommentCa + " " + this.constantsService.avActivityCommentFavourableSituationCa;
        } else {
          this.activeAvActivityCommentCa = this.constantsService.avActivityCommentFavourableSituationCa;
        }
        if (this.activeAvActivityCommentOc !== undefined) {
          this.activeAvActivityCommentOc = this.activeAvActivityCommentOc + " " + this.constantsService.avActivityCommentFavourableSituationOc;
        } else {
          this.activeAvActivityCommentOc = this.constantsService.avActivityCommentFavourableSituationOc;
        }
        break;
      default:
        break;
    }
    this.setTexts();
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
        if (this.activeSnowpackStructureCommentTextcat !== undefined) {
          this.activeSnowpackStructureCommentTextcat = this.activeSnowpackStructureCommentTextcat + "." + this.constantsService.snowpackStructureCommentNewSnowTextcat;
        } else {
          this.activeSnowpackStructureCommentTextcat = this.constantsService.snowpackStructureCommentNewSnowTextcat;
        }
        if (this.activeSnowpackStructureCommentDe !== undefined) {
          this.activeSnowpackStructureCommentDe = this.activeSnowpackStructureCommentDe + " " + this.constantsService.snowpackStructureCommentNewSnowDe;
        } else {
          this.activeSnowpackStructureCommentDe = this.constantsService.snowpackStructureCommentNewSnowDe;
        }
        if (this.activeSnowpackStructureCommentIt !== undefined) {
          this.activeSnowpackStructureCommentIt = this.activeSnowpackStructureCommentIt + " " + this.constantsService.snowpackStructureCommentNewSnowIt;
        } else {
          this.activeSnowpackStructureCommentIt = this.constantsService.snowpackStructureCommentNewSnowIt;
        }
        if (this.activeSnowpackStructureCommentEn !== undefined) {
          this.activeSnowpackStructureCommentEn = this.activeSnowpackStructureCommentEn + " " + this.constantsService.snowpackStructureCommentNewSnowEn;
        } else {
          this.activeSnowpackStructureCommentEn = this.constantsService.snowpackStructureCommentNewSnowEn;
        }
        if (this.activeSnowpackStructureCommentFr !== undefined) {
          this.activeSnowpackStructureCommentFr = this.activeSnowpackStructureCommentFr + " " + this.constantsService.snowpackStructureCommentNewSnowFr;
        } else {
          this.activeSnowpackStructureCommentFr = this.constantsService.snowpackStructureCommentNewSnowFr;
        }
        if (this.activeSnowpackStructureCommentEs !== undefined) {
          this.activeSnowpackStructureCommentEs = this.activeSnowpackStructureCommentEs + " " + this.constantsService.snowpackStructureCommentNewSnowEs;
        } else {
          this.activeSnowpackStructureCommentEs = this.constantsService.snowpackStructureCommentNewSnowEs;
        }
        if (this.activeSnowpackStructureCommentCa !== undefined) {
          this.activeSnowpackStructureCommentCa = this.activeSnowpackStructureCommentCa + " " + this.constantsService.snowpackStructureCommentNewSnowCa;
        } else {
          this.activeSnowpackStructureCommentCa = this.constantsService.snowpackStructureCommentNewSnowCa;
        }
        if (this.activeSnowpackStructureCommentOc !== undefined) {
          this.activeSnowpackStructureCommentOc = this.activeSnowpackStructureCommentOc + " " + this.constantsService.snowpackStructureCommentNewSnowOc;
        } else {
          this.activeSnowpackStructureCommentOc = this.constantsService.snowpackStructureCommentNewSnowOc;
        }
        break;
      case "windSlab":
        if (this.activeSnowpackStructureCommentTextcat !== undefined) {
          this.activeSnowpackStructureCommentTextcat = this.activeSnowpackStructureCommentTextcat + "." + this.constantsService.snowpackStructureCommentWindSlabTextcat;
        } else {
          this.activeSnowpackStructureCommentTextcat = this.constantsService.snowpackStructureCommentWindSlabTextcat;
        }
        if (this.activeSnowpackStructureCommentDe !== undefined) {
          this.activeSnowpackStructureCommentDe = this.activeSnowpackStructureCommentDe + " " + this.constantsService.snowpackStructureCommentWindSlabDe;
        } else {
          this.activeSnowpackStructureCommentDe = this.constantsService.snowpackStructureCommentWindSlabDe;
        }
        if (this.activeSnowpackStructureCommentIt !== undefined) {
          this.activeSnowpackStructureCommentIt = this.activeSnowpackStructureCommentIt + " " + this.constantsService.snowpackStructureCommentWindSlabIt;
        } else {
          this.activeSnowpackStructureCommentIt = this.constantsService.snowpackStructureCommentWindSlabIt;
        }
        if (this.activeSnowpackStructureCommentEn !== undefined) {
          this.activeSnowpackStructureCommentEn = this.activeSnowpackStructureCommentEn + " " + this.constantsService.snowpackStructureCommentWindSlabEn;
        } else {
          this.activeSnowpackStructureCommentEn = this.constantsService.snowpackStructureCommentWindSlabEn;
        }
        if (this.activeSnowpackStructureCommentFr !== undefined) {
          this.activeSnowpackStructureCommentFr = this.activeSnowpackStructureCommentFr + " " + this.constantsService.snowpackStructureCommentWindSlabFr;
        } else {
          this.activeSnowpackStructureCommentFr = this.constantsService.snowpackStructureCommentWindSlabFr;
        }
        if (this.activeSnowpackStructureCommentEs !== undefined) {
          this.activeSnowpackStructureCommentEs = this.activeSnowpackStructureCommentEs + " " + this.constantsService.snowpackStructureCommentWindSlabEs;
        } else {
          this.activeSnowpackStructureCommentEs = this.constantsService.snowpackStructureCommentWindSlabEs;
        }
        if (this.activeSnowpackStructureCommentCa !== undefined) {
          this.activeSnowpackStructureCommentCa = this.activeSnowpackStructureCommentCa + " " + this.constantsService.snowpackStructureCommentWindSlabCa;
        } else {
          this.activeSnowpackStructureCommentCa = this.constantsService.snowpackStructureCommentWindSlabCa;
        }
        if (this.activeSnowpackStructureCommentOc !== undefined) {
          this.activeSnowpackStructureCommentOc = this.activeSnowpackStructureCommentOc + " " + this.constantsService.snowpackStructureCommentWindSlabOc;
        } else {
          this.activeSnowpackStructureCommentOc = this.constantsService.snowpackStructureCommentWindSlabOc;
        }
        break;
      case "persistentWeakLayers":
        if (this.activeSnowpackStructureCommentTextcat !== undefined) {
          this.activeSnowpackStructureCommentTextcat = this.activeSnowpackStructureCommentTextcat + "." + this.constantsService.snowpackStructureCommentPersistentWeakLayersTextcat;
        } else {
          this.activeSnowpackStructureCommentTextcat = this.constantsService.snowpackStructureCommentPersistentWeakLayersTextcat;
        }
        if (this.activeSnowpackStructureCommentDe !== undefined) {
          this.activeSnowpackStructureCommentDe = this.activeSnowpackStructureCommentDe + " " + this.constantsService.snowpackStructureCommentPersistentWeakLayersDe;
        } else {
          this.activeSnowpackStructureCommentDe = this.constantsService.snowpackStructureCommentPersistentWeakLayersDe;
        }
        if (this.activeSnowpackStructureCommentIt !== undefined) {
          this.activeSnowpackStructureCommentIt = this.activeSnowpackStructureCommentIt + " " + this.constantsService.snowpackStructureCommentPersistentWeakLayersIt;
        } else {
          this.activeSnowpackStructureCommentIt = this.constantsService.snowpackStructureCommentPersistentWeakLayersIt;
        }
        if (this.activeSnowpackStructureCommentEn !== undefined) {
          this.activeSnowpackStructureCommentEn = this.activeSnowpackStructureCommentEn + " " + this.constantsService.snowpackStructureCommentPersistentWeakLayersEn;
        } else {
          this.activeSnowpackStructureCommentEn = this.constantsService.snowpackStructureCommentPersistentWeakLayersEn;
        }
        if (this.activeSnowpackStructureCommentFr !== undefined) {
          this.activeSnowpackStructureCommentFr = this.activeSnowpackStructureCommentFr + " " + this.constantsService.snowpackStructureCommentPersistentWeakLayersFr;
        } else {
          this.activeSnowpackStructureCommentFr = this.constantsService.snowpackStructureCommentPersistentWeakLayersFr;
        }
        if (this.activeSnowpackStructureCommentEs !== undefined) {
          this.activeSnowpackStructureCommentEs = this.activeSnowpackStructureCommentEs + " " + this.constantsService.snowpackStructureCommentPersistentWeakLayersEs;
        } else {
          this.activeSnowpackStructureCommentEs = this.constantsService.snowpackStructureCommentPersistentWeakLayersEs;
        }
        if (this.activeSnowpackStructureCommentCa !== undefined) {
          this.activeSnowpackStructureCommentCa = this.activeSnowpackStructureCommentCa + " " + this.constantsService.snowpackStructureCommentPersistentWeakLayersCa;
        } else {
          this.activeSnowpackStructureCommentCa = this.constantsService.snowpackStructureCommentPersistentWeakLayersCa;
        }
        if (this.activeSnowpackStructureCommentOc !== undefined) {
          this.activeSnowpackStructureCommentOc = this.activeSnowpackStructureCommentOc + " " + this.constantsService.snowpackStructureCommentPersistentWeakLayersOc;
        } else {
          this.activeSnowpackStructureCommentOc = this.constantsService.snowpackStructureCommentPersistentWeakLayersOc;
        }
        break;
      case "wetSnow":
        if (this.activeSnowpackStructureCommentTextcat !== undefined) {
          this.activeSnowpackStructureCommentTextcat = this.activeSnowpackStructureCommentTextcat + "." + this.constantsService.snowpackStructureCommentWetSnowTextcat;
        } else {
          this.activeSnowpackStructureCommentTextcat = this.constantsService.snowpackStructureCommentWetSnowTextcat;
        }
        if (this.activeSnowpackStructureCommentDe !== undefined) {
          this.activeSnowpackStructureCommentDe = this.activeSnowpackStructureCommentDe + " " + this.constantsService.snowpackStructureCommentWetSnowDe;
        } else {
          this.activeSnowpackStructureCommentDe = this.constantsService.snowpackStructureCommentWetSnowDe;
        }
        if (this.activeSnowpackStructureCommentIt !== undefined) {
          this.activeSnowpackStructureCommentIt = this.activeSnowpackStructureCommentIt + " " + this.constantsService.snowpackStructureCommentWetSnowIt;
        } else {
          this.activeSnowpackStructureCommentIt = this.constantsService.snowpackStructureCommentWetSnowIt;
        }
        if (this.activeSnowpackStructureCommentEn !== undefined) {
          this.activeSnowpackStructureCommentEn = this.activeSnowpackStructureCommentEn + " " + this.constantsService.snowpackStructureCommentWetSnowEn;
        } else {
          this.activeSnowpackStructureCommentEn = this.constantsService.snowpackStructureCommentWetSnowEn;
        }
        if (this.activeSnowpackStructureCommentFr !== undefined) {
          this.activeSnowpackStructureCommentFr = this.activeSnowpackStructureCommentFr + " " + this.constantsService.snowpackStructureCommentWetSnowFr;
        } else {
          this.activeSnowpackStructureCommentFr = this.constantsService.snowpackStructureCommentWetSnowFr;
        }
        if (this.activeSnowpackStructureCommentEs !== undefined) {
          this.activeSnowpackStructureCommentEs = this.activeSnowpackStructureCommentEs + " " + this.constantsService.snowpackStructureCommentWetSnowEs;
        } else {
          this.activeSnowpackStructureCommentEs = this.constantsService.snowpackStructureCommentWetSnowEs;
        }
        if (this.activeSnowpackStructureCommentCa !== undefined) {
          this.activeSnowpackStructureCommentCa = this.activeSnowpackStructureCommentCa + " " + this.constantsService.snowpackStructureCommentWetSnowCa;
        } else {
          this.activeSnowpackStructureCommentCa = this.constantsService.snowpackStructureCommentWetSnowCa;
        }
        if (this.activeSnowpackStructureCommentOc !== undefined) {
          this.activeSnowpackStructureCommentOc = this.activeSnowpackStructureCommentOc + " " + this.constantsService.snowpackStructureCommentWetSnowOc;
        } else {
          this.activeSnowpackStructureCommentOc = this.constantsService.snowpackStructureCommentWetSnowOc;
        }
        break;
      case "glidingSnow":
        if (this.activeSnowpackStructureCommentTextcat !== undefined) {
          this.activeSnowpackStructureCommentTextcat = this.activeSnowpackStructureCommentTextcat + "." + this.constantsService.snowpackStructureCommentGlidingSnowTextcat;
        } else {
          this.activeSnowpackStructureCommentTextcat = this.constantsService.snowpackStructureCommentGlidingSnowTextcat;
        }
        if (this.activeSnowpackStructureCommentDe !== undefined) {
          this.activeSnowpackStructureCommentDe = this.activeSnowpackStructureCommentDe + " " + this.constantsService.snowpackStructureCommentGlidingSnowDe;
        } else {
          this.activeSnowpackStructureCommentDe = this.constantsService.snowpackStructureCommentGlidingSnowDe;
        }
        if (this.activeSnowpackStructureCommentIt !== undefined) {
          this.activeSnowpackStructureCommentIt = this.activeSnowpackStructureCommentIt + " " + this.constantsService.snowpackStructureCommentGlidingSnowIt;
        } else {
          this.activeSnowpackStructureCommentIt = this.constantsService.snowpackStructureCommentGlidingSnowIt;
        }
        if (this.activeSnowpackStructureCommentEn !== undefined) {
          this.activeSnowpackStructureCommentEn = this.activeSnowpackStructureCommentEn + " " + this.constantsService.snowpackStructureCommentGlidingSnowEn;
        } else {
          this.activeSnowpackStructureCommentEn = this.constantsService.snowpackStructureCommentGlidingSnowEn;
        }
        if (this.activeSnowpackStructureCommentFr !== undefined) {
          this.activeSnowpackStructureCommentFr = this.activeSnowpackStructureCommentFr + " " + this.constantsService.snowpackStructureCommentGlidingSnowFr;
        } else {
          this.activeSnowpackStructureCommentFr = this.constantsService.snowpackStructureCommentGlidingSnowFr;
        }
        if (this.activeSnowpackStructureCommentEs !== undefined) {
          this.activeSnowpackStructureCommentEs = this.activeSnowpackStructureCommentEs + " " + this.constantsService.snowpackStructureCommentGlidingSnowEs;
        } else {
          this.activeSnowpackStructureCommentEs = this.constantsService.snowpackStructureCommentGlidingSnowEs;
        }
        if (this.activeSnowpackStructureCommentCa !== undefined) {
          this.activeSnowpackStructureCommentCa = this.activeSnowpackStructureCommentCa + " " + this.constantsService.snowpackStructureCommentGlidingSnowCa;
        } else {
          this.activeSnowpackStructureCommentCa = this.constantsService.snowpackStructureCommentGlidingSnowCa;
        }
        if (this.activeSnowpackStructureCommentOc !== undefined) {
          this.activeSnowpackStructureCommentOc = this.activeSnowpackStructureCommentOc + " " + this.constantsService.snowpackStructureCommentGlidingSnowOc;
        } else {
          this.activeSnowpackStructureCommentOc = this.constantsService.snowpackStructureCommentGlidingSnowOc;
        }
        break;
      case "favourableSituation":
        if (this.activeSnowpackStructureCommentTextcat !== undefined) {
          this.activeSnowpackStructureCommentTextcat = this.activeSnowpackStructureCommentTextcat + "." + this.constantsService.snowpackStructureCommentFavourableSituationTextcat;
        } else {
          this.activeSnowpackStructureCommentTextcat = this.constantsService.snowpackStructureCommentFavourableSituationTextcat;
        }
        if (this.activeSnowpackStructureCommentDe !== undefined) {
          this.activeSnowpackStructureCommentDe = this.activeSnowpackStructureCommentDe + " " + this.constantsService.snowpackStructureCommentFavourableSituationDe;
        } else {
          this.activeSnowpackStructureCommentDe = this.constantsService.snowpackStructureCommentFavourableSituationDe;
        }
        if (this.activeSnowpackStructureCommentIt !== undefined) {
          this.activeSnowpackStructureCommentIt = this.activeSnowpackStructureCommentIt + " " + this.constantsService.snowpackStructureCommentFavourableSituationIt;
        } else {
          this.activeSnowpackStructureCommentIt = this.constantsService.snowpackStructureCommentFavourableSituationIt;
        }
        if (this.activeSnowpackStructureCommentEn !== undefined) {
          this.activeSnowpackStructureCommentEn = this.activeSnowpackStructureCommentEn + " " + this.constantsService.snowpackStructureCommentFavourableSituationEn;
        } else {
          this.activeSnowpackStructureCommentEn = this.constantsService.snowpackStructureCommentFavourableSituationEn;
        }
        if (this.activeSnowpackStructureCommentFr !== undefined) {
          this.activeSnowpackStructureCommentFr = this.activeSnowpackStructureCommentFr + " " + this.constantsService.snowpackStructureCommentFavourableSituationFr;
        } else {
          this.activeSnowpackStructureCommentFr = this.constantsService.snowpackStructureCommentFavourableSituationFr;
        }
        if (this.activeSnowpackStructureCommentEs !== undefined) {
          this.activeSnowpackStructureCommentEs = this.activeSnowpackStructureCommentEs + " " + this.constantsService.snowpackStructureCommentFavourableSituationEs;
        } else {
          this.activeSnowpackStructureCommentEs = this.constantsService.snowpackStructureCommentFavourableSituationEs;
        }
        if (this.activeSnowpackStructureCommentCa !== undefined) {
          this.activeSnowpackStructureCommentCa = this.activeSnowpackStructureCommentCa + " " + this.constantsService.snowpackStructureCommentFavourableSituationCa;
        } else {
          this.activeSnowpackStructureCommentCa = this.constantsService.snowpackStructureCommentFavourableSituationCa;
        }
        if (this.activeSnowpackStructureCommentOc !== undefined) {
          this.activeSnowpackStructureCommentOc = this.activeSnowpackStructureCommentOc + " " + this.constantsService.snowpackStructureCommentFavourableSituationOc;
        } else {
          this.activeSnowpackStructureCommentOc = this.constantsService.snowpackStructureCommentFavourableSituationOc;
        }
        break;
      default:
        break;
    }
    this.setTexts();
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
|"activeHighlights"
|"activeAvActivityHighlights"
|"activeAvActivityComment"
|"activeSnowpackStructureHighlights"
|"activeSnowpackStructureComment"
|"activeTendencyComment"
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
