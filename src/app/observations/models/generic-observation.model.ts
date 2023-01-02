import * as Enums from "app/enums/enums";

// icons
import { appCircleAddIcon } from "../../svg/circle_add";
import { appCircleAlertIcon } from "../../svg/circle_alert";
import { appCircleCheckIcon } from "../../svg/circle_check";
import { appCircleDotsHorizontalIcon } from "../../svg/circle_dots_horizontal";
import { appCircleFullIcon } from "../../svg/circle_full";
import { appCircleMinusIcon } from "../../svg/circle_minus";
import { appCircleOkayTickIcon } from "../../svg/circle_okay_tick";
import { appCirclePlayEmptyIcon } from "../../svg/circle_play_empty";
import { appCirclePlayIcon } from "../../svg/circle_play";
import { appCircleStopIcon } from "../../svg/circle_stop";

export type TranslationFunction = (key: string) => string;

export interface GenericObservation<Data = any> {
  /**
   * Additional data (e.g. original data stored when fetching from external API)
   */
  $data: Data;
  /**
   * External URL/image to display as iframe
   */
  $externalURL?: string;
  /**
   * Additional information to display as table rows in the observation dialog
   */
  $extraDialogRows?:
    | ObservationTableRow[]
    | ((t: TranslationFunction) => ObservationTableRow[]);
  /**
   * Snowpack stability that can be inferred from this observation
   */
  stability?: Stability;
  /**
   * Radius of the map marker
   */
  $markerRadius?: number;
  $source: ObservationSource;
  $type: ObservationType;
  /**
   * Aspect corresponding with this observation
   */
  aspect?: Aspect;
  /**
   * Name of the author
   */
  authorName: string;
  /**
   * Free-text content
   */
  content: string;
  /**
   * Elevation in meters
   */
  elevation: number;
  /**
   * Date when the event occurred
   */
  eventDate: Date;
  /**
   * Location latitude (WGS 84)
   */
  latitude: number;
  /**
   * Location name
   */
  locationName: string;
  /**
   * Location longitude (WGS 84)
   */
  longitude: number;
  /**
   * Micro-region code (computed from latitude/longitude)
   */
  region: string;
  /**
   * Date when the observation has been reported
   */
  reportDate?: Date;
  /**
   * Avalanche problem corresponding with this observation
   */
  avalancheProblems?: AvalancheProblem[];
  /**
   * Danger pattern corresponding with this observation
   */
  dangerPatterns?: Enums.DangerPattern[];
  /**
   * Important observations
   */
  snowLine?: number;
  surfaceHoar?: boolean;
  graupel?: boolean;
  stabilityTest?: boolean;
  iceFormation?: boolean;
  veryLightNewSnow?: boolean;

  filterType?: ObservationFilterType;
  isHighlighted?: boolean;
}

// similar to Enum.AvalancheProblem as string enum
export enum AvalancheProblem {
  new_snow = "new_snow",
  wind_slab = "wind_slab",
  persistent_weak_layers = "persistent_weak_layers",
  wet_snow = "wet_snow",
  gliding_snow = "gliding_snow",
  favourable_situation = "favourable_situation",
  cornices = "cornices",
  no_distinct_problem = "no_distinct_problem",
}

export enum ObservationFilterType {
  Global = "Global",
  Local = "Local",
}

export type Stability =
  | Enums.Stability.good
  | Enums.Stability.fair
  | Enums.Stability.poor
  | Enums.Stability.very_poor;

const colors: Record<Stability, string> = {
  good: "green",
  fair: "orange",
  poor: "red",
  very_poor: "black",
};

export function toMarkerColor(observation: GenericObservation) {
  return colors[observation?.stability ?? "unknown"] ?? "gray";
}

export enum ObservationSource {
  AvalancheWarningService = "AvalancheWarningService",
  Observer = "Observer",
  LwdKip = "LwdKip",
  Lawis = "Lawis",
  LoLaSafety = "LoLaSafety",
  AvaObs = "AvaObs",
  KipLive = "KipLive",
  Natlefs = "Natlefs",
  WikisnowECT = "WikisnowECT",
}

