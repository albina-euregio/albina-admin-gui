import {
  type GenericObservation,
  Aspect,
  AvalancheProblem,
  DangerPattern as GenericDangerPattern,
  imageCountString,
  ImportantObservation,
  ObservationSource,
  ObservationType,
  SnowpackStability as Stability,
} from "../../generic-observation";

export interface LolaKronosApi {
  clientAccessToken: string;
  lolaEvaluation: LolaEvaluation[];
  lolaSnowProfile: LolaSnowProfile[];
  lolaSnowStabilityTest: LolaSnowStabilityTest[];
  lolaSimpleObservation: LolaSimpleObservation[];
  lolaAvalancheEvent: LolaAvalancheEvent[];
  lolaRainBoundary: LolaRainBoundary[];
  lolaRissk: LolaRissk[];
  lolaSnapshot: LolaRainBoundary[];
  lolaCommissionEvaluation: LolaCommissionEvaluation[];
  lolaAction: LolaAction[];
  lolaEarlyObservation: LolaEarlyObservation[];
  laDokCommissionObservation: LaDokObservation[];
  laDokDetailedObservations: LaDokObservation[];
  laDokSimpleObservations: LaDokSimpleObservation[];
}

export interface LaDokObservation {
  _id: string;
  uuId: string;
  __v: number;
  avalancheActivities: AvalancheActivity[];
  avalancheProblemPrimary: LolaAvalancheProblem;
  avalancheProblemSecondary: LolaAvalancheProblem;
  avalancheProblemThird: LolaAvalancheProblem;
  billable: string;
  billingValue: number;
  comissionMembersAgreed: CommissionMembersAgreed[];
  comment: string;
  commissionId: number;
  commissionMeasureComment: string;
  commissionMeasures: any[];
  commissionName: string;
  createdAt: Date;
  dangerSigns: string[];
  deleted: boolean;
  deletedTime: null;
  deletedUsername: string;
  edited: Edited[];
  entities: Entity[];
  firstName: string;
  generatedInCockpit: boolean;
  generatedInCockpitFromUserName: string;
  glideCracks: GlideCracks;
  hasCommissionMeasures: boolean;
  images: Image[];
  isCommissionObservation: boolean;
  lastName: string;
  latency: string;
  loadCapacity: string;
  lolaApplication: string;
  observationPlaceComment: string;
  pdfGenerated: boolean;
  pdfGeneratedTime: Date;
  pdfName: string;
  pdfToken: string;
  position: GpsPoint;
  processStatus: string;
  readByUser: string[];
  regionId: string;
  regionName: string;
  sendToCommissionMailList: boolean;
  serverStatus: string;
  shapeFileRegionId: string;
  sinkingDepthShoe: number | null;
  sinkingDepthSki: number | null;
  sinkingDepthSonde: number | null;
  snowStabilityTests: Test[];
  snowSurface: string[];
  storedInApp: Date;
  storedInDb: Date;
  surface: string;
  time: Date;
  updatedAt: Date;
  userId: string;
  weakestSnowStability: string;
  weather: LaDokCommissionObservationWeather;
  wetness: string;
  windDriftedSnowAmount: string;
  windSignsOlderThen24h: string;
}

export interface AvalancheActivity {
  active: boolean;
  type: string;
  size: string;
  release: string;
  frequency: string;
  altitude: number | null;
  exposure: string[];
  startingZone: string;
}

export interface LolaAvalancheProblem {
  isActive: boolean;
  avalancheProblem: string;
  avalancheTypes: any[];
  exposition: string[];
  increaseDuringDay: boolean;
  sizeOfTheProblem: number;
  avalancheType: string;
  validity: string;
  elevation: number | null;
  avalancheSize: number;
  weakestSnowStability: string;
}

export interface CommissionMembersAgreed {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  commissions: Commission[];
}

export interface Commission {
  LK_NR: number;
  LK_Name: string;
}

export interface Edited {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  time?: Date;
  email?: string;
}

export interface Entity {
  entityId: string;
  entityName: string;
  entityShortName: string;
  entityIcon: string;
}

export interface GlideCracks {
  altitude: number | null;
  exposure: string[];
}

export interface Image {
  imageUuid: string;
  copyRight: string;
  comment: string;
  fileName: string;
}

export interface GpsPoint {
  lat: number | null;
  lng: number | null;
  adsRegion?: AvalancheReportRegions | null;
  alt?: null;
  accuracy?: null;
  markerLabel?: null;
}

export interface AvalancheReportRegions {
  loc_ref: string;
  source: string;
  loc_name: string;
}

export interface Test {
  testCategory: string;
  testResult: string;
  number: number | null;
  position: number | null;
  comment: string;
  snowStability: string;
  KBBTOverlayingLayer: null | string;
  KBBTImpactHardness: string;
  KBBTCrystalsSize: null | string;
  KBBTWeakLayerThickness: null | string;
  measureFrom: string;
  grainSizeWeakLayer?: null | string;
}

