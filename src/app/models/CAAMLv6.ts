import * as z from "zod/v4";
import type { AvalancheProblemModel } from "./avalanche-problem.model";
import type { BulletinModelAsJSON } from "./bulletin.model";
import type { BulletinDaytimeDescriptionModel } from "./bulletin-daytime-description.model";
import * as Enums from "../enums/enums";

export const CustomDataSchema = z.optional(z.any());
export type CustomData = z.infer<typeof CustomDataSchema>;

const ValidTimePeriodSchema = z.enum(["all_day", "earlier", "later"]);
export type ValidTimePeriod = z.infer<typeof ValidTimePeriodSchema>;

export const TextsSchema = z.object({
  comment: z.optional(z.string()),
  highlights: z.optional(z.string()),
});
export type Texts = z.infer<typeof TextsSchema>;

export const ElevationBoundaryOrBandSchema = z.object({
  lowerBound: z.optional(z.string()),
  upperBound: z.optional(z.string()),
});
export type ElevationBoundaryOrBand = z.infer<typeof ElevationBoundaryOrBandSchema>;

export const ExternalFileSchema = z.object({
  description: z.optional(z.string()),
  fileReferenceURI: z.optional(z.string()),
  fileType: z.optional(z.string()),
});
export type ExternalFile = z.infer<typeof ExternalFileSchema>;

export const ValidTimeSchema = z.object({
  endTime: z.optional(z.coerce.date()),
  startTime: z.optional(z.coerce.date()),
});
export type ValidTime = z.infer<typeof ValidTimeSchema>;

export const MetaDataSchema = z.object({
  comment: z.optional(z.string()),
  extFiles: z.optional(z.array(ExternalFileSchema)),
});
export type MetaData = z.infer<typeof MetaDataSchema>;

export const DangerRatingSchema = z.object({
  aspects: z.optional(z.array(z.enum(Enums.Aspect))),
  customData: CustomDataSchema,
  elevation: z.optional(ElevationBoundaryOrBandSchema),
  mainValue: z.enum(Enums.DangerRating),
  metaData: z.optional(MetaDataSchema),
  validTimePeriod: z.optional(ValidTimePeriodSchema),
});
export type DangerRating = z.infer<typeof DangerRatingSchema>;

export const RegionSchema = z.object({
  customData: CustomDataSchema,
  metaData: z.optional(MetaDataSchema),
  name: z.optional(z.string()),
  regionID: z.string(),
});
export type Region = z.infer<typeof RegionSchema>;

export const PersonSchema = z.object({
  customData: CustomDataSchema,
  metaData: z.optional(MetaDataSchema),
  name: z.optional(z.string()),
  website: z.optional(z.string()),
});
export type Person = z.infer<typeof PersonSchema>;

export const AvalancheBulletinProviderSchema = z.object({
  contactPerson: z.optional(PersonSchema),
  customData: CustomDataSchema,
  metaData: z.optional(MetaDataSchema),
  name: z.optional(z.string()),
  website: z.optional(z.string()),
});
export type AvalancheBulletinProvider = z.infer<typeof AvalancheBulletinProviderSchema>;

export const TendencySchema = z.object({
  comment: z.optional(z.string()),
  highlights: z.optional(z.string()),
  customData: CustomDataSchema,
  metaData: z.optional(MetaDataSchema),
  tendencyType: z.optional(z.enum(["decreasing", "increasing", "steady"])),
  validTime: z.optional(ValidTimeSchema),
});
export type Tendency = z.infer<typeof TendencySchema>;

export const AvalancheProblemSchema = z.object({
  aspects: z.optional(z.array(z.enum(Enums.Aspect))),
  avalancheSize: z.optional(z.number()),
  comment: z.optional(z.string()),
  customData: CustomDataSchema,
  dangerRatingValue: z.optional(z.enum(Enums.DangerRating)),
  elevation: z.optional(ElevationBoundaryOrBandSchema),
  frequency: z.optional(z.enum(Enums.Frequency)),
  metaData: z.optional(MetaDataSchema),
  problemType: z.enum(Enums.AvalancheProblem),
  snowpackStability: z.optional(z.enum(Enums.SnowpackStability)),
  validTimePeriod: z.optional(ValidTimePeriodSchema),
});
export type AvalancheProblem = z.infer<typeof AvalancheProblemSchema>;

export const AvalancheBulletinSourceSchema = z.object({
  person: z.optional(PersonSchema),
  provider: z.optional(AvalancheBulletinProviderSchema),
});
export type AvalancheBulletinSource = z.infer<typeof AvalancheBulletinSourceSchema>;

