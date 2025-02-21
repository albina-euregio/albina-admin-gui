import { Component, OnChanges, input, output, inject } from "@angular/core";

import { debounceTime, Subject } from "rxjs";

// services
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";

// For iframe
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

import * as Enums from "../enums/enums";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
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
  WeakLayerCrust,
  Wetness,
} from "./models/danger-source-variant.model";
import { DangerSourcesService } from "./danger-sources.service";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { NgIf, NgFor, NgClass, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { AspectsComponent } from "../shared/aspects.component";
import { MatrixParameterComponent } from "../shared/matrix-parameter.component";
import { SliderComponent, SliderOptions } from "../shared/slider.component";

@Component({
  selector: "app-danger-source-variant",
  templateUrl: "danger-source-variant.component.html",
  standalone: true,
  imports: [
    BsDropdownModule,
    NgIf,
    FormsModule,
    NgFor,
    AccordionModule,
    NgClass,
    SliderComponent,
    AspectsComponent,
    MatrixParameterComponent,
    DatePipe,
    TranslateModule,
  ],
})
export class DangerSourceVariantComponent implements OnChanges {
  dangerSourcesService = inject(DangerSourcesService);
  private sanitizer = inject(DomSanitizer);
  authenticationService = inject(AuthenticationService);
  private modalService = inject(BsModalService);
  constantsService = inject(ConstantsService);
  regionsService = inject(RegionsService);
  translateService = inject(TranslateService);

  readonly variant = input<DangerSourceVariantModel>(undefined);
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

  avalancheTypeEnum = Enums.AvalancheType;
  wetnessEnum = Wetness;
  grainShapeEnum = GrainShape;
  thicknessEnum = Thickness;
  characteristicEnum = Characteristic;
  snowpackPositionEnum = SnowpackPosition;
  weakLayerCrustEnum = WeakLayerCrust;
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
  public isAccordionCommentOpen: boolean;

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
    getSelectionBarColor: (value: number): string => {
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

  ngOnChanges() {
    if (!this.isElevationHighEditing) {
      const variant = this.variant();
      this.useElevationHigh = variant.treelineHigh || variant.elevationHigh !== null;
      this.localElevationHigh = this.variant().elevationHigh;
      this.localTreelineHigh = this.variant().treelineHigh;
    }
    if (!this.isElevationLowEditing) {
      const variant = this.variant();
      this.useElevationLow = variant.treelineLow || variant.elevationLow !== null;
      this.localElevationLow = this.variant().elevationLow;
      this.localTreelineLow = this.variant().treelineLow;
    }
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
      case "comment":
        this.isAccordionCommentOpen = event;
        break;
      default:
        break;
    }
  }

  isAvalancheType(type: Enums.AvalancheType) {
    return this.variant()?.avalancheType === type;
  }

  setAvalancheType(event: Event, type: Enums.AvalancheType) {
    event.stopPropagation();
    this.variant().avalancheType = type;
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

  setWeakLayerPersistent(weakLayerPersistent: boolean) {
    const variant = this.variant();
    if (variant?.weakLayerPersistent === weakLayerPersistent) {
      variant.weakLayerPersistent = undefined;
    } else {
      variant.weakLayerPersistent = weakLayerPersistent;
    }
    this.updateVariantOnServer();
  }

  setWeakLayerWet(weakLayerWet: boolean) {
    const variant = this.variant();
    if (variant?.weakLayerWet === weakLayerWet) {
      variant.weakLayerWet = undefined;
    } else {
      variant.weakLayerWet = weakLayerWet;
    }
    this.updateVariantOnServer();
  }

  isWeakLayerCrustAbove(weakLayerCrustAbove: WeakLayerCrust) {
    return this.variant()?.weakLayerCrustAbove === weakLayerCrustAbove;
  }

  setWeakLayerCrustAbove(event: Event, weakLayerCrustAbove: WeakLayerCrust) {
    event.stopPropagation();
    this.variant().weakLayerCrustAbove = weakLayerCrustAbove;
    this.updateVariantOnServer();
  }

  isWeakLayerCrustBelow(weakLayerCrustBelow: WeakLayerCrust) {
    return this.variant()?.weakLayerCrustBelow === weakLayerCrustBelow;
  }

  setWeakLayerCrustBelow(event: Event, weakLayerCrustBelow: WeakLayerCrust) {
    event.stopPropagation();
    this.variant().weakLayerCrustBelow = weakLayerCrustBelow;
    this.updateVariantOnServer();
  }

  setRemoteTriggering(remoteTriggering: boolean) {
    const variant = this.variant();
    if (variant?.remoteTriggering === remoteTriggering) {
      variant.remoteTriggering = undefined;
    } else {
      variant.remoteTriggering = remoteTriggering;
    }
    this.updateVariantOnServer();
  }

  setHasDaytimeDependency(hasDaytimeDependency: boolean) {
    const variant = this.variant();
    if (variant?.hasDaytimeDependency === hasDaytimeDependency) {
      variant.hasDaytimeDependency = undefined;
    } else {
      variant.hasDaytimeDependency = hasDaytimeDependency;
    }
    this.updateVariantOnServer();
  }

  setDangerIncreaseWithElevation(dangerIncreaseWithElevation: boolean) {
    const variant = this.variant();
    if (variant?.dangerIncreaseWithElevation === dangerIncreaseWithElevation) {
      variant.dangerIncreaseWithElevation = undefined;
    } else {
      variant.dangerIncreaseWithElevation = dangerIncreaseWithElevation;
    }
    this.updateVariantOnServer();
  }

  setRunoutIntoGreen(runoutIntoGreen: boolean) {
    const variant = this.variant();
    if (variant?.runoutIntoGreen === runoutIntoGreen) {
      variant.runoutIntoGreen = undefined;
    } else {
      variant.runoutIntoGreen = runoutIntoGreen;
    }
    this.updateVariantOnServer();
  }

  isLooseSnowMoisture(wetness: Wetness) {
    return this.variant()?.looseSnowMoisture === wetness;
  }

  setLooseSnowMoisture(event: Event, wetness: Wetness) {
    event.stopPropagation();
    this.variant().looseSnowMoisture = wetness;
    this.updateVariantOnServer();
  }

  isLooseSnowGrainShape(grainShape: GrainShape) {
    return this.variant()?.looseSnowGrainShape === grainShape;
  }

  setLooseSnowGrainShape(event: Event, grainShape: GrainShape) {
    event.stopPropagation();
    this.variant().looseSnowGrainShape = grainShape;
    this.updateVariantOnServer();
  }

  isSlabGrainShape(grainShape: GrainShape) {
    return this.variant()?.slabGrainShape === grainShape;
  }

  setSlabGrainShape(event: Event, grainShape: GrainShape) {
    event.stopPropagation();
    this.variant().slabGrainShape = grainShape;
    this.updateVariantOnServer();
  }

  isSlabHandHardnessLowerLimit(handHardness: HandHardness) {
    return this.variant()?.slabHandHardnessLowerLimit === handHardness;
  }

  setSlabHandHardnessLowerLimit(event: Event, handHardness: HandHardness) {
    event.stopPropagation();
    this.variant().slabHandHardnessLowerLimit = handHardness;
    this.updateVariantOnServer();
  }

  isSlabHandHardnessUpperLimit(handHardness: HandHardness) {
    return this.variant()?.slabHandHardnessUpperLimit === handHardness;
  }

  setSlabHandHardnessUpperLimit(event: Event, handHardness: HandHardness) {
    event.stopPropagation();
    this.variant().slabHandHardnessUpperLimit = handHardness;
    this.updateVariantOnServer();
  }

  isSlabHardnessProfile(tendency: Enums.Tendency) {
    return this.variant()?.slabHardnessProfile === tendency;
  }

  setSlabHardnessProfile(event: Event, tendency: Enums.Tendency) {
    event.stopPropagation();
    this.variant().slabHardnessProfile = tendency;
    this.updateVariantOnServer();
  }

  isSlabEnergyTransferPotential(slabEnergyTransferPotential: Characteristic) {
    return this.variant()?.slabEnergyTransferPotential === slabEnergyTransferPotential;
  }

  setSlabEnergyTransferPotential(event: Event, slabEnergyTransferPotential: Characteristic) {
    event.stopPropagation();
    this.variant().slabEnergyTransferPotential = slabEnergyTransferPotential;
    this.updateVariantOnServer();
  }

  isSlabDistribution(slabDistribution: Distribution) {
    return this.variant()?.slabDistribution === slabDistribution;
  }

  setSlabDistribution(event: Event, slabDistribution: Distribution) {
    event.stopPropagation();
    this.variant().slabDistribution = slabDistribution;
    this.updateVariantOnServer();
  }

  isWeakLayerGrainShape(grainShape: GrainShape) {
    return this.variant()?.weakLayerGrainShape === grainShape;
  }

  setWeakLayerGrainShape(event: Event, grainShape: GrainShape) {
    event.stopPropagation();
    this.variant().weakLayerGrainShape = grainShape;
    this.updateVariantOnServer();
  }

  isWeakLayerThickness(thickness: Thickness) {
    return this.variant()?.weakLayerThickness === thickness;
  }

  setWeakLayerThickness(event: Event, thickness: Thickness) {
    event.stopPropagation();
    this.variant().weakLayerThickness = thickness;
    this.updateVariantOnServer();
  }

  isWeakLayerStrength(strength: Characteristic) {
    return this.variant()?.weakLayerStrength === strength;
  }

  setWeakLayerStrength(event: Event, strength: Characteristic) {
    event.stopPropagation();
    this.variant().weakLayerStrength = strength;
    this.updateVariantOnServer();
  }

  isWeakLayerPosition(snowpackPosition: SnowpackPosition) {
    return this.variant()?.weakLayerPosition === snowpackPosition;
  }

  setWeakLayerPosition(event: Event, snowpackPosition: SnowpackPosition) {
    event.stopPropagation();
    this.variant().weakLayerPosition = snowpackPosition;
    this.updateVariantOnServer();
  }

  isWeakLayerCreation(creationProcess: CreationProcess) {
    return this.variant()?.weakLayerCreation === creationProcess;
  }

  setWeakLayerCreation(event: Event, creationProcess: CreationProcess) {
    event.stopPropagation();
    this.variant().weakLayerCreation = creationProcess;
    this.updateVariantOnServer();
  }

  isWeakLayerDistribution(distribution: Distribution) {
    return this.variant()?.weakLayerDistribution === distribution;
  }

  setWeakLayerDistribution(event: Event, distribution: Distribution) {
    event.stopPropagation();
    this.variant().weakLayerDistribution = distribution;
    this.updateVariantOnServer();
  }

  isDangerSpotRecognizability(dangerSpotRecognizability: Recognizability) {
    return this.variant()?.dangerSpotRecognizability === dangerSpotRecognizability;
  }

  setDangerSpotRecognizability(event: Event, dangerSpotRecognizability: Recognizability) {
    event.stopPropagation();
    this.variant().dangerSpotRecognizability = dangerSpotRecognizability;
    this.updateVariantOnServer();
  }

  isHighestDangerAspect(highestDangerAspect: Enums.Aspect) {
    return this.variant()?.highestDangerAspect === highestDangerAspect;
  }

  setHighestDangerAspect(event: Event, highestDangerAspect: Enums.Aspect) {
    event.stopPropagation();
    this.variant().highestDangerAspect = highestDangerAspect;
    this.updateVariantOnServer();
  }

  isDangerPeak(dangerPeak: Daytime) {
    return this.variant()?.dangerPeak === dangerPeak;
  }

  setDangerPeak(event: Event, dangerPeak: Daytime) {
    event.stopPropagation();
    this.variant().dangerPeak = dangerPeak;
    this.updateVariantOnServer();
  }

  isSlopeGradient(slopeGradient: SlopeGradient) {
    return this.variant()?.slopeGradient === slopeGradient;
  }

  setSlopeGradient(event: Event, slopeGradient: SlopeGradient) {
    event.stopPropagation();
    this.variant().slopeGradient = slopeGradient;
    this.updateVariantOnServer();
  }

  isNaturalRelease(naturalRelease: Probability) {
    return this.variant()?.naturalRelease === naturalRelease;
  }

  setNaturalRelease(event: Event, naturalRelease: Probability) {
    event.stopPropagation();
    this.variant().naturalRelease = naturalRelease;
    this.updateVariantOnServer();
  }

  isTerrainType(terrainType: TerrainType) {
    return this.variant()?.terrainTypes.includes(terrainType);
  }

  setTerrainType(event: Event, terrainType: TerrainType) {
    event.stopPropagation();
    const variant = this.variant();
    if (variant?.terrainTypes.includes(terrainType)) {
      const index = variant?.terrainTypes.indexOf(terrainType, 0);
      if (index > -1) {
        variant?.terrainTypes.splice(index, 1);
      }
    } else {
      variant?.terrainTypes.push(terrainType);
    }
    this.updateVariantOnServer();
  }

  isDangerSign(dangerSign: DangerSign) {
    return this.variant()?.dangerSigns.includes(dangerSign);
  }

  setDangerSign(event: Event, dangerSign: DangerSign) {
    event.stopPropagation();
    const variant = this.variant();
    if (variant?.dangerSigns.includes(dangerSign)) {
      const index = variant?.dangerSigns.indexOf(dangerSign, 0);
      if (index > -1) {
        variant?.dangerSigns.splice(index, 1);
      }
    } else {
      variant?.dangerSigns.push(dangerSign);
    }
    this.updateVariantOnServer();
  }

  updateElevationHigh(event) {
    if (!this.localTreelineHigh) {
      const variant = this.variant();
      if (variant && this.localElevationHigh !== undefined && this.localElevationHigh !== "") {
        this.localElevationHigh = Math.round(this.localElevationHigh / 100) * 100;
        variant.elevationHigh = this.localElevationHigh;
        if (variant.elevationHigh > 9000) {
          variant.elevationHigh = 9000;
        } else if (variant.elevationHigh < 0) {
          variant.elevationHigh = 0;
        }
      }
      this.isElevationHighEditing = false;
      this.updateVariantOnServer();
    }
  }

  updateElevationLow() {
    if (!this.localTreelineLow) {
      const variant = this.variant();
      if (variant && this.localElevationLow !== undefined && this.localElevationLow !== "") {
        this.localElevationLow = Math.round(this.localElevationLow / 100) * 100;
        variant.elevationLow = this.localElevationLow;
        if (variant.elevationLow > 9000) {
          variant.elevationLow = 9000;
        } else if (variant.elevationLow < 0) {
          variant.elevationLow = 0;
        }
      }
      this.isElevationLowEditing = false;
      this.updateVariantOnServer();
    }
  }

  treelineHighClicked(event) {
    event.stopPropagation();
    const variant = this.variant();
    if (variant.treelineHigh) {
      this.isElevationHighEditing = true;
      variant.treelineHigh = false;
      this.localElevationHigh = "";
      this.localTreelineHigh = false;
    } else {
      variant.treelineHigh = true;
      variant.elevationHigh = undefined;
      this.localElevationHigh = "";
      this.localTreelineHigh = true;
      this.isElevationHighEditing = false;
    }
    this.updateVariantOnServer();
  }

  treelineLowClicked(event) {
    event.stopPropagation();
    const variant = this.variant();
    if (variant.treelineLow) {
      this.isElevationLowEditing = true;
      this.localTreelineLow = false;
      this.localElevationLow = "";
      variant.treelineLow = false;
    } else {
      variant.treelineLow = true;
      variant.elevationLow = undefined;
      this.localElevationLow = "";
      this.localTreelineLow = true;
      this.isElevationLowEditing = false;
    }
    this.updateVariantOnServer();
  }

  setUseElevationHigh(event) {
    if (!event.currentTarget.checked) {
      this.localElevationHigh = "";
      this.localTreelineHigh = false;
      const variant = this.variant();
      variant.treelineHigh = false;
      variant.elevationHigh = undefined;
      this.isElevationHighEditing = false;
      this.useElevationHigh = false;
      this.updateVariantOnServer();
    } else {
      this.useElevationHigh = true;
      this.isElevationHighEditing = true;
    }
  }

  setUseElevationLow(event) {
    if (!event.currentTarget.checked) {
      this.localElevationLow = "";
      this.localTreelineLow = false;
      const variant = this.variant();
      variant.treelineLow = false;
      variant.elevationLow = undefined;
      this.isElevationLowEditing = false;
      this.useElevationLow = false;
      this.updateVariantOnServer();
    } else {
      this.useElevationLow = true;
      this.isElevationLowEditing = true;
    }
  }
}
