import { DangerSourcesService } from "../danger-sources/danger-sources.service";
import * as Enums from "../enums/enums";
// models
import { BulletinModel, BulletinModelAsJSON } from "../models/bulletin.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { CopyService } from "../providers/copy-service/copy.service";
import { MapService } from "../providers/map-service/map.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { AvalancheProblemIconsComponent } from "../shared/avalanche-problem-icons.component";
import { DangerRatingIconComponent } from "../shared/danger-rating-icon.component";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";
import { AvalancheBulletinComponent } from "./avalanche-bulletin.component";
import { BulletinTextComponent } from "./bulletin-text.component";
import { ModalCheckComponent } from "./modal-check.component";
import { ModalMediaFileComponent } from "./modal-media-file.component";
import { ModalPublicationStatusComponent } from "./modal-publication-status.component";
import { ModalPublishAllComponent } from "./modal-publish-all.component";
import { ModalPublishComponent } from "./modal-publish.component";
// modals
import { ModalSubmitComponent } from "./modal-submit.component";
import { DatePipe, KeyValuePipe, NgFor, NgIf, NgTemplateOutlet } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  viewChild,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
// services
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import {
  DangerSourceVariantModel,
  DangerSourceVariantStatus,
  DangerSourceVariantType,
  Daytime,
} from "app/danger-sources/models/danger-source-variant.model";
import { AvalancheProblemModel } from "app/models/avalanche-problem.model";
import { BulletinDaytimeDescriptionModel } from "app/models/bulletin-daytime-description.model";
import { ServerModel } from "app/models/server.model";
import { emptyLangTexts, LangTexts } from "app/models/text.model";
import { LocalStorageService } from "app/providers/local-storage-service/local-storage.service";
import { UndoRedoService } from "app/providers/undo-redo-service/undo-redo.service";
import { debounce } from "es-toolkit";
import { saveAs } from "file-saver";
import { BsDropdownDirective, BsDropdownModule } from "ngx-bootstrap/dropdown";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
// For iframe
import { forkJoin, map, Observable, of, Subject, Subscription, takeUntil, tap, timer } from "rxjs";

