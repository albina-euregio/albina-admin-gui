import { Component, Input, Output, EventEmitter, OnChanges } from "@angular/core";

import { debounceTime, Subject } from "rxjs";

// services
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";

// For iframe
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

import * as Enums from "../enums/enums";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { TranslateService } from "@ngx-translate/core";
import {
  Characteristic,
  CreationProcess,
  DangerSign,
  DangerSourceVariantModel,
  DangerSourceVariantStatus,
  Daytime,
  Distribution,
  GlidingSnowActivity,
  GrainShape,
  HandHardness,
  Probability,
  Recognizability,
  SlopeGradient,
  SnowpackPosition,
  TerrainType,
  Thickness,
  Wetness,
} from "./models/danger-source-variant.model";
import { DangerSourcesService } from "./danger-sources.service";
import { ChangeContext, Options } from "@angular-slider/ngx-slider";

@Component({
  selector: "app-danger-source-variant",
  templateUrl: "danger-source-variant.component.html",
})
export class DangerSourceVariantComponent implements OnChanges {
  @Input() variant: DangerSourceVariantModel;
  @Input() disabled: boolean;
  @Input() isCompactMapLayout: boolean;
  @Input() isVariantsSidebarVisible: boolean;
  @Input() isComparedVariant: boolean;

  private readonly updateVariantOnServerEventDebounce = new Subject<DangerSourceVariantModel>();
  @Output() updateVariantOnServerEvent = new EventEmitter<DangerSourceVariantModel>();
  @Output() deleteVariantEvent = new EventEmitter<DangerSourceVariantModel>();
  @Output() editMicroRegionsEvent = new EventEmitter<DangerSourceVariantModel>();
  @Output() copyVariantEvent = new EventEmitter<DangerSourceVariantModel>();
  @Output() deselectVariantEvent = new EventEmitter<DangerSourceVariantModel>();
  @Output() toggleVariantsSidebarEvent = new EventEmitter<void>();

  dangerPattern: Enums.DangerPattern[] = Object.values(Enums.DangerPattern);
  tendency: Enums.Tendency[] = Object.values(Enums.Tendency);
  avalancheTypeEnum = Enums.AvalancheType;
  wetnessEnum = Wetness;
  grainShapeEnum = GrainShape;
  thicknessEnum = Thickness;
  characteristicEnum = Characteristic;
  snowpackPositionEnum = SnowpackPosition;
  creationProcessEnum = CreationProcess;
  distributionEnum = Distribution;
  recognizabilityEnum = Recognizability;
  aspectEnum = Enums.Aspect;
  daytimeEnum = Daytime;
  slopeGradientEnum = SlopeGradient;
  probabilityEnum = Probability;
  tendencyEnum = Enums.Tendency;
  handHardnessEnum = HandHardness;
  terrainTypeEnum = TerrainType;
  dangerSignEnum = DangerSign;
  variantStatus = DangerSourceVariantStatus;

  useElevationHigh = false;
  useElevationLow = false;
  isElevationHighEditing = false;
  isElevationLowEditing = false;
  localElevationHigh = undefined;
  localElevationLow = undefined;
  localTreelineHigh = false;
  localTreelineLow = false;

  public editRegions: boolean;

  public isAccordionAvalancheOpen: boolean;
  public isAccordionMatrixOpen: boolean;
  public isAccordionCharacteristicsOpen: boolean;

