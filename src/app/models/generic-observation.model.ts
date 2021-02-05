import * as Enums from "../enums/enums";

export interface GenericObservation<Data = any> {
  $data: Data;
  $externalURL?: string;
  $extraDialogRows?: (observation: this, t: (key: string) => string) => Promise<ObservationTableRow[]>;
  $markerColor: string;
  $source: Source;
  aspect: Aspect;
  authorName: string;
  content: string;
  elevation: number;
  eventDate: Date;
  latitude: number;
  locationName: string;
  longitude: number;
  region: string;
  reportDate?: Date;
}

export enum Source {
  albina,
  avaobs,
  lawis,
  lola_safety,
  natlefs
}

export enum Aspect {
  N = "N",
  NE = "NE",
  E = "E",
  SE = "SE",
  S = "S",
  SW = "SW",
  W = "W",
  NW = "NW"
}

export interface ObservationTableRow {
  label: string;
  date?: Date;
  number?: number;
  boolean?: boolean;
  value?: string;
}

export function toObservationTable(observation: GenericObservation, t: (key: string) => string): ObservationTableRow[] {
  return [
    { label: t("observations.eventDate"), date: observation.eventDate },
    { label: t("observations.reportDate"), date: observation.reportDate },
    { label: t("observations.authorName"), value: observation.authorName },
    { label: t("observations.locationName"), value: observation.locationName },
    { label: t("observations.elevation"), number: observation.elevation },
    { label: t("observations.aspect"), value: observation.aspect !== undefined ? t("aspect." + observation.aspect) : undefined },
    { label: t("observations.comment"), value: observation.content }
  ];
}

export function toAspect(aspect: Enums.Aspect | string): Aspect {
  if (typeof aspect === "number") {
    const string = Enums.Aspect[aspect];
    return Aspect[string];
  } else if (typeof aspect === "string") {
    return Aspect[aspect];
  }
}