export enum ObservationType {
  SimpleObservation = "SimpleObservation",
  Evaluation = "Evaluation",
  Avalanche = "Avalanche",
  Blasting = "Blasting",
  Closure = "Closure",
  Profile = "Profile",
  Incident = "Incident",
  TimeSeries = "TimeSeries",
}

export const ObservationSourceColors: Record<ObservationSource, string> =
  // FIXME
  Object.freeze({
    [ObservationSource.AvalancheWarningService]: "#ca0020",
    [ObservationSource.Observer]: "#83e4f0",
    [ObservationSource.LwdKip]: "#f781bf",
    [ObservationSource.Lawis]: "#44a9db",
    [ObservationSource.LoLaSafety]: "#a6d96a",
    [ObservationSource.AvaObs]: "#6a3d9a",
    [ObservationSource.KipLive]: "#6a3d9a",
    [ObservationSource.Natlefs]: "#6a3d9a",
    [ObservationSource.WikisnowECT]: "#c6e667",
  });

export const ObservationTypeIcons: Record<ObservationType, string> =
  // FIXME
  Object.freeze({
    [ObservationType.SimpleObservation]: appCircleAlertIcon.data,
    [ObservationType.Evaluation]: appCircleAlertIcon.data,
    [ObservationType.Incident]: appCircleAlertIcon.data,
    [ObservationType.Profile]: appCircleAlertIcon.data,
    [ObservationType.Avalanche]: appCircleDotsHorizontalIcon.data,
    [ObservationType.Blasting]: appCircleAlertIcon.data,
    [ObservationType.Closure]: appCircleAlertIcon.data,
    [ObservationType.TimeSeries]: appCircleAlertIcon.data,
  });

export enum Aspect {
  N = "N",
  NE = "NE",
  E = "E",
  SE = "SE",
  S = "S",
  SW = "SW",
  W = "W",
  NW = "NW",
}

export enum LocalFilterTypes {
  Elevation = "Elevation",
  Aspect = "Aspect",
  AvalancheProblem = "AvalancheProblem",
  Stability = "Stability",
  ObservationType = "ObservationType",
  ImportantObservation = "ImportantObservation",
  DangerPattern = "DangerPattern",
  Days = "Days",
}

export interface ChartsData {
  Elevation: Object;
  Aspects: Object;
  AvalancheProblem: Object;
  Stability: Object;
  ObservationType: Object;
  ImportantObservation: Object;
  DangerPattern: Object;
  Days: Object;
}

export interface FilterSelectionData {
  all: string[];
  selected: string[];
  highlighted: string[];
}

export interface ObservationTableRow {
  label: string;
  date?: Date;
  number?: number;
  boolean?: boolean;
  url?: string;
  value?: string;
}

export function toObservationTable(
  observation: GenericObservation,
  t: (key: string) => string
): ObservationTableRow[] {
  return [
    { label: t("observations.eventDate"), date: observation.eventDate },
    { label: t("observations.reportDate"), date: observation.reportDate },
    { label: t("observations.authorName"), value: observation.authorName },
    { label: t("observations.locationName"), value: observation.locationName },
    { label: t("observations.elevation"), number: observation.elevation },
    {
      label: t("observations.aspect"),
      value:
        observation.aspect !== undefined
          ? t("aspect." + observation.aspect)
          : undefined,
    },
    { label: t("observations.comment"), value: observation.content },
  ];
}

export function toAspect(
  aspect: Enums.Aspect | string | undefined
): Aspect | undefined {
  if (typeof aspect === "number") {
    const string = Enums.Aspect[aspect];
    return Aspect[string];
  } else if (typeof aspect === "string") {
    return Aspect[aspect];
  }
}

export function imageCountString(images: any[] | undefined) {
  return images?.length ? ` 📷 ${images.length}` : "";
}

export function toGeoJSON(observations: GenericObservation[]) {
  const features = observations.map(
    (o): GeoJSON.Feature => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          o.longitude ?? 0.0,
          o.latitude ?? 0.0,
          o.elevation ?? 0.0,
        ],
      },
      properties: {
        ...o,
        ...(o.$data || {}),
        $data: undefined,
      },
    })
  );
  const collection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features,
  };
  return collection;
}
