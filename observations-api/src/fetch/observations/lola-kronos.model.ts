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
  lolaSimpleObservation: LolaSimpleObservation[];
  lolaEvaluation: LolaEvaluation[];
  lolaCommissionEvaluation: LolaEvaluation[];
  lolaSnowProfile: LolaSnowProfile[];
  lolaAvalancheEvent: LolaAvalancheEvent[];
  lolaRainBoundary: LolaRainBoundary[];
}

export interface LolaAvalancheEvent {
  entities: LolaEntity[];
  uuId: string;
  lolaApplication: string;
  avalancheEventTime: string;
  avalancheProblem: string[];
  avalancheSize: string;
  avalancheType: string;
  comment: string;
  createdAt: Date;
  damageCaused: boolean;
  deleted: boolean;
  deletedTime: Date;
  deletedUsername: string;
  edited: any[];
  firstName: string;
  gpsPoint: GpsPoint;
  images: Image[];
  lastName: string;
  locationDescription: string;
  pdfGeneratedTime: Date;
  pdfName: string;
  processStatus: string;
  regionId: string;
  regionName: string;
  rhbRegionId: string;
  rhbRegionName: string;
  serverStatus: string;
  storedInDb: Date;
  time: Date;
  userId: string;
}

export interface GpsPoint {
  lat: number | null;
  lng: number | null;
  alt?: number | null;
  accuracy?: number | null;
  adsRegion?: AvalancheReportRegions | null;
  markerLabel?: string | null;
  expositionGrad?: number;
}

export interface AvalancheReportRegions {
  loc_ref: string;
  source: string;
  loc_name: string;
}

export interface Image {
  imageUuid: string;
  copyRight: string;
  comment: string;
  fileName: string;
}