  stopListening: Function;

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-md",
  };

  glidingSnowActivityOptions: Options = {
    floor: 0,
    ceil: 100,
    showTicksValues: false,
    showTicks: true,
    showSelectionBar: true,
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
    getSelectionBarColor: (value: number): string => {
      return "lightgrey";
    },
    getPointerColor: (value: number): string => {
      return "grey";
    },
  };

  constructor(
    public dangerSourcesService: DangerSourcesService,
    private sanitizer: DomSanitizer,
    public authenticationService: AuthenticationService,
    private modalService: BsModalService,
    public constantsService: ConstantsService,
    public regionsService: RegionsService,
    public translateService: TranslateService,
  ) {
    this.updateVariantOnServerEventDebounce
      .pipe(debounceTime(1000))
      .subscribe((variant) => this.updateVariantOnServerEvent.emit(variant));
  }

  ngOnChanges() {
    if (!this.isElevationHighEditing) {
      this.useElevationHigh = this.variant.treelineHigh || this.variant.elevationHigh !== undefined;
      this.localElevationHigh = this.variant.elevationHigh;
      this.localTreelineHigh = this.variant.treelineHigh;
    }
    if (!this.isElevationLowEditing) {
      this.useElevationLow = this.variant.treelineLow || this.variant.elevationLow !== undefined;
      this.localElevationLow = this.variant.elevationLow;
      this.localTreelineLow = this.variant.treelineLow;
    }
    this.glidingSnowActivityOptions = Object.assign({}, this.glidingSnowActivityOptions, { disabled: this.disabled });
  }

  updateVariantOnServer() {
    this.updateVariantOnServerEventDebounce.next(this.variant);
  }

  copyVariant(event) {
    this.copyVariantEvent.emit(this.variant);
  }

  deselectVariant() {
    this.deselectVariantEvent.emit(this.variant);
  }

  deleteVariant() {
    this.deleteVariantEvent.emit(this.variant);
  }

  editMicroRegions() {
    this.editMicroRegionsEvent.emit(this.variant);
  }

  isInternal(): boolean {
    const ownerRegion = this.variant.ownerRegion;
    return ownerRegion && this.authenticationService.isInternalRegion(ownerRegion);
  }

  showEditMicroRegionsButton(): boolean {
    return (
      !this.isComparedVariant && !this.editRegions && this.isInternal() && this.dangerSourcesService.getIsEditable()
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

  accordionChanged(event: boolean, groupName: string) {
    switch (groupName) {
      case "avalanche":
        this.isAccordionAvalancheOpen = event;
        break;
      case "matrix":
        this.isAccordionMatrixOpen = event;
        break;
      case "characteristics":
        this.isAccordionCharacteristicsOpen = event;
        break;
      default:
        break;
    }
  }

  isAvalancheType(type: Enums.AvalancheType) {
    return this.variant?.avalancheType === type;
  }

  setAvalancheType(event: Event, type: Enums.AvalancheType) {
    event.stopPropagation();
    this.variant.avalancheType = type;
    this.updateVariantOnServer();
  }

  isLooseSnowMoisture(wetness: Wetness) {
    return this.variant?.looseSnowMoisture === wetness;
  }

  setLooseSnowMoisture(event: Event, wetness: Wetness) {
    event.stopPropagation();
    this.variant.looseSnowMoisture = wetness;
    this.updateVariantOnServer();
  }

  isLooseSnowGrainShape(grainShape: GrainShape) {
    return this.variant?.looseSnowGrainShape === grainShape;
  }

  setLooseSnowGrainShape(event: Event, grainShape: GrainShape) {
    event.stopPropagation();
    this.variant.looseSnowGrainShape = grainShape;
    this.updateVariantOnServer();
  }

  isSlabGrainShape(grainShape: GrainShape) {
    return this.variant?.slabGrainShape === grainShape;
  }

  setSlabGrainShape(event: Event, grainShape: GrainShape) {
    event.stopPropagation();
    this.variant.slabGrainShape = grainShape;
    this.updateVariantOnServer();
  }

  isSlabHandHardnessLowerLimit(handHardness: HandHardness) {
    return this.variant?.slabHandHardnessLowerLimit === handHardness;
  }

  setSlabHandHardnessLowerLimit(event: Event, handHardness: HandHardness) {
    event.stopPropagation();
    this.variant.slabHandHardnessLowerLimit = handHardness;
    this.updateVariantOnServer();
  }

  isSlabHandHardnessUpperLimit(handHardness: HandHardness) {
    return this.variant?.slabHandHardnessUpperLimit === handHardness;
  }

  setSlabHandHardnessUpperLimit(event: Event, handHardness: HandHardness) {
    event.stopPropagation();
    this.variant.slabHandHardnessUpperLimit = handHardness;
    this.updateVariantOnServer();
  }

  isSlabHardnessProfile(tendency: Enums.Tendency) {
    return this.variant?.slabHardnessProfile === tendency;
  }

  setSlabHardnessProfile(event: Event, tendency: Enums.Tendency) {
    event.stopPropagation();
    this.variant.slabHardnessProfile = tendency;
    this.updateVariantOnServer();
  }

  isSlabEnergyTransferPotential(slabEnergyTransferPotential: Characteristic) {
    return this.variant?.slabEnergyTransferPotential === slabEnergyTransferPotential;
  }

  setSlabEnergyTransferPotential(event: Event, slabEnergyTransferPotential: Characteristic) {
    event.stopPropagation();
    this.variant.slabEnergyTransferPotential = slabEnergyTransferPotential;
    this.updateVariantOnServer();
  }

  isSlabDistribution(slabDistribution: Distribution) {
    return this.variant?.slabDistribution === slabDistribution;
  }

  setSlabDistribution(event: Event, slabDistribution: Distribution) {
    event.stopPropagation();
    this.variant.slabDistribution = slabDistribution;
    this.updateVariantOnServer();
  }

  isWeakLayerGrainShape(grainShape: GrainShape) {
    return this.variant?.weakLayerGrainShape === grainShape;
  }

  setWeakLayerGrainShape(event: Event, grainShape: GrainShape) {
    event.stopPropagation();
    this.variant.weakLayerGrainShape = grainShape;
    this.updateVariantOnServer();
  }

  isWeakLayerThickness(thickness: Thickness) {
    return this.variant?.weakLayerThickness === thickness;
  }

  setWeakLayerThickness(event: Event, thickness: Thickness) {
    event.stopPropagation();
    this.variant.weakLayerThickness = thickness;
    this.updateVariantOnServer();
  }

  isWeakLayerStrength(strength: Characteristic) {
    return this.variant?.weakLayerStrength === strength;
  }

  setWeakLayerStrength(event: Event, strength: Characteristic) {
    event.stopPropagation();
    this.variant.weakLayerStrength = strength;
    this.updateVariantOnServer();
  }

  isWeakLayerPosition(snowpackPosition: SnowpackPosition) {
    return this.variant?.weakLayerPosition === snowpackPosition;
  }

  setWeakLayerPosition(event: Event, snowpackPosition: SnowpackPosition) {
    event.stopPropagation();
    this.variant.weakLayerPosition = snowpackPosition;
    this.updateVariantOnServer();
  }

  isWeakLayerCreation(creationProcess: CreationProcess) {
    return this.variant?.weakLayerCreation === creationProcess;
  }

  setWeakLayerCreation(event: Event, creationProcess: CreationProcess) {
    event.stopPropagation();
    this.variant.weakLayerCreation = creationProcess;
    this.updateVariantOnServer();
  }

  isWeakLayerDistribution(distribution: Distribution) {
    return this.variant?.weakLayerDistribution === distribution;
  }

  setWeakLayerDistribution(event: Event, distribution: Distribution) {
    event.stopPropagation();
    this.variant.weakLayerDistribution = distribution;
    this.updateVariantOnServer();
  }

  isDangerSpotRecognizability(dangerSpotRecognizability: Recognizability) {
    return this.variant?.dangerSpotRecognizability === dangerSpotRecognizability;
  }

  setDangerSpotRecognizability(event: Event, dangerSpotRecognizability: Recognizability) {
    event.stopPropagation();
    this.variant.dangerSpotRecognizability = dangerSpotRecognizability;
    this.updateVariantOnServer();
  }

  isHighestDangerAspect(highestDangerAspect: Enums.Aspect) {
    return this.variant?.highestDangerAspect === highestDangerAspect;
  }

  setHighestDangerAspect(event: Event, highestDangerAspect: Enums.Aspect) {
    event.stopPropagation();
    this.variant.highestDangerAspect = highestDangerAspect;
    this.updateVariantOnServer();
  }

  isDangerPeak(dangerPeak: Daytime) {
    return this.variant?.dangerPeak === dangerPeak;
  }

  setDangerPeak(event: Event, dangerPeak: Daytime) {
    event.stopPropagation();
    this.variant.dangerPeak = dangerPeak;
    this.updateVariantOnServer();
  }

  isSlopeGradient(slopeGradient: SlopeGradient) {
    return this.variant?.slopeGradient === slopeGradient;
  }

  setSlopeGradient(event: Event, slopeGradient: SlopeGradient) {
    event.stopPropagation();
    this.variant.slopeGradient = slopeGradient;
    this.updateVariantOnServer();
  }

  isNaturalRelease(naturalRelease: Probability) {
    return this.variant?.naturalRelease === naturalRelease;
  }

  setNaturalRelease(event: Event, naturalRelease: Probability) {
    event.stopPropagation();
    this.variant.naturalRelease = naturalRelease;
    this.updateVariantOnServer();
  }

  isTerrainType(terrainType: TerrainType) {
    return this.variant?.terrainTypes.includes(terrainType);
  }

  setTerrainType(event: Event, terrainType: TerrainType) {
    event.stopPropagation();
    if (this.variant?.terrainTypes.includes(terrainType)) {
      const index = this.variant?.terrainTypes.indexOf(terrainType, 0);
      if (index > -1) {
        this.variant?.terrainTypes.splice(index, 1);
      }
    } else {
      this.variant?.terrainTypes.push(terrainType);
    }
    this.updateVariantOnServer();
  }

  isDangerSign(dangerSign: DangerSign) {
    return this.variant?.dangerSigns.includes(dangerSign);
  }

  setDangerSign(event: Event, dangerSign: DangerSign) {
    event.stopPropagation();
    if (this.variant?.dangerSigns.includes(dangerSign)) {
      const index = this.variant?.dangerSigns.indexOf(dangerSign, 0);
      if (index > -1) {
        this.variant?.dangerSigns.splice(index, 1);
      }
    } else {
      this.variant?.dangerSigns.push(dangerSign);
    }
    this.updateVariantOnServer();
  }

  updateElevationHigh(event) {
    if (!this.localTreelineHigh) {
      if (this.variant && this.localElevationHigh !== undefined && this.localElevationHigh !== "") {
        this.localElevationHigh = Math.round(this.localElevationHigh / 100) * 100;
        this.variant.elevationHigh = this.localElevationHigh;
        if (this.variant.elevationHigh > 9000) {
          this.variant.elevationHigh = 9000;
        } else if (this.variant.elevationHigh < 0) {
          this.variant.elevationHigh = 0;
        }
      }
      this.isElevationHighEditing = false;
    }
  }

  updateElevationLow() {
    if (!this.localTreelineLow) {
      if (this.variant && this.localElevationLow !== undefined && this.localElevationLow !== "") {
        this.localElevationLow = Math.round(this.localElevationLow / 100) * 100;
        this.variant.elevationLow = this.localElevationLow;
        if (this.variant.elevationLow > 9000) {
          this.variant.elevationLow = 9000;
        } else if (this.variant.elevationLow < 0) {
          this.variant.elevationLow = 0;
        }
      }
      this.isElevationLowEditing = false;
    }
  }

  treelineHighClicked(event) {
    event.stopPropagation();
    if (this.variant.treelineHigh) {
      this.isElevationHighEditing = true;
      this.variant.treelineHigh = false;
      this.localElevationHigh = "";
      this.localTreelineHigh = false;
    } else {
      this.variant.treelineHigh = true;
      this.variant.elevationHigh = undefined;
      this.localElevationHigh = "";
      this.localTreelineHigh = true;
      this.isElevationHighEditing = false;
    }
  }

  treelineLowClicked(event) {
    event.stopPropagation();
    if (this.variant.treelineLow) {
      this.isElevationLowEditing = true;
      this.localTreelineLow = false;
      this.localElevationLow = "";
      this.variant.treelineLow = false;
    } else {
      this.variant.treelineLow = true;
      this.variant.elevationLow = undefined;
      this.localElevationLow = "";
      this.localTreelineLow = true;
      this.isElevationLowEditing = false;
    }
  }

  setUseElevationHigh(event) {
    if (!event.currentTarget.checked) {
      this.localElevationHigh = "";
      this.localTreelineHigh = false;
      this.variant.treelineHigh = false;
      this.variant.elevationHigh = undefined;
      this.isElevationHighEditing = false;
    } else {
      this.useElevationHigh = true;
      this.isElevationHighEditing = true;
    }
  }

  setUseElevationLow(event) {
    if (!event.currentTarget.checked) {
      this.localElevationLow = "";
      this.localTreelineLow = false;
      this.variant.treelineLow = false;
      this.variant.elevationLow = undefined;
      this.isElevationLowEditing = false;
    } else {
      this.useElevationLow = true;
      this.isElevationLowEditing = true;
    }
  }

  onGlidingSnowActivityValueChange(changeContext: ChangeContext): void {
    switch (true) {
      case changeContext.value < 33:
        this.variant.glidingSnowActivity = GlidingSnowActivity.low;
        break;
      case changeContext.value < 66:
        this.variant.glidingSnowActivity = GlidingSnowActivity.medium;
        break;
      default:
        this.variant.glidingSnowActivity = GlidingSnowActivity.high;
        break;
    }
    this.updateVariantOnServer();
  }
}
