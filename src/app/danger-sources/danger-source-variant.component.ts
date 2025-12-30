import * as Enums from "../enums/enums";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { AspectsComponent } from "../shared/aspects.component";
import { haveSameElements } from "../shared/compareArrays";
import { ElevationsComponent } from "../shared/elevations.component";
import { MatrixParameterComponent } from "../shared/matrix-parameter.component";
import { SliderOptions } from "../shared/slider.component";
import { DangerSourcesService } from "./danger-sources.service";
import {
  DangerSign,
  DangerSourceVariantModel,
  DangerSourceVariantSchema,
  DangerSourceVariantStatus,
  DangerSourceVariantType,
  GlidingSnowActivity,
  GrainShape,
  TerrainType,
} from "./models/danger-source-variant.model";
import { zEnumValues } from "./models/zod-util";
import { ToggleBtnGroup } from "./toggle-btn-group";
import { DatePipe, NgClass } from "@angular/common";
import { Component, inject, input, OnChanges, OnInit, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { MatrixInformationSchema } from "app/models/matrix-information.model";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { BsModalService } from "ngx-bootstrap/modal";
import { debounceTime, Subject } from "rxjs";

@Component({
  selector: "app-danger-source-variant",
  templateUrl: "danger-source-variant.component.html",
  standalone: true,
  imports: [
    BsDropdownModule,
    FormsModule,
    AccordionModule,
    NgClass,
    AspectsComponent,
    ElevationsComponent,
    MatrixParameterComponent,
    DatePipe,
    TranslateModule,
    ToggleBtnGroup,
  ],
})
export class DangerSourceVariantComponent implements OnChanges, OnInit {
  dangerSourcesService = inject(DangerSourcesService);
  private sanitizer = inject(DomSanitizer);
  authenticationService = inject(AuthenticationService);
  private modalService = inject(BsModalService);
  constantsService = inject(ConstantsService);
  regionsService = inject(RegionsService);
  translateService = inject(TranslateService);

  readonly DangerSourceVariantSchema = DangerSourceVariantSchema;
  readonly zEnumValues = zEnumValues;
  readonly variant = input<DangerSourceVariantModel>(undefined);
  readonly comparedVariant = input<DangerSourceVariantModel>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly isCompactMapLayout = input<boolean>(undefined);
  readonly isVariantsSidebarVisible = input<boolean>(undefined);
  readonly isComparedVariant = input<boolean>(undefined);

  private readonly updateVariantOnServerEventDebounce = new Subject<DangerSourceVariantModel>();
  readonly updateVariantOnServerEvent = output<DangerSourceVariantModel>();
  readonly deleteVariantEvent = output<DangerSourceVariantModel>();
  readonly editMicroRegionsEvent = output<DangerSourceVariantModel>();
  readonly copyVariantEvent = output<DangerSourceVariantModel>();
  readonly deselectVariantEvent = output<DangerSourceVariantModel>();
  readonly toggleVariantsSidebarEvent = output<void>();

  dangerPattern: Enums.DangerPattern[] = Object.values(Enums.DangerPattern);
  tendency: Enums.Tendency[] = Object.values(Enums.Tendency);
  variantStatus: DangerSourceVariantStatus[] = Object.values(DangerSourceVariantStatus);
  public variantType = DangerSourceVariantType;
  haveSameElements = haveSameElements;

  avalancheTypeEnum = Enums.AvalancheType;
  grainShapeEnum = GrainShape;
  terrainTypeDiminish = (): Partial<Record<TerrainType, boolean>> => ({
    [TerrainType.gullies_and_bowls]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [TerrainType.adjacent_to_ridgelines]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [TerrainType.distant_from_ridgelines]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [TerrainType.in_the_vicinity_of_peaks]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [TerrainType.pass_areas]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [TerrainType.shady_slopes]: this.isAvalancheType(Enums.AvalancheType.glide),
    [TerrainType.grassy_slopes]: !this.isAvalancheType(Enums.AvalancheType.glide),
    [TerrainType.cut_slopes]: !this.isAvalancheType(Enums.AvalancheType.glide),
    [TerrainType.wind_loaded_slopes]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [TerrainType.base_of_rock_walls]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [TerrainType.behind_abrupt_changes_in_the_terrain]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [TerrainType.areas_where_the_snow_cover_is_rather_shallow]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [TerrainType.transitions_into_gullies_and_bowls]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [TerrainType.transitions_from_a_shallow_to_a_deep_snowpack]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [TerrainType.highly_frequented_off_piste_terrain]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [TerrainType.little_used_backcountry_terrain]: this.isAvalancheType(Enums.AvalancheType.glide),
    [TerrainType.places_that_are_protected_from_the_wind]: this.isAvalancheType(Enums.AvalancheType.glide),
    [TerrainType.regions_exposed_to_the_foehn_wind]: !this.isAvalancheType(Enums.AvalancheType.slab),
  });
  dangerSignDiminish = (): Partial<Record<DangerSign, boolean>> => ({
    [DangerSign.shooting_cracks]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [DangerSign.whumpfing]: !this.isAvalancheType(Enums.AvalancheType.slab),
    [DangerSign.glide_cracks]: !this.isAvalancheType(Enums.AvalancheType.glide),
  });

  public editRegions: boolean;

  public isAccordionGlideOpen: boolean;
  public isAccordionLooseOpen: boolean;
  public isAccordionSlabOpen: boolean;
  public isAccordionWeakLayerOpen: boolean;
  public isAccordionMatrixOpen: boolean;
  public isAccordionCharacteristicsOpen: boolean;
  public isAccordionCommentOpen: boolean;
  public isAccordionUncertaintiesOpen: boolean;

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-md",
  };

  glidingSnowActivityOptions: SliderOptions = {
    floor: 0,
    ceil: 100,
    ticks: [0, 16, 33, 49, 65, 82, 100],
    getLegend: (value: number): string => {
      switch (value) {
        case 16:
          return this.translateService.instant("glidingSnowActivity.low");
        case 49:
          return this.translateService.instant("glidingSnowActivity.medium");
        case 82:
          return this.translateService.instant("glidingSnowActivity.high");
        default:
          return "";
      }
    },
    getSelectionBarColor: (): string => {
      return "lightgrey";
    },
    onValueChange: (value: number) => {
      this.variant().glidingSnowActivityValue = value;
      switch (true) {
        case value < 33:
          this.variant().glidingSnowActivity = GlidingSnowActivity.low;
          break;
        case value < 66:
          this.variant().glidingSnowActivity = GlidingSnowActivity.medium;
          break;
        default:
          this.variant().glidingSnowActivity = GlidingSnowActivity.high;
          break;
      }
      this.updateVariantOnServer();
    },
  };

  constructor() {
    this.updateVariantOnServerEventDebounce
      .pipe(debounceTime(1000))
      .subscribe((variant) => this.updateVariantOnServerEvent.emit(variant));
  }

  ngOnInit() {
    this.dangerSourcesService.accordionChanged$.subscribe(({ isOpen, groupName }) => {
      switch (groupName) {
        case "glide":
          this.isAccordionGlideOpen = isOpen;
          break;
        case "loose":
          this.isAccordionLooseOpen = isOpen;
          break;
        case "slab":
          this.isAccordionSlabOpen = isOpen;
          break;
        case "weakLayer":
          this.isAccordionWeakLayerOpen = isOpen;
          break;
        case "matrix":
          this.isAccordionMatrixOpen = isOpen;
          break;
        case "characteristics":
          this.isAccordionCharacteristicsOpen = isOpen;
          break;
        case "comment":
          this.isAccordionCommentOpen = isOpen;
          break;
        case "uncertainties":
          this.isAccordionUncertaintiesOpen = isOpen;
          break;
        default:
          break;
      }
    });
  }

  ngOnChanges() {
    this.glidingSnowActivityOptions = Object.assign({}, this.glidingSnowActivityOptions, { disabled: this.disabled() });
  }

  updateVariantOnServer() {
    this.updateVariantOnServerEventDebounce.next(this.variant());
  }

  onVariantStatusChange(event: DangerSourceVariantStatus) {
    this.variant().dangerSourceVariantStatus = event;
    this.updateVariantOnServer();
  }

  copyVariant() {
    this.copyVariantEvent.emit(this.variant());
  }

  deselectVariant() {
    this.deselectVariantEvent.emit(this.variant());
  }

  deleteVariant() {
    this.deleteVariantEvent.emit(this.variant());
  }

  editMicroRegions() {
    this.editMicroRegionsEvent.emit(this.variant());
  }

  isInternal(): boolean {
    const ownerRegion = this.variant().ownerRegion;
    return ownerRegion && this.authenticationService.isInternalRegion(ownerRegion);
  }

  showEditMicroRegionsButton(): boolean {
    return (
      !this.isComparedVariant() && !this.editRegions && this.isInternal() && this.dangerSourcesService.getIsEditable()
    );
  }

  isCreator(variant: DangerSourceVariantModel): boolean {
    const ownerRegion = variant.ownerRegion;
    return ownerRegion !== undefined && ownerRegion?.startsWith(this.authenticationService.getActiveRegionId());
  }

  getRegionNames(bulletin): string {
    const regionNames = bulletin.savedRegions.map((regionCode) => this.regionsService.getRegionName(regionCode));
    return regionNames.join(", ");
  }

  toggleVariantsSidebar() {
    this.toggleVariantsSidebarEvent.emit();
  }

  accordionChanged(isOpen: boolean, groupName: string) {
    this.dangerSourcesService.emitAccordionChanged({ isOpen, groupName });
  }

  isAvalancheType(type: Enums.AvalancheType) {
    return this.variant()?.avalancheType === type;
  }

  setAvalancheType(type: Enums.AvalancheType) {
    this.variant().avalancheType = type;
    // reset matrix parameters when changing the avalanche type
    this.variant().eawsMatrixInformation = MatrixInformationSchema.parse({});
    this.updateVariantOnServer();
  }

  setZeroDegreeIsotherm(zeroDegreeIsotherm: boolean) {
    const variant = this.variant();
    if (variant?.zeroDegreeIsotherm === zeroDegreeIsotherm) {
      variant.zeroDegreeIsotherm = undefined;
    } else {
      variant.zeroDegreeIsotherm = zeroDegreeIsotherm;
    }
    this.updateVariantOnServer();
  }

  /**
   * Compares elevationHigh, elevationLow, treelineHigh, treelineLow between variant and comparedVariant.
   * For treelineHigh/treelineLow, null/undefined is treated as false.
   */
  get isElevationEqual(): boolean {
    const v = this.variant();
    const c = this.comparedVariant();
    if (!v || !c) return false;

    // elevationHigh
    if (
      !(
        ((v.elevationHigh === null || v.elevationHigh === undefined) &&
          (c.elevationHigh === null || c.elevationHigh === undefined)) ||
        v.elevationHigh === c.elevationHigh
      )
    ) {
      console.log("elevationHigh not equal", v.elevationHigh, c.elevationHigh);
      return true;
    }

    // elevationLow
    if (
      !(
        ((v.elevationLow === null || v.elevationLow === undefined) &&
          (c.elevationLow === null || c.elevationLow === undefined)) ||
        v.elevationLow === c.elevationLow
      )
    ) {
      console.log("elevationLow not equal", v.elevationLow, c.elevationLow);
      return true;
    }

    // treelineHigh
    if (
      !(
        ((v.treelineHigh === null || v.treelineHigh === undefined) &&
          (c.treelineHigh === null || c.treelineHigh === undefined)) ||
        (v.treelineHigh && c.treelineHigh) ||
        (!v.treelineHigh && !c.treelineHigh)
      )
    ) {
      console.log("treelineHigh not equal", v.treelineHigh, c.treelineHigh);
      return true;
    }

    // treelineLow
    if (
      !(
        ((v.treelineLow === null || v.treelineLow === undefined) &&
          (c.treelineLow === null || c.treelineLow === undefined)) ||
        (v.treelineLow && c.treelineLow) ||
        (!v.treelineLow && !c.treelineLow)
      )
    ) {
      console.log("treelineLow not equal", v.treelineLow, c.treelineLow);
      return true;
    }
    return false;
  }

  /**
   * Compares elevationHigh, elevationLow, treelineHigh, treelineLow between variant and comparedVariant.
   * For treelineHigh/treelineLow, null/undefined is treated as false.
   */
  get isElevationOfExistenceEqual(): boolean {
    const v = this.variant();
    const c = this.comparedVariant();
    if (!v || !c) return false;

    // elevationHigh
    if (
      !(
        ((v.elevationHighOfExistence === null || v.elevationHighOfExistence === undefined) &&
          (c.elevationHighOfExistence === null || c.elevationHighOfExistence === undefined)) ||
        v.elevationHighOfExistence === c.elevationHighOfExistence
      )
    ) {
      console.log("elevationHigh not equal", v.elevationHighOfExistence, c.elevationHighOfExistence);
      return true;
    }

    // elevationLow
    if (
      !(
        ((v.elevationLowOfExistence === null || v.elevationLowOfExistence === undefined) &&
          (c.elevationLowOfExistence === null || c.elevationLowOfExistence === undefined)) ||
        v.elevationLowOfExistence === c.elevationLowOfExistence
      )
    ) {
      console.log("elevationLow not equal", v.elevationLowOfExistence, c.elevationLowOfExistence);
      return true;
    }

    // treelineHigh
    if (
      !(
        ((v.treelineHighOfExistence === null || v.treelineHighOfExistence === undefined) &&
          (c.treelineHighOfExistence === null || c.treelineHighOfExistence === undefined)) ||
        (v.treelineHighOfExistence && c.treelineHighOfExistence) ||
        (!v.treelineHighOfExistence && !c.treelineHighOfExistence)
      )
    ) {
      console.log("treelineHigh not equal", v.treelineHighOfExistence, c.treelineHighOfExistence);
      return true;
    }

    // treelineLow
    if (
      !(
        ((v.treelineLowOfExistence === null || v.treelineLowOfExistence === undefined) &&
          (c.treelineLowOfExistence === null || c.treelineLowOfExistence === undefined)) ||
        (v.treelineLowOfExistence && c.treelineLowOfExistence) ||
        (!v.treelineLowOfExistence && !c.treelineLowOfExistence)
      )
    ) {
      console.log("treelineLow not equal", v.treelineLowOfExistence, c.treelineLowOfExistence);
      return true;
    }
    return false;
  }
}