export const BulletinSchema = z.object({
  avalancheActivity: z.optional(TextsSchema),
  avalancheProblems: z.optional(z.array(AvalancheProblemSchema)),
  bulletinID: z.optional(z.string()),
  customData: CustomDataSchema,
  dangerRatings: z.optional(z.array(DangerRatingSchema)),
  highlights: z.optional(z.string()),
  lang: z.optional(z.string()),
  metaData: z.optional(MetaDataSchema),
  nextUpdate: z.optional(z.coerce.date()),
  publicationTime: z.coerce.date(),
  regions: z.optional(z.array(RegionSchema)),
  snowpackStructure: z.optional(TextsSchema),
  source: z.optional(AvalancheBulletinSourceSchema),
  tendency: z.pipe(
    z.optional(z.union([TendencySchema, z.array(TendencySchema)])),
    z.transform((t) => (Array.isArray(t) ? t : [t])),
  ),
  travelAdvisory: z.optional(TextsSchema),
  unscheduled: z.optional(z.boolean()),
  validTime: z.optional(ValidTimeSchema),
  weatherForecast: z.optional(TextsSchema),
  weatherReview: z.optional(TextsSchema),
});
export type Bulletin = z.infer<typeof BulletinSchema>;

export const BulletinsSchema = z.object({
  bulletins: z.array(BulletinSchema),
  customData: CustomDataSchema,
  metaData: z.optional(MetaDataSchema),
});
export type Bulletins = z.infer<typeof BulletinsSchema>;

export function toAlbinaBulletin(b: Bulletin): BulletinModelAsJSON {
  return {
    id: b.bulletinID,
    author: {} as any,
    publicationDate: b.publicationTime,
    validity: {
      from: b.validTime.startTime,
      until: b.validTime.endTime,
    },
    suggestedRegions: [],
    savedRegions: [],
    publishedRegions: b.regions.map((r) => r.regionID),
    strategicMindset: undefined,
    forenoon: toDaytimeDescription(b, "later"),
    afternoon: toDaytimeDescription(b, "earlier"),
    hasDaytimeDependency: b.dangerRatings?.some((p) => p.validTimePeriod === "later"),
    highlights: [
      {
        languageCode: b.lang,
        text: b.highlights,
      },
    ],
    avActivityHighlights: [
      {
        languageCode: b.lang,
        text: b.avalancheActivity?.highlights,
      },
    ],
    avActivityComment: [
      {
        languageCode: b.lang,
        text:
          b.avalancheActivity?.comment ??
          b.avalancheProblems
            ?.map((p) => p.comment)
            .filter((value, index, array) => array.indexOf(value) === index)
            .join("\n\n"),
      },
    ],
    snowpackStructureHighlights: [
      {
        languageCode: b.lang,
        text: b.snowpackStructure?.highlights,
      },
    ],
    snowpackStructureComment: [
      {
        languageCode: b.lang,
        text: b.snowpackStructure?.comment,
      },
    ],
    tendencyComment: [
      {
        languageCode: b.lang,
        text: b.tendency?.[0]?.comment,
      },
    ],
    tendency: Enums.Tendency[b.tendency?.[0]?.tendencyType],
  } satisfies Partial<BulletinModelAsJSON> as BulletinModelAsJSON;
}

function toDaytimeDescription(b: Bulletin, exclude: ValidTimePeriod): BulletinDaytimeDescriptionModel {
  const problems = (b.avalancheProblems ?? []).filter((p) => p.validTimePeriod !== exclude);
  const problemModels = problems.map(
    (p) =>
      ({
        aspects: p.aspects,
        avalancheProblem: p.problemType,
        eawsMatrixInformation: {
          avalancheSize: Object.values(Enums.AvalancheSize)[p.avalancheSize - 1],
          frequency: p.frequency,
          snowpackStability: p.snowpackStability,
          dangerRating: p.dangerRatingValue,
        },
      }) as Partial<AvalancheProblemModel> as AvalancheProblemModel,
  );
  const dangerRatings = (b.dangerRatings ?? []).filter((r) => r.validTimePeriod !== exclude);
  const dangerRatingsBounds = dangerRatings
    .flatMap((r) => [r.elevation?.lowerBound, r.elevation?.upperBound])
    .filter(Boolean);
  return {
    dangerRatingAbove: dangerRatings
      .filter((r) => !r.elevation?.lowerBound)
      .map((r) => r.mainValue)
      .find((r) => r),
    dangerRatingBelow: dangerRatings
      .filter((r) => !r.elevation?.upperBound)
      .map((r) => r.mainValue)
      .find((r) => r),
    avalancheProblem1: problemModels.pop(),
    avalancheProblem2: problemModels.pop(),
    avalancheProblem3: problemModels.pop(),
    avalancheProblem4: problemModels.pop(),
    avalancheProblem5: problemModels.pop(),
    hasElevationDependency: dangerRatingsBounds.length > 0,
    elevation: dangerRatingsBounds
      .filter((r) => /\d+/.test(r))
      .map((r) => +r)
      .find((r) => r),
    treeline: dangerRatingsBounds.includes("treeline"),
  } satisfies Partial<BulletinDaytimeDescriptionModel> as BulletinDaytimeDescriptionModel;
}