export interface LaDokCommissionObservationWeather {
  temperatureAir: number | null;
  precipitation: string;
  precipitationIntense: string;
  clouds: string;
  windSpeed: string;
  windDirection: string[];
  windSigns: any[];
  weatherTrend24h: string;
  snowHeight: number | null;
  freshSnow24H: number | null;
  freshSnow72H: string;
  snowfallLine: number | null;
}

export interface LaDokSimpleObservation {
  _id: string;
  __v: number;
  billable: string;
  billingValue: number;
  comment: string;
  createdAt: Date;
  deleted: boolean;
  deletedTime: null;
  deletedUsername: string;
  edited: Edited[];
  entities: Entity[];
  firstName: string;
  generatedInCockpit: boolean;
  generatedInCockpitFromUserName: string;
  images: Image[];
  lastName: string;
  locationDescription: string;
  position: GpsPoint;
  processStatus: string;
  readByUser: string[];
  regionId: string;
  regionName: string;
  serverStatus: string;
  shapeFileRegionId: string;
  storedInApp: Date;
  storedInDb: Date;
  time: Date;
  updatedAt: Date;
  userId: string;
  uuId: string;
  lolaApplication: string;
  pdfGenerated: boolean;
  pdfGeneratedTime: Date;
  pdfName: string;
  pdfToken: string;
}

export interface LolaAction {
  _id: string;
  uuId: string;
  __v: number;
  actionTypes: any[];
  actions: any[];
  agreedBy: Edited[];
  agreedByFurtherPersons: any[];
  comment: string;
  createdAt: Date;
  customActions: CustomAction[];
  deleted: boolean;
  deletedTime: null;
  deletedUsername: string;
  edited: Edited[];
  entities: Entity[];
  firstName: string;
  forwardDecisionTo: string[];
  forwardDecisionToAdditional: any[];
  images: Image[];
  lastName: string;
  lolaApplication: string;
  pdfGenerated: boolean;
  pdfGeneratedTime: Date;
  pdfName: string;
  pdfToken: string;
  position: CustomActionPosition;
  processStatus: string;
  reason: string;
  regionId: string;
  regionName: string;
  regions: any[];
  scope: string;
  serverStatus: string;
  storedInApp: Date;
  storedInDb: Date;
  time: Date;
  updatedAt: Date;
  userId: string;
  validFrom: Date;
  validTo: Date;
}

export interface CustomAction {
  uuId: string;
  text: string;
  position: CustomActionPosition;
  order: number;
  commentIntern: string;
  comment: string;
  action: string;
  actionTypes: string[];
  informPopulation: boolean;
  validFrom: Date;
  validTo: Date;
}

export interface CustomActionPosition {
  lat: number;
  lng: number;
  adsRegion: AvalancheReportRegions | null;
}

export interface LolaAvalancheEvent {
  _id: string;
  uuId: string;
  __v: number;
  altitude: number | null;
  aspects: Aspect[];
  avalancheEventTime: string;
  avalancheProblem: any[];
  avalancheRelease: string;
  avalancheSize: string;
  avalancheType: string;
  comment: string;
  commissionId: string;
  commissionName: string;
  createdAt: Date;
  damageCaused: boolean;
  damageComment: string;
  damages: string[];
  deleted: boolean;
  deletedTime: null;
  deletedUsername: string;
  edited: Edited[];
  entities: Entity[];
  eventOnAvalancheTrack: boolean;
  firstName: string;
  images: Image[];
  infraAvalancheId: string;
  infraAvalancheName: string;
  infraRouteSectionFrom: string;
  infraRouteSectionId: string;
  infraRouteSectionTo: string;
  lastName: string;
  lolaApplication: string;
  lwdBayernBillable: null;
  lwdBayernBillingValue: number;
  lwdBayernGeneratedInCockpit: boolean;
  lwdBayernGeneratedInCockpitFromUserName: string;
  lwdBayernMapShapeId: null;
  lwdBayernObservationField: null;
  measures: string;
  measuresRequired: boolean;
  pdfGenerated: boolean;
  pdfGeneratedTime: Date;
  pdfName: string;
  pdfToken: string;
  placeDescription: string;
  position: GpsPoint;
  processStatus: string;
  qualityTime: string;
  readByUser: string[];
  regionId: string;
  regionName: string;
  regions: any[];
  rhbRegionId: string;
  rhbRegionName: string;
  serverStatus: string;
  storedInApp: Date;
  storedInDb: Date;
  time: Date;
  updatedAt: Date;
  userId: string;
  wetnessInStartingArea: string;
}

