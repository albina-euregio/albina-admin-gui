import {
  type GenericObservation,
  Aspect,
  AvalancheProblem,
  ObservationSource,
  type ObservationTableRow,
  ObservationType,
  PersonInvolvement,
  SnowpackStability,
} from "../../generic-observation";

/**
 * Avalanche in the format of the SLF Aval API v5 (https://test-api.slf.ch/aval/api/v5/).
 * Where the agreed Wyssen payload uses a different field name than the spec, both are listed.
 */
export interface WyssenAvalanche {
  externalId: string;
  triggerDateTime: string;
  triggerDateTimeAcc?: string;
  triggerDateTimeAccuracy?: string;
  triggerType?: string;
  triggerRemote?: string;
  avalancheType?: string;
  avalancheSize?: string | number;
  avalancheMoisture?: string;
  note?: string;
  confidential?: boolean;
  stormeRelevant?: boolean;
  detectionType?: string;
  avalancheLength?: number;
  avalancheLengthAcc?: string;
  avalancheLengthAccuracy?: string;
  weakLayer?: string;
  fractureThicknessMean?: number;
  fractureWidth?: number;
  fractureWidthAcc?: string;
  fractureWidthAccuracy?: string;
  startZoneAspect?: string;
  startZoneSlopeAngle?: string | number;
  startZoneSlopeAngleInDegrees?: string | number;
  startZoneElevation?: number;
  startZoneElevationAcc?: string;
  startZoneElevationAccuracy?: string;
  depositElevation?: number;
  depositHeight?: number;
  depositWidth?: number;
  depositLength?: number;
  materialDamageExists?: string;
  matDmgExists?: string;
  rescueMissionExists?: string;
  prsDmgExists?: string;
  groupSize?: number;
  prsDmgGroupSize?: number;
  groupSizeAccuracy?: string;
  prsDmgGroupSizeAccuracy?: string;
  prsDmgPersons?: { burialConsequence?: string }[];
  location?: { type: "Point"; coordinates: number[] };
  zones?: { type?: string; geo: unknown }[];
}

export function toWyssenAvalancheObservation(aval: WyssenAvalanche): GenericObservation<WyssenAvalanche> {
  const [longitude, latitude] = aval.location?.coordinates ?? [];
  return {
    $id: aval.externalId,
    $source: ObservationSource.Wyssen,
    $type: ObservationType.Avalanche,
    $data: aval,
    $extraDialogRows: toWyssenAvalancheTable(aval),
    $allowEdit: false,
    $deleted: false,
    stability: SnowpackStability.very_poor,
    aspect: Object.values(Aspect).find((a) => a === aval.startZoneAspect),
    avalancheProblems: getAvalancheProblems(aval),
    content: aval.note,
    elevation: aval.startZoneElevation ?? aval.depositElevation,
    eventDate: new Date(aval.triggerDateTime),
    latitude,
    longitude,
    personInvolvement: getPersonInvolvement(aval),
    reportDate: new Date(),
  };
}

function getAvalancheProblems(aval: WyssenAvalanche): AvalancheProblem[] {
  const problems: AvalancheProblem[] = [];
  if (aval.avalancheType === "FULL_DEPTH") problems.push(AvalancheProblem.gliding_snow);
  else if (aval.avalancheMoisture === "WET") problems.push(AvalancheProblem.wet_snow);
  if (aval.weakLayer === "IN_OLD_SNOW" || aval.weakLayer === "IN_OLD_SNOW_CLOSE_TO_THE_GROUND") {
    problems.push(AvalancheProblem.persistent_weak_layers);
  }
  return problems;
}

function getPersonInvolvement(aval: WyssenAvalanche): PersonInvolvement {
  const consequences = aval.prsDmgPersons?.map((p) => p.burialConsequence) ?? [];
  if (consequences.includes("DEAD")) return PersonInvolvement.Dead;
  if (consequences.includes("INJURED")) return PersonInvolvement.Injured;
  if (consequences.includes("UNINJURED")) return PersonInvolvement.Uninjured;
  if (aval.prsDmgExists === "NO") return PersonInvolvement.No;
  return PersonInvolvement.Unknown;
}

function withUnit(value: unknown, unit: string, accuracy?: string): string | undefined {
  if (value === undefined || value === null || value === "") return;
  return accuracy ? `${value} ${unit} (${accuracy})` : `${value} ${unit}`;
}

export function toWyssenAvalancheTable(aval: WyssenAvalanche): ObservationTableRow[] {
  const rows: ObservationTableRow[] = [
    { label: "Genauigkeit Abgangszeitpunkt", value: aval.triggerDateTimeAcc ?? aval.triggerDateTimeAccuracy },
    { label: "Auslöseart", value: aval.triggerType },
    { label: "Fernauslösung", value: aval.triggerRemote },
    { label: "observations.avalancheType", value: aval.avalancheType },
    { label: "observations.avalancheSize", value: aval.avalancheSize?.toString() },
    { label: "Feuchtigkeit", value: aval.avalancheMoisture },
    { label: "Schwachschicht", value: aval.weakLayer },
    {
      label: "observations.avalancheLength",
      value: withUnit(aval.avalancheLength, "m", aval.avalancheLengthAcc ?? aval.avalancheLengthAccuracy),
    },
    {
      label: "observations.avalancheWidth",
      value: withUnit(aval.fractureWidth, "m", aval.fractureWidthAcc ?? aval.fractureWidthAccuracy),
    },
    { label: "observations.fractureDepth", value: withUnit(aval.fractureThicknessMean, "cm") },
    {
      label: "observations.incline",
      value: withUnit(aval.startZoneSlopeAngle ?? aval.startZoneSlopeAngleInDegrees, "°"),
    },
    {
      label: "Anrisshöhe",
      value: withUnit(aval.startZoneElevation, "m", aval.startZoneElevationAcc ?? aval.startZoneElevationAccuracy),
    },
    { label: "Ablagerung Höhe ü. M.", value: withUnit(aval.depositElevation, "m") },
    { label: "Ablagerung Mächtigkeit", value: withUnit(aval.depositHeight, "m") },
    { label: "Ablagerung Breite", value: withUnit(aval.depositWidth, "m") },
    { label: "Ablagerung Länge", value: withUnit(aval.depositLength, "m") },
    { label: "Sachschaden", value: aval.materialDamageExists ?? aval.matDmgExists },
    { label: "Rettungseinsatz", value: aval.rescueMissionExists },
    {
      label: "Gruppengröße",
      value: withUnit(
        aval.groupSize ?? aval.prsDmgGroupSize,
        "Pers.",
        aval.groupSizeAccuracy ?? aval.prsDmgGroupSizeAccuracy,
      ),
    },
    { label: "Erfassungsart", value: aval.detectionType },
    { label: "Vertraulich", boolean: aval.confidential },
    { label: "StorMe-relevant", boolean: aval.stormeRelevant },
  ];
  return rows.filter((row) => (row.value ?? "") !== "" || typeof row.boolean === "boolean");
}