@Component({
  templateUrl: "create-bulletin.component.html",
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    BsDropdownModule,
    NgTemplateOutlet,
    AvalancheBulletinComponent,
    DangerRatingIconComponent,
    AvalancheProblemIconsComponent,
    DatePipe,
    KeyValuePipe,
    TranslateModule,
    NgxMousetrapDirective,
    BulletinTextComponent,
  ],
})
export class CreateBulletinComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private activeRoute = inject(ActivatedRoute);
  bulletinsService = inject(BulletinsService);
  dangerSourcesService = inject(DangerSourcesService);
  authenticationService = inject(AuthenticationService);
  translateService = inject(TranslateService);
  localStorageService = inject(LocalStorageService);
  protected constantsService = inject(ConstantsService);
  regionsService = inject(RegionsService);
  copyService = inject(CopyService);
  private mapService = inject(MapService);
  private modalService = inject(BsModalService);
  private undoRedoService = inject(UndoRedoService);

  public bulletinStatus = Enums.BulletinStatus;

  public autoSaving: boolean;
  public loadingPreview: boolean;
  public editRegions: boolean;
  public loading: boolean;
  public saveError: Map<string, BulletinModel>;
  public loadInternalBulletinsError: boolean;
  public loadExternalBulletinsError: boolean;

  private destroy$ = new Subject<void>();

  public originalBulletins: Map<string, BulletinModel>;

  public showAfternoonMap: boolean;

  public showForeignRegions: boolean;

  public activeBulletin: BulletinModel;
  public comparedBulletin: BulletinModel;
  public internBulletinsList: BulletinModel[];
  private internBulletinsListEtag: string;
  public externRegionsMap: Map<ServerModel, BulletinModel[]>;
  public showExternRegionsMap: Map<string, boolean>;
  public showExternRegions: boolean;

  public showStatusOfAllRegions = false;

  public showNewBulletinModal = false;

  public isCompactMapLayout = false;
  public isBulletinSidebarVisible = true;
  private bulletinMarkedDelete: BulletinModel;

  public publishing: boolean;
  public submitting: boolean;
  public copying: boolean;

  readonly scrollActiveBulletin = viewChild<ElementRef>("scrollActiveBulletin");
  readonly scrollComparedBulletin = viewChild<ElementRef>("scrollComparedBulletin");

  public loadingErrorModalRef: BsModalRef;
  readonly loadingErrorTemplate = viewChild<TemplateRef<unknown>>("loadingErrorTemplate");

  public loadingJsonFileErrorModalRef: BsModalRef;
  readonly loadingJsonFileErrorTemplate = viewChild<TemplateRef<unknown>>("loadingJsonFileErrorTemplate");

  public loadModalRef: BsModalRef;
  readonly loadTemplate = viewChild<TemplateRef<unknown>>("loadTemplate");

  public deleteAllWarningRegionsModalRef: BsModalRef;
  readonly deleteAllWarningRegionsTemplate = viewChild<TemplateRef<unknown>>("deleteAllWarningRegionsTemplate");

  public deleteAggregatedRegionModalRef: BsModalRef;
  readonly deleteAggregatedRegionTemplate = viewChild<TemplateRef<unknown>>("deleteAggregatedRegionTemplate");

  public noRegionModalRef: BsModalRef;
  readonly noRegionTemplate = viewChild<TemplateRef<unknown>>("noRegionTemplate");

  public discardModalRef: BsModalRef;
  readonly discardTemplate = viewChild<TemplateRef<unknown>>("discardTemplate");

  public saveErrorModalRef: BsModalRef;
  readonly saveErrorTemplate = viewChild<TemplateRef<unknown>>("saveErrorTemplate");

  public changeErrorModalRef: BsModalRef;
  readonly changeErrorTemplate = viewChild<TemplateRef<unknown>>("changeErrorTemplate");

  public avalancheProblemErrorModalRef: BsModalRef;
  readonly avalancheProblemErrorTemplate = viewChild<TemplateRef<unknown>>("avalancheProblemErrorTemplate");

  public copyRegionModalRef: BsModalRef;
  readonly copyRegionTemplate = viewChild<TemplateRef<unknown>>("copyRegionTemplate");

  public submitBulletinsModalRef: BsModalRef;
  readonly submitBulletinsTemplate = viewChild<TemplateRef<unknown>>("submitBulletinsTemplate");

  public submitBulletinsDuplicateRegionModalRef: BsModalRef;
  readonly submitBulletinsDuplicateRegionTemplate = viewChild<TemplateRef<unknown>>(
    "submitBulletinsDuplicateRegionTemplate",
  );

  public submitBulletinsErrorModalRef: BsModalRef;
  readonly submitBulletinsErrorTemplate = viewChild<TemplateRef<unknown>>("submitBulletinsErrorTemplate");

  public publishBulletinsModalRef: BsModalRef;
  readonly publishBulletinsTemplate = viewChild<TemplateRef<unknown>>("publishBulletinsTemplate");

  public publishBulletinsErrorModalRef: BsModalRef;
  readonly publishBulletinsErrorTemplate = viewChild<TemplateRef<unknown>>("publishBulletinsErrorTemplate");

  public previewErrorModalRef: BsModalRef;
  readonly previewErrorTemplate = viewChild<TemplateRef<unknown>>("previewErrorTemplate");

  public publicationStatusModalRef: BsModalRef;
  readonly publicationStatusTemplate = viewChild<TemplateRef<unknown>>("publicationStatusTemplate");

  public mediaFileModalRef: BsModalRef;
  readonly mediaFileTemplate = viewChild<TemplateRef<unknown>>("mediaFileTemplate");

  public publishAllModalRef: BsModalRef;

  public checkBulletinsModalRef: BsModalRef;
  readonly checkBulletinsTemplate = viewChild<TemplateRef<unknown>>("checkBulletinsTemplate");

  public checkBulletinsErrorModalRef: BsModalRef;
  readonly checkBulletinsErrorTemplate = viewChild<TemplateRef<unknown>>("checkBulletinsErrorTemplate");

  @ViewChild(BsDropdownDirective) dropdown: BsDropdownDirective;

  internalBulletinsSubscription!: Subscription;
  externalBulletinsSubscription!: Subscription;

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-md",
  };

  updateBulletinOnServer = debounce(this.updateBulletinOnServerNow, 1000);

  constructor() {
    if (!this.bulletinsService.dates?.length) {
      this.bulletinsService.init();
    }
    this.loading = false;
    this.showAfternoonMap = false;
    this.showForeignRegions = true;
    this.mapService.resetAll();
    this.internBulletinsList = new Array<BulletinModel>();
    this.externRegionsMap = new Map<ServerModel, BulletinModel[]>();
    this.showExternRegionsMap = new Map<string, boolean>();
    this.showExternRegions = false;
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
    this.showExternRegions = false;

    this.editRegions = false;
    this.showAfternoonMap = false;
  }

  toggleShowForeignRegions() {
    this.showForeignRegions = !this.showForeignRegions;
  }

  showExternalRegions(key: string) {
    return this.showExternRegionsMap.get(key);
  }

  toggleShowExternalRegionsList(apiUrl: string) {
    this.showExternRegionsMap.set(apiUrl, !this.showExternRegionsMap.get(apiUrl));
  }

  toggleShowExternalRegions() {
    this.showExternRegions = !this.showExternRegions;
    if (this.showExternRegions) {
      this.externRegionsMap.forEach((bulletins) => {
        bulletins.forEach((bulletin) => {
          this.mapService.updateAggregatedRegion(bulletin);
        });
      });
    } else {
      this.mapService.resetAggregatedRegions();
      this.internBulletinsList.forEach((bulletin) => {
        this.mapService.updateAggregatedRegion(bulletin);
      });
    }
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
        .pipe(takeUntil(this.destroy$))
        .pipe(
          map(() => {
            if (!this.loading && !this.publishing && !this.submitting && !this.copying && !this.showNewBulletinModal) {
              this.loadBulletinsFromServer();
            }
          }),
        )
        .subscribe();

      this.externalBulletinsSubscription = timer(2000, 30000)
        .pipe(takeUntil(this.destroy$))
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
        const regions = [this.authenticationService.getActiveRegionId()];
        this.bulletinsService.loadBulletins(this.bulletinsService.getCopyDate(), regions).subscribe(
          ({ bulletins }) => {
            this.copyBulletins(bulletins);
            this.bulletinsService.setCopyDate(undefined);
            // load bulletins from the current date, add foreign bulletins
            this.bulletinsService
              .loadBulletins(this.bulletinsService.getActiveDate(), this.authenticationService.getInternalRegions())
              .subscribe(
                ({ bulletins }) => {
                  this.addForeignBulletins(bulletins);
                  this.save();
                  this.loading = false;
                },
                () => {
                  console.error("Foreign bulletins could not be loaded!");
                  this.loading = false;
                  this.openLoadingErrorModal(this.loadingErrorTemplate());
                },
              );
          },
          () => {
            console.error("Own bulletins could not be loaded!");
            this.loading = false;
            this.openLoadingErrorModal(this.loadingErrorTemplate());
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
    const scrollActiveBulletin = this.scrollActiveBulletin();
    if (!scrollActiveBulletin?.nativeElement) return;
    const scrollComparedBulletin = this.scrollComparedBulletin();
    if (!scrollComparedBulletin?.nativeElement) return;
    if (scrollId === "scrollComparedBulletin") {
      scrollActiveBulletin.nativeElement.scrollTop = scrollComparedBulletin.nativeElement.scrollTop;
    } else if (scrollId === "scrollActiveBulletin") {
      scrollComparedBulletin.nativeElement.scrollTop = scrollActiveBulletin.nativeElement.scrollTop;
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
        ({ bulletins, etag }) => {
          this.loadInternalBulletinsError = false;
          if (!etag || etag !== this.internBulletinsListEtag) {
            this.addInternalBulletins(bulletins);
            this.internBulletinsListEtag = etag;
          } else {
            console.info("Skipping internal bulletin update for", this.internBulletinsListEtag);
          }
          this.loading = false;
        },
        (error) => {
          if (error instanceof HttpErrorResponse && error.status === 304) {
            console.info("Skipping internal bulletin update for", this.internBulletinsListEtag);
          } else {
            console.error("Bulletins could not be loaded!", error);
            this.loadInternalBulletinsError = true;
          }
          this.loading = false;
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
          (error) => {
            console.error("Bulletins from " + server.apiUrl + " could not be loaded!", error);
            this.loadExternalBulletinsError = true;
          },
        ),
      );
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

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
      this.bulletinsService.isLocked(this.activeBulletin.id) ||
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
      (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted ||
        this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.resubmitted) &&
      !this.bulletinsService.hasBeenPublished5PM(date)
    );
  }

  showPublicationHappensAt8AM(date: [Date, Date]) {
    return (
      (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted ||
        this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.resubmitted) &&
      this.bulletinsService.hasBeenPublished5PM(date) &&
      !this.bulletinsService.hasBeenPublished8AM(date)
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
    const formattedDate = this.constantsService.getISODateString(date[1]);
    this.router.navigate(["/bulletins/" + formattedDate], {
      queryParams: { readOnly: this.bulletinsService.getIsReadOnly() },
    });
  }

  loadSuggestionFromDangerSources() {
    this.loading = true;
    this.dangerSourcesService
      .loadDangerSourceVariants(this.bulletinsService.getActiveDate(), this.authenticationService.getInternalRegions())
      .subscribe({
        next: async (variants) => {
          let dangerSourceVariants: DangerSourceVariantModel[] = variants;

          // filter only analysis variants with status active
          if (variants.some((variant) => variant.dangerSourceVariantType === DangerSourceVariantType.analysis)) {
            dangerSourceVariants = variants.filter(
              (variant) =>
                variant.dangerSourceVariantType === DangerSourceVariantType.analysis &&
                variant.dangerSourceVariantStatus === "active",
            );
          }

          // filter only danger source variants with status active
          dangerSourceVariants = dangerSourceVariants.filter(
            (variant) => variant.dangerSourceVariantStatus === DangerSourceVariantStatus.active,
          );

          // sort variants by relevance
          dangerSourceVariants.sort((a, b) => {
            if (
              Enums.WarnLevel[a.eawsMatrixInformation.dangerRating] <
              Enums.WarnLevel[b.eawsMatrixInformation.dangerRating]
            ) {
              return 1;
            } else if (a.eawsMatrixInformation.dangerRating > b.eawsMatrixInformation.dangerRating) {
              return -1;
            } else {
              if (a.eawsMatrixInformation.snowpackStabilityValue < b.eawsMatrixInformation.snowpackStabilityValue) {
                return 1;
              } else if (
                a.eawsMatrixInformation.snowpackStabilityValue > b.eawsMatrixInformation.snowpackStabilityValue
              ) {
                return -1;
              } else {
                if (a.eawsMatrixInformation.avalancheSizeValue < b.eawsMatrixInformation.avalancheSizeValue) {
                  return 1;
                } else if (a.eawsMatrixInformation.avalancheSizeValue > b.eawsMatrixInformation.avalancheSizeValue) {
                  return -1;
                } else {
                  return 0;
                }
              }
            }
          });

          // map micro regions to danger source variants
          const microRegionDangerSourceVariants = new Map<string, DangerSourceVariantModel[]>(); // microRegionId -> dangerSourceVariantId[]
          for (const dangerSourceVariant of dangerSourceVariants) {
            for (const microRegionId of dangerSourceVariant.regions) {
              if (microRegionDangerSourceVariants.has(microRegionId)) {
                microRegionDangerSourceVariants.get(microRegionId).push(dangerSourceVariant);
              } else {
                microRegionDangerSourceVariants.set(microRegionId, [dangerSourceVariant]);
              }
            }
          }

          // keep only 4 variants per micro region
          for (const [microRegionId, dangerSourceVariantIds] of microRegionDangerSourceVariants) {
            microRegionDangerSourceVariants.set(microRegionId, dangerSourceVariantIds.slice(0, 4));
          }

          // aggregate micro regions with same danger source variants
          const aggregatedRegions = new Map<string, string[]>(); // dangerSourceVariantId -> microRegionId[]

          for (const [microRegionId, dangerSourceVariantIds] of microRegionDangerSourceVariants) {
            const key = dangerSourceVariantIds.map((variant) => variant.id).join("|");
            if (aggregatedRegions.has(key)) {
              aggregatedRegions.get(key).push(microRegionId);
            } else {
              aggregatedRegions.set(key, [microRegionId]);
            }
          }

          // create bulletin for each aggregated region
          const bulletins = new Array<BulletinModel>();
          for (const [dangerSourceVariantIds, microRegionIds] of aggregatedRegions) {
            const bulletin = new BulletinModel();
            // set bulletin properties
            bulletin.savedRegions = microRegionIds;
            bulletin.validFrom = this.bulletinsService.getActiveDate()[0];
            bulletin.validUntil = this.bulletinsService.getActiveDate()[1];
            bulletin.author = this.authenticationService.currentAuthor;
            bulletin.ownerRegion = this.authenticationService.getActiveRegionId();

            // create avalanche problem for each danger source variant
            const amDaytimeDescription = new BulletinDaytimeDescriptionModel();
            const pmDaytimeDescription = new BulletinDaytimeDescriptionModel();
            let amIndex = 1;
            let pmIndex = 1;
            let hasDaytimeDependency = false;
            for (const dangerSourceVariantId of dangerSourceVariantIds.split("|")) {
              const dangerSourceVariant = DangerSourceVariantModel.createFromJson(
                dangerSourceVariants.find((variant) => variant.id === dangerSourceVariantId),
              );
              // create avalanche problem only if danger rating > 1
              if (dangerSourceVariant.eawsMatrixInformation.dangerRating != Enums.DangerRating.low) {
                const avalancheProblem = new AvalancheProblemModel();
                avalancheProblem.aspects = dangerSourceVariant.aspects;
                if (dangerSourceVariant.treelineHigh) {
                  avalancheProblem.treelineHigh = dangerSourceVariant.treelineHigh;
                } else {
                  avalancheProblem.elevationHigh = dangerSourceVariant.elevationHigh;
                }
                if (dangerSourceVariant.treelineLow) {
                  avalancheProblem.treelineLow = dangerSourceVariant.treelineLow;
                } else {
                  avalancheProblem.elevationLow = dangerSourceVariant.elevationLow;
                }
                avalancheProblem.setAvalancheProblem(dangerSourceVariant.getAvalancheProblem());
                avalancheProblem.avalancheType = Enums.AvalancheType[dangerSourceVariant.avalancheType];
                avalancheProblem.matrixInformation = dangerSourceVariant.eawsMatrixInformation;

                if (dangerSourceVariant.hasDaytimeDependency) {
                  hasDaytimeDependency = true;
                  if (dangerSourceVariant.dangerPeak === Daytime.afternoon) {
                    this.addAvalancheProblem(avalancheProblem, pmDaytimeDescription, pmIndex);
                    pmIndex = pmIndex + 1;
                  } else {
                    this.addAvalancheProblem(avalancheProblem, amDaytimeDescription, amIndex);
                    amIndex = amIndex + 1;
                  }
                } else {
                  this.addAvalancheProblem(avalancheProblem, amDaytimeDescription, amIndex);
                  amIndex = amIndex + 1;
                  this.addAvalancheProblem(avalancheProblem, pmDaytimeDescription, pmIndex);
                  pmIndex = pmIndex + 1;
                }
              }

              // add texts from danger source variant
              if (dangerSourceVariant.textcat) {
                bulletin.avActivityCommentTextcat = bulletin.avActivityCommentTextcat
                  ? bulletin.avActivityCommentTextcat +
                    "," +
                    this.constantsService.textcatLineBreak +
                    "," +
                    this.constantsService.textcatLineBreak +
                    "," +
                    dangerSourceVariant.textcat
                  : "[" + dangerSourceVariant.textcat;
              }
              bulletin.avActivityComment$ = {
                en: "⚠ Error: Missing translation",
                de: "⚠ Error: Missing translation",
                it: "⚠ Error: Missing translation",
                fr: "⚠ Error: Missing translation",
                es: "⚠ Error: Missing translation",
                ca: "⚠ Error: Missing translation",
                oc: "⚠ Error: Missing translation",
              };
            }

            bulletin.avActivityCommentTextcat = bulletin.avActivityCommentTextcat
              ? bulletin.avActivityCommentTextcat + "]"
              : undefined;

            amDaytimeDescription.updateDangerRating();
            bulletin.forenoon = amDaytimeDescription;

            if (hasDaytimeDependency) {
              bulletin.hasDaytimeDependency = true;
              pmDaytimeDescription.updateDangerRating();
              bulletin.afternoon = pmDaytimeDescription;
            }

            bulletins.push(bulletin);
            this.addInternalBulletin(bulletin);
          }

          this.updateInternalBulletins();

          // save bulletins
          this.bulletinsService.saveBulletins(bulletins, this.bulletinsService.getActiveDate()).subscribe(
            () => {
              console.log("Bulletins saved on server.");
              this.updateBulletinStatusEdit();
              this.autoSaving = false;
            },
            () => {
              this.autoSaving = false;
              console.error("Bulletins could not be saved on server!");
              this.openSaveErrorModal(this.saveErrorTemplate());
            },
          );

          this.loading = false;
        },
        error: (error) => {
          console.error("Danger source variants could not be loaded!", error);
          this.loading = false;
        },
      });
  }

  private addAvalancheProblem(
    avalancheProblem: AvalancheProblemModel,
    daytimeDescription: BulletinDaytimeDescriptionModel,
    index: number,
  ) {
    if (index < 3) {
      switch (index) {
        case 1:
          daytimeDescription.avalancheProblem1 = avalancheProblem;
          break;
        case 2:
          daytimeDescription.avalancheProblem2 = avalancheProblem;
          break;
        case 3:
          daytimeDescription.avalancheProblem3 = avalancheProblem;
          break;
        case 4:
          daytimeDescription.avalancheProblem4 = avalancheProblem;
          break;
        default:
          break;
      }
    }
  }

  publishAll(change: boolean) {
    this.publishing = true;
    this.openPublishAllModal(change);
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
        this.openCheckBulletinsErrorModal(this.checkBulletinsErrorTemplate());
      },
    );
  }

  showLoadSuggestionFromDangerSourcesButton() {
    return (
      !this.bulletinsService.getIsReadOnly() &&
      !this.publishing &&
      !this.submitting &&
      (this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman)) &&
      this.authenticationService.getActiveRegion()?.enableDangerSources &&
      this.dangerSourcesService.hasDangerSourceVariants(this.bulletinsService.getActiveDate())
    );
  }

  showDeleteAllWarningRegionsButton() {
    return (
      !this.bulletinsService.getIsReadOnly() &&
      !this.publishing &&
      !this.submitting &&
      (this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman))
    );
  }

  showPublishAllButton() {
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

  openPublishAllModal(change: boolean) {
    const initialState = {
      text: change
        ? this.translateService.instant("bulletins.table.publishAllDialog.changeMessage")
        : this.translateService.instant("bulletins.table.publishAllDialog.message"),
      change: change,
      component: this,
    };
    this.publishAllModalRef = this.modalService.show(ModalPublishAllComponent, { initialState });

    this.modalService.onHide.subscribe((reason: string) => {
      this.publishing = false;
    });
  }

  publishAllModalConfirm(change: boolean): void {
    this.publishAllModalRef.hide();
    this.bulletinsService.publishAllBulletins(this.bulletinsService.getActiveDate(), change).subscribe(
      (data) => {
        console.log("All bulletins published.");
        this.publishing = false;
      },
      (error) => {
        console.error("All bulletins could not be published!");
        this.openPublishBulletinsErrorModal(this.publishBulletinsErrorTemplate());
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
      bulletin.validFrom = this.bulletinsService.getActiveDate()[0];
      bulletin.validUntil = this.bulletinsService.getActiveDate()[1];

      // only own regions
      const saved = new Array<string>();
      for (const region of bulletin.savedRegions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          saved.push(region);
        }
      }
      for (const region of bulletin.publishedRegions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          saved.push(region);
        }
      }

      if (saved.length > 0) {
        bulletin.savedRegions = saved;
        bulletin.suggestedRegions = new Array<string>();
        bulletin.publishedRegions = new Array<string>();
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
    const formattedDate = this.constantsService.getISODateString(this.bulletinsService.getActiveDate()[1]);
    element.setAttribute("download", formattedDate + "_report.json");
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
      this.openLoadingJsonFileErrorModal(this.loadingJsonFileErrorTemplate());
    };
  }

  private async initMaps() {
    await this.mapService.initAmPmMap();
    this.mapService.map.on({ click: () => this.onMapClick() });
    this.mapService.afternoonMap.on({ click: () => this.onMapClick() });
  }

  private onMapClick() {
    if (!this.showNewBulletinModal && !this.editRegions) {
      let hit = false;
      const clickedRegion = this.mapService.getClickedRegion();
      for (const bulletin of this.internBulletinsList.concat([...this.externRegionsMap.values()].flat())) {
        if (bulletin.savedRegions.includes(clickedRegion) || bulletin.publishedRegions.includes(clickedRegion)) {
          hit = true;
          this.toggleBulletin(bulletin);
        }
      }
      if (!hit) {
        for (const bulletin of this.internBulletinsList.concat([...this.externRegionsMap.values()].flat())) {
          if (bulletin.suggestedRegions.includes(clickedRegion)) {
            this.toggleBulletin(bulletin);
            break;
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
      if (bulletin.ownerRegion.startsWith(this.authenticationService.getActiveRegionId())) {
        result.push(bulletin);
      }
    }
    return result;
  }

  getForeignBulletins() {
    const result = new Array<BulletinModel>();
    for (const bulletin of this.internBulletinsList) {
      if (
        !bulletin.ownerRegion.startsWith(this.authenticationService.getActiveRegionId()) &&
        !this.authenticationService.isExternalRegion(bulletin.ownerRegion.toString())
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
    this.openLoadModal(this.loadTemplate());
  }

  deleteAllWarningRegions() {
    this.openDeleteAllWarningRegionsModal(this.deleteAllWarningRegionsTemplate());
  }

  // create a copy of every bulletin (with new id)
  private copyBulletins(response) {
    this.mapService.resetInternalAggregatedRegions();

    for (const jsonBulletin of response) {
      const originalBulletin = BulletinModel.createFromJson(jsonBulletin);

      this.originalBulletins.set(originalBulletin.id, originalBulletin);

      const bulletin = new BulletinModel(originalBulletin);

      bulletin.author = this.authenticationService.getCurrentAuthor();
      bulletin.additionalAuthors = new Array<string>();
      bulletin.addAdditionalAuthor(this.authenticationService.getCurrentAuthor().name);
      bulletin.ownerRegion = this.authenticationService.getActiveRegionId();

      // reset regions
      const saved = new Array<string>();
      for (const region of bulletin.savedRegions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          saved.push(region);
        }
      }
      for (const region of bulletin.publishedRegions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          saved.push(region);
        }
      }

      if (saved.length > 0) {
        bulletin.savedRegions = saved;

        bulletin.suggestedRegions = new Array<string>();
        bulletin.publishedRegions = new Array<string>();

        this.addInternalBulletin(bulletin);
      }
    }

    this.updateInternalBulletins();

    this.mapService.deselectAggregatedRegion();

    this.save();
  }

  private addForeignBulletins(response: BulletinModelAsJSON[]) {
    this.mapService.resetInternalAggregatedRegions();

    for (const jsonBulletin of response) {
      const bulletin = BulletinModel.createFromJson(jsonBulletin);

      if (!bulletin.ownerRegion.startsWith(this.authenticationService.getActiveRegionId())) {
        this.addInternalBulletin(bulletin);
      }
    }

    this.updateInternalBulletins();

    this.mapService.deselectAggregatedRegion();
  }

  private addExternalBulletins(server: ServerModel, response: BulletinModelAsJSON[]) {
    const bulletinsList = new Array<BulletinModel>();
    if (response) {
      for (const jsonBulletin of response) {
        const bulletin = BulletinModel.createFromJson(jsonBulletin);
        bulletinsList.push(bulletin);
        if (this.activeBulletin && this.activeBulletin.id === bulletin.id) {
          this.activeBulletin = bulletin;
        }
        if (this.showExternRegions) {
          this.mapService.updateAggregatedRegion(bulletin);
        }
      }
    }

    bulletinsList.sort((a, b): number => {
      if (a.ownerRegion < b.ownerRegion) {
        return 1;
      }
      if (a.ownerRegion > b.ownerRegion) {
        return -1;
      }
      return 0;
    });

    this.externRegionsMap.set(server, bulletinsList);
    if (!this.showExternRegionsMap.has(server.apiUrl)) {
      this.showExternRegionsMap.set(server.apiUrl, false);
    }

    if (this.activeBulletin) {
      this.mapService.selectAggregatedRegion(this.activeBulletin);
    }
  }

  private getNewId(response: BulletinModelAsJSON[], regionId: string) {
    for (const jsonBulletin of response) {
      if (jsonBulletin.savedRegions.includes(regionId)) return jsonBulletin.id;
    }
    return undefined;
  }

  undoRedoActiveBulletin(type: "undo" | "redo") {
    this.updateBulletinOnServer.flush();
    const activeId = this.activeBulletin.id;
    const bulletin = this.undoRedoService.undoRedoActiveBulletin(type, activeId);
    const index = this.internBulletinsList.indexOf(this.activeBulletin);
    this.activeBulletin = bulletin;
    this.internBulletinsList.splice(index, 1, bulletin);
    this.mapService.updateAggregatedRegion(bulletin);
    this.updateBulletinOnServer(bulletin, true, false);
  }

  private addInternalBulletins(response: BulletinModelAsJSON[]) {
    let hasDaytimeDependency = false;

    const bulletinsList = new Array<BulletinModel>();
    for (const jsonBulletin of response) {
      const bulletin = BulletinModel.createFromJson(jsonBulletin);
      this.undoRedoService.initUndoRedoStacksFromServer(bulletin);
      if (this.activeBulletin && this.activeBulletin.id === bulletin.id) {
        // do not update active bulletin (this is currently edited) except if it is disabled
        if (this.isDisabled()) {
          this.activeBulletin = bulletin;
        } else {
          if (this.activeBulletin.suggestedRegions !== bulletin.suggestedRegions) {
            this.activeBulletin.suggestedRegions = bulletin.suggestedRegions;
          }
          if (this.activeBulletin.savedRegions !== bulletin.savedRegions) {
            this.activeBulletin.savedRegions = bulletin.savedRegions;
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
      if (a.ownerRegion < b.ownerRegion) {
        return 1;
      }
      if (a.ownerRegion > b.ownerRegion) {
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
    } else if (this.activeBulletin) {
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
    if (this.activeBulletin && this.activeBulletin.id === bulletin.id) this.activeBulletin = bulletin;

    this.internBulletinsList.sort((a, b): number => {
      if (a.ownerRegion < b.ownerRegion) {
        return 1;
      }
      if (a.ownerRegion > b.ownerRegion) {
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
    for (const region of bulletin.suggestedRegions) {
      if (region.startsWith(this.authenticationService.getActiveRegionId())) {
        // delete region from other bulletinInputModels
        for (const b of this.internBulletinsList) {
          const savedRegions = new Array<string>();
          for (const entry of b.savedRegions) {
            if (entry !== region) {
              savedRegions.push(entry);
            }
          }
          b.savedRegions = savedRegions;
        }

        bulletin.savedRegions.push(region);
      } else {
        suggested.push(region);
      }
    }
    bulletin.suggestedRegions = suggested;
    bulletin.addAdditionalAuthor(this.authenticationService.getCurrentAuthor().name);

    this.updateBulletinOnServer(bulletin);
  }

  rejectSuggestions(event, bulletin: BulletinModel) {
    event.stopPropagation();
    const suggested = new Array<string>();
    for (const region of bulletin.suggestedRegions) {
      if (!region.startsWith(this.authenticationService.getActiveRegionId())) {
        suggested.push(region);
      }
    }
    bulletin.suggestedRegions = suggested;

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
      bulletin.author = this.authenticationService.getCurrentAuthor();
      bulletin.addAdditionalAuthor(this.authenticationService.getCurrentAuthor().name);
      bulletin.ownerRegion = this.authenticationService.getActiveRegionId();
      if (this.authenticationService.getActiveRegion().enableGeneralHeadline && this.internBulletinsList.length) {
        bulletin.generalHeadlineCommentTextcat = this.internBulletinsList[0].generalHeadlineCommentTextcat;
        bulletin.generalHeadlineComment$ = this.internBulletinsList[0].generalHeadlineComment$;
        bulletin.generalHeadlineCommentNotes = this.internBulletinsList[0].generalHeadlineCommentNotes;
      }
    }

    this.selectBulletin(bulletin);
    this.editBulletinMicroRegions(bulletin);
  }

  copyBulletin(bulletin: BulletinModel) {
    const newBulletin = new BulletinModel(bulletin);
    newBulletin.additionalAuthors = new Array<string>();
    newBulletin.savedRegions = new Array<string>();
    newBulletin.publishedRegions = new Array<string>();
    newBulletin.suggestedRegions = new Array<string>();

    newBulletin.author = this.authenticationService.getCurrentAuthor();
    newBulletin.addAdditionalAuthor(this.authenticationService.getCurrentAuthor().name);
    newBulletin.ownerRegion = this.authenticationService.getActiveRegionId();

    // if bulletin without textcats is copied to region with textcat, clear texts
    if (!this.authenticationService.getActiveRegion().enableEditableFields) {
      if (!bulletin.avActivityCommentTextcat) {
        newBulletin.avActivityComment$ = emptyLangTexts();
      }
      if (!bulletin.avActivityHighlightsTextcat) {
        newBulletin.avActivityHighlights$ = emptyLangTexts();
      }
      if (!bulletin.snowpackStructureCommentTextcat) {
        newBulletin.snowpackStructureComment$ = emptyLangTexts();
      }
      if (!bulletin.snowpackStructureHighlightsTextcat) {
        newBulletin.snowpackStructureHighlights$ = emptyLangTexts();
      }
      if (!bulletin.tendencyCommentTextcat) {
        newBulletin.tendencyComment$ = emptyLangTexts();
      }
      if (!bulletin.generalHeadlineCommentTextcat) {
        newBulletin.generalHeadlineComment$ = emptyLangTexts();
      }
      if (!bulletin.synopsisCommentTextcat) {
        newBulletin.synopsisComment$ = emptyLangTexts();
      }
    }

    if (!this.authenticationService.getActiveRegion().enableGeneralHeadline) {
      newBulletin.generalHeadlineComment$ = emptyLangTexts();
    }
    if (!this.authenticationService.getActiveRegion().enableWeatherTextField) {
      newBulletin.synopsisComment$ = emptyLangTexts();
    }

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

  toggleNextBulletin() {
    const index = this.internBulletinsList.indexOf(this.activeBulletin);
    if (this.activeBulletin && index >= 0 && index < this.internBulletinsList.length - 1) {
      this.selectBulletin(this.internBulletinsList[index + 1]);
    } else if (!this.activeBulletin && this.internBulletinsList.length > 0) {
      this.selectBulletin(this.internBulletinsList[0]);
    }
  }

  togglePreviousBulletin() {
    const index = this.internBulletinsList.indexOf(this.activeBulletin);
    if (this.activeBulletin && index > 0) {
      this.selectBulletin(this.internBulletinsList[index - 1]);
    } else if (!this.activeBulletin && this.internBulletinsList.length > 0) {
      this.selectBulletin(this.internBulletinsList[this.internBulletinsList.length - 1]);
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
    this.bulletinsService.getPreviewPdf(this.internBulletinsList).subscribe((blob) => {
      this.loadingPreview = false;
      const formattedDate = this.constantsService.getISODateString(this.bulletinsService.getActiveDate()[1]);
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
        this.checkBulletin(bulletin)
      ) {
        error = true;
      }
    }

    return error;
  }

  protected checkBulletin(bulletin: BulletinModel) {
    const checkProblems = (problems: AvalancheProblemModel[]) =>
      problems.some((problem) => this.checkAvalancheProblem(problem));

    if (
      bulletin.forenoon &&
      checkProblems([
        bulletin.forenoon.avalancheProblem1,
        bulletin.forenoon.avalancheProblem2,
        bulletin.forenoon.avalancheProblem3,
        bulletin.forenoon.avalancheProblem4,
        bulletin.forenoon.avalancheProblem5,
      ])
    ) {
      return true;
    }

    if (
      bulletin.afternoon &&
      checkProblems([
        bulletin.afternoon.avalancheProblem1,
        bulletin.afternoon.avalancheProblem2,
        bulletin.afternoon.avalancheProblem3,
        bulletin.afternoon.avalancheProblem4,
        bulletin.afternoon.avalancheProblem5,
      ])
    ) {
      return true;
    }

    const checkTexts = (texts: LangTexts[]) => texts.some((text) => this.checkTextcatTranslations(text));

    if (
      checkTexts([
        bulletin.avActivityHighlights$,
        bulletin.avActivityComment$,
        bulletin.snowpackStructureHighlights$,
        bulletin.snowpackStructureComment$,
      ])
    ) {
      return true;
    }

    return false;
  }

  private checkTextcatTranslations(text: LangTexts) {
    return Object.values(text).some((t) => t && t.startsWith("⚠ Error:"));
  }

  private checkAvalancheProblem(avalancheProblem: AvalancheProblemModel) {
    if (!avalancheProblem) {
      return false;
    }
    return (
      avalancheProblem.aspects.length <= 0 ||
      !avalancheProblem.avalancheProblem ||
      !avalancheProblem.avalancheType ||
      !avalancheProblem.getDangerRating() ||
      avalancheProblem.getDangerRating() == Enums.DangerRating.missing ||
      !avalancheProblem.matrixInformation ||
      !avalancheProblem.matrixInformation.snowpackStability ||
      !avalancheProblem.matrixInformation.frequency ||
      !avalancheProblem.matrixInformation.avalancheSize
    );
  }

  deleteBulletin(event: Event, bulletin: BulletinModel) {
    event.stopPropagation();
    this.eventDeleteBulletin(bulletin);
  }

  eventDeleteBulletin(bulletin: BulletinModel) {
    this.bulletinMarkedDelete = bulletin;
    this.openDeleteAggregatedRegionModal(this.deleteAggregatedRegionTemplate());
  }

  compareBulletin(event: Event, bulletin: BulletinModel) {
    event.stopPropagation();
    this.comparedBulletin = bulletin;
  }

  private delBulletin(bulletin: BulletinModel) {
    this.deselectBulletin(true);
    this.deleteBulletinOnServer(bulletin).subscribe();
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

    const isUpdate: boolean = this.activeBulletin.savedRegions.length !== 0; // save selected regions to active bulletin
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
      for (const region of this.activeBulletin.savedRegions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          oldSavedRegions.push(region);
        }
      }
      for (const region of oldSavedRegions) {
        const index = this.activeBulletin.savedRegions.indexOf(region);
        this.activeBulletin.savedRegions.splice(index, 1);
      }

      // delete old published regions in own area
      const oldPublishedRegions = new Array<string>();
      for (const region of this.activeBulletin.publishedRegions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          oldPublishedRegions.push(region);
        }
      }
      for (const region of oldPublishedRegions) {
        const index = this.activeBulletin.publishedRegions.indexOf(region);
        this.activeBulletin.publishedRegions.splice(index, 1);
      }

      // delete old suggested regions outside own area
      const oldSuggestedRegions = new Array<string>();
      for (const region of this.activeBulletin.suggestedRegions) {
        if (!region.startsWith(this.authenticationService.getActiveRegionId())) {
          oldSuggestedRegions.push(region);
        }
      }
      for (const region of oldSuggestedRegions) {
        const index = this.activeBulletin.suggestedRegions.indexOf(region);
        this.activeBulletin.suggestedRegions.splice(index, 1);
      }

      for (const region of regions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          if (!this.activeBulletin.savedRegions.includes(region)) {
            this.activeBulletin.savedRegions.push(region);
          }
        } else {
          if (
            !region.startsWith(this.activeBulletin.ownerRegion) &&
            !this.activeBulletin.savedRegions.includes(region) &&
            !this.activeBulletin.suggestedRegions.includes(region) &&
            !this.activeBulletin.publishedRegions.includes(region)
          ) {
            this.activeBulletin.suggestedRegions.push(region);
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
      this.openNoRegionModal(this.noRegionTemplate());
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
    bulletin.validFrom = this.bulletinsService.getActiveDate()[0];
    bulletin.validUntil = this.bulletinsService.getActiveDate()[1];
    this.bulletinsService.createBulletin(bulletin, this.bulletinsService.getActiveDate()).subscribe(
      (data) => {
        if (this.activeBulletin && this.activeBulletin.id == undefined) {
          this.activeBulletin.id = this.getNewId(data, regionId);
        }
        this.mapService.deselectAggregatedRegion();
        this.addInternalBulletins(data);
        this.loadInternalBulletinsError = false;
        this.loading = false;
        this.updateBulletinStatusEdit();
        console.log("Bulletin created on server.");
      },
      (error) => {
        console.error("Bulletin could not be created on server!");
        this.openSaveErrorModal(this.saveErrorTemplate());
      },
    );
  }

  updateSaveErrors() {
    for (const bulletin of this.saveError.values()) {
      this.updateBulletinOnServer(bulletin, false);
    }
  }

  private updateBulletinOnServerNow(bulletin: BulletinModel, checkErrors = true, writeUndoStack = true) {
    if (this.isWriteDisabled()) return;
    bulletin.validFrom = this.bulletinsService.getActiveDate()[0];
    bulletin.validUntil = this.bulletinsService.getActiveDate()[1];
    if (writeUndoStack) {
      this.undoRedoService.pushToUndoStack(bulletin);
    }
    this.bulletinsService.updateBulletin(bulletin, this.bulletinsService.getActiveDate()).subscribe(
      (data) => {
        this.addInternalBulletins(data);
        this.saveError.delete(bulletin.id);
        this.loadInternalBulletinsError = false;
        this.loading = false;
        if (checkErrors) {
          this.updateSaveErrors();
        }
        this.updateBulletinStatusEdit();
        console.log("Bulletin updated on server.");
      },
      (error) => {
        console.error("Bulletin could not be updated on server!");
        this.saveError.set(bulletin.id, bulletin);
      },
    );
  }

  private deleteBulletinOnServer(bulletin: BulletinModel): Observable<BulletinModelAsJSON[]> {
    if (this.isWriteDisabled()) {
      return of(null);
    }
    // tap is used to perform side-effects for the observable
    return this.bulletinsService.deleteBulletin(bulletin, this.bulletinsService.getActiveDate()).pipe(
      tap({
        next: (data) => {
          this.addInternalBulletins(data);
          this.loadInternalBulletinsError = false;
          this.loading = false;
          console.log("Bulletin deleted on server.");
        },
        error: (error) => {
          console.error("Bulletin could not be deleted on server!");
          this.openSaveErrorModal(this.saveErrorTemplate());
        },
      }),
    );
  }

  hasSuggestions(bulletin: BulletinModel): boolean {
    return bulletin.suggestedRegions.some((region) =>
      region.startsWith(this.authenticationService.getActiveRegionId()),
    );
  }

  isCreator(bulletin: BulletinModel): boolean {
    return (
      bulletin.ownerRegion !== undefined &&
      bulletin.ownerRegion.startsWith(this.authenticationService.getActiveRegionId())
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
    if (bulletin !== undefined && bulletin.savedRegions.length === 0) {
      this.delBulletin(bulletin);
      this.activeBulletin = undefined;
    } else {
      if (this.activeBulletin) {
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
      const regions = bulletin.publishedRegions.concat(bulletin.savedRegions);
      for (const region of regions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          bulletin.validFrom = this.bulletinsService.getActiveDate()[0];
          bulletin.validUntil = this.bulletinsService.getActiveDate()[1];
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
        this.updateBulletinStatusEdit();
        this.autoSaving = false;
      },
      () => {
        this.autoSaving = false;
        console.error("Bulletins could not be saved on server!");
        this.openSaveErrorModal(this.saveErrorTemplate());
      },
    );
  }

  updateBulletinStatusEdit() {
    let newStatus;

    if (this.bulletinsService.hasBeenPublished5PM(this.bulletinsService.getActiveDate())) {
      newStatus = this.bulletinStatus.updated;
    } else {
      newStatus = this.bulletinStatus.draft;
    }

    this.bulletinsService.statusMap
      .get(this.authenticationService.getActiveRegionId())
      .set(this.bulletinsService.getActiveDate()[0].getTime(), newStatus);
  }

  goBack() {
    this.deselectBulletin();
    this.router.navigate(["/bulletins"]);
  }

  openLoadingErrorModal(template: TemplateRef<unknown>) {
    this.loadingErrorModalRef = this.modalService.show(template, this.config);
  }

  loadingErrorModalConfirm(): void {
    this.loadingErrorModalRef.hide();
  }

  openLoadingJsonFileErrorModal(template: TemplateRef<unknown>) {
    this.loadingJsonFileErrorModalRef = this.modalService.show(template, this.config);
  }

  loadingJsonFileErrorModalConfirm(): void {
    this.loadingJsonFileErrorModalRef.hide();
  }

  openLoadModal(template: TemplateRef<unknown>) {
    this.loadModalRef = this.modalService.show(template, this.config);
  }

  loadModalConfirm(event: Event): void {
    (event.currentTarget as HTMLButtonElement).setAttribute("disabled", "disabled");
    this.loadModalRef.hide();
    this.loading = true;
    const date = this.bulletinsService.getPreviousDate();

    const regions = [this.authenticationService.getActiveRegionId()];
    this.bulletinsService.loadBulletinsFromServer(date, regions).subscribe(
      ({ bulletins }) => {
        // delete own regions
        const entries = new Array<BulletinModel>();
        for (const bulletin of this.internBulletinsList) {
          if (bulletin.ownerRegion.startsWith(this.authenticationService.getActiveRegionId())) {
            entries.push(bulletin);
          } else {
            const tmpSavedRegions = new Array<string>();
            bulletin.savedRegions.forEach((region) => {
              if (region.startsWith(this.authenticationService.getActiveRegionId())) {
                bulletin.suggestedRegions.push(region);
              } else {
                tmpSavedRegions.push(region);
              }
            });
            bulletin.savedRegions = tmpSavedRegions;
            const tmpPublishedRegions = new Array<string>();
            bulletin.publishedRegions.forEach((region) => {
              if (region.startsWith(this.authenticationService.getActiveRegionId())) {
                bulletin.suggestedRegions.push(region);
              } else {
                tmpPublishedRegions.push(region);
              }
            });
            bulletin.publishedRegions = tmpPublishedRegions;
            this.updateBulletinOnServer(bulletin, false, false);
          }
        }
        this.deselectBulletin(true);
        const delObservables: Observable<unknown>[] = entries.map((entry) => this.deleteBulletinOnServer(entry));
        forkJoin(delObservables).subscribe({
          complete: () => {
            // only copy after all deletions are complete
            this.copyBulletins(bulletins);
            this.loading = false;
          },
        });
      },
      () => {
        this.loading = false;
        this.openLoadingErrorModal(this.loadingErrorTemplate());
      },
    );
  }

  loadModalDecline(event: Event): void {
    (event.currentTarget as HTMLButtonElement).setAttribute("disabled", "disabled");
    this.loadModalRef.hide();
  }

  openDeleteAllWarningRegionsModal(template: TemplateRef<unknown>) {
    this.deleteAllWarningRegionsModalRef = this.modalService.show(template, this.config);
  }

  deleteAllWarningRegionsModalConfirm(event: Event): void {
    (event.currentTarget as HTMLButtonElement).setAttribute("disabled", "disabled");
    this.deleteAllWarningRegionsModalRef.hide();

    // delete own regions
    for (const bulletin of this.internBulletinsList) {
      if (bulletin.ownerRegion.startsWith(this.authenticationService.getActiveRegionId())) {
        this.delBulletin(bulletin);
      }
    }
  }

  deleteAllWarningRegionsModalDecline(event: Event): void {
    (event.currentTarget as HTMLButtonElement).setAttribute("disabled", "disabled");
    this.deleteAllWarningRegionsModalRef.hide();
  }

  openDeleteAggregatedRegionModal(template: TemplateRef<unknown>) {
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

  openNoRegionModal(template: TemplateRef<unknown>) {
    this.noRegionModalRef = this.modalService.show(template, this.config);
  }

  noRegionModalConfirm(): void {
    this.noRegionModalRef.hide();
  }

  openDiscardModal(template: TemplateRef<unknown>) {
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
    this.copyRegionModalRef = this.modalService.show(this.copyRegionTemplate(), this.config);
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

  openSaveErrorModal(template: TemplateRef<unknown>) {
    this.saveErrorModalRef = this.modalService.show(template, this.config);
  }

  saveErrorModalConfirm(): void {
    this.saveErrorModalRef.hide();
    this.loading = false;
  }

  openChangeErrorModal(template: TemplateRef<unknown>) {
    this.changeErrorModalRef = this.modalService.show(template, this.config);
  }

  changeErrorModalConfirm(): void {
    this.changeErrorModalRef.hide();
  }

  openAvalancheProblemErrorModal(template: TemplateRef<unknown>) {
    this.avalancheProblemErrorModalRef = this.modalService.show(template, this.config);
    this.modalService.onHide.subscribe(() => {
      this.publishing = false;
      this.submitting = false;
    });
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
            this.openSubmitBulletinsDuplicateRegionModal(this.submitBulletinsDuplicateRegionTemplate());
          } else {
            this.openSubmitBulletinsModal(this.submitBulletinsTemplate(), message, date);
          }
        },
        (error) => {
          console.error("Bulletins could not be checked!");
          this.openCheckBulletinsErrorModal(this.checkBulletinsErrorTemplate());
        },
      );
    } else {
      this.openAvalancheProblemErrorModal(this.avalancheProblemErrorTemplate());
    }
  }

  openSubmitBulletinsDuplicateRegionModal(template: TemplateRef<unknown>) {
    this.submitBulletinsDuplicateRegionModalRef = this.modalService.show(template, this.config);
  }

  submitBulletinsDuplicateRegionModalConfirm(): void {
    this.submitBulletinsDuplicateRegionModalRef.hide();
    this.submitting = false;
  }

  openSubmitBulletinsModal(template: TemplateRef<unknown>, message: string, date: [Date, Date]) {
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

  openCheckBulletinsErrorModal(template: TemplateRef<unknown>) {
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
        this.openSubmitBulletinsErrorModal(this.submitBulletinsErrorTemplate());
      },
    );
  }

  submitBulletinsModalDecline(): void {
    this.submitBulletinsModalRef.hide();
    this.submitting = false;
  }

  openSubmitBulletinsErrorModal(template: TemplateRef<unknown>) {
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
    this.updateBulletinStatusEdit();
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

  publish(event: Event, date: [Date, Date], change = false) {
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

          this.openPublishBulletinsModal(message, date, change);
        },
        (error) => {
          console.error("Bulletins could not be checked!");
          this.openCheckBulletinsErrorModal(this.checkBulletinsErrorTemplate());
        },
      );
    } else {
      this.openAvalancheProblemErrorModal(this.avalancheProblemErrorTemplate());
    }
  }

  openPublishBulletinsModal(message: string, date: [Date, Date], change: boolean) {
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
          this.openPublishBulletinsErrorModal(this.publishBulletinsErrorTemplate());
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
          this.openPublishBulletinsErrorModal(this.publishBulletinsErrorTemplate());
        },
      );
    }
  }

  publishBulletinsModalDecline(): void {
    this.publishBulletinsModalRef.hide();
    this.publishing = false;
  }

  openPublishBulletinsErrorModal(template: TemplateRef<unknown>) {
    this.publishBulletinsErrorModalRef = this.modalService.show(template, this.config);
  }

  publishBulletinsErrorModalConfirm(): void {
    this.publishBulletinsErrorModalRef.hide();
    this.publishing = false;
  }

  openPreviewErrorModal(template: TemplateRef<unknown>) {
    this.previewErrorModalRef = this.modalService.show(template, this.config);
  }

  previewErrorModalConfirm(): void {
    this.previewErrorModalRef.hide();
    this.loadingPreview = false;
  }

  openCheckBulletinsModal(message: string) {
    const initialState = {
      text: message,
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
