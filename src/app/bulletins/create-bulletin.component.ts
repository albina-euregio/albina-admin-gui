import { Component, HostListener, ViewChild, ElementRef, ApplicationRef, TemplateRef, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { DatePipe, formatDate } from "@angular/common";
import { MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig } from "@angular/material/legacy-dialog";


import { CatalogOfPhrasesComponent } from "../catalog-of-phrases/catalog-of-phrases.component";
import { interval } from "rxjs";
import { BehaviorSubject } from "rxjs";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal";
import { saveAs } from "file-saver";

import { environment } from "../../environments/environment";

// models
import { BulletinModel } from "../models/bulletin.model";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";

// services
import { TranslateService } from "@ngx-translate/core";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { MapService } from "../providers/map-service/map.service";
import { SettingsService } from "../providers/settings-service/settings.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { CopyService } from "../providers/copy-service/copy.service";

// modals
import { ModalSubmitComponent } from "./modal-submit.component";
import { ModalPublishComponent } from "./modal-publish.component";
import { ModalPublicationStatusComponent } from "./modal-publication-status.component";
import { ModalPublishAllComponent } from "./modal-publish-all.component";
import { ModalMediaFileComponent } from "./modal-media-file.component";
import { ModalCheckComponent } from "./modal-check.component";

// For iframe
import { Renderer2 } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { Subscription } from "rxjs";
import { Console } from "console";

import * as Enums from "../enums/enums";
import { BulletinLockModel } from "app/models/bulletin-lock.model";

declare var L: any;

@Component({
  templateUrl: "create-bulletin.component.html"
})
export class CreateBulletinComponent implements OnInit, OnDestroy {

  public bulletinStatus = Enums.BulletinStatus;
  public dangerPattern = Enums.DangerPattern;
  public tendency = Enums.Tendency;

  public autoSaving: boolean;
  public loadingPreview: boolean;
  public editRegions: boolean;
  public loading: boolean;

  public originalBulletins: Map<string, BulletinModel>;

  public showAfternoonMap: boolean;

  public showForeignRegions: boolean;
  public showExternalRegions: boolean;

  public activeBulletin: BulletinModel;
  public internBulletinsList: BulletinModel[];
  public externBulletinsList: BulletinModel[];

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

  public showStatusOfAllRegions: boolean = false;

  public showNewBulletinModal: boolean = false;

  public isCompactMapLayout: boolean = false;
  private selectedCopyRegionDate: string;
  private bulletinCopy: BulletinModel;
  private bulletinMarkedDelete: BulletinModel;

  // Publishing
  public publishing: Date;
  public copying: boolean;


  public loadingErrorModalRef: BsModalRef;
  @ViewChild("loadingErrorTemplate") loadingErrorTemplate: TemplateRef<any>;

  public loadingJsonFileErrorModalRef: BsModalRef;
  @ViewChild("loadingJsonFileErrorTemplate") loadingJsonFileErrorTemplate: TemplateRef<any>;

  public loadModalRef: BsModalRef;
  @ViewChild("loadTemplate") loadTemplate: TemplateRef<any>;

  public deleteAggregatedRegionModalRef: BsModalRef;
  @ViewChild("deleteAggregatedRegionTemplate") deleteAggregatedRegionTemplate: TemplateRef<any>;

  public noRegionModalRef: BsModalRef;
  @ViewChild("noRegionTemplate") noRegionTemplate: TemplateRef<any>;

  public discardModalRef: BsModalRef;
  @ViewChild("discardTemplate") discardTemplate: TemplateRef<any>;

  public saveErrorModalRef: BsModalRef;
  @ViewChild("saveErrorTemplate") saveErrorTemplate: TemplateRef<any>;

  public changeErrorModalRef: BsModalRef;
  @ViewChild("changeErrorTemplate") changeErrorTemplate: TemplateRef<any>;

  public avalancheProblemErrorModalRef: BsModalRef;
  @ViewChild("avalancheProblemErrorTemplate") avalancheProblemErrorTemplate: TemplateRef<any>;

  public loadAvActivityCommentExampleTextModalRef: BsModalRef;
  @ViewChild("loadAvActivityCommentExampleTextTemplate") loadAvActivityCommentExampleTextTemplate: TemplateRef<any>;

  public loadSnowpackStructureCommentExampleTextModalRef: BsModalRef;
  @ViewChild("loadSnowpackStructureCommentExampleTextTemplate") loadSnowpackStructureCommentExampleTextTemplate: TemplateRef<any>;

  public copyRegionModalRef: BsModalRef;
  @ViewChild("copyRegionTemplate") copyRegionTemplate: TemplateRef<any>;

  public submitBulletinsModalRef: BsModalRef;
  @ViewChild("submitBulletinsTemplate") submitBulletinsTemplate: TemplateRef<any>;

  public submitBulletinsDuplicateRegionModalRef: BsModalRef;
  @ViewChild("submitBulletinsDuplicateRegionTemplate") submitBulletinsDuplicateRegionTemplate: TemplateRef<any>;

  public submitBulletinsErrorModalRef: BsModalRef;
  @ViewChild("submitBulletinsErrorTemplate") submitBulletinsErrorTemplate: TemplateRef<any>;

  public publishBulletinsModalRef: BsModalRef;
  @ViewChild("publishBulletinsTemplate") publishBulletinsTemplate: TemplateRef<any>;

  public publishBulletinsErrorModalRef: BsModalRef;
  @ViewChild("publishBulletinsErrorTemplate") publishBulletinsErrorTemplate: TemplateRef<any>;

  public previewErrorModalRef: BsModalRef;
  @ViewChild("previewErrorTemplate") previewErrorTemplate: TemplateRef<any>;

  public publicationStatusModalRef: BsModalRef;
  @ViewChild("publicationStatusTemplate") publicationStatusTemplate: TemplateRef<any>;

  public mediaFileModalRef: BsModalRef;
  @ViewChild("mediaFileTemplate") mediaFileTemplate: TemplateRef<any>;

  public publishAllModalRef: BsModalRef;
  @ViewChild("publishAllTemplate") publishAllTemplate: TemplateRef<any>;

  public checkBulletinsModalRef: BsModalRef;
  @ViewChild("checkBulletinsTemplate") checkBulletinsTemplate: TemplateRef<any>;

  public checkBulletinsErrorModalRef: BsModalRef;
  @ViewChild("checkBulletinsErrorTemplate") checkBulletinsErrorTemplate: TemplateRef<any>;

  public pmUrl: SafeUrl;

  @ViewChild("receiver") receiver: ElementRef<HTMLIFrameElement>;
  stopListening: Function;
  display: boolean = false;

  // tra le proprietà del componente
  eventSubscriber: Subscription;

  public config = {
    keyboard: true,
    class: "modal-sm"
  };

  constructor(
    private router: Router,
    public bulletinsService: BulletinsService,
    private dialog: MatDialog,
    public authenticationService: AuthenticationService,
    private translateService: TranslateService,
    private settingsService: SettingsService,
    private constantsService: ConstantsService,
    public regionsService: RegionsService,
    public copyService: CopyService,
    private mapService: MapService,
    private applicationRef: ApplicationRef,
    private sanitizer: DomSanitizer,
    renderer: Renderer2,
    private modalService: BsModalService,
    private datePipe: DatePipe
  ) {
    this.loading = true;
    this.showAfternoonMap = false;
    this.showForeignRegions = true;
    this.showExternalRegions = false;
    this.stopListening = renderer.listen("window", "message", this.getText.bind(this));
    this.mapService.resetAll();
    this.internBulletinsList = new Array<BulletinModel>();
    this.externBulletinsList = new Array<BulletinModel>();
    // this.preventClick = false;
    // this.timer = 0;

    // Set initial value based on the current window width
    this.isCompactMapLayout = window.innerWidth < 768;
    this.publishing = undefined;
    this.copying = false;
    this.loadingPreview = false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.isCompactMapLayout = event.target.innerWidth < 768;
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

  reset() {
    this.originalBulletins = new Map<string, BulletinModel>();
    this.activeBulletin = undefined;
    this.internBulletinsList = new Array<BulletinModel>();
    this.externBulletinsList = new Array<BulletinModel>();

    this.activeHighlightsTextcat = undefined;
    this.activeHighlightsDe = undefined;
    this.activeHighlightsIt = undefined;
    this.activeHighlightsEn = undefined;
    this.activeHighlightsFr = undefined;
    this.activeHighlightsEs = undefined;
    this.activeHighlightsCa = undefined;
    this.activeHighlightsOc = undefined;

    this.activeAvActivityHighlightsTextcat = undefined;
    this.activeAvActivityHighlightsDe = undefined;
    this.activeAvActivityHighlightsIt = undefined;
    this.activeAvActivityHighlightsEn = undefined;
    this.activeAvActivityHighlightsFr = undefined;
    this.activeAvActivityHighlightsEs = undefined;
    this.activeAvActivityHighlightsCa = undefined;
    this.activeAvActivityHighlightsOc = undefined;
    this.activeAvActivityHighlightsNotes = undefined;

    this.activeAvActivityCommentTextcat = undefined;
    this.activeAvActivityCommentDe = undefined;
    this.activeAvActivityCommentIt = undefined;
    this.activeAvActivityCommentEn = undefined;
    this.activeAvActivityCommentFr = undefined;
    this.activeAvActivityCommentEs = undefined;
    this.activeAvActivityCommentCa = undefined;
    this.activeAvActivityCommentOc = undefined;
    this.activeAvActivityCommentNotes = undefined;

    this.activeSnowpackStructureHighlightsTextcat = undefined;
    this.activeSnowpackStructureHighlightsDe = undefined;
    this.activeSnowpackStructureHighlightsIt = undefined;
    this.activeSnowpackStructureHighlightsEn = undefined;
    this.activeSnowpackStructureHighlightsFr = undefined;
    this.activeSnowpackStructureHighlightsEs = undefined;
    this.activeSnowpackStructureHighlightsCa = undefined;
    this.activeSnowpackStructureHighlightsOc = undefined;
    this.activeSnowpackStructureHighlightsNotes = undefined;

    this.activeSnowpackStructureCommentTextcat = undefined;
    this.activeSnowpackStructureCommentDe = undefined;
    this.activeSnowpackStructureCommentIt = undefined;
    this.activeSnowpackStructureCommentEn = undefined;
    this.activeSnowpackStructureCommentFr = undefined;
    this.activeSnowpackStructureCommentEs = undefined;
    this.activeSnowpackStructureCommentCa = undefined;
    this.activeSnowpackStructureCommentOc = undefined;
    this.activeSnowpackStructureCommentNotes = undefined;

    this.activeTendencyCommentTextcat = undefined;
    this.activeTendencyCommentDe = undefined;
    this.activeTendencyCommentIt = undefined;
    this.activeTendencyCommentEn = undefined;
    this.activeTendencyCommentFr = undefined;
    this.activeTendencyCommentEs = undefined;
    this.activeTendencyCommentCa = undefined;
    this.activeTendencyCommentOc = undefined;
    this.activeTendencyCommentNotes = undefined;

    this.editRegions = false;
    this.showAfternoonMap = false;

    this.isAccordionDangerRatingOpen = false;
    this.isAccordionAvalancheProblemOpen = true;
    this.isAccordionDangerDescriptionOpen = false;
    this.isAccordionSnowpackStructureOpen = false;
    this.isAccordionTendencyOpen = false;

    this.showTranslationsHighlights = false;
    this.showTranslationsAvActivityHighlights = false;
    this.showTranslationsAvActivityComment = false;
    this.showTranslationsSnowpackStructureComment = false;
    this.showTranslationsTendencyComment = false;
  }

  toggleShowForeignRegions() {
    if (this.showForeignRegions)
      this.showForeignRegions = false;
    else
      this.showForeignRegions = true;
  }

  toggleShowExternalRegions() {
    if (this.showExternalRegions)
      this.showExternalRegions = false;
    else
      this.showExternalRegions = true;
  }

  hasExternalRegions() {
    if (this.externBulletinsList.length > 0)
      return true;
    else
      return false;
  }

  private getTextcatUrl(): SafeUrl {
    // lang
    const l = this.settingsService.getLangString() === "it" ? "it" : "de"; // only de+it are supported
    const r = this.authenticationService.getActiveRegionCode();
    const url = environment.textcatUrl + "?l=" +  l + "&r=" + r;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit() {
    this.initializeComponent();
  }

  async initializeComponent() {
    // for reload iframe on change language
    this.eventSubscriber = this.settingsService.getChangeEmitter().subscribe(
      () => this.pmUrl = this.getTextcatUrl()
    );

    await this.initMaps();

    if (this.bulletinsService.getActiveDate() && this.authenticationService.isUserLoggedIn()) {

      this.reset();

      // TODO implement bulletin locking
      //this.bulletinsService.loadLockedBulletins();

      // setting pm language for iframe
      this.pmUrl = this.getTextcatUrl();

      // copy bulletins from other date
      if (this.bulletinsService.getCopyDate()) {
        const regions = new Array<String>();
        regions.push(this.authenticationService.getActiveRegionId());

        // load own bulletins from the date they are copied from
        this.bulletinsService.loadBulletins(this.bulletinsService.getCopyDate(), regions).subscribe(
          data => {
            this.copyBulletins(data);
            this.bulletinsService.setCopyDate(undefined);
            // load foreign bulletins from the current date
            if (this.authenticationService.isEuregio()) {
              const foreignRegions = new Array<String>();
              foreignRegions.push(this.constantsService.codeTyrol);
              foreignRegions.push(this.constantsService.codeSouthTyrol);
              foreignRegions.push(this.constantsService.codeTrentino);
              this.bulletinsService.loadBulletins(this.bulletinsService.getActiveDate(), foreignRegions).subscribe(
                data2 => {
                  this.addForeignBulletins(data2);
                  this.save();
                },
                () => {
                  console.error("Foreign bulletins could not be loaded!");
                  this.loading = false;
                  this.openLoadingErrorModal(this.loadingErrorTemplate);
                }
              );
            } else {
              this.loading = false;
            }
          },
          () => {
            console.error("Own bulletins could not be loaded!");
            this.loading = false;
            this.openLoadingErrorModal(this.loadingErrorTemplate);
          }
        );

        // load current bulletins (do not copy them, also if it is an update)
      } else {
        this.loadBulletinsFromServer();
      }

      if (this.isDateEditable(this.bulletinsService.getActiveDate())) {
        this.bulletinsService.setIsEditable(true);
      } else {
        this.bulletinsService.setIsEditable(false);
      }

      this.authenticationService.getExternalServers().map((server) =>
        this.bulletinsService.loadExternalBulletins(this.bulletinsService.getActiveDate(), server).subscribe(
          data2 => {
            this.addExternalBulletins(data2);
          },
          () => {
            console.error("External bulletins could not be loaded!");
          }
        )
      );

    } else {
      this.goBack();
    }
  }

  ngOnDestroy() {
    if (this.bulletinsService.getIsEditable()) {
      this.eventSubscriber.unsubscribe();
    }

    this.mapService.resetAll();

    this.bulletinsService.setActiveDate(undefined);
    this.bulletinsService.setIsEditable(false);

    this.loading = false;
    this.editRegions = false;
    this.copying = false;
  }

  isDisabled() {
    return (this.loading || !this.bulletinsService.getIsEditable() || this.bulletinsService.isLocked(this.activeBulletin.getId()) || this.editRegions || !this.isCreator(this.activeBulletin)) ? true : false;
  }

  isDateEditable(date) {
    if (
      (((this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.missing) || (this.bulletinsService.getUserRegionStatus(date) === undefined)) && (!this.bulletinsService.hasBeenPublished5PM(this.bulletinsService.getActiveDate()))) ||
      (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.updated) ||
      (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.draft)
    ) {
      return true;
    }
  }

  showPublicationHappensAt5PM(date) {
    return (
      (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted) && 
      (!this.bulletinsService.hasBeenPublished5PM(date))
    ) ? true : false;
  }

  showPublicationHappensAt8AM(date) {
    return (
      (
        (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted) ||
        (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.resubmitted)
      ) &&
      (!this.bulletinsService.hasBeenPublished8AM(date)) &&
      (!this.showPublicationHappensAt5PM(date))
    ) ? true : false;
  }

  showPublicationHappened(date) {
    return (
      (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.published) ||
      (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.republished)
    ) ? true : false;
  }

  showNoPublicationWillHappen(date) {
    return (
      (
        (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted) ||
        (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.resubmitted)
      ) &&
      (this.bulletinsService.hasBeenPublished8AM(date))
    ) ? true : false;
  }

  loadBulletin(date) {
    this.deselectBulletin();

    this.bulletinsService.setActiveDate(date);
    if (this.authenticationService.getActiveRegionId() && this.authenticationService.getActiveRegionId() !== undefined && (this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster) || this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman))) {

      if (!this.isDateEditable(date)) {
        this.bulletinsService.setIsEditable(false);
        this.initializeComponent();
      } else {
        if (this.bulletinsService.getActiveDate() && this.authenticationService.isUserLoggedIn()) {
          this.bulletinsService.setIsEditable(true);
          this.initializeComponent();
        }
      }
    } else {
      this.bulletinsService.setActiveDate(date);
      this.bulletinsService.setIsEditable(false);
      this.initializeComponent();
    }
  }

  publishAll(event, date: Date) {
    event.stopPropagation();
    this.publishing = date;
    this.openPublishAllModal(this.publishAllTemplate, date);
  }

  check(event, date: Date) {
    event.stopPropagation();

    this.bulletinsService.checkBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
      data => {
        let message = "<b>" + this.translateService.instant("bulletins.table.checkBulletinsDialog.message") + "</b><br><br>";

        if ((data as any).length === 0) {
          message += this.translateService.instant("bulletins.table.checkBulletinsDialog.ok");
        } else {
          for (const entry of (data as any)) {
            if (entry === "missingDangerRating") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingDangerRating") + "<br>";
            }
            if (entry === "missingRegion") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingRegion") + "<br>";
            }
            if (entry === "missingAvActivityHighlights") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingAvActivityHighlights") + "<br>";
            }
            if (entry === "missingAvActivityComment") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingAvActivityComment") + "<br>";
            }
            if (entry === "missingSnowpackStructureHighlights") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingSnowpackStructureHighlights") + "<br>";
            }
            if (entry === "missingSnowpackStructureComment") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingSnowpackStructureComment") + "<br>";
            }
            if (entry === "pendingSuggestions") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.pendingSuggestions") + "<br>";
            }
            if (entry === "incompleteTranslation") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.incompleteTranslation");
            }
          }
        }

        this.openCheckBulletinsModal(this.checkBulletinsTemplate, message, date);
      },
      error => {
        console.error("Bulletins could not be checked!");
        this.openCheckBulletinsErrorModal(this.checkBulletinsErrorTemplate);
      }
    );
  }

  showPublishAllButton(date) {
    if (this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin)) {
      return true;
    }
  }

  showCheckButton(date) {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
      (!this.publishing || this.publishing.getTime() !== date.getTime()) &&
      (
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.draft ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.updated
      ) &&
      !this.copying &&
      this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman)) {
      return true;
    } else {
      return false;
    }
  }

  showMediaFileButton() {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
        this.authenticationService.getActiveRegion().enableMediaFile &&
      (!this.publishing || this.publishing.getTime() !== this.bulletinsService.getActiveDate().getTime()) &&
      (
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.draft ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.updated ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.submitted ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.published ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.resubmitted ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.republished
      ) &&
      !this.copying &&
      (
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster)
      )
    ) {
      return true;
    } else {
      return false;
    }
  }

  showInfoButton() {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
      (!this.publishing || this.publishing.getTime() !== this.bulletinsService.getActiveDate().getTime()) &&
      (
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.published ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.republished
      ) &&
      !this.copying &&
      (
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin)
      )
    ) {
      return true;
    } else {
      return false;
    }
  }

  showPublicationInfo(event, date: Date) {
    event.stopPropagation();
    this.bulletinsService.getPublicationStatus(this.authenticationService.getActiveRegionId(), date).subscribe(
      data => {
        this.openPublicationStatusModal(this.publicationStatusTemplate, (data as any), date);
      },
      error => {
        console.error("Publication status could not be loaded!");
      }
    );
  }

  openMediaFileDialog(event, date: Date) {
    event.stopPropagation();
    this.openMediaFileModal(this.mediaFileTemplate, date);
  }

  openPublicationStatusModal(template: TemplateRef<any>, json, date: Date) {
    const initialState = {
      json: json,
      date: date,
      component: this
    };
    this.publicationStatusModalRef = this.modalService.show(ModalPublicationStatusComponent, { initialState });
  }
  
  openMediaFileModal(template: TemplateRef<any>, date: Date) {
    const initialState = {
      date: date,
      component: this
    };
    this.mediaFileModalRef = this.modalService.show(ModalMediaFileComponent, { initialState });
  }

  mediaFileModalConfirm(date: Date): void {
    this.mediaFileModalRef.hide();
  }

  publicationStatusModalConfirm(date: Date): void {
    this.publicationStatusModalRef.hide();
  }  

  openPublishAllModal(template: TemplateRef<any>, date: Date) {
    const initialState = {
      date: date,
      component: this
    };
    this.publishAllModalRef = this.modalService.show(ModalPublishAllComponent, { initialState });

    this.modalService.onHide.subscribe((reason: string) => {
      this.publishing = undefined;
    });
  }

  publishAllModalConfirm(date: Date): void {
    this.publishAllModalRef.hide();
    this.bulletinsService.publishAllBulletins(date).subscribe(
      data => {
        console.log("All bulletins published.");
        if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.resubmitted) {
          this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.republished);
        } else if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted) {
          this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.published);
        }
        this.publishing = undefined;
      },
      error => {
        console.error("All bulletins could not be published!");
        this.openPublishBulletinsErrorModal(this.publishBulletinsErrorTemplate);
      }
    );
  }

  publishAllModalDecline(): void {
    this.publishAllModalRef.hide();
    this.publishing = undefined;
  }

  downloadJsonBulletin() {
    this.loading = true;
    this.setTexts();
    this.deselectBulletin();

    const validFrom = new Date(this.bulletinsService.getActiveDate());
    const validUntil = new Date(this.bulletinsService.getActiveDate());
    validUntil.setTime(validUntil.getTime() + (24 * 60 * 60 * 1000));

    const result = new Array<BulletinModel>();

    for (const bulletin of this.internBulletinsList) {
      bulletin.setValidFrom(validFrom);
      bulletin.setValidUntil(validUntil);

      // only own regions
      const saved = new Array<String>();
      for (const region of bulletin.getSavedRegions()) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          saved.push(region);
        }
      }
      for (const region of bulletin.getPublishedRegions()) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          saved.push(region);
        }
      }

      if (saved.length > 0) {
        bulletin.setSavedRegions(saved);
        bulletin.setSuggestedRegions(new Array<String>());
        bulletin.setPublishedRegions(new Array<String>());
      }

      result.push(bulletin);
    }

    const jsonBulletins = [];
    for (let i = result.length - 1; i >= 0; i--) {
      jsonBulletins.push(result[i].toJson());
    }
    const sJson = JSON.stringify(jsonBulletins);
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/json;charset=UTF-8," + encodeURIComponent(sJson));
    element.setAttribute("download", this.datePipe.transform(validFrom, "yyyy-MM-dd") + "_report.json");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click(); // simulate click
    document.body.removeChild(element);
    this.loading = false;
  }

  uploadJsonBulletin(event) {
    const selectedFile = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.readAsText(selectedFile, "UTF-8");
    fileReader.onload = () => {
      const json = JSON.parse(fileReader.result.toString());

      this.reset();
      this.copyBulletins(json);
      console.info("Bulletins loaded from file: " + selectedFile.name);
    }
    fileReader.onerror = (error) => {
      console.error("Bulletins could not be loaded from file: " + error);
      this.openLoadingJsonFileErrorModal(this.loadingJsonFileErrorTemplate);
    }
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

  private async initMaps() {
    const [map, afternoonMap] = await this.mapService.initAmPmMap(this.showAfternoonMap);
    map.on("click", () => this.onMapClick());
    afternoonMap.on("click", () => this.onMapClick());
  }

  private onMapClick() {
    if (this.showNewBulletinModal && !this.editRegions) {
      const test = this.mapService.getClickedRegion();
      for (const bulletin of this.internBulletinsList.concat(this.externBulletinsList)) {
        if (bulletin.getSavedRegions().indexOf(test) > -1 || bulletin.getPublishedRegions().indexOf(test) > -1 ) {
          if (this.activeBulletin === bulletin) {
            this.deselectBulletin();
          } else {
            this.selectBulletin(bulletin);
          }
        }
      }
    }
  }

  setMapLayout(bulletin, isCompact: boolean): void {
    // Show the map on top of form (compact) or right next to the form?
    this.isCompactMapLayout = isCompact;
    
    setTimeout(() => {
      this.mapService.map.invalidateSize();
    }, 10);
  }

  setTendency(event, tendency) {
    event.stopPropagation();
    this.activeBulletin.tendency = tendency;
  }

  onShowAfternoonMapChange(checked) {
    this.showAfternoonMap = checked;
    this.setTexts();

    const bulletin = this.activeBulletin;

    this.deselectBulletin();
    const map = document.getElementById("map");
    const afternoonMap = document.getElementById("afternoonMap");
    if (this.showAfternoonMap) {
      map.classList.add("create-bulletin__map--am");
      afternoonMap.classList.add("create-bulletin__map--am");
    } else {
      map.classList.remove("create-bulletin__map--am");
      afternoonMap.classList.remove("create-bulletin__map--am");
    }
    this.initMaps().then(() => this.updateInternalBulletins());

    if (bulletin) {
      this.selectBulletin(bulletin);
    }
  }

  getOwnBulletins() {
    const result = new Array<BulletinModel>();
    for (const bulletin of this.internBulletinsList) {
      if (bulletin.getOwnerRegion().startsWith(this.authenticationService.getActiveRegionId())) {
        result.push(bulletin);
      }
    }
    return result;
  }

  getForeignBulletins() {
    const result = new Array<BulletinModel>();
    for (const bulletin of this.internBulletinsList) {
      if (!bulletin.getOwnerRegion().startsWith(this.authenticationService.getActiveRegionId()) && !this.authenticationService.isExternalRegion(bulletin.getOwnerRegion().toString())) {
        result.push(bulletin);
      }
    }
    return result;
  }

  getExternalBulletins() {
    return this.externBulletinsList;
  }

  loadBulletinsFromYesterday() {
    this.openLoadModal(this.loadTemplate);
  }

  // create a copy of every bulletin (with new id)
  private copyBulletins(response) {
    this.mapService.resetAggregatedRegions();

    for (const jsonBulletin of response) {
      const originalBulletin = BulletinModel.createFromJson(jsonBulletin);

      this.originalBulletins.set(originalBulletin.getId(), originalBulletin);

      const bulletin = new BulletinModel(originalBulletin);

      bulletin.setAuthor(this.authenticationService.getAuthor());
      bulletin.setAdditionalAuthors(new Array<String>());
      bulletin.addAdditionalAuthor(this.authenticationService.getAuthor().getName());
      bulletin.setOwnerRegion(this.authenticationService.getActiveRegionId());

      // reset regions
      const saved = new Array<String>();
      for (const region of bulletin.getSavedRegions()) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          saved.push(region);
        }
      }
      for (const region of bulletin.getPublishedRegions()) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          saved.push(region);
        }
      }

      if (saved.length > 0) {
        bulletin.setSavedRegions(saved);

        bulletin.setSuggestedRegions(new Array<String>());
        bulletin.setPublishedRegions(new Array<String>());

        this.addInternalBulletin(bulletin);
      }
    }

    this.updateInternalBulletins();

    this.mapService.deselectAggregatedRegion();
  }

  private addForeignBulletins(response) {
    this.mapService.resetAggregatedRegions();

    for (const jsonBulletin of response) {
      const bulletin = BulletinModel.createFromJson(jsonBulletin);

      if (!bulletin.getOwnerRegion().startsWith(this.authenticationService.getActiveRegionId())) {
        this.addInternalBulletin(bulletin);
      }
    }

    this.updateInternalBulletins();

    this.loading = false;
    this.mapService.deselectAggregatedRegion();
  }

  private addExternalBulletins(response) {
    for (const jsonBulletin of response) {
      const bulletin = BulletinModel.createFromJson(jsonBulletin);
      this.addExternalBulletin(bulletin);
    }

    this.updateExternalBulletins();

    this.loading = false;
    this.mapService.deselectAggregatedRegion();
  }

  private updateInternalBulletins() {
    for (const bulletin of this.internBulletinsList) {
      this.mapService.updateAggregatedRegion(bulletin);
    }
  }

  private updateExternalBulletins() {
    for (const bulletin of this.externBulletinsList) {
      this.mapService.addAggregatedRegion(bulletin);
    }
  }

  private addInternalBulletin(bulletin: BulletinModel) {
    this.internBulletinsList.push(bulletin);
    this.internBulletinsList.sort((a, b): number => {
      if (a.getOwnerRegion() < b.getOwnerRegion()) { return 1; }
      if (a.getOwnerRegion() > b.getOwnerRegion()) { return -1; }
      return 0;
    });

    if (bulletin.hasDaytimeDependency && this.showAfternoonMap === false) {
      this.showAfternoonMap = true;
      this.onShowAfternoonMapChange(true);
    }
  }

  private addExternalBulletin(bulletin: BulletinModel) {
    this.externBulletinsList.push(bulletin);
    this.externBulletinsList.sort((a, b): number => {
      if (a.getOwnerRegion() < b.getOwnerRegion()) { return 1; }
      if (a.getOwnerRegion() > b.getOwnerRegion()) { return -1; }
      return 0;
    });
  }

  acceptSuggestions(event, bulletin: BulletinModel) {
    event.stopPropagation();
    const suggested = new Array<String>();
    for (const region of bulletin.getSuggestedRegions()) {
      if (region.startsWith(this.authenticationService.getActiveRegionId())) {

        // delete region from other bulletinInputModels
        for (const b of this.internBulletinsList) {
          const savedRegions = new Array<String>();
          for (const entry of b.getSavedRegions()) {
            if (entry !== region) {
              savedRegions.push(entry);
            }
          }
          b.setSavedRegions(savedRegions);
        }

        bulletin.getSavedRegions().push(region);
      } else {
        suggested.push(region);
      }
    }
    bulletin.setSuggestedRegions(suggested);

    bulletin.addAdditionalAuthor(this.authenticationService.getAuthor().getName());

    this.bulletinsService.updateBulletin(bulletin, this.bulletinsService.getActiveDate());

    this.updateAggregatedRegions();
  }

  rejectSuggestions(event, bulletin: BulletinModel) {
    event.stopPropagation();
    const suggested = new Array<String>();
    for (const region of bulletin.getSuggestedRegions()) {
      if (!region.startsWith(this.authenticationService.getActiveRegionId())) {
        suggested.push(region);
      }
    }
    bulletin.setSuggestedRegions(suggested);

    this.bulletinsService.updateBulletin(bulletin, this.bulletinsService.getActiveDate());

    this.updateAggregatedRegions();
  }

  private createInitialAggregatedRegion() {
    const bulletin = new BulletinModel();
    bulletin.setAuthor(this.authenticationService.getAuthor());
    bulletin.addAdditionalAuthor(this.authenticationService.getAuthor().getName());
    bulletin.setOwnerRegion(this.authenticationService.getActiveRegionId());
    const regions = Object.assign([], this.regionsService.initialAggregatedRegion[this.authenticationService.getActiveRegionId()]);
    bulletin.setSavedRegions(regions);

    this.addInternalBulletin(bulletin);
  }


  createBulletin(copy) {
    let bulletin: BulletinModel;
    if (copy && this.copyService.getBulletin()) {
      bulletin = this.copyService.getBulletin();
      this.copyService.resetCopyBulletin();
    } else {
      this.showNewBulletinModal = true;
      bulletin = new BulletinModel();
      bulletin.setAuthor(this.authenticationService.getAuthor());
      bulletin.addAdditionalAuthor(this.authenticationService.getAuthor().getName());
      bulletin.setOwnerRegion(this.authenticationService.getActiveRegionId());
    }

    this.addInternalBulletin(bulletin);
    this.selectBulletin(bulletin);
    this.mapService.selectAggregatedRegion(bulletin);
    this.editBulletinRegions();
    // Always create 1 problem
    this.createAvalancheProblem(false);

    // create bulletin
    this.bulletinsService.createBulletin(bulletin, this.bulletinsService.getActiveDate());
  }

  copyBulletin() {
    this.setTexts();
    if (this.activeBulletin) {
      const bulletin = new BulletinModel(this.activeBulletin);
      bulletin.setAdditionalAuthors(new Array<String>());
      bulletin.setSavedRegions(new Array<String>());
      bulletin.setPublishedRegions(new Array<String>());
      bulletin.setSuggestedRegions(new Array<String>());

      bulletin.setAuthor(this.authenticationService.getAuthor());
      bulletin.addAdditionalAuthor(this.authenticationService.getAuthor().getName());
      bulletin.setOwnerRegion(this.authenticationService.getActiveRegionId());
      this.copyService.setCopyBulletin(true);
      this.copyService.setBulletin(bulletin);
    }
  }

  toggleBulletin(bulletin: BulletinModel) {
    if (this.activeBulletin && bulletin === this.activeBulletin) {
      this.deselectBulletin();
    } else {
      this.selectBulletin(bulletin);
    }
  }
  
  selectBulletin(bulletin: BulletinModel) {
    if (!this.editRegions) {
      this.deselectBulletin();

      this.activeBulletin = bulletin;

      // lock bulletin
      if (!this.bulletinsService.isLocked(this.activeBulletin.getId()) && this.activeBulletin.getOwnerRegion().startsWith(this.authenticationService.getActiveRegionId())) {
        this.bulletinsService.lockBulletin(this.bulletinsService.getActiveDate(), this.activeBulletin.getId());
      }

      this.activeHighlightsTextcat = this.activeBulletin.getHighlightsTextcat();
      this.activeHighlightsDe = this.activeBulletin.getHighlightsIn(Enums.LanguageCode.de);
      this.activeHighlightsIt = this.activeBulletin.getHighlightsIn(Enums.LanguageCode.it);
      this.activeHighlightsEn = this.activeBulletin.getHighlightsIn(Enums.LanguageCode.en);
      this.activeHighlightsFr = this.activeBulletin.getHighlightsIn(Enums.LanguageCode.fr);
      this.activeHighlightsEs = this.activeBulletin.getHighlightsIn(Enums.LanguageCode.es);
      this.activeHighlightsCa = this.activeBulletin.getHighlightsIn(Enums.LanguageCode.ca);
      this.activeHighlightsOc = this.activeBulletin.getHighlightsIn(Enums.LanguageCode.oc);

      this.activeAvActivityHighlightsTextcat = this.activeBulletin.getAvActivityHighlightsTextcat();
      this.activeAvActivityHighlightsDe = this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.de);
      this.activeAvActivityHighlightsIt = this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.it);
      this.activeAvActivityHighlightsEn = this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.en);
      this.activeAvActivityHighlightsFr = this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.fr);
      this.activeAvActivityHighlightsEs = this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.es);
      this.activeAvActivityHighlightsCa = this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.ca);
      this.activeAvActivityHighlightsOc = this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.oc);
      this.activeAvActivityHighlightsNotes = this.activeBulletin.getAvActivityHighlightsNotes();

      this.activeAvActivityCommentTextcat = this.activeBulletin.getAvActivityCommentTextcat();
      this.activeAvActivityCommentDe = this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.de);
      this.activeAvActivityCommentIt = this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.it);
      this.activeAvActivityCommentEn = this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.en);
      this.activeAvActivityCommentFr = this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.fr);
      this.activeAvActivityCommentEs = this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.es);
      this.activeAvActivityCommentCa = this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.ca);
      this.activeAvActivityCommentOc = this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.oc);
      this.activeAvActivityCommentNotes = this.activeBulletin.getAvActivityCommentNotes();

      this.activeSnowpackStructureHighlightsTextcat = this.activeBulletin.getSnowpackStructureHighlightsTextcat();
      this.activeSnowpackStructureHighlightsDe = this.activeBulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.de);
      this.activeSnowpackStructureHighlightsIt = this.activeBulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.it);
      this.activeSnowpackStructureHighlightsEn = this.activeBulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.en);
      this.activeSnowpackStructureHighlightsFr = this.activeBulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.fr);
      this.activeSnowpackStructureHighlightsEs = this.activeBulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.es);
      this.activeSnowpackStructureHighlightsCa = this.activeBulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.ca);
      this.activeSnowpackStructureHighlightsOc = this.activeBulletin.getSnowpackStructureHighlightIn(Enums.LanguageCode.oc);
      this.activeSnowpackStructureHighlightsNotes = this.activeBulletin.getSnowpackStructureHighlightsNotes();

      this.activeSnowpackStructureCommentTextcat = this.activeBulletin.getSnowpackStructureCommentTextcat();
      this.activeSnowpackStructureCommentDe = this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.de);
      this.activeSnowpackStructureCommentIt = this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.it);
      this.activeSnowpackStructureCommentEn = this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.en);
      this.activeSnowpackStructureCommentFr = this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.fr);
      this.activeSnowpackStructureCommentEs = this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.es);
      this.activeSnowpackStructureCommentCa = this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.ca);
      this.activeSnowpackStructureCommentOc = this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.oc);
      this.activeSnowpackStructureCommentNotes = this.activeBulletin.getSnowpackStructureCommentNotes();

      this.activeTendencyCommentTextcat = this.activeBulletin.getTendencyCommentTextcat();
      this.activeTendencyCommentDe = this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.de);
      this.activeTendencyCommentIt = this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.it);
      this.activeTendencyCommentEn = this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.en);
      this.activeTendencyCommentFr = this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.fr);
      this.activeTendencyCommentEs = this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.es);
      this.activeTendencyCommentCa = this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.ca);
      this.activeTendencyCommentOc = this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.oc);
      this.activeTendencyCommentNotes = this.activeBulletin.getTendencyCommentNotes();

      this.mapService.selectAggregatedRegion(this.activeBulletin);
    }
  }

  deselectBulletin(del?: boolean) {
    if (!this.editRegions && this.activeBulletin !== null && this.activeBulletin !== undefined) {

      this.setTexts();

      if (this.activeAvActivityHighlightsTextcat) {
        this.activeBulletin.setAvActivityHighlightsTextcat(this.activeAvActivityHighlightsTextcat);
      }

      if (this.activeAvActivityCommentTextcat) {
        this.activeBulletin.setAvActivityCommentTextcat(this.activeAvActivityCommentTextcat);
      }

      if (this.activeSnowpackStructureCommentTextcat) {
        this.activeBulletin.setSnowpackStructureCommentTextcat(this.activeSnowpackStructureCommentTextcat);
      }

      if (this.activeTendencyCommentTextcat) {
        this.activeBulletin.setTendencyCommentTextcat(this.activeTendencyCommentTextcat);
      }

      this.mapService.deselectAggregatedRegion();
      
      // update bulletin
      this.bulletinsService.updateBulletin(this.activeBulletin, this.bulletinsService.getActiveDate());
      // lock bulletin
      this.bulletinsService.unlockBulletin(this.bulletinsService.getActiveDate(), this.activeBulletin.getId());
      
      this.activeBulletin = undefined;

      this.applicationRef.tick();
    }

    setTimeout(() => {
      this.mapService.map.invalidateSize();
    }, 10);
  }

  preview() {
    this.loadingPreview = true;
    this.bulletinsService.getPreviewPdf(this.bulletinsService.getActiveDate()).subscribe(blob => {
      this.loadingPreview = false;
      const format = "yyyy-MM-dd";
      const locale = "en-US";
      const formattedDate = formatDate(this.bulletinsService.getActiveDate(), format, locale);
      saveAs(blob, "PREVIEW_" + formattedDate + ".pdf");
      console.log("Preview loaded.");
    })
  }

  daytimeDependencyChanged(event, value) {
    event.stopPropagation();
    if (this.bulletinsService.getIsEditable() && this.bulletinsService.isLocked(this.activeBulletin.getId()) && this.isCreator(this.activeBulletin)) {
      this.activeBulletin.setHasDaytimeDependency(value);

      if (this.activeBulletin.hasDaytimeDependency) {
        if (this.showAfternoonMap === false) {
          this.showAfternoonMap = true;
          this.onShowAfternoonMapChange(true);
        }
        this.activeBulletin.afternoon.setDangerRatingAbove(this.activeBulletin.forenoon.getDangerRatingAbove());
        if (this.activeBulletin.forenoon.getAvalancheProblem1() && this.activeBulletin.forenoon.getAvalancheProblem1() !== undefined) {
          this.activeBulletin.afternoon.setAvalancheProblem1(new AvalancheProblemModel(this.activeBulletin.forenoon.getAvalancheProblem1()));
        }
        if (this.activeBulletin.forenoon.getAvalancheProblem2() && this.activeBulletin.forenoon.getAvalancheProblem2() !== undefined) {
          this.activeBulletin.afternoon.setAvalancheProblem2(new AvalancheProblemModel(this.activeBulletin.forenoon.getAvalancheProblem2()));
        }
        if (this.activeBulletin.forenoon.getAvalancheProblem3() && this.activeBulletin.forenoon.getAvalancheProblem3() !== undefined) {
          this.activeBulletin.afternoon.setAvalancheProblem3(new AvalancheProblemModel(this.activeBulletin.forenoon.getAvalancheProblem3()));
        }
        if (this.activeBulletin.forenoon.getAvalancheProblem4() && this.activeBulletin.forenoon.getAvalancheProblem4() !== undefined) {
          this.activeBulletin.afternoon.setAvalancheProblem4(new AvalancheProblemModel(this.activeBulletin.forenoon.getAvalancheProblem4()));
        }
        if (this.activeBulletin.forenoon.getAvalancheProblem5() && this.activeBulletin.forenoon.getAvalancheProblem5() !== undefined) {
          this.activeBulletin.afternoon.setAvalancheProblem5(new AvalancheProblemModel(this.activeBulletin.forenoon.getAvalancheProblem5()));
        }
        if (this.activeBulletin.forenoon.hasElevationDependency) {
          this.activeBulletin.afternoon.setHasElevationDependency(true);
          this.activeBulletin.afternoon.setDangerRatingBelow(this.activeBulletin.forenoon.getDangerRatingBelow());
        }
      } else {
        this.activeBulletin.afternoon.setDangerRatingAbove(new BehaviorSubject<Enums.DangerRating>(Enums.DangerRating.missing));
        this.activeBulletin.afternoon.setAvalancheProblem1(undefined);
        this.activeBulletin.afternoon.setAvalancheProblem2(undefined);
        this.activeBulletin.afternoon.setAvalancheProblem3(undefined);
        this.activeBulletin.afternoon.setAvalancheProblem4(undefined);
        this.activeBulletin.afternoon.setAvalancheProblem5(undefined);
        this.activeBulletin.afternoon.setHasElevationDependency(false);
        this.activeBulletin.afternoon.setDangerRatingBelow(new BehaviorSubject<Enums.DangerRating>(Enums.DangerRating.missing));
        let daytimeDependency = false;
        for (const bulletin of this.internBulletinsList.concat(this.externBulletinsList)) {
          if (bulletin.hasDaytimeDependency) {
            daytimeDependency = true;
            break;
          }
        }
        if (!daytimeDependency && this.showAfternoonMap) {
          this.showAfternoonMap = false;
          this.onShowAfternoonMapChange(false);
        }
      }
      this.activeBulletin.getForenoon().updateDangerRating();
      this.activeBulletin.getAfternoon().updateDangerRating();
      this.mapService.updateAggregatedRegion(this.activeBulletin);
      this.mapService.selectAggregatedRegion(this.activeBulletin);
    }
  }

  private checkAvalancheProblems(): boolean {
    let error = false;

    for (const bulletin of this.internBulletinsList) {
      if (bulletin.forenoon) {
        if (bulletin.forenoon.avalancheProblem1) {
          if (
            bulletin.forenoon.avalancheProblem1.getAspects().length <= 0 ||
            !bulletin.forenoon.avalancheProblem1.getAvalancheProblem() ||
            !bulletin.forenoon.avalancheProblem1.getDangerRating() ||
            bulletin.forenoon.avalancheProblem1.getDangerRating() == Enums.DangerRating.missing ||
            !bulletin.forenoon.avalancheProblem1.getMatrixInformation() ||
            !bulletin.forenoon.avalancheProblem1.getMatrixInformation().getSnowpackStability() ||
            !bulletin.forenoon.avalancheProblem1.getMatrixInformation().getFrequency() ||
            !bulletin.forenoon.avalancheProblem1.getMatrixInformation().getAvalancheSize())
          {
            error = true;
          }
        }
        if (bulletin.forenoon.avalancheProblem2) {
          if (
            bulletin.forenoon.avalancheProblem2.getAspects().length <= 0 ||
            !bulletin.forenoon.avalancheProblem2.getAvalancheProblem() ||
            !bulletin.forenoon.avalancheProblem2.getDangerRating() ||
            bulletin.forenoon.avalancheProblem2.getDangerRating() == Enums.DangerRating.missing ||
            !bulletin.forenoon.avalancheProblem2.getMatrixInformation() ||
            !bulletin.forenoon.avalancheProblem2.getMatrixInformation().getSnowpackStability() ||
            !bulletin.forenoon.avalancheProblem2.getMatrixInformation().getFrequency() ||
            !bulletin.forenoon.avalancheProblem2.getMatrixInformation().getAvalancheSize())
          {
            error = true;
          }
        }
        if (bulletin.forenoon.avalancheProblem3) {
          if (
            bulletin.forenoon.avalancheProblem3.getAspects().length <= 0 ||
            !bulletin.forenoon.avalancheProblem3.getAvalancheProblem() ||
            !bulletin.forenoon.avalancheProblem3.getDangerRating() ||
            bulletin.forenoon.avalancheProblem3.getDangerRating() == Enums.DangerRating.missing ||
            !bulletin.forenoon.avalancheProblem3.getMatrixInformation() ||
            !bulletin.forenoon.avalancheProblem3.getMatrixInformation().getSnowpackStability() ||
            !bulletin.forenoon.avalancheProblem3.getMatrixInformation().getFrequency() ||
            !bulletin.forenoon.avalancheProblem3.getMatrixInformation().getAvalancheSize())
          {
            error = true;
          }
        }
        if (bulletin.forenoon.avalancheProblem4) {
          if (
            bulletin.forenoon.avalancheProblem4.getAspects().length <= 0 ||
            !bulletin.forenoon.avalancheProblem4.getAvalancheProblem() ||
            !bulletin.forenoon.avalancheProblem4.getDangerRating() ||
            bulletin.forenoon.avalancheProblem4.getDangerRating() == Enums.DangerRating.missing ||
            !bulletin.forenoon.avalancheProblem4.getMatrixInformation() ||
            !bulletin.forenoon.avalancheProblem4.getMatrixInformation().getSnowpackStability() ||
            !bulletin.forenoon.avalancheProblem4.getMatrixInformation().getFrequency() ||
            !bulletin.forenoon.avalancheProblem4.getMatrixInformation().getAvalancheSize())
          {
            error = true;
          }
        }
        if (bulletin.forenoon.avalancheProblem5) {
          if (
            bulletin.forenoon.avalancheProblem5.getAspects().length <= 0 ||
            !bulletin.forenoon.avalancheProblem5.getAvalancheProblem() ||
            !bulletin.forenoon.avalancheProblem5.getDangerRating() ||
            bulletin.forenoon.avalancheProblem5.getDangerRating() == Enums.DangerRating.missing ||
            !bulletin.forenoon.avalancheProblem5.getMatrixInformation() ||
            !bulletin.forenoon.avalancheProblem5.getMatrixInformation().getSnowpackStability() ||
            !bulletin.forenoon.avalancheProblem5.getMatrixInformation().getFrequency() ||
            !bulletin.forenoon.avalancheProblem5.getMatrixInformation().getAvalancheSize())
          {
            error = true;
          }
        }
      }
      if (bulletin.afternoon) {
        if (bulletin.afternoon.avalancheProblem1) {
          if (
            bulletin.afternoon.avalancheProblem1.getAspects().length <= 0 ||
            !bulletin.afternoon.avalancheProblem1.getAvalancheProblem() ||
            !bulletin.afternoon.avalancheProblem1.getDangerRating() ||
            bulletin.afternoon.avalancheProblem1.getDangerRating() == Enums.DangerRating.missing ||
            !bulletin.afternoon.avalancheProblem1.getMatrixInformation() ||
            !bulletin.afternoon.avalancheProblem1.getMatrixInformation().getSnowpackStability() ||
            !bulletin.afternoon.avalancheProblem1.getMatrixInformation().getFrequency() ||
            !bulletin.afternoon.avalancheProblem1.getMatrixInformation().getAvalancheSize())
          {
            error = true;
          }
        }
        if (bulletin.afternoon.avalancheProblem2) {
          if (
            bulletin.afternoon.avalancheProblem2.getAspects().length <= 0 ||
            !bulletin.afternoon.avalancheProblem2.getAvalancheProblem() ||
            !bulletin.afternoon.avalancheProblem2.getDangerRating() ||
            bulletin.afternoon.avalancheProblem2.getDangerRating() == Enums.DangerRating.missing ||
            !bulletin.afternoon.avalancheProblem2.getMatrixInformation() ||
            !bulletin.afternoon.avalancheProblem2.getMatrixInformation().getSnowpackStability() ||
            !bulletin.afternoon.avalancheProblem2.getMatrixInformation().getFrequency() ||
            !bulletin.afternoon.avalancheProblem2.getMatrixInformation().getAvalancheSize())
          {
            error = true;
          }
        }
        if (bulletin.afternoon.avalancheProblem3) {
          if (
            bulletin.afternoon.avalancheProblem3.getAspects().length <= 0 ||
            !bulletin.afternoon.avalancheProblem3.getAvalancheProblem() ||
            !bulletin.afternoon.avalancheProblem3.getDangerRating() ||
            bulletin.afternoon.avalancheProblem3.getDangerRating() == Enums.DangerRating.missing ||
            !bulletin.afternoon.avalancheProblem3.getMatrixInformation() ||
            !bulletin.afternoon.avalancheProblem3.getMatrixInformation().getSnowpackStability() ||
            !bulletin.afternoon.avalancheProblem3.getMatrixInformation().getFrequency() ||
            !bulletin.afternoon.avalancheProblem3.getMatrixInformation().getAvalancheSize())
          {
            error = true;
          }
        }
        if (bulletin.afternoon.avalancheProblem4) {
          if (
            bulletin.afternoon.avalancheProblem4.getAspects().length <= 0 ||
            !bulletin.afternoon.avalancheProblem4.getAvalancheProblem() ||
            !bulletin.afternoon.avalancheProblem4.getDangerRating() ||
            bulletin.afternoon.avalancheProblem4.getDangerRating() == Enums.DangerRating.missing ||
            !bulletin.afternoon.avalancheProblem4.getMatrixInformation() ||
            !bulletin.afternoon.avalancheProblem4.getMatrixInformation().getSnowpackStability() ||
            !bulletin.afternoon.avalancheProblem4.getMatrixInformation().getFrequency() ||
            !bulletin.afternoon.avalancheProblem4.getMatrixInformation().getAvalancheSize())
          {
            error = true;
          }
        }
        if (bulletin.afternoon.avalancheProblem5) {
          if (
            bulletin.afternoon.avalancheProblem5.getAspects().length <= 0 ||
            !bulletin.afternoon.avalancheProblem5.getAvalancheProblem() ||
            !bulletin.afternoon.avalancheProblem5.getDangerRating() ||
            bulletin.afternoon.avalancheProblem5.getDangerRating() == Enums.DangerRating.missing ||
            !bulletin.afternoon.avalancheProblem5.getMatrixInformation() ||
            !bulletin.afternoon.avalancheProblem5.getMatrixInformation().getSnowpackStability() ||
            !bulletin.afternoon.avalancheProblem5.getMatrixInformation().getFrequency() ||
            !bulletin.afternoon.avalancheProblem5.getMatrixInformation().getAvalancheSize())
          {
            error = true;
          }
        }
      }
    }

    if (error) {
      this.openAvalancheProblemErrorModal(this.avalancheProblemErrorTemplate);
    } else {
      return true;
    }
  }

  private setTexts() {
    if (this.activeBulletin) {
      this.activeBulletin.setHighlightsTextcat(this.activeHighlightsTextcat);
      this.activeBulletin.setHighlightsIn(this.activeHighlightsDe, Enums.LanguageCode.de);
      this.activeBulletin.setHighlightsIn(this.activeHighlightsIt, Enums.LanguageCode.it);
      this.activeBulletin.setHighlightsIn(this.activeHighlightsEn, Enums.LanguageCode.en);
      this.activeBulletin.setHighlightsIn(this.activeHighlightsFr, Enums.LanguageCode.fr);
      this.activeBulletin.setHighlightsIn(this.activeHighlightsEs, Enums.LanguageCode.es);
      this.activeBulletin.setHighlightsIn(this.activeHighlightsCa, Enums.LanguageCode.ca);
      this.activeBulletin.setHighlightsIn(this.activeHighlightsOc, Enums.LanguageCode.oc);

      this.activeBulletin.setAvActivityHighlightsTextcat(this.activeAvActivityHighlightsTextcat);
      this.activeBulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsDe, Enums.LanguageCode.de);
      this.activeBulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsIt, Enums.LanguageCode.it);
      this.activeBulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsEn, Enums.LanguageCode.en);
      this.activeBulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsFr, Enums.LanguageCode.fr);
      this.activeBulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsEs, Enums.LanguageCode.es);
      this.activeBulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsCa, Enums.LanguageCode.ca);
      this.activeBulletin.setAvActivityHighlightsIn(this.activeAvActivityHighlightsOc, Enums.LanguageCode.oc);
      this.activeBulletin.setAvActivityHighlightsNotes(this.activeAvActivityHighlightsNotes);

      this.activeBulletin.setAvActivityCommentTextcat(this.activeAvActivityCommentTextcat);
      this.activeBulletin.setAvActivityCommentIn(this.activeAvActivityCommentDe, Enums.LanguageCode.de);
      this.activeBulletin.setAvActivityCommentIn(this.activeAvActivityCommentIt, Enums.LanguageCode.it);
      this.activeBulletin.setAvActivityCommentIn(this.activeAvActivityCommentEn, Enums.LanguageCode.en);
      this.activeBulletin.setAvActivityCommentIn(this.activeAvActivityCommentFr, Enums.LanguageCode.fr);
      this.activeBulletin.setAvActivityCommentIn(this.activeAvActivityCommentEs, Enums.LanguageCode.es);
      this.activeBulletin.setAvActivityCommentIn(this.activeAvActivityCommentCa, Enums.LanguageCode.ca);
      this.activeBulletin.setAvActivityCommentIn(this.activeAvActivityCommentOc, Enums.LanguageCode.oc);
      this.activeBulletin.setAvActivityCommentNotes(this.activeAvActivityCommentNotes);

      this.activeBulletin.setSnowpackStructureHighlightsTextcat(this.activeSnowpackStructureHighlightsTextcat);
      this.activeBulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsDe, Enums.LanguageCode.de);
      this.activeBulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsIt, Enums.LanguageCode.it);
      this.activeBulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsEn, Enums.LanguageCode.en);
      this.activeBulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsFr, Enums.LanguageCode.fr);
      this.activeBulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsEs, Enums.LanguageCode.es);
      this.activeBulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsCa, Enums.LanguageCode.ca);
      this.activeBulletin.setSnowpackStructureHighlightsIn(this.activeSnowpackStructureHighlightsOc, Enums.LanguageCode.oc);
      this.activeBulletin.setSnowpackStructureHighlightsNotes(this.activeSnowpackStructureHighlightsNotes);

      this.activeBulletin.setSnowpackStructureCommentTextcat(this.activeSnowpackStructureCommentTextcat);
      this.activeBulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentDe, Enums.LanguageCode.de);
      this.activeBulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentIt, Enums.LanguageCode.it);
      this.activeBulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentEn, Enums.LanguageCode.en);
      this.activeBulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentFr, Enums.LanguageCode.fr);
      this.activeBulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentEs, Enums.LanguageCode.es);
      this.activeBulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentCa, Enums.LanguageCode.ca);
      this.activeBulletin.setSnowpackStructureCommentIn(this.activeSnowpackStructureCommentOc, Enums.LanguageCode.oc);
      this.activeBulletin.setSnowpackStructureCommentNotes(this.activeSnowpackStructureCommentNotes);

      this.activeBulletin.setTendencyCommentTextcat(this.activeTendencyCommentTextcat);
      this.activeBulletin.setTendencyCommentIn(this.activeTendencyCommentDe, Enums.LanguageCode.de);
      this.activeBulletin.setTendencyCommentIn(this.activeTendencyCommentIt, Enums.LanguageCode.it);
      this.activeBulletin.setTendencyCommentIn(this.activeTendencyCommentEn, Enums.LanguageCode.en);
      this.activeBulletin.setTendencyCommentIn(this.activeTendencyCommentFr, Enums.LanguageCode.fr);
      this.activeBulletin.setTendencyCommentIn(this.activeTendencyCommentEs, Enums.LanguageCode.es);
      this.activeBulletin.setTendencyCommentIn(this.activeTendencyCommentCa, Enums.LanguageCode.ca);
      this.activeBulletin.setTendencyCommentIn(this.activeTendencyCommentOc, Enums.LanguageCode.oc);
      this.activeBulletin.setTendencyCommentNotes(this.activeTendencyCommentNotes);
    }
  }

  deleteBulletin(event, bulletin: BulletinModel) {
    event.stopPropagation();
    this.bulletinMarkedDelete = bulletin;
    this.openDeleteAggregatedRegionModal(this.deleteAggregatedRegionTemplate);
  }

  compareBulletin(event, bulletin: BulletinModel) {
    event.stopPropagation();
    // TODO implement
  }

  // region
  private delBulletin(bulletin: BulletinModel) {

    // check if there are other published or saved regions
    let hit = false;
    let newOwnerRegion = "";
    for (const region of bulletin.getPublishedRegions()) {
      if (!region.startsWith(this.authenticationService.getActiveRegionId())) {
        hit = true;
        if (region.startsWith(this.constantsService.codeTyrol)) {
          newOwnerRegion = this.constantsService.codeTyrol;
        } else if (region.startsWith(this.constantsService.codeSouthTyrol)) {
          newOwnerRegion = this.constantsService.codeSouthTyrol;
        } else if (region.startsWith(this.constantsService.codeTrentino)) {
          newOwnerRegion = this.constantsService.codeTrentino;
        }
        break;
      }
    }
    if (!hit) {
      for (const region of bulletin.getSavedRegions()) {
        if (!region.startsWith(this.authenticationService.getActiveRegionId())) {
          hit = true;
          if (region.startsWith(this.constantsService.codeTyrol)) {
            newOwnerRegion = this.constantsService.codeTyrol;
          } else if (region.startsWith(this.constantsService.codeSouthTyrol)) {
            newOwnerRegion = this.constantsService.codeSouthTyrol;
          } else if (region.startsWith(this.constantsService.codeTrentino)) {
            newOwnerRegion = this.constantsService.codeTrentino;
          }
          break;
        }
      }
    }

    if (hit) {
      // delete own saved regions
      const oldSavedRegions = new Array<String>();
      for (const region of bulletin.getSavedRegions()) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          oldSavedRegions.push(region);
        }
      }
      for (const region of oldSavedRegions) {
        const index = bulletin.getSavedRegions().indexOf(region);
        bulletin.getSavedRegions().splice(index, 1);
      }

      // delete own published regions
      const oldPublishedRegions = new Array<String>();
      for (const region of bulletin.getPublishedRegions()) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          oldPublishedRegions.push(region);
        }
      }
      for (const region of oldPublishedRegions) {
        const index = bulletin.getPublishedRegions().indexOf(region);
        bulletin.getPublishedRegions().splice(index, 1);
      }

      // change ownership
      bulletin.setOwnerRegion(newOwnerRegion);

      // update bulletin
      this.bulletinsService.updateBulletin(bulletin, this.bulletinsService.getActiveDate());
    } else {
      const index = this.internBulletinsList.indexOf(bulletin);
      if (index > -1) {
        this.internBulletinsList.splice(index, 1);
        // delete bulletin
        this.bulletinsService.deleteBulletin(bulletin, this.bulletinsService.getActiveDate());
      }
    }

    this.mapService.resetAggregatedRegions();
    this.updateInternalBulletins();
    this.updateExternalBulletins();
    this.deselectBulletin(true);
  }

  editBulletin(event) {
    event.stopPropagation();
    this.showNewBulletinModal = true;
    this.editBulletinRegions();
  }

  private editBulletinRegions() {
    this.editRegions = true;
    this.mapService.editAggregatedRegion(this.activeBulletin);
  }

  saveBulletin(event) {
    event.stopPropagation();

    this.showNewBulletinModal = false;

    // save selected regions to active bulletin
    const regions = this.mapService.getSelectedRegions();

    for (const region of this.activeBulletin.getSavedRegions()) {
      if (region.startsWith(this.authenticationService.getActiveRegionId())) {
        break;
      }
    }

    let newRegionsHit = false;
    for (const region of regions) {
      if (region.startsWith(this.authenticationService.getActiveRegionId())) {
        newRegionsHit = true;
        break;
      }
    }

    if (newRegionsHit || !this.activeBulletin.getOwnerRegion().startsWith(this.authenticationService.getActiveRegionId())) {
      this.editRegions = false;

      // delete old saved regions in own area
      const oldSavedRegions = new Array<String>();
      for (const region of this.activeBulletin.getSavedRegions()) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          oldSavedRegions.push(region);
        }
      }
      for (const region of oldSavedRegions) {
        const index = this.activeBulletin.getSavedRegions().indexOf(region);
        this.activeBulletin.getSavedRegions().splice(index, 1);
      }

      // delete old published regions in own area
      const oldPublishedRegions = new Array<String>();
      for (const region of this.activeBulletin.getPublishedRegions()) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          oldPublishedRegions.push(region);
        }
      }
      for (const region of oldPublishedRegions) {
        const index = this.activeBulletin.getPublishedRegions().indexOf(region);
        this.activeBulletin.getPublishedRegions().splice(index, 1);
      }

      // delete old suggested regions outside own area
      const oldSuggestedRegions = new Array<String>();
      for (const region of this.activeBulletin.getSuggestedRegions()) {
        if (!region.startsWith(this.authenticationService.getActiveRegionId())) {
          oldSuggestedRegions.push(region);
        }
      }
      for (const region of oldSuggestedRegions) {
        const index = this.activeBulletin.getSuggestedRegions().indexOf(region);
        this.activeBulletin.getSuggestedRegions().splice(index, 1);
      }

      for (const region of regions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          if (this.activeBulletin.getSavedRegions().indexOf(region) === -1) {
            this.activeBulletin.getSavedRegions().push(region);
          }
        } else {
          if ((this.activeBulletin.getSavedRegions().indexOf(region) === -1) && (this.activeBulletin.getSuggestedRegions().indexOf(region) === -1) && (this.activeBulletin.getPublishedRegions().indexOf(region) === -1)) {
            this.activeBulletin.getSuggestedRegions().push(region);
          }
        }
      }

      this.updateAggregatedRegions();

      // update bulletin
      this.bulletinsService.updateBulletin(this.activeBulletin, this.bulletinsService.getActiveDate());

    } else {
      this.openNoRegionModal(this.noRegionTemplate);
    }
  }

  private updateAggregatedRegions() {

    this.mapService.resetAggregatedRegions();

    for (const bulletin of this.internBulletinsList) {
      if (bulletin !== this.activeBulletin) {
        // regions saved by me (only in own area possible)
        for (const region of this.activeBulletin.getSavedRegions()) {
          // region was saved in other aggregated region => delete
          let index = bulletin.getSavedRegions().indexOf(region);
          if (index !== -1) {
            bulletin.getSavedRegions().splice(index, 1);
          }

          // region was published in other aggregated region => delete
          index = bulletin.getPublishedRegions().indexOf(region);
          if (region.startsWith(this.authenticationService.getActiveRegionId()) && index !== -1) {
            bulletin.getPublishedRegions().splice(index, 1);
          }

          // region was suggested by other user (multiple suggestions possible for same region) => delete all)
          index = bulletin.getSuggestedRegions().indexOf(region);
          if (index !== -1) {
            bulletin.getSuggestedRegions().splice(index, 1);
          }
        }

        // regions suggested by me (only in foreign area possible)
        // region was published => delete suggestion
        for (const region of bulletin.getPublishedRegions()) {
          const index = this.activeBulletin.getSuggestedRegions().indexOf(region);
          if (index !== -1) {
            this.activeBulletin.getSuggestedRegions().splice(index, 1);
          }
        }
      }
      this.mapService.addAggregatedRegion(bulletin);
    }

    for (const bulletin of this.externBulletinsList) {
      this.mapService.addAggregatedRegion(bulletin);
    }

    this.mapService.discardAggregatedRegion();
    this.mapService.selectAggregatedRegion(this.activeBulletin);
  }

  hasSuggestions(bulletin: BulletinModel): boolean {
    for (const region of bulletin.getSuggestedRegions()) {
      if (region.startsWith(this.authenticationService.getActiveRegionId())) {
        return true;
      }
    }
    return false;
  }

  isCreator(bulletin: BulletinModel): boolean {
    if (bulletin.getOwnerRegion() !== undefined && bulletin.getOwnerRegion().startsWith(this.authenticationService.getActiveRegionId())) {
      return true;
    }
    return false;
  }

  showPreviewButton() {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
      (!this.publishing || this.publishing.getTime() !== this.bulletinsService.getActiveDate().getTime()) &&
      (
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.draft ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.updated ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.submitted ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.resubmitted ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.published ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.republished 
      ) &&
      !this.copying &&
      (
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman)
      )
     ) {
      return true;
    } else {
      return false;
    }
  }

  discardBulletin(event, bulletin?: BulletinModel) {
    event.stopPropagation();
    this.showNewBulletinModal = false;
    this.editRegions = false;
    
    if (bulletin !== undefined && bulletin.getSavedRegions().length === 0) {
      this.delBulletin(bulletin);
    }

    this.mapService.discardAggregatedRegion();

    if (this.activeBulletin && this.activeBulletin !== undefined) {
      this.mapService.selectAggregatedRegion(this.activeBulletin);
    }
  }

  save() {
    if (this.internBulletinsList.length > 0) {
      this.autoSaving = true;
      this.setTexts();

      const validFrom = new Date(this.bulletinsService.getActiveDate());
      const validUntil = new Date(this.bulletinsService.getActiveDate());
      validUntil.setTime(validUntil.getTime() + (24 * 60 * 60 * 1000));

      const result = new Array<BulletinModel>();

      for (const bulletin of this.internBulletinsList) {
        const regions = bulletin.getPublishedRegions().concat(bulletin.getSavedRegions());
        for (const region of regions) {
          if (region.startsWith(this.authenticationService.getActiveRegionId())) {
            bulletin.setValidFrom(validFrom);
            bulletin.setValidUntil(validUntil);
            result.push(bulletin);
            break;
          }
        }
      }

      if (result.length > 0) {
        this.bulletinsService.saveBulletins(result, this.bulletinsService.getActiveDate()).subscribe(
          () => {
            console.log("Bulletins saved on server.");
            this.autoSaving = false;
          },
          () => {
            this.autoSaving = false;
            console.error("Bulletins could not be saved on server!");
            this.openSaveErrorModal(this.saveErrorTemplate);
          }
        );
      }
    }
  }

  goBack() {
    this.router.navigate(["/bulletins"]);
  }

  @HostListener("document:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.keyCode === 27 && this.editRegions) {
      this.discardBulletin(event);
    } else if (event.keyCode === 27 && (this.copyService.isCopyTextcat() || this.copyService.isCopyBulletin())) {
      this.copyService.resetCopyTextcat();
      this.copyService.resetCopyBulletin();
    }
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
        this.copyService.setTextTextcat(this.activeBulletin.getHighlightsTextcat());
        this.copyService.setTextDe(this.activeBulletin.getHighlightsIn(Enums.LanguageCode.de));
        this.copyService.setTextIt(this.activeBulletin.getHighlightsIn(Enums.LanguageCode.it));
        this.copyService.setTextEn(this.activeBulletin.getHighlightsIn(Enums.LanguageCode.en));
        this.copyService.setTextFr(this.activeBulletin.getHighlightsIn(Enums.LanguageCode.fr));
        this.copyService.setTextEs(this.activeBulletin.getHighlightsIn(Enums.LanguageCode.es));
        this.copyService.setTextCa(this.activeBulletin.getHighlightsIn(Enums.LanguageCode.ca));
        this.copyService.setTextOc(this.activeBulletin.getHighlightsIn(Enums.LanguageCode.oc));
        break;
      case "avActivityHighlights":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.activeBulletin.getAvActivityHighlightsTextcat());
        this.copyService.setTextDe(this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.de));
        this.copyService.setTextIt(this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.it));
        this.copyService.setTextEn(this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.en));
        this.copyService.setTextFr(this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.fr));
        this.copyService.setTextEs(this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.es));
        this.copyService.setTextCa(this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.ca));
        this.copyService.setTextOc(this.activeBulletin.getAvActivityHighlightsIn(Enums.LanguageCode.oc));
        break;
      case "avActivityComment":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.activeBulletin.getAvActivityCommentTextcat());
        this.copyService.setTextDe(this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.de));
        this.copyService.setTextIt(this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.it));
        this.copyService.setTextEn(this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.en));
        this.copyService.setTextFr(this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.fr));
        this.copyService.setTextEs(this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.es));
        this.copyService.setTextCa(this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.ca));
        this.copyService.setTextOc(this.activeBulletin.getAvActivityCommentIn(Enums.LanguageCode.oc));
        break;
      case "snowpackStructureComment":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.activeBulletin.getSnowpackStructureCommentTextcat());
        this.copyService.setTextDe(this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.de));
        this.copyService.setTextIt(this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.it));
        this.copyService.setTextEn(this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.en));
        this.copyService.setTextFr(this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.fr));
        this.copyService.setTextEs(this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.es));
        this.copyService.setTextCa(this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.ca));
        this.copyService.setTextOc(this.activeBulletin.getSnowpackStructureCommentIn(Enums.LanguageCode.oc));
        break;
      case "tendencyComment":
        this.copyService.setCopyTextcat(true);
        this.copyService.setTextTextcat(this.activeBulletin.getTendencyCommentTextcat());
        this.copyService.setTextDe(this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.de));
        this.copyService.setTextIt(this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.it));
        this.copyService.setTextEn(this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.en));
        this.copyService.setTextFr(this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.fr));
        this.copyService.setTextEs(this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.es));
        this.copyService.setTextCa(this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.ca));
        this.copyService.setTextOc(this.activeBulletin.getTendencyCommentIn(Enums.LanguageCode.oc));
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
  }

  getText(e) {
    e.preventDefault();
    if (e.data.type !== "webpackInvalid" && e.data.type !== "webpackOk") {
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
    }
  };

  openLoadingErrorModal(template: TemplateRef<any>) {
    this.loadingErrorModalRef = this.modalService.show(template, this.config);
  }

  loadingErrorModalConfirm(): void {
    this.loadingErrorModalRef.hide();
    this.goBack();
  }

  openLoadingJsonFileErrorModal(template: TemplateRef<any>) {
    this.loadingJsonFileErrorModalRef = this.modalService.show(template, this.config);
  }

  loadingJsonFileErrorModalConfirm(): void {
    this.loadingJsonFileErrorModalRef.hide();
  }

  openLoadModal(template: TemplateRef<any>) {
    this.loadModalRef = this.modalService.show(template, this.config);
  }

  loadModalConfirm(event): void {
    event.currentTarget.setAttribute("disabled", true);
    this.loadModalRef.hide();
    this.loading = true;
    const date = new Date(this.bulletinsService.getActiveDate());
    date.setDate(date.getDate() - 1);

    const regions = new Array<String>();
    regions.push(this.authenticationService.getActiveRegionId());

    this.bulletinsService.loadBulletins(date, regions).subscribe(
      data => {

        // delete own regions
        const entries = new Array<BulletinModel>();

        for (const bulletin of this.internBulletinsList) {
          if (bulletin.getOwnerRegion().startsWith(this.authenticationService.getActiveRegionId())) {
            entries.push(bulletin);
          }
        }
        for (const entry of entries) {
          this.delBulletin(entry);
        }

        this.copyBulletins(data);
        this.loading = false;
      },
      () => {
        this.loading = false;
        this.openLoadingErrorModal(this.loadingErrorTemplate);
      }
    );
  }

  loadModalDecline(event): void {
    event.currentTarget.setAttribute("disabled", true);
    this.loadModalRef.hide();
  }

  private loadBulletinsFromServer() {
    const regions = new Array<String>();
    if (this.authenticationService.isEuregio()) {
      regions.push(this.constantsService.codeTyrol);
      regions.push(this.constantsService.codeSouthTyrol);
      regions.push(this.constantsService.codeTrentino);
    } else {
      regions.push(this.authenticationService.getActiveRegionId());
    }
    this.bulletinsService.loadBulletins(this.bulletinsService.getActiveDate(), regions).subscribe(
      data => {
        for (const jsonBulletin of (data as any)) {
          const bulletin = BulletinModel.createFromJson(jsonBulletin);

          // only add bulletins with published or saved regions
          if ((bulletin.getPublishedRegions() && bulletin.getPublishedRegions().length > 0) || (bulletin.getSavedRegions() && bulletin.getSavedRegions().length > 0)) {
            this.addInternalBulletin(bulletin);
          }
        }

        let hit = false;
        for (const bulletin of this.internBulletinsList) {
          for (const region of bulletin.getSavedRegions()) {
            if (region.startsWith(this.authenticationService.getActiveRegionId())) {
              hit = true;
              break;
            }
          }
          for (const region of bulletin.getPublishedRegions()) {
            if (region.startsWith(this.authenticationService.getActiveRegionId())) {
              hit = true;
              break;
            }
          }
          if (hit) {
            break;
          }
        }

        this.updateInternalBulletins();

        this.mapService.deselectAggregatedRegion();
        this.loading = false;
      },
      () => {
        console.error("Bulletins could not be loaded!");
        this.loading = false;
        this.openLoadingErrorModal(this.loadingErrorTemplate);
      }
    );
  }

  openDeleteAggregatedRegionModal(template: TemplateRef<any>) {
    this.deleteAggregatedRegionModalRef = this.modalService.show(template, this.config);
  }

  deleteAggregatedRegionModalConfirm(): void {
    this.deleteAggregatedRegionModalRef.hide();
    this.delBulletin(this.bulletinMarkedDelete);

    // TODO websocket: unlock region

  }

  deleteAggregatedRegionModalDecline(): void {
    this.deleteAggregatedRegionModalRef.hide();
  }

  openNoRegionModal(template: TemplateRef<any>) {
    this.noRegionModalRef = this.modalService.show(template, this.config);
  }

  noRegionModalConfirm(): void {
    this.noRegionModalRef.hide();
  }

  openDiscardModal(template: TemplateRef<any>) {
    this.discardModalRef = this.modalService.show(template, this.config);
  }

  discardModalConfirm(): void {
    this.discardModalRef.hide();
    this.goBack();
  }

  discardModalDecline(): void {
    this.discardModalRef.hide();
  }


  openCopyRegionModal(event, template: TemplateRef<any>, bulletin: BulletinModel) {
    event.stopPropagation();
    this.bulletinCopy = bulletin;
    this.copyRegionModalRef = this.modalService.show(template, this.config);
  }

  copyRegionModalConfirm(): void {
    console.log('copy region');
    console.log(this.bulletinCopy);
    this.selectBulletin(this.bulletinCopy);
    this.copyBulletin(); 

    if (this.copyService.isCopyBulletin()) {
      console.log('passte region');
      this.createBulletin(true);
    }

    this.copyRegionModalRef.hide();
  }

  copyRegionModalDecline(): void {
    if (this.copyService.isCopyBulletin()) {
      this.copyService.resetCopyBulletin();
    }    
    this.copyRegionModalRef.hide();
  }


  openSaveErrorModal(template: TemplateRef<any>) {
    this.saveErrorModalRef = this.modalService.show(template, this.config);
  }

  saveErrorModalConfirm(): void {
    this.saveErrorModalRef.hide();
    this.goBack();
  }

  openChangeErrorModal(template: TemplateRef<any>) {
    this.changeErrorModalRef = this.modalService.show(template, this.config);
  }

  changeErrorModalConfirm(): void {
    this.changeErrorModalRef.hide();
  }

  openAvalancheProblemErrorModal(template: TemplateRef<any>) {
    this.avalancheProblemErrorModalRef = this.modalService.show(template, this.config);
  }

  avalancheProblemErrorModalConfirm(): void {
    this.avalancheProblemErrorModalRef.hide();
    this.publishing = undefined;
  }

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
      daytime = this.activeBulletin.afternoon;
    } else {
      daytime = this.activeBulletin.forenoon;
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
  }

  hasFiveAvalancheProblems(isAfternoon: boolean) {
    let daytime;
    if (isAfternoon) {
      daytime = this.activeBulletin.afternoon;
    } else {
      daytime = this.activeBulletin.forenoon;
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

  getActiveRegionStatus(date) {
    const regionStatusMap = this.bulletinsService.statusMap.get(this.authenticationService.getActiveRegionId());
    if (regionStatusMap)
      return regionStatusMap.get(date.getTime());
    else
      return Enums.BulletinStatus.missing;
  }

  getRegionStatus(region, date) {
    const regionStatusMap = this.bulletinsService.statusMap.get(region);
    if (regionStatusMap)
      return regionStatusMap.get(date.getTime());
    else
      return Enums.BulletinStatus.missing;
  }

  /* Publishing */
  showSubmitButton(date) {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
      (!this.publishing || this.publishing.getTime() !== date.getTime()) &&
      (
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.draft ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.updated
      ) &&
      !this.copying &&
      this.internBulletinsList.length > 0 &&
      this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster)) {
      return true;
    } else {
      return false;
    }
  }

  submit(event, date: Date) {
    event.stopPropagation();
    this.publishing = date;

    if (this.checkAvalancheProblems()) {
      this.bulletinsService.checkBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
        data => {
          let duplicateRegion = false;

          let message = "<b>" + this.translateService.instant("bulletins.table.submitBulletinsDialog.message") + "</b><br><br>";

          for (const entry of (data as any)) {
            if (entry === "duplicateRegion") {
              duplicateRegion = true;
            }
            if (entry === "missingDangerRating") {
              message += this.translateService.instant("bulletins.table.submitBulletinsDialog.missingDangerRating") + "<br>";
            }
            if (entry === "missingRegion") {
              message += this.translateService.instant("bulletins.table.submitBulletinsDialog.missingRegion") + "<br>";
            }
            if (entry === "missingAvActivityHighlights") {
              message += this.translateService.instant("bulletins.table.submitBulletinsDialog.missingAvActivityHighlights") + "<br>";
            }
            if (entry === "missingAvActivityComment") {
              message += this.translateService.instant("bulletins.table.submitBulletinsDialog.missingAvActivityComment") + "<br>";
            }
            if (entry === "missingSnowpackStructureHighlights") {
              message += this.translateService.instant("bulletins.table.submitBulletinsDialog.missingSnowpackStructureHighlights") + "<br>";
            }
            if (entry === "missingSnowpackStructureComment") {
              message += this.translateService.instant("bulletins.table.submitBulletinsDialog.missingSnowpackStructureComment") + "<br>";
            }
            if (entry === "pendingSuggestions") {
              message += this.translateService.instant("bulletins.table.submitBulletinsDialog.pendingSuggestions") + "<br>";
            }
            if (entry === "incompleteTranslation") {
              message += this.translateService.instant("bulletins.table.publishBulletinsDialog.incompleteTranslation");
            }
          }

          if (duplicateRegion) {
            this.openSubmitBulletinsDuplicateRegionModal(this.submitBulletinsDuplicateRegionTemplate);
          } else {
            this.openSubmitBulletinsModal(this.submitBulletinsTemplate, message, date);
          }
        },
        error => {
          console.error("Bulletins could not be checked!");
          this.openCheckBulletinsErrorModal(this.checkBulletinsErrorTemplate);
        }
      );
    }
  }

  openSubmitBulletinsDuplicateRegionModal(template: TemplateRef<any>) {
    this.submitBulletinsDuplicateRegionModalRef = this.modalService.show(template, this.config);
  }

  submitBulletinsDuplicateRegionModalConfirm(): void {
    this.submitBulletinsDuplicateRegionModalRef.hide();
    this.publishing = undefined;
  }

  openSubmitBulletinsModal(template: TemplateRef<any>, message: string, date: Date) {
    const initialState = {
      text: message,
      date: date,
      component: this
    };
    this.submitBulletinsModalRef = this.modalService.show(ModalSubmitComponent, { initialState });

    this.modalService.onHide.subscribe((reason: string) => {
      this.publishing = undefined;
    });
  }

  openCheckBulletinsErrorModal(template: TemplateRef<any>) {
    this.checkBulletinsErrorModalRef = this.modalService.show(template, this.config);
  }

  checkBulletinsErrorModalConfirm(): void {
    this.checkBulletinsErrorModalRef.hide();
    this.publishing = undefined;
  }

  submitBulletinsModalConfirm(date: Date): void {
    this.submitBulletinsModalRef.hide();
    this.save();
    this.bulletinsService.submitBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
      data => {
        console.log("Bulletins submitted.");
        if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.updated) {
          this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.resubmitted);
        } else if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.draft) {
          this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.submitted);
        }
        this.bulletinsService.setIsEditable(false);
        this.publishing = undefined;
      },
      error => {
        console.error("Bulletins could not be submitted!");
        this.openSubmitBulletinsErrorModal(this.submitBulletinsErrorTemplate);
      }
    );
  }

  submitBulletinsModalDecline(): void {
    this.submitBulletinsModalRef.hide();
    this.publishing = undefined;
  }

  openSubmitBulletinsErrorModal(template: TemplateRef<any>) {
    this.submitBulletinsErrorModalRef = this.modalService.show(template, this.config);
  }

  submitBulletinsErrorModalConfirm(): void {
    this.submitBulletinsErrorModalRef.hide();
    this.publishing = undefined;
  }

  showUpdateButton(date) {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
      (!this.publishing || this.publishing.getTime() !== date.getTime()) &&
      (
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.submitted ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.resubmitted ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.published ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.republished ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.missing ||
        (this.bulletinsService.getUserRegionStatus(date) === undefined && (this.bulletinsService.hasBeenPublished5PM(date)))
      ) &&
      !this.copying &&
      (
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman)
      )) {
      return true;
    } else {
      return false;
    }
  }

  createUpdate(event) {
    event.stopPropagation();
    this.bulletinsService.setUserRegionStatus(this.bulletinsService.getActiveDate(), Enums.BulletinStatus.updated);
    this.bulletinsService.setIsEditable(true);
    this.save();
  }

  showPublishButton(date) {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
      (!this.publishing || this.publishing.getTime() !== date.getTime()) &&
      (this.bulletinsService.hasBeenPublished5PM(date)) &&
      (
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.resubmitted ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.submitted
      ) &&
      !this.copying &&
      this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster)) {
      return true;
    } else {
      return false;
    }
  }

  showSpinningIconButton(date) {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
      !this.copying &&
      this.publishing &&
      this.publishing.getTime() === date.getTime()) {
      return true;
    } else {
      return false;
    }
  }

  publish(event, date: Date, change: boolean) {
    event.stopPropagation();
    this.publishing = date;

    this.bulletinsService.checkBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
      data => {
        let message = "<b>" + this.translateService.instant("bulletins.table.publishBulletinsDialog.message") + "</b><br><br>";

        for (const entry of (data as any)) {
          if (entry === "missingDangerRating") {
            message += this.translateService.instant("bulletins.table.publishBulletinsDialog.missingDangerRating") + "<br>";
          }
          if (entry === "missingRegion") {
            message += this.translateService.instant("bulletins.table.publishBulletinsDialog.missingRegion") + "<br>";
          }
          if (entry === "duplicateRegion") {
            message += this.translateService.instant("bulletins.table.publishBulletinsDialog.duplicateRegion") + "<br>";
          }
          if (entry === "missingAvActivityHighlights") {
            message += this.translateService.instant("bulletins.table.publishBulletinsDialog.missingAvActivityHighlights") + "<br>";
          }
          if (entry === "missingAvActivityComment") {
            message += this.translateService.instant("bulletins.table.publishBulletinsDialog.missingAvActivityComment") + "<br>";
          }
          if (entry === "missingSnowpackStructureHighlights") {
            message += this.translateService.instant("bulletins.table.publishBulletinsDialog.missingSnowpackStructureHighlights") + "<br>";
          }
          if (entry === "missingSnowpackStructureComment") {
            message += this.translateService.instant("bulletins.table.publishBulletinsDialog.missingSnowpackStructureComment") + "<br>";
          }
          if (entry === "pendingSuggestions") {
            message += this.translateService.instant("bulletins.table.publishBulletinsDialog.pendingSuggestions") + "<br>";
          }
          if (entry === "incompleteTranslation") {
            message += this.translateService.instant("bulletins.table.publishBulletinsDialog.incompleteTranslation");
          }
        }

        this.openPublishBulletinsModal(this.publishBulletinsTemplate, message, date, change);
      },
      error => {
        console.error("Bulletins could not be checked!");
        this.openCheckBulletinsErrorModal(this.checkBulletinsErrorTemplate);
      }
    );
  }

  openPublishBulletinsModal(template: TemplateRef<any>, message: string, date: Date, change: boolean) {
    const initialState = {
      text: message,
      date: date,
      change: change,
      component: this
    };
    this.publishBulletinsModalRef = this.modalService.show(ModalPublishComponent, { initialState });

    this.modalService.onHide.subscribe((reason: string) => {
      this.publishing = undefined;
    });
  }

  publishBulletinsModalConfirm(date: Date, change: boolean): void {
    this.publishBulletinsModalRef.hide();
    if (change) {
      this.bulletinsService.changeBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
        data => {
          console.log("Bulletins published (no messages).");
          if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.resubmitted) {
            this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.republished);
          } else if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted) {
            this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.published);
          }
          this.publishing = undefined;
        },
        error => {
          console.error("Bulletins could not be published (no messages)!");
          this.openPublishBulletinsErrorModal(this.publishBulletinsErrorTemplate);
        }
      );
    } else {
      this.bulletinsService.publishBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
        data => {
          console.log("Bulletins published.");
          if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.resubmitted) {
            this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.republished);
          } else if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted) {
            this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.published);
          }
          this.publishing = undefined;
        },
        error => {
          console.error("Bulletins could not be published!");
          this.openPublishBulletinsErrorModal(this.publishBulletinsErrorTemplate);
        }
      );
    }
  }

  publishBulletinsModalDecline(): void {
    this.publishBulletinsModalRef.hide();
    this.publishing = undefined;
  }

  openPublishBulletinsErrorModal(template: TemplateRef<any>) {
    this.publishBulletinsErrorModalRef = this.modalService.show(template, this.config);
  }  
  
  publishBulletinsErrorModalConfirm(): void {
    this.publishBulletinsErrorModalRef.hide();
    this.publishing = undefined;
  }

  openPreviewErrorModal(template: TemplateRef<any>) {
    this.previewErrorModalRef = this.modalService.show(template, this.config);
  }

  previewErrorModalConfirm(): void {
    this.previewErrorModalRef.hide();
    this.loadingPreview = false;
  }

  openCheckBulletinsModal(template: TemplateRef<any>, message: string, date: Date) {
    const initialState = {
      text: message,
      date: date,
      component: this
    };
    this.checkBulletinsModalRef = this.modalService.show(ModalCheckComponent, { initialState });

    this.modalService.onHide.subscribe((reason: string) => {
      this.publishing = undefined;
    });
  }

  checkBulletinsModalConfirm(): void {
    this.checkBulletinsModalRef.hide();
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
