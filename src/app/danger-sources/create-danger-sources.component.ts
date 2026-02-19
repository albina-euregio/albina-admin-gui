import * as Enums from "../enums/enums";
// models
import { MatrixInformationSchema } from "../models/matrix-information.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { MapService } from "../providers/map-service/map.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { AspectsComponent } from "../shared/aspects.component";
import { AvalancheProblemIconsComponent } from "../shared/avalanche-problem-icons.component";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";
import { DangerSourceVariantComponent } from "./danger-source-variant.component";
import { DangerSourcesService } from "./danger-sources.service";
import { ModalCreateDangerSourceComponent } from "./modal-create-danger-source.component";
import { ModalEditDangerSourceComponent } from "./modal-edit-danger-source.component";
import {
  DangerSourceVariantModel,
  DangerSourceVariantStatus,
  DangerSourceVariantType,
  Daytime,
  Probability,
  sortDangerSourceVariantsByRelevance,
} from "./models/danger-source-variant.model";
import { DangerSourceModel } from "./models/danger-source.model";
import { DatePipe, NgClass, NgTemplateOutlet } from "@angular/common";
import { Component, ElementRef, HostListener, inject, OnDestroy, OnInit, TemplateRef, viewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
// services
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { LocalStorageService } from "app/providers/local-storage-service/local-storage.service";
import { orderBy } from "es-toolkit";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { Subscription } from "rxjs";

@Component({
  templateUrl: "create-danger-sources.component.html",
  standalone: true,
  imports: [
    NgClass,
    NgTemplateOutlet,
    DangerSourceVariantComponent,
    BsDropdownModule,
    DatePipe,
    TranslateModule,
    NgxMousetrapDirective,
    AvalancheProblemIconsComponent,
    AspectsComponent,
  ],
})
export class CreateDangerSourcesComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private activeRoute = inject(ActivatedRoute);
  dangerSourcesService = inject(DangerSourcesService);
  authenticationService = inject(AuthenticationService);
  translateService = inject(TranslateService);
  private localStorageService = inject(LocalStorageService);
  constantsService = inject(ConstantsService);
  regionsService = inject(RegionsService);
  private mapService = inject(MapService);
  private modalService = inject(BsModalService);

  public variantStatus = DangerSourceVariantStatus;
  public variantType = DangerSourceVariantType;

  public editRegions: boolean;
  public loading: boolean;
  public saveError: Map<string, DangerSourceVariantModel>;
  public loadInternalVariantsError: boolean;
  public loadInternalDangerSourcesError: boolean;

  public showAfternoonMap: boolean;

  public activeVariant: DangerSourceVariantModel;
  public comparedVariant: DangerSourceVariantModel;
  public internVariantsList: DangerSourceVariantModel[];
  public internDangerSourcesList: DangerSourceModel[];
  public activeDangerSourceOnMap: DangerSourceModel;

  public showDangerSourceVariantsMap: Map<string, boolean>;
  public showNewVariantModal = false;

  public isCompactMapLayout = false;
  public isVariantsSidebarVisible = true;
  private variantMarkedDelete: DangerSourceVariantModel;

  public copying: boolean;

  readonly scrollActiveVariant = viewChild<ElementRef>("scrollActiveVariant");
  readonly scrollComparedVariant = viewChild<ElementRef>("scrollComparedVariant");

  public loadingErrorModalRef: BsModalRef;
  readonly loadingErrorTemplate = viewChild<TemplateRef<unknown>>("loadingErrorTemplate");

  public loadModalRef: BsModalRef;
  readonly loadTemplate = viewChild<TemplateRef<unknown>>("loadTemplate");

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

  public checkBulletinsModalRef: BsModalRef;
  readonly checkBulletinsTemplate = viewChild<TemplateRef<unknown>>("checkBulletinsTemplate");

  public checkBulletinsErrorModalRef: BsModalRef;
  readonly checkBulletinsErrorTemplate = viewChild<TemplateRef<unknown>>("checkBulletinsErrorTemplate");

  public editDangerSourceModalRef: BsModalRef;
  readonly editDangerSourceTemplate = viewChild<TemplateRef<unknown>>("editDangerSourceTemplate");

  public createDangerSourceModalRef: BsModalRef;
  readonly createDangerSourceTemplate = viewChild<TemplateRef<unknown>>("createDangerSourceTemplate");

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-md",
  };

  constructor() {
    this.loading = false;
    this.showAfternoonMap = false;
    this.mapService.resetAll();
    this.internVariantsList = new Array<DangerSourceVariantModel>();
    this.internDangerSourcesList = new Array<DangerSourceModel>();
    this.showDangerSourceVariantsMap = new Map<string, boolean>(); // this.preventClick = false;

    if (this.localStorageService.getCompactMapLayout()) {
      this.isCompactMapLayout = this.localStorageService.getCompactMapLayout();
    } else {
      // Set initial value based on the current window width
      this.isCompactMapLayout = window.innerWidth < 768;
    }

    this.copying = false;
    this.saveError = new Map();
    this.loadInternalVariantsError = false;

    this.route.queryParams.subscribe((params) => {
      this.dangerSourcesService.setIsReadOnly(params.readOnly ? params.readOnly.toLocaleLowerCase() === "true" : false);
    });
  }

  @HostListener("window:resize", ["$event"])
  onResize(event: Event) {
    this.isCompactMapLayout = (event.target as Window).innerWidth < 768;
    this.localStorageService.setCompactMapLayout(this.isCompactMapLayout);
  }

  reset() {
    this.activeVariant = undefined;
    this.comparedVariant = undefined;
    this.activeDangerSourceOnMap = undefined;

    this.editRegions = false;
    this.showAfternoonMap = false;
    this.showDangerSourceVariantsMap = new Map<string, boolean>();
  }

  private initDangerSourceVariantsMap() {
    for (const dangerSource of this.internDangerSourcesList) {
      if (
        this.getVariantCountByStatus(dangerSource, DangerSourceVariantStatus.active) == 0 &&
        this.getVariantCountByStatus(dangerSource, DangerSourceVariantStatus.dormant) == 0
      ) {
        this.showDangerSourceVariantsMap.set(dangerSource.id, false);
      } else {
        this.showDangerSourceVariantsMap.set(dangerSource.id, true);
      }
    }
  }

  ngOnInit() {
    this.activeRoute.params.subscribe((routeParams) => {
      const date = new Date(routeParams.date);
      date.setHours(0, 0, 0, 0);
      this.dangerSourcesService.setActiveDate(this.dangerSourcesService.getValidFromUntil(date));

      if (this.authenticationService.isCurrentUserInRole(this.constantsService.roleObserver)) {
        this.dangerSourcesService.setIsReadOnly(true);
      }

      this.initializeComponent();
    });
  }

  async initializeComponent() {
    this.loading = true;

    await this.initMaps();

    if (this.dangerSourcesService.getActiveDate() && this.authenticationService.isUserLoggedIn()) {
      this.reset();

      this.loadDangerSourcesFromServer(this.dangerSourcesService.getDangerSourceVariantType());
      this.mapService.deselectAggregatedRegion();

      this.dangerSourcesService.setIsEditable(true);
    } else {
      this.goBack();
    }
  }

  toggleCompactMapLayout() {
    this.isCompactMapLayout = !this.isCompactMapLayout;
    this.localStorageService.setCompactMapLayout(this.isCompactMapLayout);
  }

  toggleVariantsSidebar() {
    this.isVariantsSidebarVisible = !this.isVariantsSidebarVisible;
  }

  isNaturalReleaseLikely(variant: DangerSourceVariantModel): boolean {
    return variant.naturalRelease === Probability.likely;
  }

  updateVariantScroll(scrollId: string, event): void {
    event.preventDefault();
    event.stopPropagation();
    const scrollActiveVariant = this.scrollActiveVariant();
    if (!scrollActiveVariant?.nativeElement) return;
    const scrollComparedVariant = this.scrollComparedVariant();
    if (!scrollComparedVariant?.nativeElement) return;
    if (scrollId === "scrollComparedVariant") {
      scrollActiveVariant.nativeElement.scrollTop = scrollComparedVariant.nativeElement.scrollTop;
    } else if (scrollId === "scrollActiveVariant") {
      scrollComparedVariant.nativeElement.scrollTop = scrollActiveVariant.nativeElement.scrollTop;
    }
  }

  private pendingDangerSources: Subscription;
  private pendingDangerSourcesVariants: Subscription;
  public loadDangerSourcesFromServer(type: DangerSourceVariantType) {
    console.log("Loading danger sources");
    this.internVariantsList = new Array<DangerSourceVariantModel>();
    this.pendingDangerSources?.unsubscribe();
    this.pendingDangerSources = this.dangerSourcesService
      .loadDangerSources(this.dangerSourcesService.getActiveDate(), this.authenticationService.getActiveRegionId())
      .subscribe({
        next: (dangerSources) => {
          console.log("Loaded %d danger sources", dangerSources.length);
          this.addInternalDangerSources(dangerSources);
          this.loadInternalDangerSourcesError = false;
          this.pendingDangerSourcesVariants?.unsubscribe();
          console.log("Loading danger source variants");
          this.pendingDangerSourcesVariants = this.dangerSourcesService
            .loadDangerSourceVariants(
              this.dangerSourcesService.getActiveDate(),
              this.authenticationService.getActiveRegionId(),
            )
            .subscribe({
              next: (variants) => {
                console.log("Loaded %d danger source variants", variants.length);
                this.loadInternalVariantsError = false;

                if (
                  type === DangerSourceVariantType.analysis &&
                  !variants.some((variant) => variant.dangerSourceVariantType === DangerSourceVariantType.analysis)
                ) {
                  const newVariants = this.copyVariants(variants, true);
                  //this.addInternalVariants(dangerSources, variants.concat(newVariants), type);
                  this.save(variants.concat(newVariants));
                } else {
                  this.addInternalVariants(variants, type);
                }
                this.sortInternDangerSourcesList();
                this.initDangerSourceVariantsMap();
                this.loading = false;
              },
              error: (error) => {
                console.error("Variants could not be loaded!", error);
                this.loading = false;
                this.loadInternalVariantsError = true;
              },
            });
        },
        error: (error) => {
          console.error("Danger sources could not be loaded!", error);
          this.loading = false;
          this.loadInternalDangerSourcesError = true;
        },
      });
  }

  ngOnDestroy() {
    this.mapService.resetAll();
    this.mapService.removeMaps();

    this.dangerSourcesService.setActiveDate(undefined);
    this.dangerSourcesService.setIsEditable(false);

    this.loading = false;
    this.editRegions = false;
    this.copying = false;
  }

  isDisabled() {
    return (
      this.loading ||
      !this.dangerSourcesService.getIsEditable() ||
      this.editRegions ||
      !this.isCreator(this.activeVariant) ||
      this.authenticationService.isCurrentUserInRole(this.constantsService.roleObserver)
    );
  }

  changeDate(date: [Date, Date]) {
    this.deselectVariant();
    const formattedDate = this.constantsService.getISODateString(date[1]);
    this.router.navigate(["/danger-sources/" + formattedDate], {
      queryParams: { readOnly: this.dangerSourcesService.getIsReadOnly() },
    });
  }

  private async initMaps() {
    await this.mapService.initAmPmMap();
    this.mapService.map.on({ click: (event) => this.onMapClick(event.originalEvent) });
    this.mapService.afternoonMap.on({
      click: (event) => this.onMapClick(event.originalEvent),
    });
  }

  private onMapClick(event: MouseEvent) {
    if (!this.showNewVariantModal && !this.editRegions) {
      const clickedRegion = this.mapService.getClickedRegion();
      for (const variant of this.internVariantsList) {
        if (
          variant.regions.includes(clickedRegion) &&
          variant.dangerSourceVariantStatus !== DangerSourceVariantStatus.inactive
        ) {
          if (
            !this.activeDangerSourceOnMap ||
            (this.activeDangerSourceOnMap && variant.dangerSource.id === this.activeDangerSourceOnMap.id)
          ) {
            if (
              (/Mac|iPod|iPhone|iPad/.test(navigator.platform) ? event.metaKey : event.ctrlKey) &&
              this.activeVariant &&
              this.activeVariant !== variant
            ) {
              this.compareVariant(variant);
              break;
            } else {
              if (this.activeVariant === variant) {
                this.deselectVariant();
                break;
              } else {
                this.selectVariant(variant);
                break;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Returns the main date of the danger source when it was created. This is one day off the creation date due to the validity from 5PM until 5PM
   * @param creationDatetime Creation datetime of the danger source
   * @returns Main date of the danger source
   */
  getMainDateString(creationDatetime?: Date): Date {
    const result = new Date(creationDatetime);
    result.setDate(result.getDate() + 1);
    return result;
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

  hasForecast(variant: DangerSourceVariantModel): boolean {
    return (
      variant.dangerSourceVariantType === DangerSourceVariantType.analysis &&
      this.internVariantsList.some((v) => variant.forecastDangerSourceVariantId === v.id)
    );
  }

  compareForecast(event: Event, variant: DangerSourceVariantModel) {
    event.stopPropagation();

    if (this.comparedVariant && this.comparedVariant.id === variant.forecastDangerSourceVariantId) {
      this.comparedVariant = undefined;
    } else {
      this.selectVariant(variant);
      this.comparedVariant = this.internVariantsList.find((v) => variant.forecastDangerSourceVariantId === v.id);
    }
  }

  getVariantsOfDangerSource(dangerSourceId: string) {
    const result = new Array<DangerSourceVariantModel>();
    for (const variant of this.internVariantsList) {
      if (
        variant.dangerSource.id === dangerSourceId &&
        variant.dangerSourceVariantType === this.dangerSourcesService.getDangerSourceVariantType()
      ) {
        result.push(variant);
      }
    }
    return result;
  }

  getOwnVariants() {
    const result = new Array<DangerSourceVariantModel>();
    for (const variant of this.internVariantsList) {
      if (variant.ownerRegion.startsWith(this.authenticationService.getActiveRegionId())) {
        result.push(variant);
      }
    }
    return result;
  }

  getForeignVariants() {
    const result = new Array<DangerSourceVariantModel>();
    for (const variant of this.internVariantsList) {
      if (
        !variant.ownerRegion.startsWith(this.authenticationService.getActiveRegionId()) &&
        !this.authenticationService.isExternalRegion(variant.ownerRegion.toString())
      ) {
        result.push(variant);
      }
    }
    return result;
  }

  loadAllVariantsFromYesterday() {
    this.openLoadModal(this.loadTemplate());
  }

  loadVariantsFromYesterday(dangerSourceId?: string) {
    const date = this.dangerSourcesService.getNextDate();

    if (dangerSourceId) {
      this.dangerSourcesService
        .loadDangerSourceVariants(date, this.authenticationService.getActiveRegionId(), dangerSourceId)
        .subscribe(
          (variants) => {
            // delete own regions of danger source
            const resultVariants = new Array<DangerSourceVariantModel>();

            for (const variant of this.internVariantsList) {
              if (
                !variant.ownerRegion.startsWith(this.authenticationService.getActiveRegionId()) ||
                variant.dangerSource.id !== dangerSourceId
              ) {
                resultVariants.push(variant);
              }
            }

            this.copyVariants(
              variants.filter((variant) => variant.dangerSourceVariantType === DangerSourceVariantType.analysis),
              false,
            ).forEach((element) => resultVariants.push(element));

            this.save(resultVariants);
            this.loading = false;
          },
          () => {
            this.loading = false;
            this.openLoadingErrorModal(this.loadingErrorTemplate());
          },
        );
    } else {
      this.dangerSourcesService
        .loadDangerSourceVariants(date, this.authenticationService.getActiveRegionId())
        .subscribe(
          (variants) => {
            // delete own regions
            const resultVariants = new Array<DangerSourceVariantModel>();

            for (const variant of this.internVariantsList) {
              if (!variant.ownerRegion.startsWith(this.authenticationService.getActiveRegionId())) {
                resultVariants.push(variant);
              }
            }

            this.copyVariants(
              variants.filter((variant) => variant.dangerSourceVariantType === DangerSourceVariantType.analysis),
              false,
            ).forEach((element) => resultVariants.push(element));

            this.save(resultVariants);
            this.loading = false;
          },
          () => {
            this.loading = false;
            this.openLoadingErrorModal(this.loadingErrorTemplate());
          },
        );
    }
  }

  toggleShowVariantsOnMap(dangerSourceId: string) {
    if (this.activeDangerSourceOnMap && this.activeDangerSourceOnMap.id === dangerSourceId) {
      this.activeDangerSourceOnMap = undefined;
    } else {
      this.activeDangerSourceOnMap = this.internDangerSourcesList.find((ds) => ds.id === dangerSourceId);
    }
    this.mapService.resetInternalAggregatedRegions();
    this.updateInternalVariantsOnMap(this.dangerSourcesService.getDangerSourceVariantType());
  }

  // create a copy of every variant (with new id)
  private copyVariants(response, setForecastVariantId: boolean): DangerSourceVariantModel[] {
    const result = Array<DangerSourceVariantModel>();
    for (const jsonVariant of response) {
      const variant = DangerSourceVariantModel.parse(jsonVariant);
      if (setForecastVariantId) {
        variant.forecastDangerSourceVariantId = variant.id;
      }
      variant.id = undefined;
      variant.ownerRegion = this.authenticationService.getActiveRegionId();
      variant.validFrom = this.dangerSourcesService.getActiveDate()[0];
      variant.validUntil = this.dangerSourcesService.getActiveDate()[1];
      variant.dangerSourceVariantType = this.dangerSourcesService.getDangerSourceVariantType();

      // reset regions
      const regions = new Array<string>();
      for (const region of variant.regions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          regions.push(region);
        }
      }

      if (regions.length > 0) {
        variant.regions = regions;
        result.push(variant);
      }
    }
    return result;
  }

  save(variants: DangerSourceVariantModel[]) {
    if (!variants.length) {
      return;
    }
    this.dangerSourcesService.replaceVariants(variants, this.dangerSourcesService.getActiveDate()).subscribe(
      () => {
        this.loadDangerSourcesFromServer(this.dangerSourcesService.getDangerSourceVariantType());
        this.loadInternalVariantsError = false;
        this.loading = false;
        console.log("Variants saved on server.");
      },
      () => {
        console.error("Variants could not be saved on server!");
        this.openSaveErrorModal(this.saveErrorTemplate());
      },
    );
  }

  private sortInternDangerSourcesList() {
    const variantType = this.internVariantsList.some(
      (variant) => variant.dangerSourceVariantType === DangerSourceVariantType.analysis,
    )
      ? DangerSourceVariantType.analysis
      : DangerSourceVariantType.forecast;

    // Sort by status (active > dormant > inactive), then by creationDate (desc)
    orderBy(
      this.internDangerSourcesList,
      [
        // Determine primary status for each danger source
        (dangerSource) => {
          // Count variants by status for each danger source
          const counts = {
            active: 0,
            dormant: 0,
            inactive: 0,
          };
          for (const variant of this.internVariantsList) {
            if (variant.dangerSource.id === dangerSource.id && variant.dangerSourceVariantType === variantType) {
              if (variant.dangerSourceVariantStatus === DangerSourceVariantStatus.active) counts.active++;
              else if (variant.dangerSourceVariantStatus === DangerSourceVariantStatus.dormant) counts.dormant++;
              else if (variant.dangerSourceVariantStatus === DangerSourceVariantStatus.inactive) counts.inactive++;
            }
          }
          if (counts.active > 0) return 0; // active
          if (counts.dormant > 0) return 0; // dormant
          if (counts.inactive > 0) return 2; // inactive
          return 3; // no variants
        },
        // If status is equal, sort by creationDate (desc)
        (dangerSource) => dangerSource.creationDate,
      ],
      ["asc", "desc"],
    );
  }

  private addInternalDangerSources(dangerSources: DangerSourceModel[]) {
    // Only mutate the array in-place, never assign a new array
    if (!this.internDangerSourcesList) {
      this.internDangerSourcesList = [];
    }
    // Remove items not in the new list
    for (let i = this.internDangerSourcesList.length - 1; i >= 0; i--) {
      if (!dangerSources.find((ds) => ds.id === this.internDangerSourcesList[i].id)) {
        this.internDangerSourcesList.splice(i, 1);
      }
    }
    // Update existing and add new
    dangerSources.forEach((ds, idx) => {
      const existing = this.internDangerSourcesList.find((item) => item.id === ds.id);
      if (existing) {
        Object.assign(existing, ds);
      } else {
        this.internDangerSourcesList.splice(idx, 0, ds);
      }
    });
    this.sortInternDangerSourcesList();
  }

  /**
   * Deletes one variant from internal variants.
   * @param variant variant to delete
   */
  private deleteInternalVariant(variant: DangerSourceVariantModel) {
    this.deselectVariant();
    this.internVariantsList.splice(this.internVariantsList.indexOf(variant), 1);
  }

  /**
   * Replaces all old variants with new ones.
   * @param dangerSourceVariants new variants
   */
  private addInternalVariants(dangerSourceVariants: DangerSourceVariantModel[], type: DangerSourceVariantType) {
    const variants = new Array<DangerSourceVariantModel>();
    for (const v of dangerSourceVariants) {
      const variant = DangerSourceVariantModel.parse(v);
      variant.forecastDangerSourceVariantId = v.forecastDangerSourceVariantId;
      variant.id = v.id;

      // set active variant
      if (this.activeVariant) {
        if (!this.activeVariant.id || this.activeVariant.id === "") {
          if (this.activeVariant.creationDate.getTime() === variant.creationDate.getTime()) {
            this.activeVariant = variant;
          }
          variants.push(variant);
        } else {
          // do not replace active variant
          if (this.activeVariant.id === variant.id) {
            this.activeVariant.regions = variant.regions;
            variants.push(this.activeVariant);
          } else {
            variants.push(variant);
          }
        }
      } else {
        variants.push(variant);
      }
    }

    // In-place update of internVariantsList
    if (!this.internVariantsList) {
      this.internVariantsList = [];
    }
    // Remove items not in the new list
    for (let i = this.internVariantsList.length - 1; i >= 0; i--) {
      if (!variants.find((v) => v.id === this.internVariantsList[i].id)) {
        this.internVariantsList.splice(i, 1);
      }
    }
    // Update existing and add new
    variants.forEach((v, idx) => {
      const existing = this.internVariantsList.find((item) => item.id === v.id);
      if (existing) {
        Object.assign(existing, v);
      } else {
        this.internVariantsList.splice(idx, 0, v);
      }
    });

    sortDangerSourceVariantsByRelevance(this.internVariantsList);
    this.updateInternalVariantsOnMap(type);

    if (this.editRegions) {
      this.mapService.showEditSelection();
    } else if (this.activeVariant) {
      this.mapService.selectAggregatedRegion(this.activeVariant, this.comparedVariant);
    }
  }

  private updateInternalVariantsOnMap(type: DangerSourceVariantType) {
    this.mapService.resetInternalAggregatedRegions();
    const variants = this.activeDangerSourceOnMap
      ? this.internVariantsList.filter((v) => v.dangerSource.id === this.activeDangerSourceOnMap.id)
      : this.internVariantsList;
    for (let i = variants.length - 1; i >= 0; --i) {
      if (variants[i].dangerSourceVariantType === type) {
        if (
          variants[i].dangerSourceVariantStatus === DangerSourceVariantStatus.inactive ||
          variants[i].dangerSourceVariantStatus === DangerSourceVariantStatus.dormant
        ) {
          continue;
        }
        if (variants[i].hasDaytimeDependency) {
          if (variants[i].dangerPeak !== Daytime.afternoon) {
            this.mapService.updateAggregatedRegionAM(variants[i]);
          } else {
            this.mapService.updateAggregatedRegionPM(variants[i]);
          }
        } else {
          this.mapService.updateAggregatedRegion(variants[i]);
        }
      }
    }
  }

  toggleDangerSourceVariantsList(dangerSourceId: string) {
    this.showDangerSourceVariantsMap.set(dangerSourceId, !this.showDangerSourceVariantsMap.get(dangerSourceId));
  }

  copyVariant(originalVariant: DangerSourceVariantModel) {
    this.showNewVariantModal = true;
    this.copying = false;
    const variant = DangerSourceVariantModel.parse(originalVariant);
    variant.id = undefined;
    variant.regions = new Array<string>();
    variant.ownerRegion = this.authenticationService.getActiveRegionId();
    variant.validFrom = this.dangerSourcesService.getActiveDate()[0];
    variant.validUntil = this.dangerSourcesService.getActiveDate()[1];

    this.selectVariant(variant);
    this.editVariantMicroRegions(variant);
  }

  createDangerSource() {
    this.openCreateDangerSourceModal();
  }

  createVariant(dangerSource: DangerSourceModel) {
    this.showNewVariantModal = true;
    const newVariant = DangerSourceVariantModel.parse({
      dangerSourceVariantStatus: DangerSourceVariantStatus.active,
      hasDaytimeDependency: false,
      aspects: [],
      dangerSigns: [],
      eawsMatrixInformation: MatrixInformationSchema.parse({}),
      terrainTypes: [],
      dangerSource: dangerSource,
      regions: [],
      weakLayerGrainShapes: [],
      ownerRegion: this.authenticationService.getActiveRegionId(),
      validFrom: this.dangerSourcesService.getActiveDate()[0],
      validUntil: this.dangerSourcesService.getActiveDate()[1],
      creationDate: new Date(),
      updateDate: new Date(),
    });
    this.selectVariant(newVariant);
    this.editVariantMicroRegions(newVariant);
  }

  toggleVariant(variant: DangerSourceVariantModel) {
    if (this.activeVariant && variant === this.activeVariant) {
      this.deselectVariant();
    } else {
      this.selectVariant(variant);
    }
  }

  getStatusString(dangerSource: DangerSourceModel) {
    return (
      " (" +
      this.getVariantCountByStatus(dangerSource, DangerSourceVariantStatus.active) +
      "/" +
      this.getVariantCountByStatus(dangerSource, DangerSourceVariantStatus.dormant) +
      "/" +
      this.getVariantCountByStatus(dangerSource, DangerSourceVariantStatus.inactive) +
      ")"
    );
  }

  getVariantCountByStatus(dangerSource: DangerSourceModel, status: DangerSourceVariantStatus): number {
    if (
      this.internVariantsList.some((variant) => variant.dangerSourceVariantType === DangerSourceVariantType.analysis)
    ) {
      return this.internVariantsList.filter(
        (variant) =>
          variant.dangerSource.id === dangerSource.id &&
          variant.dangerSourceVariantStatus === status &&
          variant.dangerSourceVariantType === DangerSourceVariantType.analysis,
      ).length;
    } else {
      return this.internVariantsList.filter(
        (variant) =>
          variant.dangerSource.id === dangerSource.id &&
          variant.dangerSourceVariantStatus === status &&
          variant.dangerSourceVariantType === DangerSourceVariantType.forecast,
      ).length;
    }
  }

  getVariantCount(dangerSource: DangerSourceModel): number {
    if (
      this.internVariantsList.some((variant) => variant.dangerSourceVariantType === DangerSourceVariantType.analysis)
    ) {
      return this.internVariantsList.filter(
        (variant) =>
          variant.dangerSource.id === dangerSource.id &&
          variant.dangerSourceVariantType === DangerSourceVariantType.analysis,
      ).length;
    } else {
      return this.internVariantsList.filter(
        (variant) =>
          variant.dangerSource.id === dangerSource.id &&
          variant.dangerSourceVariantType === DangerSourceVariantType.forecast,
      ).length;
    }
  }

  openEditDangerSourceModal(dangerSource: DangerSourceModel) {
    const initialState = {
      dangerSource: dangerSource,
      component: this,
    };
    this.editDangerSourceModalRef = this.modalService.show(ModalEditDangerSourceComponent, { initialState });
  }

  editDangerSourceModalConfirm(): void {
    this.editDangerSourceModalRef.hide();
  }

  openCreateDangerSourceModal() {
    const initialState = {
      component: this,
    };

    this.createDangerSourceModalRef = this.modalService.show(ModalCreateDangerSourceComponent, { initialState });
  }

  createDangerSourceModalConfirm(dangerSource: DangerSourceModel): void {
    this.createDangerSourceModalRef.hide();
    this.internDangerSourcesList.push(dangerSource);
    this.sortInternDangerSourcesList();
  }

  createDangerSourceModalDecline(): void {
    this.createDangerSourceModalRef.hide();
  }

  selectVariant(variant: DangerSourceVariantModel) {
    if (!this.editRegions) {
      this.deselectVariant();
      this.activeVariant = variant;
      if (this.activeDangerSourceOnMap && this.activeVariant.dangerSource.id !== this.activeDangerSourceOnMap.id) {
        this.activeDangerSourceOnMap = undefined;
      }
      this.mapService.resetInternalAggregatedRegions();
      this.updateInternalVariantsOnMap(this.dangerSourcesService.getDangerSourceVariantType());
      this.mapService.selectAggregatedRegion(this.activeVariant, this.comparedVariant);
    }
  }

  deselectVariant() {
    if (!this.editRegions && this.activeVariant !== null && this.activeVariant !== undefined) {
      this.mapService.deselectAggregatedRegion();
      this.activeVariant = undefined;
      this.comparedVariant = undefined;
    }
    this.updateInternalVariantsOnMap(this.dangerSourcesService.getDangerSourceVariantType());
  }

  deselectComparedVariant() {
    this.comparedVariant = undefined;
  }

  deleteVariant(variant: DangerSourceVariantModel) {
    this.variantMarkedDelete = variant;
    this.openDeleteAggregatedRegionModal(this.deleteAggregatedRegionTemplate());
  }

  compareVariant(variant: DangerSourceVariantModel) {
    if (this.activeVariant) {
      if (this.comparedVariant && this.comparedVariant.id === variant.id) {
        this.comparedVariant = undefined;
      } else {
        this.comparedVariant = variant;
      }
      this.mapService.selectAggregatedRegion(this.activeVariant, this.comparedVariant);
    }
  }

  editMicroRegions(variant: DangerSourceVariantModel) {
    this.showNewVariantModal = true;
    this.editVariantMicroRegions(variant);
  }

  private editVariantMicroRegions(variant: DangerSourceVariantModel) {
    this.editRegions = true;
    this.mapService.editAggregatedRegion(variant);
  }

  saveVariant(event: Event) {
    event.stopPropagation();

    // save selected regions to active variant
    const isUpdate: boolean = this.activeVariant.regions.length !== 0;
    // only allow regions within own area
    const regions = this.mapService
      .getSelectedRegions()
      .filter((region) => region.startsWith(this.authenticationService.getActiveRegionId()));

    let newRegionsHit = false;
    for (const region of regions) {
      if (region.startsWith(this.authenticationService.getActiveRegionId())) {
        newRegionsHit = true;
        break;
      }
    }

    if (newRegionsHit || !this.isCreator(this.activeVariant)) {
      this.showNewVariantModal = false;
      this.editRegions = false;

      // delete old regions in own area
      const oldSavedRegions = new Array<string>();
      for (const region of this.activeVariant.regions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          oldSavedRegions.push(region);
        }
      }
      for (const region of oldSavedRegions) {
        const index = this.activeVariant.regions.indexOf(region);
        this.activeVariant.regions.splice(index, 1);
      }

      for (const region of regions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          if (!this.activeVariant.regions.includes(region)) {
            this.activeVariant.regions.push(region);
          }
        } else {
          if (!region.startsWith(this.activeVariant.ownerRegion) && !this.activeVariant.regions.includes(region)) {
            this.activeVariant.regions.push(region);
          }
        }
      }

      this.mapService.discardEditSelection();
      this.mapService.selectAggregatedRegion(this.activeVariant, this.comparedVariant);

      if (isUpdate) {
        this.saveVariantOnServer(this.activeVariant);
      } else {
        if (this.dangerSourcesService.hasBeenPublished5PM(this.dangerSourcesService.getActiveDate())) {
          this.activeVariant.dangerSourceVariantType = DangerSourceVariantType.analysis;
        } else {
          this.activeVariant.dangerSourceVariantType = DangerSourceVariantType.forecast;
        }
        this.saveVariantOnServer(this.activeVariant, "modal");
      }
    } else {
      this.openNoRegionModal(this.noRegionTemplate());
    }
  }

  updateSaveErrors() {
    for (const variant of this.saveError.values()) {
      this.saveVariantOnServer(variant, false);
    }
  }

  saveVariantOnServer(variant: DangerSourceVariantModel, checkErrors: boolean | "modal" = true) {
    variant.validFrom = this.dangerSourcesService.getActiveDate()[0];
    variant.validUntil = this.dangerSourcesService.getActiveDate()[1];
    variant.updateDate = new Date();
    ////
    this.dangerSourcesService.saveDangerSourceVariant(variant, this.dangerSourcesService.getActiveDate()).subscribe(
      (newVariant) => {
        this.activeVariant = newVariant;
        this.loadDangerSourcesFromServer(this.dangerSourcesService.getDangerSourceVariantType());
        this.saveError.delete(newVariant.id);
        this.loadInternalVariantsError = false;
        this.loading = false;
        if (checkErrors === true) {
          this.updateSaveErrors();
        }
        console.log("Variant saved on server.");
      },
      () => {
        console.error("Variant could not be saved on server!");
        if (checkErrors === "modal") {
          this.openSaveErrorModal(this.saveErrorTemplate());
        } else {
          this.saveError.set(variant.id, variant);
        }
      },
    );
  }

  isCreator(variant: DangerSourceVariantModel): boolean {
    return (
      variant.ownerRegion !== undefined &&
      variant.ownerRegion.startsWith(this.authenticationService.getActiveRegionId())
    );
  }

  discardVariant(event: Event, variant?: DangerSourceVariantModel) {
    event.stopPropagation();
    this.showNewVariantModal = false;
    this.editRegions = false;
    if (variant !== undefined && variant.regions.length === 0) {
      if (variant.id !== undefined) {
        this.deleteInternalVariant(variant);
      }
      this.activeVariant = undefined;
    } else {
      if (this.activeVariant) {
        this.mapService.selectAggregatedRegion(this.activeVariant, this.comparedVariant);
      }
    }
    this.mapService.discardEditSelection();
  }

  goBack() {
    this.deselectVariant();
    this.router.navigate(["/bulletins"]);
  }

  isDangerSourceVariantStatus(variant: DangerSourceVariantModel, status: DangerSourceVariantStatus) {
    return variant.dangerSourceVariantStatus === status;
  }

  openLoadModal(template: TemplateRef<unknown>) {
    this.loadModalRef = this.modalService.show(template, this.config);
  }

  loadModalConfirm(event: Event): void {
    (event.currentTarget as HTMLButtonElement).setAttribute("disabled", "disabled");
    this.loadModalRef.hide();
    this.loading = true;
    this.loadVariantsFromYesterday();
  }

  loadModalDecline(event: Event): void {
    (event.currentTarget as HTMLButtonElement).setAttribute("disabled", "disabled");
    this.loadModalRef.hide();
  }

  openLoadingErrorModal(template: TemplateRef<unknown>) {
    this.loadingErrorModalRef = this.modalService.show(template, this.config);
  }

  loadingErrorModalConfirm(): void {
    this.loadingErrorModalRef.hide();
  }

  openDeleteAggregatedRegionModal(template: TemplateRef<unknown>) {
    this.deleteAggregatedRegionModalRef = this.modalService.show(template, this.config);
  }

  deleteAggregatedRegionModalConfirm(): void {
    this.deleteAggregatedRegionModalRef.hide();
    this.loading = true;
    this.deleteInternalVariant(this.variantMarkedDelete);
    this.dangerSourcesService
      .deleteDangerSourceVariant(this.variantMarkedDelete, this.dangerSourcesService.getActiveDate())
      .subscribe(() => {
        this.loading = false;
        this.mapService.resetAggregatedRegions();
        this.updateInternalVariantsOnMap(this.dangerSourcesService.getDangerSourceVariantType());
      });
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

  discardModalConfirm(): void {
    this.discardModalRef.hide();
    this.goBack();
  }

  discardModalDecline(): void {
    this.discardModalRef.hide();
  }

  openSaveErrorModal(template: TemplateRef<unknown>) {
    this.saveErrorModalRef = this.modalService.show(template, this.config);
  }

  saveErrorModalConfirm(): void {
    this.saveErrorModalRef.hide();
    this.loading = false;
  }

  getDangerRatingColor(variant: DangerSourceVariantModel): string {
    return this.constantsService.getDangerRatingColor(variant.eawsMatrixInformation.dangerRating) + " !important";
  }

  getFontColor(variant: DangerSourceVariantModel): string {
    if (
      variant.eawsMatrixInformation.dangerRating === Enums.DangerRating.moderate ||
      variant.eawsMatrixInformation.dangerRating === Enums.DangerRating.low
    ) {
      return "black";
    } else {
      return "white";
    }
  }
}