export interface LolaCommissionEvaluation {
  _id: string;
  uuId: string;
  __v: number;
  avalancheLevelForecast: string;
  avalanchePotential: number;
  blastingSuccess: string;
  catchmentArea: string;
  comment: string;
  commissionId: string;
  commissionInDangerFuture: boolean;
  commissionInDangerFutureMessage: string;
  commissionInDangerToday: boolean;
  commissionInDangerTodayMessage: string;
  commissionName: string;
  commissionPersonInDager24h: boolean;
  commissionPersonInDager24hMessage?: string;
  commissionPersonInDager48h: boolean;
  commissionPersonInDager48hMessage?: string;
  commissionPersonInDagerTodayMessage?: string;
  crashTrack: string;
  createdAt: Date;
  dangerPatterns: DangerPattern[];
  dangerSigns: string[];
  deleted: boolean;
  deletedTime: null;
  deletedUsername: string;
  edited: Edited[];
  entities: Entity[];
  evaluationType: string;
  firstAssessment: number;
  firstName: string;
  freshSnowProblem: Problem;
  furtherPersons: string[];
  glidingAvalanche: Avalanche;
  glidingSnowProblem: Problem;
  images: Image[];
  infraAvalancheId: string;
  infraAvalancheName: string;
  infraLas24h: number;
  infraLas48h: number;
  infraLasDate: Date;
  infraLasId: string;
  infraLasToday: number;
  infraLocationType: string;
  infraProtectionAvailable: boolean;
  infraProtectionComment: string;
  infraProtectionMeasures: any[];
  infraRouteSectionFrom: string;
  infraRouteSectionId: string;
  infraRouteSectionTo: string;
  lastName: string;
  latency: string;
  loadCapacity: string;
  lolaApplication: string;
  looseSnowAvalanche: Avalanche;
  measures: any[];
  measuresComment: string;
  observationScope: string;
  observationScopeAspects: Aspect[];
  observationScopeMetersFrom: number | null;
  observationScopeMetersTo: number | null;
  pdfGenerated: boolean;
  pdfGeneratedTime: Date;
  pdfName: string;
  pdfToken: string;
  persistentWeakLayersProblem: Problem;
  personsObjectsInDanger: string;
  placeDescription: string;
  position: CustomActionPosition;
  powderAvalanche: Avalanche;
  precipitationForecast: string;
  processStatus: string;
  protectionValue: string;
  radiationForecast: string;
  regionId: string;
  regionName: string;
  regions: any[];
  rhbRegionId: string;
  rhbRegionName: string;
  serverStatus: string;
  sinkingDepth: string;
  slabAvalanche: Avalanche;
  snowQualitySkifun: number;
  snowStabilityTests: Test[];
  snowSurface: string[];
  snowSurfaceTemperatur: null;
  snowpackStructureForecast: string;
  storedInApp: Date;
  storedInDb: Date;
  surfaceCharacteristic: string;
  surfaceWetness: string;
  temperatureForecast: string;
  time: Date;
  traces: string;
  updatedAt: Date;
  userId: string;
  weather: LolaCommissionEvaluationWeather;
  wetSnowProblem: Problem;
  windDriftetSnowProblem: Problem;
  windForecast: string;
}

export enum DangerPattern {
  Gm1 = "GM1",
  Gm2 = "GM2",
  Gm3 = "GM3",
  Gm4 = "GM4",
  Gm5 = "GM5",
  Gm6 = "GM6",
  Gm7 = "GM7",
  Gm8 = "GM8",
  Gm9 = "GM9",
  Gm10 = "GM10",
}

export interface Problem {
  active: boolean;
  sliderValue: number;
  result: number;
  scope: string;
  scopeMetersFrom: number | null;
  scopeMetersTo: number | null;
  directions: string[];
  avalancheSize: string;
  avalancheSizeValue: number;
  avalancheType: string;
  avalancheTypes: string[];
  matrixValue: number;
  snowCoverStabilityLabel: string;
  distributionDangersLabel: string;
  hideSlider: boolean;
}

export interface Avalanche {
  avalancheType: string;
  size: string;
  release: string;
  frequency: string;
  directions: string[];
  altitude: number | null;
  comment: string;
  active: boolean;
  smallAvalanches: string;
  mediumAvalanches: string;
  largeAvalanches: string;
  veryLargeAvalanches: string;
  extremelyLargeAvalanches: string;
  scope: string;
  scopeMetersFrom: number | null;
  scopeMetersTo: number | null;
  wetness: string[];
  slopeInclination: string[];
  terrainShapes: string[];
  earlyObservationAvalancheReleases: string[];
}

export enum SnowStability {
  Moderate = "moderate",
  NA = "n/a",
  Neutral = "neutral",
  Stable = "stable",
  VeryWeak = "veryWeak",
  Weak = "weak",
}