export interface LolaEvaluation {
  entities: LolaEntity[];
  uuId: string;
  lolaApplication: string;
  avalanchePotential: number;
  comment: string;
  createdAt: Date;
  dangerPatterns: DangerPattern[];
  dangerSigns: DangerSign[];
  deleted: boolean;
  deletedTime: null;
  deletedUsername: string;
  edited: any[];
  firstAssessment: number;
  firstName: string;
  freshSnowProblem: Problem | null;
  glidingAvalanche: Avalanche | null;
  glidingSnowProblem: Problem | null;
  images: Image[];
  lastName: string;
  latency: string;
  loadCapacity: string;
  looseSnowAvalanche: Avalanche | null;
  measures: string[];
  measuresComment: string;
  pdfGeneratedTime: Date;
  pdfGererated: boolean;
  pdfName: string;
  persistentWeakLayersProblem: Problem | null;
  personsObjectsInDanger: string;
  placeDescription: string;
  position: GpsPoint;
  processStatus: string;
  regionId: string;
  regionName: string;
  rhbRegionId: string;
  rhbRegionName: string;
  serverStatus: string;
  slabAvalanche: Avalanche | null;
  snowQualitySkifun: number;
  snowStabilityTests: SnowStabilityTest[];
  snowSurface: string[];
  snowSurfaceTemperatur: number | null;
  storedInApp: Date;
  storedInDb: Date;
  surfaceCharacteristic: string;
  surfaceWetness: string;
  time: Date;
  traces: string;
  userId: string;
  weather: Weather;
  wetSnowProblem: Problem | null;
  windDriftetSnowProblem: Problem | null;
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

export enum DangerSign {
  AvalancheActivity = "avalancheActivity",
  GlideCracks = "glideCracks",
  NoDangerSigns = "noDangerSigns",
  ShootingCracks = "shootingCracks",
  Whumpfing = "whumpfing",
}

export interface Problem {
  sliderValue: number;
  result: number;
  scope: string;
  scopeMetersFrom: number | null;
  scopeMetersTo: number | null;
  directions: Aspect[];
  avalancheSize: string;
  avalancheSizeValue: number;
  avalancheType: string;
  matrixValue: number;
  snowCoverStabilityLabel: string;
  distributionDangersLabel: string;
}

export interface Avalanche {
  avalancheType: string;
  size: string;
  release: string;
  frequency: string;
  directions: Aspect[];
  altitude: number | null;
  comment: string;
}

export interface SnowStabilityTest {
  testCategory: string;
  testResult: string;
  number: number | null;
  position: number | null;
  comment: string;
  snowStability: SnowStability;
  KBBTOverlayingLayer: null | string;
  KBBTFractureSurface: string | null;
  KBBTImpactHardness: string | null;
  KBBTCrystalsSize: null | string;
  KBBTWeakLayerThickness: null | string;
  measureFrom: string;
}

export enum SnowStability {
  Moderate = "moderate",
  NA = "n/a",
  Neutral = "neutral",
  Stable = "stable",
  VeryWeak = "veryWeak",
  Weak = "weak",
}

export interface Weather {
  temperatureAir: number | null;
  temperatureRange: string;
  temperatureTendency24h: string;
  precipitationType: string;
  precipitationIntense: string;
  clouds: string;
  windDirection: string[];
  windSignsAge: string;
  windDirectionChanging: boolean;
  freshWindDriftedSnow: boolean;
  windSpeed: string;
  weatherTrend24h: string;
  snowHeight: number | null;
  freshSnow24H: string;
  freshSnow72H: string;
  snowfallLine: number | null;
  windSignsOlderThen24h: boolean;
  windDriftedSnowAmout24h: string;
}

export interface LolaSimpleObservation {
  entities: LolaEntity[];
  uuId: string;
  lolaApplication: string;
  comment: string;
  deleted: boolean;
  deletedTime: Date;
  deletedUsername: string;
  edited: any[];
  firstName: string;
  gpsPoint: GpsPoint;
  images: Image[];
  lastName: string;
  locationDescription: string;
  pdfGenerated: boolean;
  pdfGeneratedTime: Date;
  pdfName: string;
  processStatus: string;
  regionId: string;
  regionName: string;
  rhbRegionId: string;
  rhbRegionName: string;
  serverStatus: string;
  storedInDb: Date;
  time: Date;
  userId: string;
  snowSurface: any[];
  snowLine: number;
  stabilityTests: any[];
}

export interface LolaSnowProfile {
  entities: LolaEntity[];
  uuId: string;
  lolaApplication: string;
  altitude: number | null;
  aspects: Aspect[];
  comment: string;
  createdAt: Date;
  deleted: boolean;
  deletedTime: null;
  deletedUsername: string;
  edited: any[];
  firstName: string;
  furtherPersons: string[];
  images: Image[];
  lastName: string;
  latency: string;
  loadCapacity: string;
  lwdBayernBillable: null;
  lwdBayernBillingValue: number;
  lwdBayernGeneratedInCockpit: boolean;
  lwdBayernGeneratedInCockpitFromUserName: string;
  lwdBayernMapShapeId: null;
  lwdBayernObservationField: null;
  pdfGenerated: boolean;
  pdfGeneratedTime: Date;
  pdfName: string;
  placeDescription: string;
  position: GpsPoint;
  processStatus: string;
  regionId: string;
  regionName: string;
  rhbRegionId: string;
  rhbRegionName: string;
  serverStatus: string;
  snowCoverComment: string;
  snowLayers: SnowLayer[];
  snowStabilityTest: SnowStabilityTest[];
  storedInApp: Date;
  storedInDb: Date;
  surfaceCharacteristic: string;
  temperatures: Temperature[];
  tilt: number | null;
  time: Date;
  totalSnowHeight: number | null;
  userId: string;
  weakestSnowStability: SnowStability;
  weather: Weather;
  windSignsAge: string;
  windSignsOlderThen24h: boolean;
}

export interface SnowLayer {
  end: number;
  start: number;
  grainShape: string | null;
  grainShape2: string;
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

export interface LolaRainBoundary {
  _id?: any;
  uuId: string;
  entities: LolaEntity[];
  lolaApplication: string;
  time: Date;
  userId: string;
  firstName: string;
  lastName: string;
  processStatus: string;
  serverStatus: string;
  images: Image[];
  position: GpsPoint | null;
  regionName: never;
  placeDescription: string;
  elevation: number | null;
  elevationTolerance: LolaRainBoundaryElevationTolerance;
  elevationPeriod: LolaRainBoundaryElevationPeriod;
  comment: string;
  deleted: boolean;
  deletedTime: Date;
  deletedUsername: string;
  pdfName: string;
  pdfGeneratedTime: Date;
  pdfGenerated: boolean;
  storedInDb: Date;
  edited: any[];
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
  const gpsPoint =
    (obs as LolaSimpleObservation | LolaAvalancheEvent).gpsPoint ??
    (obs as LolaSnowProfile | LolaEvaluation | LolaRainBoundary).position;
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
    latitude: gpsPoint?.lat,
    locationName:
      (obs as LolaSimpleObservation | LolaAvalancheEvent).locationDescription ??
      (obs as LolaSnowProfile | LolaEvaluation | LolaRainBoundary).placeDescription,
    longitude: gpsPoint?.lng,
    avalancheProblems: getAvalancheProblems(obs as LolaEvaluation | LolaAvalancheEvent),
    dangerPatterns: (obs as LolaEvaluation).dangerPatterns?.map((dp) => getDangerPattern(dp)) || [],
    region: gpsPoint?.adsRegion?.loc_name || obs.regionName,
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
      (obs as LolaSimpleObservation).stabilityTests?.length > 0 ||
      (obs as LolaSnowProfile).snowStabilityTest?.length > 0
        ? ImportantObservation.StabilityTest
        : undefined,
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
