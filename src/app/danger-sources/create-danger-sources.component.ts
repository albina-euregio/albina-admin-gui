import { Component, HostListener, ViewChild, ElementRef, TemplateRef, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { map, Subscription, timer } from "rxjs";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal";

// models
import { BulletinModel } from "../models/bulletin.model";

// services
import { TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { MapService } from "../providers/map-service/map.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";

import * as Enums from "../enums/enums";
import { LocalStorageService } from "app/providers/local-storage-service/local-storage.service";
import {
  DangerSourceVariantModel,
  DangerSourceVariantStatus,
  DangerSourceVariantType,
} from "./models/danger-source-variant.model";
import { DangerSourcesService } from "./danger-sources.service";
import { DangerSourceModel } from "./models/danger-source.model";
import { ModalEditDangerSourceComponent } from "./modal-edit-danger-source.component";

@Component({
  templateUrl: "create-danger-sources.component.html",
})
export class CreateDangerSourcesComponent implements OnInit, OnDestroy {
  public variantStatus = DangerSourceVariantStatus;
  public variantType = DangerSourceVariantType;

  public editRegions: boolean;
  public loading: boolean;
  public saveError: Map<string, DangerSourceVariantModel>;
  public loadInternalVariantsError: boolean;
  public loadInternalDangerSourcesError: boolean;

  public showAfternoonMap: boolean;

  public showForeignRegions: boolean;

  public activeVariant: DangerSourceVariantModel;
  public comparedVariant: DangerSourceVariantModel;
  public internVariantsList: DangerSourceVariantModel[];
  public internDangerSourcesList: DangerSourceModel[];

  public showStatusOfAllRegions: boolean = false;

  public showNewVariantModal: boolean = false;

  public isCompactMapLayout: boolean = false;
  public isVariantsSidebarVisible = true;
  private variantMarkedDelete: DangerSourceVariantModel;

  public copying: boolean;

  @ViewChild("scrollActiveVariant") scrollActiveVariant: ElementRef;
  @ViewChild("scrollComparedVariant") scrollComparedVariant: ElementRef;

  public loadingErrorModalRef: BsModalRef;
  @ViewChild("loadingErrorTemplate") loadingErrorTemplate: TemplateRef<any>;

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

  public checkBulletinsModalRef: BsModalRef;
  @ViewChild("checkBulletinsTemplate") checkBulletinsTemplate: TemplateRef<any>;

  public checkBulletinsErrorModalRef: BsModalRef;
  @ViewChild("checkBulletinsErrorTemplate") checkBulletinsErrorTemplate: TemplateRef<any>;

  public editDangerSourceModalRef: BsModalRef;
  @ViewChild("editDangerSourceTemplate") editDangerSourceTemplate: TemplateRef<any>;

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-md",
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private activeRoute: ActivatedRoute,
    public dangerSourcesService: DangerSourcesService,
    public authenticationService: AuthenticationService,
    public translateService: TranslateService,
    private localStorageService: LocalStorageService,
    public constantsService: ConstantsService,
    public regionsService: RegionsService,
    private mapService: MapService,
    private modalService: BsModalService,
  ) {
    this.loading = false;
    this.showAfternoonMap = false;
    this.showForeignRegions = true;
    this.mapService.resetAll();
    this.internVariantsList = new Array<DangerSourceVariantModel>();
    this.internDangerSourcesList = new Array<DangerSourceModel>();
    // this.preventClick = false;
    // this.timer = 0;

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
    this.internVariantsList = new Array<DangerSourceVariantModel>();

    this.editRegions = false;
    this.showAfternoonMap = false;
  }

  toggleShowForeignRegions() {
    this.showForeignRegions = !this.showForeignRegions;
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

  updateVariantScroll(scrollId: string, event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.scrollActiveVariant?.nativeElement) return;
    if (!this.scrollComparedVariant?.nativeElement) return;
    if (scrollId === "scrollComparedVariant") {
      this.scrollActiveVariant.nativeElement.scrollTop = this.scrollComparedVariant.nativeElement.scrollTop;
    } else if (scrollId === "scrollActiveVariant") {
      this.scrollComparedVariant.nativeElement.scrollTop = this.scrollActiveVariant.nativeElement.scrollTop;
    }
  }

  public loadDangerSourcesFromServer(type: DangerSourceVariantType) {
    console.log("Load danger sources");
    this.internVariantsList = new Array<DangerSourceVariantModel>();
    this.dangerSourcesService
      .loadDangerSources(this.dangerSourcesService.getActiveDate(), this.authenticationService.getInternalRegions())
      .subscribe(
        (dangerSources) => {
          this.loadInternalDangerSourcesError = false;
          this.dangerSourcesService
            .loadDangerSourceVariants(
              this.dangerSourcesService.getActiveDate(),
              this.authenticationService.getInternalRegions(),
            )
            .subscribe(
              (variants) => {
                this.loadInternalVariantsError = false;

                if (
                  type === DangerSourceVariantType.analysis &&
                  !variants.some((variant) => variant.dangerSourceVariantType === DangerSourceVariantType.analysis)
                ) {
                  const newVariants = this.copyVariants(variants, true);
                  this.addInternalVariants(dangerSources, variants.concat(newVariants), type);
                  this.save(variants.concat(newVariants));
                } else {
                  this.addInternalVariants(dangerSources, variants, type);
                }
                this.loading = false;
              },
              (error) => {
                console.error("Variants could not be loaded!");
                this.loading = false;
                this.loadInternalVariantsError = true;
              },
            );
        },
        (error) => {
          console.error("Danger sources could not be loaded!");
          this.loading = false;
          this.loadInternalDangerSourcesError = true;
        },
      );
  }

  ngOnDestroy() {
    this.mapService.resetAll();

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
    this.mapService.map.on("click", () => this.onMapClick());
    this.mapService.afternoonMap.on("click", () => this.onMapClick());
  }

  private onMapClick() {
    if (!this.showNewVariantModal && !this.editRegions) {
      const clickedRegion = this.mapService.getClickedRegion();
      for (let i = this.internVariantsList.length - 1; i >= 0; --i) {
        if (this.internVariantsList[i].regions.includes(clickedRegion)) {
          if (this.activeVariant === this.internVariantsList[i]) {
            this.deselectVariant();
            break;
          } else {
            this.selectVariant(this.internVariantsList[i]);
            break;
          }
        }
      }
    }
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
    this.openLoadModal(this.loadTemplate);
  }

  loadVariantsFromYesterday(dangerSourceId?: string) {
    const date = this.dangerSourcesService.getNextDate();
    const regions = [this.authenticationService.getActiveRegionId()];

    if (dangerSourceId && dangerSourceId !== undefined) {
      this.dangerSourcesService.loadDangerSourceVariants(date, regions, dangerSourceId).subscribe(
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
          this.openLoadingErrorModal(this.loadingErrorTemplate);
        },
      );
    } else {
      this.dangerSourcesService.loadDangerSourceVariants(date, regions).subscribe(
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
          this.openLoadingErrorModal(this.loadingErrorTemplate);
        },
      );
    }
  }

  // create a copy of every variant (with new id)
  private copyVariants(response, setForecastVariantId: boolean): DangerSourceVariantModel[] {
    const result = Array<DangerSourceVariantModel>();
    for (const jsonVariant of response) {
      const originalVariant = DangerSourceVariantModel.createFromJson(jsonVariant);

      const variant = new DangerSourceVariantModel(originalVariant);
      variant.ownerRegion = this.authenticationService.getActiveRegionId();
      variant.validFrom = this.dangerSourcesService.getActiveDate()[0];
      variant.validUntil = this.dangerSourcesService.getActiveDate()[1];
      variant.dangerSourceVariantType = this.dangerSourcesService.getDangerSourceVariantType();
      if (setForecastVariantId) {
        variant.forecastDangerSourceVariantId = jsonVariant.id;
      }

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
    this.dangerSourcesService.saveVariants(variants, this.dangerSourcesService.getActiveDate()).subscribe(
      (variants) => {
        this.loadDangerSourcesFromServer(this.dangerSourcesService.getDangerSourceVariantType());
        this.loadInternalVariantsError = false;
        this.loading = false;
        console.log("Variants saved on server.");
      },
      (error) => {
        console.error("Variants could not be saved on server!");
        this.openSaveErrorModal(this.saveErrorTemplate);
      },
    );
  }

  private addInternalDangerSources(dangerSources: DangerSourceModel[]) {
    dangerSources.sort((a, b): number => {
      if (a.creationDate < b.creationDate) {
        return 1;
      }
      if (a.creationDate > b.creationDate) {
        return -1;
      }
      return 0;
    });
    this.internDangerSourcesList = dangerSources;
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
   * Adds one variant to internal variants.
   * @param variant variant to add
   */
  private addInternalVariant(variant: DangerSourceVariantModel) {
    this.internVariantsList.push(variant);
    this.sortInternVariantsList();
    if (this.activeVariant && this.activeVariant.id === variant.id) {
      this.activeVariant = variant;
    }
    if (variant.hasDaytimeDependency && this.showAfternoonMap === false) {
      this.onShowAfternoonMapChange(true);
    }
  }

  private sortInternVariantsList() {
    // TODO use dangerRating, dangerRating in brackets, snowpack stability, avalancheSize
    this.internVariantsList.sort((a, b): number => {
      if (
        Enums.WarnLevel[a.eawsMatrixInformation?.dangerRating] < Enums.WarnLevel[b.eawsMatrixInformation?.dangerRating]
      ) {
        return 1;
      }
      if (
        Enums.WarnLevel[a.eawsMatrixInformation?.dangerRating] > Enums.WarnLevel[b.eawsMatrixInformation?.dangerRating]
      ) {
        return -1;
      }
      return 0;
    });
  }

  /**
   * Replaces all old variants with new ones.
   * @param dangerSourceVariants new variants
   */
  private addInternalVariants(
    dangerSources: DangerSourceModel[],
    dangerSourceVariants: DangerSourceVariantModel[],
    type: DangerSourceVariantType,
  ) {
    this.addInternalDangerSources(dangerSources);
    let hasDaytimeDependency = false;

    const variants = new Array<DangerSourceVariantModel>();
    for (const v of dangerSourceVariants) {
      const variant = new DangerSourceVariantModel(v);
      variant.id = v.id;

      // set active variant
      if (this.activeVariant) {
        if (!this.activeVariant.id || this.activeVariant.id === "") {
          if (this.activeVariant.creationDate.getTime() === variant.creationDate.getTime()) {
            this.activeVariant = variant;
          }
          variants.push(variant);
          if (variant.hasDaytimeDependency) {
            hasDaytimeDependency = true;
          }
        } else {
          // do not replace active variant
          if (this.activeVariant.id === variant.id) {
            this.activeVariant.regions = variant.regions;
            variants.push(this.activeVariant);
            if (this.activeVariant.hasDaytimeDependency) {
              hasDaytimeDependency = true;
            }
          } else {
            variants.push(variant);
            if (variant.hasDaytimeDependency) {
              hasDaytimeDependency = true;
            }
          }
        }
      } else {
        variants.push(variant);
        if (variant.hasDaytimeDependency) {
          hasDaytimeDependency = true;
        }
      }
    }

    this.mapService.resetInternalAggregatedRegions();
    this.mapService.resetActiveSelection();

    if (hasDaytimeDependency && this.showAfternoonMap === false) {
      this.onShowAfternoonMapChange(true);
    } else if (!hasDaytimeDependency && this.showAfternoonMap === true) {
      this.onShowAfternoonMapChange(false);
    }

    variants.forEach((item) => this.internVariantsList.push(item));
    this.sortInternVariantsList();
    this.updateInternalVariantsOnMap(type);

    if (this.editRegions) {
      this.mapService.showEditSelection();
    } else if (this.activeVariant && this.activeVariant !== undefined) {
      this.mapService.selectAggregatedRegion(this.activeVariant);
    }
  }

  private updateInternalVariantsOnMap(type: DangerSourceVariantType) {
    for (let i = this.internVariantsList.length - 1; i >= 0; --i) {
      if (this.internVariantsList[i].dangerSourceVariantType === type) {
        this.mapService.updateAggregatedRegion(this.internVariantsList[i]);
      }
    }
  }

  eventCopyVariant(variant: DangerSourceVariantModel) {
    this.copyVariant(undefined, variant);
  }

  copyVariant(event: Event, originalVariant: DangerSourceVariantModel) {
    this.showNewVariantModal = true;
    const newVariant = new DangerSourceVariantModel(originalVariant);
    this.copying = false;
    newVariant.regions = new Array<string>();
    newVariant.ownerRegion = this.authenticationService.getActiveRegionId();
    newVariant.validFrom = this.dangerSourcesService.getActiveDate()[0];
    newVariant.validUntil = this.dangerSourcesService.getActiveDate()[1];

    this.selectVariant(newVariant);
    this.editVariantMicroRegions(newVariant);
  }

  createDangerSource() {
    const dangerSource = new DangerSourceModel();
    dangerSource.creationDate = this.dangerSourcesService.getActiveDate()[0];
    this.internDangerSourcesList.push(dangerSource);
    this.createVariant(dangerSource);
  }

  createVariant(dangerSource: DangerSourceModel) {
    this.showNewVariantModal = true;
    const newVariant = new DangerSourceVariantModel();
    newVariant.dangerSource = dangerSource;
    newVariant.regions = new Array<string>();
    newVariant.ownerRegion = this.authenticationService.getActiveRegionId();
    newVariant.validFrom = this.dangerSourcesService.getActiveDate()[0];
    newVariant.validUntil = this.dangerSourcesService.getActiveDate()[1];
    newVariant.creationDate = new Date();
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
    return this.internVariantsList.filter(
      (variant) => variant.dangerSource.id === dangerSource.id && variant.dangerSourceVariantStatus === status,
    ).length;
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

  selectVariant(variant: DangerSourceVariantModel) {
    if (!this.editRegions) {
      this.deselectVariant();
      this.activeVariant = variant;
      this.mapService.selectAggregatedRegion(this.activeVariant);
    }
  }

  eventDeselectVariant() {
    this.deselectVariant();
  }

  deselectVariant() {
    if (!this.editRegions && this.activeVariant !== null && this.activeVariant !== undefined) {
      this.mapService.deselectAggregatedRegion();
      this.activeVariant = undefined;
      this.comparedVariant = undefined;
    }
    this.updateInternalVariantsOnMap(this.dangerSourcesService.getDangerSourceVariantType());
  }

  eventDeselectComparedVariant(variant: DangerSourceVariantModel) {
    this.comparedVariant = undefined;
  }

  deleteVariant(event: Event, variant: DangerSourceVariantModel) {
    event.stopPropagation();
    this.eventDeleteVariant(variant);
  }

  eventDeleteVariant(variant: DangerSourceVariantModel) {
    this.variantMarkedDelete = variant;
    this.openDeleteAggregatedRegionModal(this.deleteAggregatedRegionTemplate);
  }

  compareVariant(event: Event, variant: DangerSourceVariantModel) {
    event.stopPropagation();
    this.comparedVariant = variant;
  }

  eventEditMicroRegions(variant: DangerSourceVariantModel) {
    this.showNewVariantModal = true;
    this.editVariantMicroRegions(variant);
  }

  editMicroRegions(event: Event, variant: DangerSourceVariantModel) {
    event.stopPropagation();
    this.eventEditMicroRegions(variant);
  }

  private editVariantMicroRegions(variant: DangerSourceVariantModel) {
    this.editRegions = true;
    this.mapService.editAggregatedRegion(variant);
  }

  saveVariant(event: Event) {
    event.stopPropagation();

    let isUpdate: boolean;
    isUpdate = this.activeVariant.regions.length !== 0;

    // save selected regions to active variant
    const regions = this.mapService.getSelectedRegions();

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
      this.mapService.selectAggregatedRegion(this.activeVariant);

      if (isUpdate) {
        this.updateVariantOnServer(this.activeVariant);
      } else {
        this.createVariantOnServer(this.activeVariant);
      }
    } else {
      this.openNoRegionModal(this.noRegionTemplate);
    }
  }

  private createVariantOnServer(variant: DangerSourceVariantModel) {
    variant.validFrom = this.dangerSourcesService.getActiveDate()[0];
    variant.validUntil = this.dangerSourcesService.getActiveDate()[1];
    if (this.dangerSourcesService.hasBeenPublished5PM(this.dangerSourcesService.getActiveDate())) {
      variant.dangerSourceVariantType = DangerSourceVariantType.analysis;
    } else {
      variant.dangerSourceVariantType = DangerSourceVariantType.forecast;
    }
    this.dangerSourcesService.createDangerSourceVariant(variant, this.dangerSourcesService.getActiveDate()).subscribe(
      (variants) => {
        this.loadDangerSourcesFromServer(this.dangerSourcesService.getDangerSourceVariantType());
        this.loadInternalVariantsError = false;
        this.loading = false;
        console.log("Variant created on server.");
      },
      (error) => {
        this.deselectVariant();
        console.error("Variant could not be created on server!");
        this.openSaveErrorModal(this.saveErrorTemplate);
      },
    );
  }

  updateSaveErrors() {
    for (const variant of this.saveError.values()) {
      this.updateVariantOnServer(variant, false);
    }
  }

  updateVariantOnServer(variant: DangerSourceVariantModel, checkErrors: boolean = true) {
    variant.validFrom = this.dangerSourcesService.getActiveDate()[0];
    variant.validUntil = this.dangerSourcesService.getActiveDate()[1];
    variant.updateDate = new Date();
    this.dangerSourcesService.updateDangerSourceVariant(variant, this.dangerSourcesService.getActiveDate()).subscribe(
      (variants) => {
        this.loadDangerSourcesFromServer(this.dangerSourcesService.getDangerSourceVariantType());
        this.saveError.delete(variant.id);
        this.loadInternalVariantsError = false;
        this.loading = false;
        if (checkErrors) {
          this.updateSaveErrors();
        }
        console.log("Variant updated on server.");
      },
      (error) => {
        console.error("Variant could not be updated on server!");
        this.saveError.set(variant.id, variant);
      },
    );
  }

  private deleteVariantOnServer(variant: DangerSourceVariantModel) {
    this.dangerSourcesService.deleteDangerSourceVariant(variant, this.dangerSourcesService.getActiveDate()).subscribe(
      (variants) => {
        this.loadDangerSourcesFromServer(this.dangerSourcesService.getDangerSourceVariantType());
        this.loadInternalVariantsError = false;
        this.loading = false;
        console.log("Variant deleted on server.");
      },
      (error) => {
        console.error("Variant could not be deleted on server!");
        this.openSaveErrorModal(this.saveErrorTemplate);
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
      if (this.activeVariant && this.activeVariant !== undefined) {
        this.mapService.selectAggregatedRegion(this.activeVariant);
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

  @HostListener("document:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.keyCode === 27 && this.editRegions) {
      this.discardVariant(event, this.activeVariant);
    }
  }

  openLoadModal(template: TemplateRef<any>) {
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

  openLoadingErrorModal(template: TemplateRef<any>) {
    this.loadingErrorModalRef = this.modalService.show(template, this.config);
  }

  loadingErrorModalConfirm(): void {
    this.loadingErrorModalRef.hide();
  }

  openDeleteAggregatedRegionModal(template: TemplateRef<any>) {
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

  isActiveDate(date: [Date, Date]) {
    return this.dangerSourcesService.getActiveDate()[0].getTime() === date[0].getTime();
  }

  openSaveErrorModal(template: TemplateRef<any>) {
    this.saveErrorModalRef = this.modalService.show(template, this.config);
  }

  saveErrorModalConfirm(): void {
    this.saveErrorModalRef.hide();
    this.loading = false;
  }

  getRegionNames(bulletin: BulletinModel): string {
    const regionNames = bulletin.savedRegions.map((regionCode) => this.regionsService.getRegionName(regionCode));
    return regionNames.join(", ");
  }
}
