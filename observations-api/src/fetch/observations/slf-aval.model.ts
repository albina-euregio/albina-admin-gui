import { z } from "zod/v4";

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
 * Enum values are accepted case-insensitively, empty strings (and zero for measures) are treated as missing.
 */
const blank = (v: unknown) => (v === "" || v === null ? undefined : v);
const str = z.preprocess(blank, z.string().optional());
// all measures (lengths, elevations, group size) are positive, so 0 is just the placeholder of the payload template
const num = z.preprocess((v) => (v === 0 || v === "0" ? undefined : blank(v)), z.coerce.number().optional());
const lower = (v: unknown) => (typeof v === "string" ? blank(v.toLowerCase()) : blank(v));
const lowerStr = z.preprocess(lower, z.string().optional());
const enumOf = <T extends string>(values: readonly [T, ...T[]]) => z.preprocess(lower, z.enum(values).optional());
const threestate = enumOf(["yes", "no", "unknown"]);
const position = z.tuple([z.number(), z.number()]).rest(z.number());
const point = z.object({ type: z.literal("Point"), coordinates: position });
const geometry = z.union([
  point,
  z.object({ type: z.literal("LineString"), coordinates: position.array() }),
  z.object({ type: z.literal("Polygon"), coordinates: position.array().array() }),
]);

export const slfAvalancheSchema = z.looseObject({
  externalId: str,
  triggerDateTime: z.coerce.date(),
  triggerDateTimeAccuracy: lowerStr,
  triggerType: enumOf(["natural", "person", "explosive", "snow_groomer", "other"]),
  triggerRemote: threestate,
  avalancheType: enumOf(["full_depth", "loose_snow", "slab"]),
  avalancheSize: z.preprocess(blank, z.coerce.number().int().min(1).max(5).optional()),
  avalancheMoisture: enumOf(["dry", "wet"]),
  note: str,
  confidential: z.boolean().optional(),
  stormeRelevant: z.boolean().optional(),
  detectionType: lowerStr,
  avalancheLength: num,
  avalancheLengthAccuracy: lowerStr,
  weakLayer: enumOf([
    "within_new_and_drifting_snow",
    "at_the_transition_to_old_snow",
    "in_old_snow",
    "in_old_snow_close_to_the_ground",
  ]),
  fractureThicknessMean: num,
  fractureWidth: num,
  fractureWidthAccuracy: lowerStr,
  startZoneAspect: enumOf(["n", "ne", "e", "se", "s", "sw", "w", "nw"]),
  startZoneSlopeAngleInDegrees: num,
  startZoneElevation: num,
  startZoneElevationAccuracy: lowerStr,
  depositElevation: num,
  depositHeight: num,
  depositWidth: num,
  depositLength: num,
  matDmgExists: threestate,
  rescueMissionExists: threestate,
  prsDmgExists: threestate,
  prsDmgGroupSize: num,
  prsDmgGroupSizeAccuracy: lowerStr,
  prsDmgPersons: z
    .looseObject({ burialConsequence: enumOf(["uninjured", "injured", "dead"]) })
    .array()
    .optional(),
  location: z.preprocess(blank, point.optional()),
  zones: z.looseObject({ type: str, geo: geometry }).array().optional(),
});

export type SlfAvalanche = z.infer<typeof slfAvalancheSchema>;

/**
 * Field names used in the agreed payload which differ from the SLF Aval API v5 spec.
 */
const ALIASES: Record<string, keyof SlfAvalanche> = {
  triggerDateTimeAcc: "triggerDateTimeAccuracy",
  avalancheLengthAcc: "avalancheLengthAccuracy",
  fractureWidthAcc: "fractureWidthAccuracy",
  startZoneSlopeAngle: "startZoneSlopeAngleInDegrees",
  startZoneElevationAcc: "startZoneElevationAccuracy",
  materialDamageExists: "matDmgExists",
  groupSize: "prsDmgGroupSize",
  groupSizeAccuracy: "prsDmgGroupSizeAccuracy",
};

export function parseSlfAvalanche(body: unknown): SlfAvalanche {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const obj: Record<string, unknown> = { ...body };
    for (const [alias, key] of Object.entries(ALIASES)) {
      obj[key] ??= obj[alias];
      delete obj[alias];
    }
    body = obj;
  }
  return slfAvalancheSchema.parse(body);
}

export function toSlfAvalancheObservation(aval: SlfAvalanche): GenericObservation<SlfAvalanche> {
  const [longitude, latitude] = getLocation(aval) ?? [];
  if (latitude === undefined || longitude === undefined) {
    throw new Error("Expecting location or zones with coordinates");
  }
  return {
    $id: aval.externalId ?? crypto.randomUUID(),
    $source: ObservationSource.SlfAval,
    $type: ObservationType.Avalanche,
    $data: aval,
    $extraDialogRows: toSlfAvalancheTable(aval),
    $allowEdit: false,
    $deleted: false,
    stability: SnowpackStability.very_poor,
    aspect: aval.startZoneAspect ? Aspect[aval.startZoneAspect.toUpperCase() as keyof typeof Aspect] : undefined,
    avalancheProblems: getAvalancheProblems(aval),
    content: aval.note,
    elevation: aval.startZoneElevation ?? aval.depositElevation,
    eventDate: aval.triggerDateTime,
    latitude,
    longitude,
    personInvolvement: getPersonInvolvement(aval),
    reportDate: new Date(),
  };
}