export interface LolaCommissionEvaluationWeather {
  temperatureAir: number | null;
  temperatureRange: string;
  temperatureTendency24h: string;
  precipitationType: string;
  precipitationTypes: any[];
  precipitationIntense: string;
  clouds: string;
  windDirection: string[];
  windSignsAge: string;
  windSigns: any[];
  windDirectionChanging: boolean;
  freshWindDriftedSnow: boolean;
  windSpeed: string;
  weatherTrend24h: string;
  snowHeight: number | null;
  snowHeightValley: number | null;
  freshSnow24H: string;
  freshSnow24HValue: null;
  freshSnow72H: string;
  freshSnowForecast24H: string;
  windSpeedForecast24H: string;
  windDirectionForecast24H: any[];
  temperatureCurve24h: string;
  snowfallLine: number | null;
  windDriftedSnowAmout24h: string;
}

export interface LolaEarlyObservation {
  _id: string;
  uuId: string;
  time: Date;
  lolaApplication: string;
  userId: string;
  firstName: string;
  lastName: string;
  entities: Entity[];
  processStatus: string;
  serverStatus: string;
  storedInApp: Date;
  storedInDb: Date;
  edited: Edited[];
  position: GpsPoint;
  snowHeight: number | null;
  precipitation: boolean;
  precipitationType: string[];
  freshSnowAmountLast24h: number | null;
  accumulatedFreshSnow: number;
  accumulatedFreshSnowSince: Date;
  accumulatedFreshSnowCounts: number;
  highestRainLimit: number | null;
  sinkingDepth: number | null;
  snowSurface: string[];
  crystalSize: number | null;
  meltFreezeCrustThickness: number | null;
  surfaceWetness: string;
  temperatureAirAtObservationTime: number;
  temperatureMax24h: null;
  temperatureMin24h: null;
  temperatureSnowSurface: number | null;
  winddriftingObservationPossible: boolean;
  limitedWinddriftingObservationPossible: boolean;
  winddriftedSnowAmount24h: string;
  winddriftedSnowDeposits24h: string;
  windDirection24h: string[];
  windSpeed24h: string;
  winddriftPotentialAmount24h: number;
  skirunsObersvationPossible: boolean;
  limitedSkirunsObersvationPossible: boolean;
  skirunsAmounts: number;
  skiriderBehavior: number;
  avalancheBlastDone: boolean;
  avalancheObservationPossible: boolean;
  limitedAvalancheObservationPossible: boolean;
  looseSnowAvalanche: Avalanche;
  slabAvalanche: Avalanche;
  glidingAvalanche: Avalanche;
  powderAvalanche: Avalanche;
  avalancheEvaluationPossible: boolean;
  limitedAvalancheEvaluationPossible: boolean;
  firstAssessment: number;
  avalanchePotential: number;
  snowStabilityTests: Test[];
  freshSnowProblem: Problem;
  windDriftetSnowProblem: Problem;
  persistentWeakLayersProblem: Problem;
  wetSnowProblem: Problem;
  glidingSnowProblem: Problem;
  comment: string;
  images: Image[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface LolaEvaluation {
  _id: string;
  uuId: string;
  __v: number;
  avalancheLevelForecast: string;
  avalanchePotential: number;
  blastingSuccess: string;
  catchmentArea: string;
  comment: string;
  commissionId: string;
  commissionInDangerFuture: boolean;
  commissionInDangerFutureMessage: string;
  commissionInDangerToday: boolean;
  commissionInDangerTodayMessage: string;
  commissionName: string;
  commissionPersonInDager24h: boolean;
  commissionPersonInDager24hMessage: string;
  commissionPersonInDager48h: boolean;
  commissionPersonInDager48hMessage: string;
  commissionPersonInDagerTodayMessage: string;
  crashTrack: string;
  createdAt: Date;
  dangerPatterns: DangerPattern[];
  dangerSigns: string[];
  deleted: boolean;
  deletedTime: null;
  deletedUsername: string;
  edited: Edited[];
  entities: Entity[];
  evaluationType: string;
  firstAssessment: number;
  firstName: string;
  freshSnowProblem: Problem;
  furtherPersons: string[];
  glidingAvalanche: Avalanche;
  glidingSnowProblem: Problem;
  images: Image[];
  infraAvalancheId: string;
  infraAvalancheName: string;
  infraLas24h: number;
  infraLas48h: number;
  infraLasDate: Date;
  infraLasId: string;
  infraLasToday: number;
  infraLocationType: string;
  infraProtectionAvailable: boolean;
  infraProtectionComment: string;
  infraProtectionMeasures: any[];
  infraRouteSectionFrom: string;
  infraRouteSectionId: string;
  infraRouteSectionTo: string;
  lastName: string;
  latency: string;
  loadCapacity: string;
  lolaApplication: string;
  looseSnowAvalanche: Avalanche;
  measures: any[];
  measuresComment: string;
  observationScope: string;
  observationScopeAspects: Aspect[];
  observationScopeMetersFrom: number | null;
  observationScopeMetersTo: number | null;
  pdfGenerated: boolean;
  pdfGeneratedTime: Date;
  pdfName: string;
  pdfToken: string;
  persistentWeakLayersProblem: Problem;
  personsObjectsInDanger: string;
  placeDescription: string;
  position: GpsPoint;
  powderAvalanche: Avalanche;
  precipitationForecast: string;
  processStatus: string;
  protectionValue: string;
  radiationForecast: string;
  regionId: string;
  regionName: string;
  regions: any[];
  rhbRegionId: string;
  rhbRegionName: string;
  serverStatus: string;
  sinkingDepth: string;
  slabAvalanche: Avalanche;
  snowQualitySkifun: number;
  snowStabilityTests: Test[];
  snowSurface: string[];
  snowSurfaceTemperatur: null;
  snowpackStructureForecast: string;
  storedInApp: Date;
  storedInDb: Date;
  surfaceCharacteristic: string;
  surfaceWetness: string;
  temperatureForecast: string;
  time: Date;
  traces: string;
  updatedAt: Date;
  userId: string;
  weather: LolaCommissionEvaluationWeather;
  wetSnowProblem: Problem;
  windDriftetSnowProblem: Problem;
  windForecast: string;
}

export interface LolaRainBoundary {
  _id: string;
  uuId: string;
  __v: number;
  comment: string;
  createdAt: Date;
  deleted: boolean;
  deletedTime: Date;
  deletedUsername: string;
  edited: Edited[];
  elevation?: number;
  elevationPeriod?: LolaRainBoundaryElevationPeriod;
  elevationTolerance?: LolaRainBoundaryElevationTolerance;
  entities: Entity[];
  firstName: string;
  images: Image[];
  lastName: string;
  lolaApplication: string;
  pdfGenerated?: boolean;
  pdfGeneratedTime?: Date;
  pdfName?: string;
  placeDescription?: string;
  position: CustomActionPosition;
  processStatus: string;
  serverStatus: string;
  storedInDb: Date;
  time: Date;
  updatedAt: Date;
  userId: string;
}

export interface LolaRissk {
  _id: string;
  uuId: string;
  ATESRate: string;
  __v: number;
  alertReceivers: AlertReceiver[];
  alertSendTime: Date | null;
  alertSent: boolean;
  altitudeRangeFrom: number;
  altitudeRangeTo: number;
  avalancheDangerPatterns: DangerPattern[];
  avalancheProblemComment: string;
  avalancheReport: AvalancheReport;
  avalancheReportAfternoon: AvalancheReport;
  avalancheRiskValue: number;
  avalancheTendency: string;
  briefingDone: boolean;
  createdAt: Date;
  deleted: boolean;
  deletedTime: null;
  deletedUsername: string;
  destination: string;
  destinationKnown: boolean;
  destinationProblemComment: string;
  destinationRiskValue: number;
  edited: Edited[];
  entities: Entity[];
  firstName: string;
  freshSnowProblem: Problem;
  furtherMeasuresAvalanche: string;
  furtherMeasuresDestination: string;
  furtherMeasuresGroup: string;
  furtherMeasuresMoreDangers: string;
  furtherMeasuresTerrain: string;
  furtherMeasuresWeather: string;
  furtherPersons: AlertReceiver[];
  glidingSnowProblem: Problem;
  group: AlertReceiver[];
  groupCondition: string;
  groupInHomogeneous: boolean;
  groupKnown: boolean;
  groupMotivation: string;
  groupProblemComment: string;
  groupRiskValue: number;
  groupSkill: string;
  hasAfterNoonReport: boolean;
  highestRiskValue: number;
  informTimeRunsOutReceiver: string;
  informTimeRunsOutSent: boolean;
  informTimeRunsOutTime: Date | null;
  lastName: string;
  lolaApplication: string;
  mainDirections: string[];
  missionComment: string;
  missionCompleted: boolean;
  missionCompletedComment: string;
  missionCompletedFirstName: string;
  missionCompletedLastName: string;
  missionCompletedTime: Date;
  missionCompletedUserId: string;
  missions: string[];
  modeOfTransport: string[];
  modeOfTransportOther: any[];
  moreDangerExisting: boolean;
  moreDangers: any[];
  moreDangersProblemComment: string;
  moreDangersRiskValue: number;
  name: string;
  noSpecialOccurrences: boolean;
  otherDangers: string;
  otherMission: string;
  persistentWeakLayersProblem: Problem;
  planningChecked: boolean;
  processStatus: string;
  protectionGoal: string;
  regionId: string;
  regionName: string;
  regions: any[];
  restrictionsCheck: boolean;
  returnTime: Date;
  serverStatus: string;
  snowConditions: string;
  snowWetness: string;
  standardMeasures: boolean;
  startTime: Date;
  startingPoint: string;
  storedInApp: Date;
  storedInDb: Date;
  terrainProblemComment: string;
  terrainRiskValue: number;
  time: Date;
  updatedAt: Date;
  userId: string;
  weatherCloudiness: string;
  weatherNegativeEffectHighRadiation: boolean;
  weatherPrecipitationType: string;
  weatherProblemComment: string;
  weatherRiskValue: number;
  weatherTemperatureDestination?: number;
  weatherTemperatureStartingPoint?: number;
  weatherTrend: string;
  weatherWind: string;
  wetSnowProblem: Problem;
  windDriftetSnowProblem: Problem;
}

export interface AlertReceiver {
  username: string;
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface AvalancheReport {
  dangerLevelAbove: string;
  dangerLevelBelow: string;
  dangerLevelMeters: string;
}

export interface LolaSimpleObservation {
  readByUser: any[];
  _id: string;
  uuId: string;
  __v: number;
  comment: string;
  createdAt: Date;
  dangerSigns: string[];
  deleted: boolean;
  deletedTime: Date;
  deletedUsername: string;
  edited: Edited[];
  entities: Entity[];
  firstName: string;
  hasDangerSigns?: boolean;
  hasSnowSurface?: boolean;
  images: Image[];
  lastName: string;
  lolaApplication: string;
  pdfGenerated: boolean;
  pdfGeneratedTime: Date;
  pdfName: string;
  placeDescription: string;
  position: GpsPoint | null;
  processStatus: string;
  regionId: string;
  regionName: string;
  regions: any[];
  rhbRegionId: string;
  rhbRegionName: string;
  serverStatus: string;
  snowLine: number | null;
  snowStabilityTests: any[];
  snowSurface: string[];
  storedInDb: Date;
  time: Date;
  updatedAt: Date;
  userId: string;
  weakestSnowStability: string;
}

export interface LolaSnowProfile {
  _id: string;
  uuId: string;
  __v: number;
  altitude: number | null;
  aspects: Aspect[];
  comment: string;
  commissionId: string;
  commissionName: string;
  createdAt: Date;
  deleted: boolean;
  deletedTime: null;
  deletedUsername: string;
  edited: Edited[];
  entities: Entity[];
  firstName: string;
  furtherPersons: string[];
  images: Image[];
  infraAvalancheId: string;
  infraAvalancheName: string;
  infraRouteSectionFrom: string;
  infraRouteSectionId: string;
  infraRouteSectionTo: string;
  lastName: string;
  latency: string;
  loadCapacity: string;
  lolaApplication: string;
  lwdBayernBillable: null;
  lwdBayernBillingValue: number;
  lwdBayernGeneratedInCockpit: boolean;
  lwdBayernGeneratedInCockpitFromUserName: string;
  lwdBayernMapShapeId: null;
  lwdBayernObservationField: LwdBayernObservationField | null;
  lwdBayernPublishWeb: boolean;
  pdfGenerated: boolean;
  pdfGeneratedTime: Date;
  pdfName: string;
  pdfToken: string;
  placeDescription: string;
  position: GpsPoint | null;
  processStatus: string;
  readByUser: string[];
  regionId: string;
  regionName: string;
  regions: any[];
  rhbRegionId: string;
  rhbRegionName: string;
  safetyAvalancheId: string;
  safetyAvalancheName: string;
  serverStatus: string;
  snowCoverComment: string;
  snowLayers: SnowLayer[];
  snowStabilityTest: Test[];
  storedInApp: Date;
  storedInDb: Date;
  surfaceCharacteristic: string;
  temperatures: Temperature[];
  tilt: number | null;
  time: Date;
  totalSnowHeight: number | null;
  updatedAt: Date;
  uploadedToLawis: boolean;
  uploadedToLawisID: number | null;
  uploadedToLawisTimestamp: Date;
  userId: string;
  username: string;
  weakestSnowStability: SnowStability;
  weather: LolaCommissionEvaluationWeather;
}

export interface LwdBayernObservationField {
  _id: string;
  __v: number;
  comment: string;
  position: LwdBayernObservationFieldPosition;
  name: string;
  regionId: string;
  regionName: string;
  idInString: string;
  oldRegionId: number;
  oldRegionName: string;
  updatedAt: Date;
}

export interface LwdBayernObservationFieldPosition {
  lat: number;
  lng: number;
  alt?: null;
}

export interface SnowLayer {
  end: number;
  start: number;
  grainShape: null | string;
  grainShape2: null | string;
  grainSizeFrom: number | null;
  grainSizeTo: number | null;
  layerHeight: number;
  liquidWaterContent: string;
  snowHardness: string;
}

export interface Temperature {
  temperature: number;
  position: number;
}

export interface LolaSnowStabilityTest {
  _id: string;
  uuId: string;
  __v: number;
  altitude: number | null;
  aspects: Aspect[];
  comment: string;
  commissionId: string;
  commissionName: string;
  createdAt: Date;
  deleted: boolean;
  deletedTime: Date;
  deletedUsername: string;
  edited: Edited[];
  entities: Entity[];
  eventOnAvalancheTrack: boolean;
  firstName: string;
  images: Image[];
  infraAvalancheId: string;
  infraAvalancheName: string;
  infraRouteSectionFrom: string;
  infraRouteSectionId: string;
  infraRouteSectionTo: string;
  lastName: string;
  lolaApplication: string;
  lwdBayernMapShapeId: null | string;
  pdfGenerated: boolean;
  pdfGeneratedTime: Date;
  pdfName: string;
  placeDescription: string;
  position: GpsPoint;
  processStatus: string;
  readByUser: string[];
  regionId: string;
  regionName: string;
  serverStatus: string;
  storedInDb: Date;
  tests: Test[];
  time: Date;
  totalSnowHeight: number | null;
  updatedAt: Date;
  userId: string;
  weakestSnowStability: string;
  lwdBayernGeneratedInCockpit?: boolean;
  lwdBayernGeneratedInCockpitFromUserName?: string;
}

export type LolaRainBoundaryElevationTolerance = "n/a" | "exact" | "50m" | "100m" | "200";
export type LolaRainBoundaryElevationPeriod = "n/a" | "duringPrecipitationEvent" | "observationPeriod";

export type LolaEntity =
  | {
      entityId: "651ea4bfc7740c4fbb635188";
      entityName: "SNOBS";
      entityShortName: "";
      entityIcon: "noIcon";
    }
  | {
      entityId: string;
      entityName: string;
      entityShortName: string;
      entityIcon: string;
    };

export function convertLoLaKronos(kronos: LolaKronosApi, urlPrefix: string): GenericObservation[] {
  return [
    ...kronos.lolaAvalancheEvent.map((obs) =>
      convertLoLaToGeneric(obs, ObservationType.Avalanche, urlPrefix + "detail-by-token/lolaAvalancheEvent/"),
    ),
    ...kronos.lolaEvaluation.map((obs) =>
      convertLoLaToGeneric(obs, ObservationType.Evaluation, urlPrefix + "detail-by-token/lolaEvaluation/"),
    ),
    ...kronos.lolaCommissionEvaluation.map((obs) =>
      convertLoLaToGeneric(obs, ObservationType.Evaluation, urlPrefix + "detail-by-token/lolaCommissionEvaluation/"),
    ),
    ...kronos.lolaSimpleObservation.map((obs) =>
      convertLoLaToGeneric(
        obs,
        ObservationType.SimpleObservation,
        urlPrefix + "detail-by-token/lolaSimpleObservation/",
      ),
    ),
    ...kronos.lolaSimpleObservation
      .filter((obs) => obs.snowLine)
      .map((obs) =>
        convertLoLaToGeneric(
          obs,
          ObservationType.SimpleObservation,
          urlPrefix + "detail-by-token/lolaSimpleObservation/",
          "snowLine",
        ),
      ),
    ...kronos.lolaSnowProfile.map((obs) =>
      convertLoLaToGeneric(obs, ObservationType.Profile, urlPrefix + "detail-by-token/lolaSnowProfile/"),
    ),
    ...kronos.lolaRainBoundary.map((obs) =>
      convertLoLaToGeneric(
        obs,
        ObservationType.SimpleObservation,
        urlPrefix + "detail-by-token/lolaRainBoundary/",
        "elevation",
      ),
    ),
  ];
}

export function convertLoLaToGeneric(
  obs: LolaSimpleObservation | LolaAvalancheEvent | LolaSnowProfile | LolaEvaluation | LolaRainBoundary,
  $type: ObservationType,
  urlPrefix: string,
  snowLine?: "snowLine" | "elevation",
): GenericObservation {
  return {
    $id: obs.uuId,
    $data: obs,
    $externalURL: urlPrefix.includes("lolaFiles/pdf/serve")
      ? `${urlPrefix}${obs.pdfName}`
      : `${urlPrefix}${obs.uuId}/${process.env.ALBINA_LOLA_KRONOS_API_TOKEN}`,
    $source:
      Array.isArray(obs.entities) && obs.entities.every((e) => e.entityName === "SNOBS")
        ? ObservationSource.Snobs
        : ObservationSource.LoLaKronos,
    $type,
    stability:
      $type === ObservationType.Avalanche
        ? Stability.very_poor
        : getStability((obs as LolaSnowProfile).weakestSnowStability),
    aspect: (obs as LolaSnowProfile).aspects?.[0],
    authorName: obs.firstName + " " + obs.lastName,
    content:
      (snowLine === "elevation"
        ? `Trockene Schneefallgrenze zum Beobachtungszeitpunkt: ${(obs as LolaRainBoundary).elevation}m ± ${
            (obs as LolaRainBoundary).elevationTolerance
          }m `
        : "") +
      obs.comment +
      imageCountString(obs.images) +
      ((obs as LolaSnowProfile).snowStabilityTest ?? [])
        .flatMap((t) => [
          `☲${t.testCategory}`,
          isFinite(t.number) && isFinite(t.position) ? `${t.number}@${t.position}cm` : "",
          t.comment ?? "",
        ])
        .join(" "),
    elevation:
      snowLine === "snowLine"
        ? (obs as LolaSimpleObservation).snowLine
        : snowLine === "elevation"
          ? (obs as LolaRainBoundary).elevation
          : (obs as LolaSnowProfile).altitude,
    eventDate: new Date(obs.time),
    reportDate: new Date(obs.storedInDb),
    latitude: obs.position?.lat,
    locationName: obs.placeDescription,
    longitude: obs.position?.lng,
    avalancheProblems: getAvalancheProblems(obs as LolaEvaluation | LolaAvalancheEvent),
    dangerPatterns: (obs as LolaEvaluation).dangerPatterns?.map((dp) => getDangerPattern(dp)) || [],
    region: obs.position?.adsRegion?.loc_name || (obs as LolaEvaluation | LolaAvalancheEvent).regionName,
    importantObservations: [
      snowLine === "snowLine" && (obs as LolaSimpleObservation).snowLine ? ImportantObservation.SnowLine : undefined,
      snowLine === "elevation" && (obs as LolaRainBoundary).elevation ? ImportantObservation.SnowLine : undefined,
      (obs as LolaSimpleObservation).snowSurface?.includes("surfaceHoar")
        ? ImportantObservation.SurfaceHoar
        : undefined,
      (obs as LolaSimpleObservation).snowSurface?.includes("veryLightNewSnow")
        ? ImportantObservation.VeryLightNewSnow
        : undefined,
      (obs as LolaSimpleObservation).snowSurface?.includes("graupel") ? ImportantObservation.Graupel : undefined,
      (obs as LolaSimpleObservation).snowSurface?.includes("iceFormation")
        ? ImportantObservation.IceFormation
        : undefined,
      (obs as LolaSnowProfile).snowStabilityTest?.length > 0 ? ImportantObservation.StabilityTest : undefined,
    ].filter((o) => !!o),
  };
}

function getAvalancheProblems(data: LolaEvaluation | LolaAvalancheEvent): AvalancheProblem[] {
  const lola = {
    freshSnowProblem: AvalancheProblem.new_snow,
    glidingSnowProblem: AvalancheProblem.gliding_snow,
    persistentWeakLayersProblem: AvalancheProblem.persistent_weak_layers,
    wetSnowProblem: AvalancheProblem.wet_snow,
    windDriftetSnowProblem: AvalancheProblem.wind_slab,
  } as const;
  const problems: AvalancheProblem[] = [];
  for (const [k, problem] of Object.entries(lola)) {
    const key = k as keyof typeof lola;
    if ((data as LolaEvaluation)[key]?.result > 0 || (data as LolaAvalancheEvent).avalancheProblem?.includes(key)) {
      problems.push(problem);
    }
  }
  return problems;
}

function getDangerPattern(data: DangerPattern): GenericDangerPattern {
  switch (data) {
    case DangerPattern.Gm1:
      return GenericDangerPattern.dp1;
    case DangerPattern.Gm2:
      return GenericDangerPattern.dp2;
    case DangerPattern.Gm3:
      return GenericDangerPattern.dp3;
    case DangerPattern.Gm4:
      return GenericDangerPattern.dp4;
    case DangerPattern.Gm5:
      return GenericDangerPattern.dp5;
    case DangerPattern.Gm6:
      return GenericDangerPattern.dp6;
    case DangerPattern.Gm7:
      return GenericDangerPattern.dp7;
    case DangerPattern.Gm8:
      return GenericDangerPattern.dp8;
    case DangerPattern.Gm9:
      return GenericDangerPattern.dp9;
    case DangerPattern.Gm10:
      return GenericDangerPattern.dp10;
  }
}

function getStability(s: SnowStability): Stability {
  switch (s) {
    case SnowStability.VeryWeak:
      return Stability.very_poor;
    case SnowStability.Weak:
      return Stability.poor;
    case SnowStability.Moderate:
    case SnowStability.Neutral:
      return Stability.fair;
    case SnowStability.Stable:
      return Stability.good;
    default:
      return undefined;
  }
}
