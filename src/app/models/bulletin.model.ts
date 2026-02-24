import * as Enums from "../enums/enums";
import { DangerRating, RegionStatus } from "../enums/enums";
import {
  BulletinDaytimeDescriptionModel,
  BulletinDaytimeDescriptionSchema,
} from "./bulletin-daytime-description.model";
import { convertLangTextsToJSON, TextSchema, toLangTexts } from "./text.model";
import { UserSchema } from "./user.model";
import { PolygonObject } from "app/danger-sources/models/polygon-object.model";
import { z } from "zod/v4";
import { ZSchema } from "../danger-sources/models/zod-util";

export const BulletinSchema = z.object({
  id: z.string().nullish(),

  author: UserSchema.partial().default(() => ({})),
  additionalAuthors: z
    .string()
    .array()
    .default(() => []),
  ownerRegion: z.string().nullish(),

  updateDate: z.coerce.date().nullish(),
  publicationDate: z.coerce.date().nullish(),

  suggestedRegions: z
    .string()
    .array()
    .default(() => []),
  savedRegions: z
    .string()
    .array()
    .default(() => []),
  publishedRegions: z
    .string()
    .array()
    .default(() => []),

  strategicMindset: z.enum(Enums.StrategicMindset).nullish(),

  hasDaytimeDependency: z.boolean().default(false),

  forenoon: BulletinDaytimeDescriptionSchema.transform((v) =>
    v ? BulletinDaytimeDescriptionModel.parse(v) : undefined,
  ).default(() => BulletinDaytimeDescriptionModel.parse({})),
  afternoon: BulletinDaytimeDescriptionSchema.nullish().transform((v) =>
    v ? BulletinDaytimeDescriptionModel.parse(v) : undefined,
  ),

  validity: z
    .object({
      from: z.coerce.date().nullish(),
      until: z.coerce.date().nullish(),
    })
    .default(() => ({})),

  tendency: z.enum(Enums.Tendency).nullish(),
  dangerPattern1: z.enum(Enums.DangerPattern).nullish(),
  dangerPattern2: z.enum(Enums.DangerPattern).nullish(),

  avActivityComment: TextSchema.array().default(() => []),
  avActivityCommentNotes: z.string().nullish(),
  avActivityCommentTextcat: z.string().nullish(),
  avActivityHighlights: TextSchema.array().default(() => []),
  avActivityHighlightsNotes: z.string().nullish(),
  avActivityHighlightsTextcat: z.string().nullish(),
  generalHeadlineComment: TextSchema.array().default(() => []),
  generalHeadlineCommentNotes: z.string().nullish(),
  generalHeadlineCommentTextcat: z.string().nullish(),
  highlights: TextSchema.array().default(() => []),
  highlightsTextcat: z.string().nullish(),
  snowpackStructureComment: TextSchema.array().default(() => []),
  snowpackStructureCommentNotes: z.string().nullish(),
  snowpackStructureCommentTextcat: z.string().nullish(),
  snowpackStructureHighlights: TextSchema.array().default(() => []),
  snowpackStructureHighlightsNotes: z.string().nullish(),
  snowpackStructureHighlightsTextcat: z.string().nullish(),
  synopsisComment: TextSchema.array().default(() => []),
  synopsisCommentTextcat: z.string().nullish(),
  tendencyComment: TextSchema.array().default(() => []),
  tendencyCommentNotes: z.string().nullish(),
  tendencyCommentTextcat: z.string().nullish(),
});

export type BulletinModelAsJSON = z.input<typeof BulletinSchema>;

export class BulletinModel extends ZSchema(BulletinSchema) implements PolygonObject {
  get avActivityComment$() {
    return toLangTexts(this.avActivityComment);
  }
  set avActivityComment$(v) {
    this.avActivityComment = convertLangTextsToJSON(v);
  }

