import { Component, HostListener, ViewChild, ElementRef, TemplateRef, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { DatePipe } from "@angular/common";

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
import { DangerSourceVariantModel, DangerSourceVariantStatus } from "./models/danger-source-variant.model";
import { DangerSourcesService } from "./danger-sources.service";

@Component({
  templateUrl: "create-danger-sources.component.html",
})
export class CreateDangerSourcesComponent implements OnInit, OnDestroy {
  public variantStatus = DangerSourceVariantStatus;

  public autoSaving: boolean;
  public editRegions: boolean;
  public loading: boolean;
  public saveError: Map<string, DangerSourceVariantModel>;
  public loadInternalVariantsError: boolean;

  public originalVariants: Map<string, DangerSourceVariantModel>;

  public showAfternoonMap: boolean;

  public showForeignRegions: boolean;

  public activeVariant: DangerSourceVariantModel;
  public comparedVariant: DangerSourceVariantModel;
  public internVariantsList: DangerSourceVariantModel[];
  private internVariantsListEtag: string;

  public showStatusOfAllRegions: boolean = false;

  public showNewVariantModal: boolean = false;

  public isCompactMapLayout: boolean = false;
  public isVariantsSidebarVisible = true;
  private variantMarkedDelete: DangerSourceVariantModel;

  public copying: boolean;
  public copiedVariant: DangerSourceVariantModel;

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

  internalBulletinsSubscription!: Subscription;

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
    private constantsService: ConstantsService,
    public regionsService: RegionsService,
    private mapService: MapService,
    private modalService: BsModalService,
    private datePipe: DatePipe,
  ) {
    this.loading = false;
    this.showAfternoonMap = false;
    this.showForeignRegions = true;
    this.mapService.resetAll();
    this.internVariantsList = new Array<DangerSourceVariantModel>();
    // this.preventClick = false;
    // this.timer = 0;

    if (this.localStorageService.getCompactMapLayout()) {
      this.isCompactMapLayout = this.localStorageService.getCompactMapLayout();
    } else {
      // Set initial value based on the current window width
      this.isCompactMapLayout = window.innerWidth < 768;
    }

    this.copying = false;
    this.copiedVariant = undefined;
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
    this.originalVariants = new Map<string, DangerSourceVariantModel>();
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

      this.internalBulletinsSubscription = timer(5000, 5000)
        .pipe(
          map(() => {
            if (!this.loading && !this.copying && !this.showNewVariantModal) {
              this.loadVariantsFromServer();
            }
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

    if (this.dangerSourcesService.getActiveDate() && this.authenticationService.isUserLoggedIn()) {
      this.reset();

      this.loadVariantsFromServer();
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

  private loadVariantsFromServer() {
    console.log("Load internal variants");
    this.dangerSourcesService
      .loadDangerSourceVariants(
        this.dangerSourcesService.getActiveDate(),
        this.authenticationService.getInternalRegions(),
      )
      .subscribe(
        (variants) => {
          this.loadInternalVariantsError = false;
          this.addInternalVariants(variants);
          this.loading = false;
        },
        (error) => {
          console.error("Variants could not be loaded!");
          this.loading = false;
          this.loadInternalVariantsError = true;
        },
      );
  }

  ngOnDestroy() {
    this.internalBulletinsSubscription.unsubscribe();

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
      for (const variant of this.internVariantsList) {
        if (variant.regions.includes(clickedRegion)) {
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

  loadVariantsFromYesterday() {
    this.openLoadModal(this.loadTemplate);
  }

  private addForeignBulletins(variants: DangerSourceVariantModel[]) {
    this.mapService.resetInternalAggregatedRegions();

    for (const variant of variants) {
      if (!variant.ownerRegion.startsWith(this.authenticationService.getActiveRegionId())) {
        this.addInternalVariant(variant);
      }
    }

    this.updateInternalVariants();

    this.mapService.deselectAggregatedRegion();
  }

  private getNewId(response, regionId) {
    for (const jsonBulletin of response) {
      if (jsonBulletin.savedRegions.includes(regionId)) return jsonBulletin.id;
    }
    return undefined;
  }

  private addInternalVariants(dangerSourceVariants: DangerSourceVariantModel[]) {
    let hasDaytimeDependency = false;

    const variants = new Array<DangerSourceVariantModel>();
    for (const variant of dangerSourceVariants) {
      if (this.activeVariant && this.activeVariant.id === variant.id) {
        // do not update active variant (this is currently edited) except it is disabled
        if (this.isDisabled()) {
          this.activeVariant = variant;
        } else {
          if (this.activeVariant.regions !== variant.regions) {
            this.activeVariant.regions = variant.regions;
          }
        }
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

    this.mapService.resetInternalAggregatedRegions();
    this.mapService.resetActiveSelection();

    variants.sort((a, b): number => {
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

    this.internVariantsList = variants;
    this.updateInternalVariants();

    if (this.editRegions) {
      this.mapService.showEditSelection();
    } else if (this.activeVariant && this.activeVariant !== undefined) {
      this.mapService.selectAggregatedRegion(this.activeVariant);
    }
  }

  private updateInternalVariants() {
    for (const variant of this.internVariantsList) {
      this.mapService.updateAggregatedRegion(variant);
    }
  }

  private addInternalVariant(variant: DangerSourceVariantModel) {
    this.internVariantsList.push(variant);
    if (this.activeVariant && this.activeVariant.id === variant.id) this.activeVariant = variant;

    this.internVariantsList.sort((a, b): number => {
      if (a.ownerRegion < b.ownerRegion) {
        return 1;
      }
      if (a.ownerRegion > b.ownerRegion) {
        return -1;
      }
      return 0;
    });

    if (variant.hasDaytimeDependency && this.showAfternoonMap === false) {
      this.onShowAfternoonMapChange(true);
    }
  }

  createVariant(originalVariant) {
    let newVariant: DangerSourceVariantModel;
    this.showNewVariantModal = true;
    if (originalVariant) {
      newVariant = new DangerSourceVariantModel(originalVariant);
      this.copying = false;
    } else {
      // TODO set danger source
      newVariant = new DangerSourceVariantModel();
    }
    newVariant.regions = new Array<string>();
    newVariant.ownerRegion = this.authenticationService.getActiveRegionId();

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
  }

  eventDeselectComparedBulletin(bulletin: BulletinModel) {
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

  private delVariant(variant: DangerSourceVariantModel) {
    this.deselectVariant();
    this.deleteVariantOnServer(variant);
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
    const regionId = variant.regions[0];
    variant.validFrom = this.dangerSourcesService.getActiveDate()[0];
    variant.validUntil = this.dangerSourcesService.getActiveDate()[1];
    this.dangerSourcesService.createDangerSourceVariant(variant, this.dangerSourcesService.getActiveDate()).subscribe(
      (variants) => {
        if (this.activeVariant && this.activeVariant != undefined && this.activeVariant.id == undefined) {
          this.activeVariant.id = this.getNewId(variants, regionId);
        }
        this.mapService.deselectAggregatedRegion();
        this.addInternalVariants(variants);
        this.loadInternalVariantsError = false;
        this.loading = false;
        console.log("Variant created on server.");
      },
      (error) => {
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
    this.dangerSourcesService.updateDangerSourceVariant(variant, this.dangerSourcesService.getActiveDate()).subscribe(
      (variants) => {
        this.addInternalVariants(variants);
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
        this.addInternalVariants(variants);
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
      this.delVariant(variant);
      this.activeVariant = undefined;
    } else {
      if (this.activeVariant && this.activeVariant !== undefined) {
        this.mapService.selectAggregatedRegion(this.activeVariant);
      }
    }
    this.mapService.discardEditSelection();
  }

  // create a copy of every variant (with new id)
  private copyVariants(response) {
    this.mapService.resetInternalAggregatedRegions();

    for (const jsonVariant of response) {
      const originalVariant = DangerSourceVariantModel.createFromJson(jsonVariant);

      this.originalVariants.set(originalVariant.id, originalVariant);

      const variant = new DangerSourceVariantModel(originalVariant);

      variant.ownerRegion = this.authenticationService.getActiveRegionId();

      // reset regions
      const saved = new Array<string>();
      for (const region of variant.regions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          saved.push(region);
        }
      }

      if (saved.length > 0) {
        variant.regions = saved;
        this.addInternalVariants([variant]);
      }
    }

    this.updateInternalVariants();

    this.mapService.deselectAggregatedRegion();

    this.save();
  }

  save() {
    if (!this.internVariantsList.length) {
      return;
    }
    const result = new Array<DangerSourceVariantModel>();
    for (const variant of this.internVariantsList) {
      for (const region of variant.regions) {
        if (region.startsWith(this.authenticationService.getActiveRegionId())) {
          variant.validFrom = this.dangerSourcesService.getActiveDate()[0];
          variant.validUntil = this.dangerSourcesService.getActiveDate()[1];
          result.push(variant);
          break;
        }
      }
    }
    if (!result.length) {
      return;
    }
    this.dangerSourcesService.saveDangerSourceVariants(result, this.dangerSourcesService.getActiveDate()).subscribe(
      () => {
        console.log("Variants saved on server.");
        this.autoSaving = false;
      },
      () => {
        this.autoSaving = false;
        console.error("Variants could not be saved on server!");
        this.openSaveErrorModal(this.saveErrorTemplate);
      },
    );
  }

  goBack() {
    this.deselectVariant();
    this.router.navigate(["/bulletins"]);
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
    const date = this.dangerSourcesService.getPreviousDate();

    const regions = [this.authenticationService.getActiveRegionId()];
    this.dangerSourcesService.loadDangerSourceVariants(date, regions).subscribe(
      (variants) => {
        // delete own regions
        const entries = new Array<DangerSourceVariantModel>();

        for (const variant of this.internVariantsList) {
          if (variant.ownerRegion.startsWith(this.authenticationService.getActiveRegionId())) {
            entries.push(variant);
          }
        }
        for (const entry of entries) {
          this.delVariant(entry);
        }

        this.copyVariants(variants);
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
    this.delVariant(this.variantMarkedDelete);
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

  openChangeErrorModal(template: TemplateRef<any>) {
    this.changeErrorModalRef = this.modalService.show(template, this.config);
  }

  changeErrorModalConfirm(): void {
    this.changeErrorModalRef.hide();
  }

  getRegionNames(bulletin: BulletinModel): string {
    const regionNames = bulletin.savedRegions.map((regionCode) => this.regionsService.getRegionName(regionCode));
    return regionNames.join(", ");
  }

  getActiveRegionStatus(date: [Date, Date]) {
    const regionStatusMap = this.dangerSourcesService.statusMap.get(this.authenticationService.getActiveRegionId());
    if (regionStatusMap) return regionStatusMap.get(date[0].getTime());
    else return Enums.BulletinStatus.missing;
  }

  getRegionStatus(region: string, date: [Date, Date]) {
    const regionStatusMap = this.dangerSourcesService.statusMap.get(region);
    if (regionStatusMap) return regionStatusMap.get(date[0].getTime());
    else return Enums.BulletinStatus.missing;
  }
}
