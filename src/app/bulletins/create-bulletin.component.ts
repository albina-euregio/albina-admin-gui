import { Component, HostListener, ViewChild, ElementRef, TemplateRef, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { DatePipe, formatDate } from "@angular/common";

import { map, timer } from "rxjs";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal";
import { saveAs } from "file-saver";

// models
import { BulletinModel } from "../models/bulletin.model";

// services
import { TranslateService } from "@ngx-translate/core";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { MapService } from "../providers/map-service/map.service";
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
import { Subscription } from "rxjs";

import * as Enums from "../enums/enums";
import { ServerModel } from "app/models/server.model";
import { LocalStorageService } from "app/providers/local-storage-service/local-storage.service";

@Component({
  templateUrl: "create-bulletin.component.html",
})
export class CreateBulletinComponent implements OnInit, OnDestroy {
  public bulletinStatus = Enums.BulletinStatus;

  public autoSaving: boolean;
  public loadingPreview: boolean;
  public editRegions: boolean;
  public loading: boolean;
  public saveError: Map<string, BulletinModel>;
  public loadInternalBulletinsError: boolean;
  public loadExternalBulletinsError: boolean;

  public originalBulletins: Map<string, BulletinModel>;

  public showAfternoonMap: boolean;

  public showForeignRegions: boolean;

  public activeBulletin: BulletinModel;
  public comparedBulletin: BulletinModel;
  public internBulletinsList: BulletinModel[];
  private internBulletinsListEtag: string;
  public externRegionsMap: Map<ServerModel, BulletinModel[]>;
  public showExternRegionsMap: Map<string, boolean>;

  public showStatusOfAllRegions: boolean = false;

  public showNewBulletinModal: boolean = false;

  public isCompactMapLayout: boolean = false;
  public isBulletinSidebarVisible = true;
  private bulletinMarkedDelete: BulletinModel;

  public publishing: boolean;
  public submitting: boolean;
  public copying: boolean;

  @ViewChild("scrollActiveBulletin") scrollActiveBulletin: ElementRef;
  @ViewChild("scrollComparedBulletin") scrollComparedBulletin: ElementRef;

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

  internalBulletinsSubscription!: Subscription;
  externalBulletinsSubscription!: Subscription;

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-md",
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private activeRoute: ActivatedRoute,
    public bulletinsService: BulletinsService,
    public authenticationService: AuthenticationService,
    public translateService: TranslateService,
    private localStorageService: LocalStorageService,
    private constantsService: ConstantsService,
    public regionsService: RegionsService,
    public copyService: CopyService,
    private mapService: MapService,
    private modalService: BsModalService,
    private datePipe: DatePipe,
  ) {
    this.loading = false;
    this.showAfternoonMap = false;
    this.showForeignRegions = true;
    this.mapService.resetAll();
    this.internBulletinsList = new Array<BulletinModel>();
    this.externRegionsMap = new Map<ServerModel, BulletinModel[]>();
    this.showExternRegionsMap = new Map<string, boolean>();
    // this.preventClick = false;
    // this.timer = 0;

    if (this.localStorageService.getCompactMapLayout()) {
      this.isCompactMapLayout = this.localStorageService.getCompactMapLayout();
    } else {
      // Set initial value based on the current window width
      this.isCompactMapLayout = window.innerWidth < 768;
    }

    this.publishing = false;
    this.submitting = false;
    this.copying = false;
    this.loadingPreview = false;
    this.saveError = new Map();
    this.loadInternalBulletinsError = false;
    this.loadExternalBulletinsError = false;

    this.route.queryParams.subscribe((params) => {
      this.bulletinsService.setIsReadOnly(params.readOnly ? params.readOnly.toLocaleLowerCase() === "true" : false);
    });
  }

  @HostListener("window:resize", ["$event"])
  onResize(event: Event) {
    this.isCompactMapLayout = (event.target as Window).innerWidth < 768;
    this.localStorageService.setCompactMapLayout(this.isCompactMapLayout);
  }

  reset() {
    this.originalBulletins = new Map<string, BulletinModel>();
    this.activeBulletin = undefined;
    this.comparedBulletin = undefined;
    this.internBulletinsList = new Array<BulletinModel>();
    this.externRegionsMap = new Map<ServerModel, BulletinModel[]>();
    this.showExternRegionsMap = new Map<string, boolean>();

    this.editRegions = false;
    this.showAfternoonMap = false;
  }

  toggleShowForeignRegions() {
    this.showForeignRegions = !this.showForeignRegions;
  }

  showExternalRegions(key: string) {
    return this.showExternRegionsMap.get(key);
  }

  toggleShowExternalRegions(apiUrl: string) {
    this.showExternRegionsMap.set(apiUrl, !this.showExternRegionsMap.get(apiUrl));
  }

  hasExternalRegions() {
    return this.externRegionsMap.size > 0;
  }

  ngOnInit() {
    this.activeRoute.params.subscribe((routeParams) => {
      const date = new Date(routeParams.date);
      date.setHours(0, 0, 0, 0);
      this.bulletinsService.setActiveDate(this.bulletinsService.getValidFromUntil(date));

      if (this.authenticationService.isCurrentUserInRole(this.constantsService.roleObserver)) {
        this.bulletinsService.setIsReadOnly(true);
      }

      this.initializeComponent();

      this.internalBulletinsSubscription = timer(5000, 5000)
        .pipe(
          map(() => {
            if (!this.loading && !this.publishing && !this.submitting && !this.copying && !this.showNewBulletinModal) {
              this.loadBulletinsFromServer();
            }
          }),
        )
        .subscribe();

      this.externalBulletinsSubscription = timer(2000, 30000)
        .pipe(
          map(() => {
            this.loadExternalBulletinsFromServer();
          }),
        )
        .subscribe();

      const mapDiv = document.getElementById("map");

      const resizeObserver = new ResizeObserver(() => {
        this.mapService.map?.invalidateSize();
        if (this.showAfternoonMap) {
          this.mapService.afternoonMap?.invalidateSize();
        }
      });
      resizeObserver.observe(mapDiv);
    });
  }

  async initializeComponent() {
    this.loading = true;

    await this.initMaps();

    if (this.bulletinsService.getActiveDate() && this.authenticationService.isUserLoggedIn()) {
      this.reset();

      // copy bulletins from other date
      if (this.bulletinsService.getCopyDate()) {
        // load own bulletins from the date they are copied from
        let regions = [this.authenticationService.getActiveRegionId()];
        this.bulletinsService.loadBulletins(this.bulletinsService.getCopyDate(), regions).subscribe(
          (data) => {
            this.copyBulletins(data.body);
            this.bulletinsService.setCopyDate(undefined);
            // load bulletins from the current date, add foreign bulletins
            this.bulletinsService
              .loadBulletins(this.bulletinsService.getActiveDate(), this.authenticationService.getInternalRegions())
              .subscribe(
                (data2) => {
                  this.addForeignBulletins(data2.body);
                  this.save();
                  this.loading = false;
                },
                () => {
                  console.error("Foreign bulletins could not be loaded!");
                  this.loading = false;
                  this.openLoadingErrorModal(this.loadingErrorTemplate);
                },
              );
          },
          () => {
            console.error("Own bulletins could not be loaded!");
            this.loading = false;
            this.openLoadingErrorModal(this.loadingErrorTemplate);
          },
        );

        // load current bulletins (do not copy them, also if it is an update)
      } else {
        this.loadBulletinsFromServer();
        this.mapService.deselectAggregatedRegion();
      }

      if (this.isDateEditable(this.bulletinsService.getActiveDate())) {
        this.bulletinsService.setIsEditable(true);
      } else {
        this.bulletinsService.setIsEditable(false);
      }

      if (this.copyService.isCopyBulletin()) {
        this.createBulletin(true);
      }
    } else {
      this.goBack();
    }
  }

  toggleCompactMapLayout() {
    this.isCompactMapLayout = !this.isCompactMapLayout;
    this.localStorageService.setCompactMapLayout(this.isCompactMapLayout);
  }

  toggleBulletinSidebar() {
    this.isBulletinSidebarVisible = !this.isBulletinSidebarVisible;
  }

  updateBulletinScroll(scrollId: string, event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.scrollActiveBulletin?.nativeElement) return;
    if (!this.scrollComparedBulletin?.nativeElement) return;
    if (scrollId === "scrollComparedBulletin") {
      this.scrollActiveBulletin.nativeElement.scrollTop = this.scrollComparedBulletin.nativeElement.scrollTop;
    } else if (scrollId === "scrollActiveBulletin") {
      this.scrollComparedBulletin.nativeElement.scrollTop = this.scrollActiveBulletin.nativeElement.scrollTop;
    }
  }

  private loadBulletinsFromServer() {
    console.log("Load internal bulletins");
    this.bulletinsService
      .loadBulletins(
        this.bulletinsService.getActiveDate(),
        this.authenticationService.getInternalRegions(),
        this.internBulletinsListEtag,
      )
      .subscribe(
        (data) => {
          const etag = data.headers?.get("ETag");
          this.loadInternalBulletinsError = false;
          if (!etag || etag !== this.internBulletinsListEtag) {
            this.addInternalBulletins(data.body);
            this.internBulletinsListEtag = etag;
          } else {
            console.info("Skipping internal bulletin update for", this.internBulletinsListEtag);
          }
          this.loading = false;
        },
        (error) => {
          console.error("Bulletins could not be loaded!");
          this.loading = false;
          this.loadInternalBulletinsError = true;
        },
      );
  }

  private loadExternalBulletinsFromServer() {
    if (!this.editRegions) {
      console.log("Load external bulletins");
      this.authenticationService.checkExternalServerLogin();
      this.authenticationService.getExternalServers().map((server) =>
        this.bulletinsService.loadExternalBulletins(this.bulletinsService.getActiveDate(), server).subscribe(
          (data) => {
            this.loadExternalBulletinsError = false;
            this.addExternalBulletins(server, data);
          },
          () => {
            console.error("Bulletins from " + server.getApiUrl() + " could not be loaded!");
            this.loadExternalBulletinsError = true;
          },
        ),
      );
    }
  }

  ngOnDestroy() {
    this.internalBulletinsSubscription.unsubscribe();
    this.externalBulletinsSubscription.unsubscribe();

    this.mapService.resetAll();

    this.bulletinsService.setActiveDate(undefined);
    this.bulletinsService.setIsEditable(false);

    this.loading = false;
    this.editRegions = false;
    this.copying = false;
  }

  isDisabled() {
    return (
      this.loading ||
      !this.bulletinsService.getIsEditable() ||
      this.bulletinsService.isLocked(this.activeBulletin.getId()) ||
      this.editRegions ||
      !this.isCreator(this.activeBulletin) ||
      this.authenticationService.isCurrentUserInRole(this.constantsService.roleObserver)
    );
  }

  isDateEditable(date: [Date, Date]) {
    return (
      ((this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.missing ||
        this.bulletinsService.getUserRegionStatus(date) === undefined) &&
        !this.bulletinsService.hasBeenPublished5PM(this.bulletinsService.getActiveDate())) ||
      this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.updated ||
      this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.draft
    );
  }

  showPublicationHappensAt5PM(date: [Date, Date]) {
    return (
      this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted &&
      !this.bulletinsService.hasBeenPublished5PM(date)
    );
  }

  showPublicationHappensAt8AM(date: [Date, Date]) {
    return (
      (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted ||
        this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.resubmitted) &&
      !this.bulletinsService.hasBeenPublished8AM(date) &&
      !this.showPublicationHappensAt5PM(date)
    );
  }

  showPublicationHappened(date: [Date, Date]) {
    return (
      this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.published ||
      this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.republished
    );
  }

  showNoPublicationWillHappen(date: [Date, Date]) {
    return (
      (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted ||
        this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.resubmitted) &&
      this.bulletinsService.hasBeenPublished8AM(date)
    );
  }

  changeDate(date: [Date, Date]) {
    this.deselectBulletin();
    const format = "yyyy-MM-dd";
    const locale = "en-US";
    const formattedDate = formatDate(date[1], format, locale);
    this.router.navigate(["/bulletins/" + formattedDate], {
      queryParams: { readOnly: this.bulletinsService.getIsReadOnly() },
    });
  }

  publishAll() {
    this.publishing = true;
    this.openPublishAllModal();
  }

  check(event: Event, date: [Date, Date]) {
    event.stopPropagation();

    this.bulletinsService.checkBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
      (data) => {
        let message =
          "<b>" + this.translateService.instant("bulletins.table.checkBulletinsDialog.message") + "</b><br><br>";

        if ((data as any).length === 0) {
          message += this.translateService.instant("bulletins.table.checkBulletinsDialog.ok");
        } else {
          for (const entry of data as any) {
            if (entry === "missingDangerRating") {
              message +=
                this.translateService.instant("bulletins.table.checkBulletinsDialog.missingDangerRating") + "<br>";
            }
            if (entry === "missingRegion") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingRegion") + "<br>";
            }
            if (entry === "missingAvActivityHighlights") {
              message +=
                this.translateService.instant("bulletins.table.checkBulletinsDialog.missingAvActivityHighlights") +
                "<br>";
            }
            if (entry === "missingAvActivityComment") {
              message +=
                this.translateService.instant("bulletins.table.checkBulletinsDialog.missingAvActivityComment") + "<br>";
            }
            if (entry === "missingSnowpackStructureHighlights") {
              message +=
                this.translateService.instant(
                  "bulletins.table.checkBulletinsDialog.missingSnowpackStructureHighlights",
                ) + "<br>";
            }
            if (entry === "missingSnowpackStructureComment") {
              message +=
                this.translateService.instant("bulletins.table.checkBulletinsDialog.missingSnowpackStructureComment") +
                "<br>";
            }
            if (entry === "pendingSuggestions") {
              message +=
                this.translateService.instant("bulletins.table.checkBulletinsDialog.pendingSuggestions") + "<br>";
            }
            if (entry === "incompleteTranslation") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.incompleteTranslation");
            }
          }
        }

        this.openCheckBulletinsModal(message);
      },
      (error) => {
        console.error("Bulletins could not be checked!");
        this.openCheckBulletinsErrorModal(this.checkBulletinsErrorTemplate);
      },
    );
  }

  showPublishAllButton(date: [Date, Date]) {
    return (
      !this.bulletinsService.getIsReadOnly() &&
      !this.publishing &&
      !this.submitting &&
      this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin)
    );
  }

  showCheckButton(date: [Date, Date]) {
    return (
      !this.publishing &&
      !this.submitting &&
      this.authenticationService.getActiveRegionId() !== undefined &&
      (this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.draft ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.updated) &&
      !this.copying &&
      this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman)
    );
  }

  showMediaFileButton() {
    return (
      !this.copying &&
      this.authenticationService.getActiveRegionId() !== undefined &&
      this.authenticationService.getActiveRegion().enableMediaFile &&
      (this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster))
    );
  }

  showInfoButton() {
    return (
      !this.publishing &&
      !this.submitting &&
      !this.copying &&
      this.authenticationService.getActiveRegionId() !== undefined &&
      (this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) ===
        this.bulletinStatus.published ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) ===
          this.bulletinStatus.republished) &&
      this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin)
    );
  }

  showPublicationInfo() {
    this.bulletinsService
      .getPublicationStatus(this.authenticationService.getActiveRegionId(), this.bulletinsService.getActiveDate())
      .subscribe(
        (data) => {
          this.openPublicationStatusModal(data as any);
        },
        (error) => {
          console.error("Publication status could not be loaded!");
        },
      );
  }

  openPublicationStatusModal(json) {
    const initialState = {
      json: json,
      date: this.bulletinsService.getActiveDate(),
      component: this,
    };
    this.publicationStatusModalRef = this.modalService.show(ModalPublicationStatusComponent, { initialState });
  }

  openMediaFileModal() {
    const initialState = {
      date: this.bulletinsService.getActiveDate(),
      component: this,
    };
    this.mediaFileModalRef = this.modalService.show(ModalMediaFileComponent, { initialState });
  }

  mediaFileModalConfirm(): void {
    this.mediaFileModalRef.hide();
  }

  publicationStatusModalConfirm(): void {
    this.publicationStatusModalRef.hide();
  }

  openPublishAllModal() {
    const initialState = {
      date: this.bulletinsService.getActiveDate(),
      component: this,
    };
    this.publishAllModalRef = this.modalService.show(ModalPublishAllComponent, { initialState });

    this.modalService.onHide.subscribe((reason: string) => {
      this.publishing = false;
    });
  }

  publishAllModalConfirm(): void {
    this.publishAllModalRef.hide();
    this.bulletinsService.publishAllBulletins(this.bulletinsService.getActiveDate()).subscribe(
      (data) => {
        console.log("All bulletins published.");
        this.publishing = false;
      },
      (error) => {
        console.error("All bulletins could not be published!");
        this.openPublishBulletinsErrorModal(this.publishBulletinsErrorTemplate);
      },
    );
  }

  publishAllModalDecline(): void {
    this.publishAllModalRef.hide();
    this.publishing = false;
  }

  downloadJsonBulletin() {
    this.deselectBulletin();

    const result = new Array<BulletinModel>();

    for (const bulletin of this.internBulletinsList) {
      bulletin.setValidFrom(this.bulletinsService.getActiveDate()[0]);
      bulletin.setValidUntil(this.bulletinsService.getActiveDate()[1]);

      // only own regions
      const saved = new Array<string>();
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
        bulletin.setSuggestedRegions(new Array<string>());
        bulletin.setPublishedRegions(new Array<string>());
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
    element.setAttribute(
      "download",
      this.datePipe.transform(this.bulletinsService.getActiveDate()[1], "yyyy-MM-dd") + "_report.json",
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click(); // simulate click
    document.body.removeChild(element);
  }

  uploadJsonBulletin(event: Event) {
    const selectedFile = (event.target as HTMLInputElement).files[0];
    const fileReader = new FileReader();
    fileReader.readAsText(selectedFile, "UTF-8");
    fileReader.onload = () => {
      const json = JSON.parse(fileReader.result.toString());

      this.reset();
      this.copyBulletins(json);
      console.info("Bulletins loaded from file: " + selectedFile.name);
    };
    fileReader.onerror = (error) => {
      console.error("Bulletins could not be loaded from file: " + error);
      this.openLoadingJsonFileErrorModal(this.loadingJsonFileErrorTemplate);
    };
  }

  private async initMaps() {
    await this.mapService.initAmPmMap();
    this.mapService.map.on("click", () => this.onMapClick());
    this.mapService.afternoonMap.on("click", () => this.onMapClick());
  }

  private onMapClick() {
    if (!this.showNewBulletinModal && !this.editRegions) {
      let hit = false;
      const clickedRegion = this.mapService.getClickedRegion();
      for (const bulletin of this.internBulletinsList.concat([...this.externRegionsMap.values()].flat())) {
        if (
          bulletin.getSavedRegions().includes(clickedRegion) ||
          bulletin.getPublishedRegions().includes(clickedRegion)
        ) {
          if (this.activeBulletin === bulletin) {
            this.deselectBulletin();
            hit = true;
            break;
          } else {
            this.selectBulletin(bulletin);
            hit = true;
            break;
          }
        }
      }
      if (!hit) {
        for (const bulletin of this.internBulletinsList.concat([...this.externRegionsMap.values()].flat())) {
          if (bulletin.getSuggestedRegions().includes(clickedRegion)) {
            if (this.activeBulletin === bulletin) {
              this.deselectBulletin();
              break;
            } else {
              this.selectBulletin(bulletin);
              break;
            }
          }
        }
      }
    }
  }

  setTendency(event, tendency) {
    event.stopPropagation();
    this.activeBulletin.tendency = tendency;
  }

  onShowAfternoonMapChange(checked) {
    this.showAfternoonMap = checked;

    const map = document.getElementById("map");
    const afternoonMap = document.getElementById("afternoonMap");
    if (this.showAfternoonMap) {
      map.classList.add("create-bulletin__map--am");
      afternoonMap.classList.add("create-bulletin__map--am");
      this.mapService.addAMControl();
    } else {
      map.classList.remove("create-bulletin__map--am");
      afternoonMap.classList.remove("create-bulletin__map--am");
      this.mapService.removeAMControl();
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
      if (
        !bulletin.getOwnerRegion().startsWith(this.authenticationService.getActiveRegionId()) &&
        !this.authenticationService.isExternalRegion(bulletin.getOwnerRegion().toString())
      ) {
        result.push(bulletin);
      }
    }
    return result;
  }

  getExternalRegionsMap() {
    return this.externRegionsMap;
  }

  loadBulletinsFromYesterday() {
    this.openLoadModal(this.loadTemplate);
  }

  // create a copy of every bulletin (with new id)
  private copyBulletins(response) {
    this.mapService.resetInternalAggregatedRegions();

    for (const jsonBulletin of response) {
      const originalBulletin = BulletinModel.createFromJson(jsonBulletin);

      this.originalBulletins.set(originalBulletin.getId(), originalBulletin);

      const bulletin = new BulletinModel(originalBulletin);

      bulletin.setAuthor(this.authenticationService.getCurrentAuthor());
      bulletin.setAdditionalAuthors(new Array<string>());
      bulletin.addAdditionalAuthor(this.authenticationService.getCurrentAuthor().getName());
      bulletin.setOwnerRegion(this.authenticationService.getActiveRegionId());

      // reset regions
      const saved = new Array<string>();
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

        bulletin.setSuggestedRegions(new Array<string>());
        bulletin.setPublishedRegions(new Array<string>());

        this.addInternalBulletin(bulletin);
      }
    }

    this.updateInternalBulletins();

    this.mapService.deselectAggregatedRegion();

    this.save();
  }

  private addForeignBulletins(response) {
    this.mapService.resetInternalAggregatedRegions();

    for (const jsonBulletin of response) {
      const bulletin = BulletinModel.createFromJson(jsonBulletin);

      if (!bulletin.getOwnerRegion().startsWith(this.authenticationService.getActiveRegionId())) {
        this.addInternalBulletin(bulletin);
      }
    }

    this.updateInternalBulletins();

    this.mapService.deselectAggregatedRegion();
  }

  private addExternalBulletins(server: ServerModel, response) {
    let bulletinsList = new Array<BulletinModel>();
    if (response) {
      for (const jsonBulletin of response) {
        const bulletin = BulletinModel.createFromJson(jsonBulletin);
        bulletinsList.push(bulletin);
        if (this.activeBulletin && this.activeBulletin.getId() === bulletin.getId()) {
          this.activeBulletin = bulletin;
        }
        this.mapService.updateAggregatedRegion(bulletin);
      }
    }

    bulletinsList.sort((a, b): number => {
      if (a.getOwnerRegion() < b.getOwnerRegion()) {
        return 1;
      }
      if (a.getOwnerRegion() > b.getOwnerRegion()) {
        return -1;
      }
      return 0;
    });

    this.externRegionsMap.set(server, bulletinsList);
    if (!this.showExternRegionsMap.has(server.getApiUrl())) {
      this.showExternRegionsMap.set(server.getApiUrl(), false);
    }

    if (this.activeBulletin && this.activeBulletin !== undefined) {
      this.mapService.selectAggregatedRegion(this.activeBulletin);
    }
  }

  private getNewId(response, regionId) {
    for (const jsonBulletin of response) {
      if (jsonBulletin.savedRegions.includes(regionId)) return jsonBulletin.id;
    }
    return undefined;
  }

  private addInternalBulletins(response) {
    let hasDaytimeDependency = false;

    const bulletinsList = new Array<BulletinModel>();
    for (const jsonBulletin of response) {
      const bulletin = BulletinModel.createFromJson(jsonBulletin);

      if (this.activeBulletin && this.activeBulletin.getId() === bulletin.getId()) {
        // do not update active bulletin (this is currently edited) except it is disabled
        if (this.isDisabled()) {
          this.activeBulletin = bulletin;
        } else {
          if (this.activeBulletin.getSuggestedRegions() !== bulletin.getSuggestedRegions()) {
            this.activeBulletin.setSuggestedRegions(bulletin.getSuggestedRegions());
          }
          if (this.activeBulletin.getSavedRegions() !== bulletin.getSavedRegions()) {
            this.activeBulletin.setSavedRegions(bulletin.getSavedRegions());
          }
        }
        bulletinsList.push(this.activeBulletin);
        if (this.activeBulletin.hasDaytimeDependency) {
          hasDaytimeDependency = true;
        }
      } else {
        bulletinsList.push(bulletin);
        if (bulletin.hasDaytimeDependency) {
          hasDaytimeDependency = true;
        }
      }
    }

    this.mapService.resetInternalAggregatedRegions();
    this.mapService.resetActiveSelection();

    bulletinsList.sort((a, b): number => {
      if (a.getOwnerRegion() < b.getOwnerRegion()) {
        return 1;
      }
      if (a.getOwnerRegion() > b.getOwnerRegion()) {
        return -1;
      }
      return 0;
    });

    if (hasDaytimeDependency && this.showAfternoonMap === false) {
      this.onShowAfternoonMapChange(true);
    } else if (!hasDaytimeDependency && this.showAfternoonMap === true) {
      this.onShowAfternoonMapChange(false);
    }

    this.internBulletinsList = bulletinsList;
    this.updateInternalBulletins();

    if (this.editRegions) {
      this.mapService.showEditSelection();
    } else if (this.activeBulletin && this.activeBulletin !== undefined) {
      this.mapService.selectAggregatedRegion(this.activeBulletin);
    }
  }

  private updateInternalBulletins() {
    for (const bulletin of this.internBulletinsList) {
      this.mapService.updateAggregatedRegion(bulletin);
    }
  }

  private updateExternalBulletins() {
    this.externRegionsMap.forEach((value: BulletinModel[], key: ServerModel) => {
      for (const bulletin of value) {
        this.mapService.updateAggregatedRegion(bulletin);
      }
    });
  }

  private addInternalBulletin(bulletin: BulletinModel) {
    this.internBulletinsList.push(bulletin);
    if (this.activeBulletin && this.activeBulletin.getId() === bulletin.getId()) this.activeBulletin = bulletin;

    this.internBulletinsList.sort((a, b): number => {
      if (a.getOwnerRegion() < b.getOwnerRegion()) {
        return 1;
      }
      if (a.getOwnerRegion() > b.getOwnerRegion()) {
        return -1;
      }
      return 0;
    });

    if (bulletin.hasDaytimeDependency && this.showAfternoonMap === false) {
      this.onShowAfternoonMapChange(true);
    }
  }

  acceptSuggestions(event, bulletin: BulletinModel) {
    event.stopPropagation();
    const suggested = new Array<string>();
    for (const region of bulletin.getSuggestedRegions()) {
      if (region.startsWith(this.authenticationService.getActiveRegionId())) {
        // delete region from other bulletinInputModels
        for (const b of this.internBulletinsList) {
          const savedRegions = new Array<string>();
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
    bulletin.addAdditionalAuthor(this.authenticationService.getCurrentAuthor().getName());

    this.updateBulletinOnServer(bulletin);
  }

  rejectSuggestions(event, bulletin: BulletinModel) {
    event.stopPropagation();
    const suggested = new Array<string>();
    for (const region of bulletin.getSuggestedRegions()) {
      if (!region.startsWith(this.authenticationService.getActiveRegionId())) {
        suggested.push(region);
      }
    }
    bulletin.setSuggestedRegions(suggested);

    this.updateBulletinOnServer(bulletin);
  }

  createBulletin(copy) {
    let bulletin: BulletinModel;
    this.showNewBulletinModal = true;
    if (copy && this.copyService.getBulletin()) {
      bulletin = this.copyService.getBulletin();
      this.copyService.resetCopyBulletin();
    } else {
      bulletin = new BulletinModel();
      bulletin.setAuthor(this.authenticationService.getCurrentAuthor());
      bulletin.addAdditionalAuthor(this.authenticationService.getCurrentAuthor().getName());
      bulletin.setOwnerRegion(this.authenticationService.getActiveRegionId());
    }

    this.selectBulletin(bulletin);
    this.editBulletinMicroRegions(bulletin);
  }

  copyBulletin(bulletin: BulletinModel) {
    const newBulletin = new BulletinModel(bulletin);
    newBulletin.setAdditionalAuthors(new Array<string>());
    newBulletin.setSavedRegions(new Array<string>());
    newBulletin.setPublishedRegions(new Array<string>());
    newBulletin.setSuggestedRegions(new Array<string>());

    newBulletin.setAuthor(this.authenticationService.getCurrentAuthor());
    newBulletin.addAdditionalAuthor(this.authenticationService.getCurrentAuthor().getName());
    newBulletin.setOwnerRegion(this.authenticationService.getActiveRegionId());
    this.copyService.setCopyBulletin(true);
    this.copyService.setBulletin(newBulletin);
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
      this.mapService.selectAggregatedRegion(this.activeBulletin);
    }
  }

  eventDeselectBulletin(bulletin: BulletinModel) {
    this.deselectBulletin(false);
  }

  deselectBulletin(del?: boolean) {
    if (!this.editRegions && this.activeBulletin !== null && this.activeBulletin !== undefined) {
      this.mapService.deselectAggregatedRegion();
      this.activeBulletin = undefined;
      this.comparedBulletin = undefined;
    }
  }

  eventDeselectComparedBulletin(bulletin: BulletinModel) {
    this.comparedBulletin = undefined;
  }

  preview() {
    this.loadingPreview = true;
    this.bulletinsService.getPreviewPdf(this.bulletinsService.getActiveDate()).subscribe((blob) => {
      this.loadingPreview = false;
      const format = "yyyy-MM-dd";
      const locale = "en-US";
      const formattedDate = formatDate(this.bulletinsService.getActiveDate()[1], format, locale);
      saveAs(blob, "PREVIEW_" + formattedDate + ".pdf");
      console.log("Preview loaded.");
    });
  }

  private checkAvalancheProblems(): boolean {
    let error = false;

    for (const bulletin of this.internBulletinsList) {
      if (
        bulletin
          .getSavedAndPublishedRegions()
          .some((region) => region.startsWith(this.authenticationService.getActiveRegionId())) &&
        this.checkAvalancheProblem(bulletin)
      ) {
        error = true;
      }
    }

    return error;
  }

  private checkAvalancheProblem(bulletin: BulletinModel) {
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
          !bulletin.forenoon.avalancheProblem1.getMatrixInformation().getAvalancheSize()
        ) {
          return true;
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
          !bulletin.forenoon.avalancheProblem2.getMatrixInformation().getAvalancheSize()
        ) {
          return true;
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
          !bulletin.forenoon.avalancheProblem3.getMatrixInformation().getAvalancheSize()
        ) {
          return true;
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
          !bulletin.forenoon.avalancheProblem4.getMatrixInformation().getAvalancheSize()
        ) {
          return true;
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
          !bulletin.forenoon.avalancheProblem5.getMatrixInformation().getAvalancheSize()
        ) {
          return true;
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
          !bulletin.afternoon.avalancheProblem1.getMatrixInformation().getAvalancheSize()
        ) {
          return true;
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
          !bulletin.afternoon.avalancheProblem2.getMatrixInformation().getAvalancheSize()
        ) {
          return true;
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
          !bulletin.afternoon.avalancheProblem3.getMatrixInformation().getAvalancheSize()
        ) {
          return true;
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
          !bulletin.afternoon.avalancheProblem4.getMatrixInformation().getAvalancheSize()
        ) {
          return true;
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
          !bulletin.afternoon.avalancheProblem5.getMatrixInformation().getAvalancheSize()
        ) {
          return true;
        }
      }
    }
    return false;
  }

  deleteBulletin(event: Event, bulletin: BulletinModel) {
    event.stopPropagation();
    this.eventDeleteBulletin(bulletin);
  }

  eventDeleteBulletin(bulletin: BulletinModel) {
    this.bulletinMarkedDelete = bulletin;
    this.openDeleteAggregatedRegionModal(this.deleteAggregatedRegionTemplate);
  }

  compareBulletin(event: Event, bulletin: BulletinModel) {
    event.stopPropagation();
    this.comparedBulletin = bulletin;
  }

  private delBulletin(bulletin: BulletinModel) {
    this.deselectBulletin(true);
    this.deleteBulletinOnServer(bulletin);
  }

  eventEditMicroRegions(bulletin: BulletinModel) {
    this.showNewBulletinModal = true;
    this.editBulletinMicroRegions(bulletin);
  }

  editMicroRegions(event: Event, bulletin: BulletinModel) {
    event.stopPropagation();
    this.eventEditMicroRegions(bulletin);
  }

  private editBulletinMicroRegions(bulletin: BulletinModel) {
    this.editRegions = true;
    this.mapService.editAggregatedRegion(bulletin);
  }

  saveBulletin(event: Event) {
    event.stopPropagation();

    let isUpdate: boolean;
    isUpdate = this.activeBulletin.getSavedRegions().length !== 0;

    // save selected regions to active bulletin
    const regions = this.mapService.getSelectedRegions();

    let newRegionsHit = false;
    for (const region of regions) {
      if (region.startsWith(this.authenticationService.getActiveRegionId())) {
        newRegionsHit = true;
        break;
      }
    }

    if (newRegionsHit || !this.isCreator(this.activeBulletin)) {
      this.showNewBulletinModal = false;
      this.editRegions = false;

      // delete old saved regions in own area
      const oldSavedRegions = new Array<string>();
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
      const oldPublishedRegions = new Array<string>();
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
      const oldSuggestedRegions = new Array<string>();
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
          if (!this.activeBulletin.getSavedRegions().includes(region)) {
            this.activeBulletin.getSavedRegions().push(region);
          }
        } else {
          if (
            !region.startsWith(this.activeBulletin.getOwnerRegion()) &&
            !this.activeBulletin.getSavedRegions().includes(region) &&
            !this.activeBulletin.getSuggestedRegions().includes(region) &&
            !this.activeBulletin.getPublishedRegions().includes(region)
          ) {
            this.activeBulletin.getSuggestedRegions().push(region);
          }
        }
      }

      this.mapService.discardEditSelection();
      this.mapService.selectAggregatedRegion(this.activeBulletin);

      if (isUpdate) {
        this.updateBulletinOnServer(this.activeBulletin);
      } else {
        this.createBulletinOnServer(this.activeBulletin);
      }
    } else {
      this.openNoRegionModal(this.noRegionTemplate);
    }
  }

  private isWriteDisabled(): boolean {
    const userRegionStatus = this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate());
    return (
      userRegionStatus === Enums.BulletinStatus.published ||
      userRegionStatus === Enums.BulletinStatus.republished ||
      userRegionStatus === Enums.BulletinStatus.submitted ||
      userRegionStatus === Enums.BulletinStatus.resubmitted
    );
  }

  private createBulletinOnServer(bulletin: BulletinModel) {
    if (this.isWriteDisabled()) return;
    const regionId = bulletin.getSavedAndPublishedRegions()[0];
    bulletin.setValidFrom(this.bulletinsService.getActiveDate()[0]);
    bulletin.setValidUntil(this.bulletinsService.getActiveDate()[1]);
    this.bulletinsService.createBulletin(bulletin, this.bulletinsService.getActiveDate()).subscribe(
      (data) => {
        if (this.activeBulletin && this.activeBulletin != undefined && this.activeBulletin.getId() == undefined) {
          this.activeBulletin.setId(this.getNewId(data, regionId));
        }
        this.mapService.deselectAggregatedRegion();
        this.addInternalBulletins(data);
        this.loadInternalBulletinsError = false;
        this.loading = false;
        console.log("Bulletin created on server.");
      },
      (error) => {
        console.error("Bulletin could not be created on server!");
        this.openSaveErrorModal(this.saveErrorTemplate);
      },
    );
  }

  updateSaveErrors() {
    for (const bulletin of this.saveError.values()) {
      this.updateBulletinOnServer(bulletin, false);
    }
  }

  updateBulletinOnServer(bulletin: BulletinModel, checkErrors: boolean = true) {
    if (this.isWriteDisabled()) return;
    bulletin.setValidFrom(this.bulletinsService.getActiveDate()[0]);
    bulletin.setValidUntil(this.bulletinsService.getActiveDate()[1]);
    this.bulletinsService.updateBulletin(bulletin, this.bulletinsService.getActiveDate()).subscribe(
      (data) => {
        this.addInternalBulletins(data);
        this.saveError.delete(bulletin.id);
        this.loadInternalBulletinsError = false;
        this.loading = false;
        if (checkErrors) {
          this.updateSaveErrors();
        }
        console.log("Bulletin updated on server.");
      },
      (error) => {
        console.error("Bulletin could not be updated on server!");
        this.saveError.set(bulletin.id, bulletin);
      },
    );
  }

  private deleteBulletinOnServer(bulletin: BulletinModel) {
    if (this.isWriteDisabled()) return;
    this.bulletinsService.deleteBulletin(bulletin, this.bulletinsService.getActiveDate()).subscribe(
      (data) => {
        this.addInternalBulletins(data);
        this.loadInternalBulletinsError = false;
        this.loading = false;
        console.log("Bulletin deleted on server.");
      },
      (error) => {
        console.error("Bulletin could not be deleted on server!");
        this.openSaveErrorModal(this.saveErrorTemplate);
      },
    );
  }

  hasSuggestions(bulletin: BulletinModel): boolean {
    return bulletin
      .getSuggestedRegions()
      .some((region) => region.startsWith(this.authenticationService.getActiveRegionId()));
  }

  isCreator(bulletin: BulletinModel): boolean {
    return (
      bulletin.getOwnerRegion() !== undefined &&
      bulletin.getOwnerRegion().startsWith(this.authenticationService.getActiveRegionId())
    );
  }

  showPreviewButton() {
    return (
      !this.publishing &&
      !this.submitting &&
      !this.copying &&
      this.authenticationService.getActiveRegionId() !== undefined &&
      (this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) === this.bulletinStatus.draft ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) ===
          this.bulletinStatus.updated ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) ===
          this.bulletinStatus.submitted ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) ===
          this.bulletinStatus.resubmitted ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) ===
          this.bulletinStatus.published ||
        this.bulletinsService.getUserRegionStatus(this.bulletinsService.getActiveDate()) ===
          this.bulletinStatus.republished) &&
      (this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman))
    );
  }

  discardBulletin(event: Event, bulletin?: BulletinModel) {
    event.stopPropagation();
    this.showNewBulletinModal = false;
    this.editRegions = false;
    if (bulletin !== undefined && bulletin.getSavedRegions().length === 0) {
      this.delBulletin(bulletin);
      this.activeBulletin = undefined;
    } else {
      if (this.activeBulletin && this.activeBulletin !== undefined) {
        this.mapService.selectAggregatedRegion(this.activeBulletin);
      }
    }
    this.mapService.discardEditSelection();
  }

  save() {
    if (!this.internBulletinsList.length) {
      return;
    }
    this.autoSaving = true;
    const result = new Array<BulletinModel>();
    for (const bulletin of this.internBulletinsList) {
      const regions = bulletin.getPublishedRegions().concat(bulletin.getSavedRegions());
      for (const region of regions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          bulletin.setValidFrom(this.bulletinsService.getActiveDate()[0]);
          bulletin.setValidUntil(this.bulletinsService.getActiveDate()[1]);
          result.push(bulletin);
          break;
        }
      }
    }
    if (!result.length) {
      return;
    }
    this.bulletinsService.saveBulletins(result, this.bulletinsService.getActiveDate()).subscribe(
      () => {
        console.log("Bulletins saved on server.");
        this.autoSaving = false;
      },
      () => {
        this.autoSaving = false;
        console.error("Bulletins could not be saved on server!");
        this.openSaveErrorModal(this.saveErrorTemplate);
      },
    );
  }

  goBack() {
    this.deselectBulletin();
    this.router.navigate(["/bulletins"]);
  }

  @HostListener("document:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.keyCode === 27 && this.editRegions) {
      this.discardBulletin(event, this.activeBulletin);
    } else if (event.keyCode === 27 && (this.copyService.isCopyTextcat() || this.copyService.isCopyBulletin())) {
      this.copyService.resetCopyTextcat();
      this.copyService.resetCopyBulletin();
    }
  }

  openLoadingErrorModal(template: TemplateRef<any>) {
    this.loadingErrorModalRef = this.modalService.show(template, this.config);
  }

  loadingErrorModalConfirm(): void {
    this.loadingErrorModalRef.hide();
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

  loadModalConfirm(event: Event): void {
    (event.currentTarget as HTMLButtonElement).setAttribute("disabled", "disabled");
    this.loadModalRef.hide();
    this.loading = true;
    const date = this.bulletinsService.getPreviousDate();

    const regions = [this.authenticationService.getActiveRegionId()];
    this.bulletinsService.loadBulletins(date, regions).subscribe(
      (data) => {
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

        this.copyBulletins(data.body);
        this.loading = false;
      },
      () => {
        this.loading = false;
        this.openLoadingErrorModal(this.loadingErrorTemplate);
      },
    );
  }

  loadModalDecline(event: Event): void {
    (event.currentTarget as HTMLButtonElement).setAttribute("disabled", "disabled");
    this.loadModalRef.hide();
  }

  openDeleteAggregatedRegionModal(template: TemplateRef<any>) {
    this.deleteAggregatedRegionModalRef = this.modalService.show(template, this.config);
  }

  deleteAggregatedRegionModalConfirm(): void {
    this.deleteAggregatedRegionModalRef.hide();
    this.loading = true;
    this.delBulletin(this.bulletinMarkedDelete);
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

  eventCopyBulletin(bulletin: BulletinModel) {
    this.copyBulletin(bulletin);
    this.copyRegionModalRef = this.modalService.show(this.copyRegionTemplate, this.config);
  }

  openCopyRegionModal(event, bulletin: BulletinModel) {
    event.stopPropagation();
    this.eventCopyBulletin(bulletin);
  }

  copyRegionModalConfirm(date: [Date, Date]): void {
    this.copyRegionModalRef.hide();
    if (this.bulletinsService.getActiveDate()[0].getTime() === date[0].getTime()) {
      if (this.copyService.isCopyBulletin()) {
        this.createBulletin(true);
      }
    } else {
      this.changeDate(date);
    }
  }

  copyRegionModalDecline(): void {
    if (this.copyService.isCopyBulletin()) {
      this.copyService.resetCopyBulletin();
    }
    this.copyRegionModalRef.hide();
  }

  isActiveDate(date: [Date, Date]) {
    return this.bulletinsService.getActiveDate()[0].getTime() === date[0].getTime();
  }

  openSaveErrorModal(template: TemplateRef<any>) {
    this.saveErrorModalRef = this.modalService.show(template, this.config);
  }

  saveErrorModalConfirm(): void {
    this.saveErrorModalRef.hide();
    this.loading = false;
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
    this.publishing = false;
    this.submitting = false;
  }

  getRegionNames(bulletin: BulletinModel): string {
    const regionNames = bulletin.savedRegions.map((regionCode) => this.regionsService.getRegionName(regionCode));
    return regionNames.join(", ");
  }

  getActiveRegionStatus(date: [Date, Date]) {
    const regionStatusMap = this.bulletinsService.statusMap.get(this.authenticationService.getActiveRegionId());
    if (regionStatusMap) return regionStatusMap.get(date[0].getTime());
    else return Enums.BulletinStatus.missing;
  }

  getRegionStatus(region: string, date: [Date, Date]) {
    const regionStatusMap = this.bulletinsService.statusMap.get(region);
    if (regionStatusMap) return regionStatusMap.get(date[0].getTime());
    else return Enums.BulletinStatus.missing;
  }

  showSubmitButton(date: [Date, Date]) {
    return (
      !this.bulletinsService.getIsReadOnly() &&
      !this.publishing &&
      !this.submitting &&
      !this.copying &&
      this.authenticationService.getActiveRegionId() !== undefined &&
      (this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.draft ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.updated) &&
      this.internBulletinsList.length > 0 &&
      this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster)
    );
  }

  submit(event: Event, date: [Date, Date]) {
    event.stopPropagation();

    this.deselectBulletin();

    this.submitting = true;

    if (!this.checkAvalancheProblems()) {
      this.bulletinsService.checkBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
        (data) => {
          let duplicateRegion = false;

          let message =
            "<b>" + this.translateService.instant("bulletins.table.submitBulletinsDialog.message") + "</b><br><br>";

          for (const entry of data as any) {
            if (entry === "duplicateRegion") {
              duplicateRegion = true;
            }
            if (entry === "missingDangerRating") {
              message +=
                this.translateService.instant("bulletins.table.submitBulletinsDialog.missingDangerRating") + "<br>";
            }
            if (entry === "missingRegion") {
              message += this.translateService.instant("bulletins.table.submitBulletinsDialog.missingRegion") + "<br>";
            }
            if (entry === "missingAvActivityHighlights") {
              message +=
                this.translateService.instant("bulletins.table.submitBulletinsDialog.missingAvActivityHighlights") +
                "<br>";
            }
            if (entry === "missingAvActivityComment") {
              message +=
                this.translateService.instant("bulletins.table.submitBulletinsDialog.missingAvActivityComment") +
                "<br>";
            }
            if (entry === "missingSnowpackStructureHighlights") {
              message +=
                this.translateService.instant(
                  "bulletins.table.submitBulletinsDialog.missingSnowpackStructureHighlights",
                ) + "<br>";
            }
            if (entry === "missingSnowpackStructureComment") {
              message +=
                this.translateService.instant("bulletins.table.submitBulletinsDialog.missingSnowpackStructureComment") +
                "<br>";
            }
            if (entry === "pendingSuggestions") {
              message +=
                this.translateService.instant("bulletins.table.submitBulletinsDialog.pendingSuggestions") + "<br>";
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
        (error) => {
          console.error("Bulletins could not be checked!");
          this.openCheckBulletinsErrorModal(this.checkBulletinsErrorTemplate);
        },
      );
    } else {
      this.openAvalancheProblemErrorModal(this.avalancheProblemErrorTemplate);
    }
  }

  openSubmitBulletinsDuplicateRegionModal(template: TemplateRef<any>) {
    this.submitBulletinsDuplicateRegionModalRef = this.modalService.show(template, this.config);
  }

  submitBulletinsDuplicateRegionModalConfirm(): void {
    this.submitBulletinsDuplicateRegionModalRef.hide();
    this.submitting = false;
  }

  openSubmitBulletinsModal(template: TemplateRef<any>, message: string, date: [Date, Date]) {
    const initialState = {
      text: message,
      date: date,
      component: this,
    };
    this.submitBulletinsModalRef = this.modalService.show(ModalSubmitComponent, { initialState });

    this.modalService.onHide.subscribe((reason: string) => {
      this.submitting = false;
    });
  }

  openCheckBulletinsErrorModal(template: TemplateRef<any>) {
    this.checkBulletinsErrorModalRef = this.modalService.show(template, this.config);
  }

  checkBulletinsErrorModalConfirm(): void {
    this.checkBulletinsErrorModalRef.hide();
    this.publishing = false;
    this.submitting = false;
  }

  submitBulletinsModalConfirm(date: [Date, Date]): void {
    this.submitBulletinsModalRef.hide();
    this.bulletinsService.submitBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
      (data) => {
        console.log("Bulletins submitted.");
        if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.updated) {
          this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.resubmitted);
        } else if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.draft) {
          this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.submitted);
        }
        this.bulletinsService.setIsEditable(false);
        this.submitting = false;
      },
      (error) => {
        console.error("Bulletins could not be submitted!");
        this.openSubmitBulletinsErrorModal(this.submitBulletinsErrorTemplate);
      },
    );
  }

  submitBulletinsModalDecline(): void {
    this.submitBulletinsModalRef.hide();
    this.submitting = false;
  }

  openSubmitBulletinsErrorModal(template: TemplateRef<any>) {
    this.submitBulletinsErrorModalRef = this.modalService.show(template, this.config);
  }

  submitBulletinsErrorModalConfirm(): void {
    this.submitBulletinsErrorModalRef.hide();
    this.submitting = false;
  }

  showUpdateButton(date: [Date, Date]) {
    return (
      !this.bulletinsService.getIsReadOnly() &&
      !this.publishing &&
      !this.submitting &&
      !this.copying &&
      this.authenticationService.getActiveRegionId() !== undefined &&
      (this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.submitted ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.resubmitted ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.published ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.republished ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.missing ||
        (this.bulletinsService.getUserRegionStatus(date) === undefined &&
          this.bulletinsService.hasBeenPublished5PM(date))) &&
      (this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman))
    );
  }

  createUpdate(event: Event) {
    event.stopPropagation();
    this.bulletinsService.setUserRegionStatus(this.bulletinsService.getActiveDate(), Enums.BulletinStatus.updated);
    this.bulletinsService.setIsEditable(true);
    this.save();
  }

  showPublishButton(date: [Date, Date]) {
    return (
      !this.bulletinsService.getIsReadOnly() &&
      !this.publishing &&
      !this.submitting &&
      !this.copying &&
      this.authenticationService.getActiveRegionId() !== undefined &&
      this.bulletinsService.hasBeenPublished5PM(date) &&
      (this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.resubmitted ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.submitted) &&
      this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster)
    );
  }

  publish(event: Event, date: [Date, Date], change: boolean = false) {
    event.stopPropagation();
    this.publishing = true;

    if (!this.checkAvalancheProblems()) {
      this.bulletinsService.checkBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
        (data) => {
          let message =
            "<b>" + this.translateService.instant("bulletins.table.publishBulletinsDialog.message") + "</b><br><br>";

          for (const entry of data as any) {
            if (entry === "missingDangerRating") {
              message +=
                this.translateService.instant("bulletins.table.publishBulletinsDialog.missingDangerRating") + "<br>";
            }
            if (entry === "missingRegion") {
              message += this.translateService.instant("bulletins.table.publishBulletinsDialog.missingRegion") + "<br>";
            }
            if (entry === "duplicateRegion") {
              message +=
                this.translateService.instant("bulletins.table.publishBulletinsDialog.duplicateRegion") + "<br>";
            }
            if (entry === "missingAvActivityHighlights") {
              message +=
                this.translateService.instant("bulletins.table.publishBulletinsDialog.missingAvActivityHighlights") +
                "<br>";
            }
            if (entry === "missingAvActivityComment") {
              message +=
                this.translateService.instant("bulletins.table.publishBulletinsDialog.missingAvActivityComment") +
                "<br>";
            }
            if (entry === "missingSnowpackStructureHighlights") {
              message +=
                this.translateService.instant(
                  "bulletins.table.publishBulletinsDialog.missingSnowpackStructureHighlights",
                ) + "<br>";
            }
            if (entry === "missingSnowpackStructureComment") {
              message +=
                this.translateService.instant(
                  "bulletins.table.publishBulletinsDialog.missingSnowpackStructureComment",
                ) + "<br>";
            }
            if (entry === "pendingSuggestions") {
              message +=
                this.translateService.instant("bulletins.table.publishBulletinsDialog.pendingSuggestions") + "<br>";
            }
            if (entry === "incompleteTranslation") {
              message += this.translateService.instant("bulletins.table.publishBulletinsDialog.incompleteTranslation");
            }
          }

          this.openPublishBulletinsModal(this.publishBulletinsTemplate, message, date, change);
        },
        (error) => {
          console.error("Bulletins could not be checked!");
          this.openCheckBulletinsErrorModal(this.checkBulletinsErrorTemplate);
        },
      );
    } else {
      this.openAvalancheProblemErrorModal(this.avalancheProblemErrorTemplate);
    }
  }

  openPublishBulletinsModal(template: TemplateRef<any>, message: string, date: [Date, Date], change: boolean) {
    const initialState = {
      text: message,
      date: date,
      change: change,
      component: this,
    };
    this.publishBulletinsModalRef = this.modalService.show(ModalPublishComponent, { initialState });

    this.modalService.onHide.subscribe((reason: string) => {
      this.publishing = false;
    });
  }

  publishBulletinsModalConfirm(date: [Date, Date], change: boolean): void {
    this.publishBulletinsModalRef.hide();
    if (change) {
      this.bulletinsService.changeBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
        (data) => {
          console.log("Bulletins published (no messages).");
          if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.resubmitted) {
            this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.republished);
          } else if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted) {
            this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.published);
          }
          this.publishing = false;
        },
        (error) => {
          console.error("Bulletins could not be published (no messages)!");
          this.openPublishBulletinsErrorModal(this.publishBulletinsErrorTemplate);
        },
      );
    } else {
      this.bulletinsService.publishBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
        (data) => {
          console.log("Bulletins published.");
          if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.resubmitted) {
            this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.republished);
          } else if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted) {
            this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.published);
          }
          this.publishing = false;
        },
        (error) => {
          console.error("Bulletins could not be published!");
          this.openPublishBulletinsErrorModal(this.publishBulletinsErrorTemplate);
        },
      );
    }
  }

  publishBulletinsModalDecline(): void {
    this.publishBulletinsModalRef.hide();
    this.publishing = false;
  }

  openPublishBulletinsErrorModal(template: TemplateRef<any>) {
    this.publishBulletinsErrorModalRef = this.modalService.show(template, this.config);
  }

  publishBulletinsErrorModalConfirm(): void {
    this.publishBulletinsErrorModalRef.hide();
    this.publishing = false;
  }

  openPreviewErrorModal(template: TemplateRef<any>) {
    this.previewErrorModalRef = this.modalService.show(template, this.config);
  }

  previewErrorModalConfirm(): void {
    this.previewErrorModalRef.hide();
    this.loadingPreview = false;
  }

  openCheckBulletinsModal(message: string) {
    const initialState = {
      text: message,
      date: this.bulletinsService.getActiveDate(),
      component: this,
    };
    this.checkBulletinsModalRef = this.modalService.show(ModalCheckComponent, { initialState });

    this.modalService.onHide.subscribe((reason: string) => {
      this.publishing = false;
      this.submitting = false;
    });
  }

  checkBulletinsModalConfirm(): void {
    this.checkBulletinsModalRef.hide();
  }
}