  get avActivityHighlights$() {
    return toLangTexts(this.avActivityHighlights);
  }
  set avActivityHighlights$(v) {
    this.avActivityHighlights = convertLangTextsToJSON(v);
  }

  get generalHeadlineComment$() {
    return toLangTexts(this.generalHeadlineComment);
  }
  set generalHeadlineComment$(v) {
    this.generalHeadlineComment = convertLangTextsToJSON(v);
  }

  get highlights$() {
    return toLangTexts(this.highlights);
  }
  set highlights$(v) {
    this.highlights = convertLangTextsToJSON(v);
  }

  get snowpackStructureComment$() {
    return toLangTexts(this.snowpackStructureComment);
  }
  set snowpackStructureComment$(v) {
    this.snowpackStructureComment = convertLangTextsToJSON(v);
  }

  get snowpackStructureHighlights$() {
    return toLangTexts(this.snowpackStructureHighlights);
  }
  set snowpackStructureHighlights$(v) {
    this.snowpackStructureHighlights = convertLangTextsToJSON(v);
  }

  get synopsisComment$() {
    return toLangTexts(this.synopsisComment);
  }
  set synopsisComment$(v) {
    this.synopsisComment = convertLangTextsToJSON(v);
  }

  get tendencyComment$() {
    return toLangTexts(this.tendencyComment);
  }
  set tendencyComment$(v) {
    this.tendencyComment = convertLangTextsToJSON(v);
  }
  addAdditionalAuthor(author: string) {
    if (!this.additionalAuthors.includes(author)) {
      this.additionalAuthors.push(author);
    }
  }

  getForenoonDangerRatingAbove(): Enums.DangerRating {
    return this.forenoon.dangerRatingAbove;
  }

  getAfternoonDangerRatingAbove(): Enums.DangerRating {
    if (
      this.hasDaytimeDependency &&
      this.afternoon?.dangerRatingAbove &&
      this.afternoon?.dangerRatingAbove !== DangerRating.missing
    ) {
      return this.afternoon.dangerRatingAbove;
    } else {
      return this.forenoon.dangerRatingAbove;
    }
  }

  getForenoonDangerRatingBelow(): Enums.DangerRating {
    if (this.forenoon.hasElevationDependency) {
      return this.forenoon.dangerRatingBelow;
    } else {
      return this.forenoon.dangerRatingAbove;
    }
  }

  getAfternoonDangerRatingBelow(): Enums.DangerRating {
    if (this.hasDaytimeDependency) {
      if (this.afternoon.hasElevationDependency) {
        if (this.afternoon?.dangerRatingBelow && this.afternoon?.dangerRatingBelow !== DangerRating.missing) {
          return this.afternoon.dangerRatingBelow;
        } else {
          return this.forenoon.dangerRatingBelow;
        }
      } else {
        return this.getAfternoonDangerRatingAbove();
      }
    } else {
      return this.getForenoonDangerRatingBelow();
    }
  }

  getForenoonElevation(): number {
    if (!this.forenoon.hasElevationDependency) {
      return Infinity;
    }
    return this.forenoon.treeline ? 2000 : this.forenoon.elevation;
  }

  getAfternoonElevation(): number {
    if (!this.hasDaytimeDependency) {
      return this.getForenoonElevation();
    }
    if (!this.afternoon.hasElevationDependency) {
      return Infinity;
    }
    return this.afternoon.treeline ? 2000 : this.afternoon.elevation;
  }

  getSavedAndPublishedRegions() {
    return this.publishedRegions.concat(this.savedRegions);
  }

  getAllRegions(): string[] {
    return this.publishedRegions.concat(this.savedRegions).concat(this.suggestedRegions);
  }

  public getRegionsByStatus(type?: RegionStatus): string[] {
    switch (type) {
      case RegionStatus.suggested:
        return this.suggestedRegions;
      case RegionStatus.saved:
        return this.savedRegions;
      case RegionStatus.published:
        return this.publishedRegions;
      default:
        return this.getAllRegions();
    }
  }
}