// [0, 0] is the placeholder of the payload template
const isSet = (p: number[]) => p[0] !== 0 || p[1] !== 0;

function getLocation(aval: SlfAvalanche): number[] | undefined {
  if (aval.location && isSet(aval.location.coordinates)) return aval.location.coordinates;
  // prefer the start zone, then any point, then the centroid of the vertices of a line/polygon
  const rank = (z: (typeof aval.zones)[number]) =>
    z.type?.toLowerCase() === "start_zone_point" ? 0 : z.geo.type === "Point" ? 1 : 2;
  const zones = [...(aval.zones ?? [])].sort((z1, z2) => rank(z1) - rank(z2));
  for (const { geo } of zones) {
    const positions = (
      geo.type === "Point"
        ? [geo.coordinates]
        : geo.type === "LineString"
          ? geo.coordinates
          : (geo.coordinates[0]?.slice(0, -1) ?? [])
    ).filter(isSet);
    if (!positions.length) continue;
    return [0, 1].map((i) => positions.reduce((sum, p) => sum + p[i], 0) / positions.length);
  }
}

function getAvalancheProblems(aval: SlfAvalanche): AvalancheProblem[] {
  const problems = new Set<AvalancheProblem>();
  if (aval.avalancheType === "full_depth") problems.add(AvalancheProblem.gliding_snow);
  else if (aval.avalancheMoisture === "wet") problems.add(AvalancheProblem.wet_snow);
  if (aval.weakLayer === "in_old_snow" || aval.weakLayer === "in_old_snow_close_to_the_ground") {
    problems.add(AvalancheProblem.persistent_weak_layers);
  }
  return [...problems];
}

function getPersonInvolvement(aval: SlfAvalanche): PersonInvolvement {
  const consequences = aval.prsDmgPersons?.map((p) => p.burialConsequence) ?? [];
  if (consequences.includes("dead")) return PersonInvolvement.Dead;
  if (consequences.includes("injured")) return PersonInvolvement.Injured;
  if (consequences.includes("uninjured")) return PersonInvolvement.Uninjured;
  if (aval.prsDmgExists === "no") return PersonInvolvement.No;
  return PersonInvolvement.Unknown;
}

function withAccuracy(value: number | undefined, accuracy: string | undefined, unit: string): string | undefined {
  if (value === undefined) return;
  return accuracy && accuracy !== "accurate" ? `${value} ${unit} (${accuracy})` : `${value} ${unit}`;
}

export function toSlfAvalancheTable(aval: SlfAvalanche): ObservationTableRow[] {
  const rows: ObservationTableRow[] = [
    { label: "Genauigkeit Abgangszeitpunkt", value: aval.triggerDateTimeAccuracy },
    { label: "Auslöseart", value: aval.triggerType },
    { label: "Fernauslösung", value: aval.triggerRemote },
    { label: "observations.avalancheType", value: aval.avalancheType },
    { label: "observations.avalancheSize", number: aval.avalancheSize },
    { label: "Feuchtigkeit", value: aval.avalancheMoisture },
    { label: "Schwachschicht", value: aval.weakLayer },
    {
      label: "observations.avalancheLength",
      value: withAccuracy(aval.avalancheLength, aval.avalancheLengthAccuracy, "m"),
    },
    { label: "Anrissbreite", value: withAccuracy(aval.fractureWidth, aval.fractureWidthAccuracy, "m") },
    { label: "observations.fractureDepth", value: withAccuracy(aval.fractureThicknessMean, undefined, "cm") },
    { label: "observations.incline", value: withAccuracy(aval.startZoneSlopeAngleInDegrees, undefined, "°") },
    {
      label: "Anrisshöhe",
      value: withAccuracy(aval.startZoneElevation, aval.startZoneElevationAccuracy, "m"),
    },
    { label: "Ablagerung Höhe ü. M.", value: withAccuracy(aval.depositElevation, undefined, "m") },
    { label: "Ablagerung Mächtigkeit", value: withAccuracy(aval.depositHeight, undefined, "m") },
    { label: "Ablagerung Breite", value: withAccuracy(aval.depositWidth, undefined, "m") },
    { label: "Ablagerung Länge", value: withAccuracy(aval.depositLength, undefined, "m") },
    { label: "Sachschaden", value: aval.matDmgExists },
    { label: "Rettungseinsatz", value: aval.rescueMissionExists },
    {
      label: "Gruppengröße",
      value: withAccuracy(aval.prsDmgGroupSize, aval.prsDmgGroupSizeAccuracy, "Pers."),
    },
    { label: "Erfassungsart", value: aval.detectionType },
    { label: "Vertraulich", boolean: aval.confidential },
    { label: "StorMe-relevant", boolean: aval.stormeRelevant },
  ];
  return rows.filter((r) => r.value !== undefined || r.number !== undefined || r.boolean !== undefined);
}
