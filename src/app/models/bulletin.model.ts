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

  public forenoon: BulletinDaytimeDescriptionModel;
  public afternoon: BulletinDaytimeDescriptionModel;

  public highlightsTextcat: string;
  public avActivityHighlightsTextcat: string;
  public avActivityCommentTextcat: string;
  public snowpackStructureHighlightsTextcat: string;
  public snowpackStructureCommentTextcat: string;
  public tendencyCommentTextcat: string;
  public generalHeadlineCommentTextcat: string;
  public synopsisCommentTextcat: string;

  public avActivityHighlightsNotes: string;
  public avActivityCommentNotes: string;
  public snowpackStructureHighlightsNotes: string;
  public snowpackStructureCommentNotes: string;
  public tendencyCommentNotes: string;
  public generalHeadlineCommentNotes: string;

  public highlights$: LangTexts;
  public avActivityHighlights$: LangTexts;
  public avActivityComment$: LangTexts;
  public snowpackStructureHighlights$: LangTexts;
  public snowpackStructureComment$: LangTexts;
  public tendencyComment$: LangTexts;
  public generalHeadlineComment$: LangTexts;
  public synopsisComment$: LangTexts;

  public tendency: Enums.Tendency;

  public dangerPattern1: Enums.DangerPattern;
  public dangerPattern2: Enums.DangerPattern;

  static createFromJson(json: BulletinModelAsJSON | any) {
    const bulletin = new BulletinModel();

    bulletin.id = json.id;
    bulletin.author = UserSchema.partial().parse(json.author) as unknown as UserModel;
    const jsonAdditionalAuthors = json.additionalAuthors;
    const additionalAuthors = new Array<string>();
    for (const i in jsonAdditionalAuthors) {
      if (jsonAdditionalAuthors[i] !== null) {
        additionalAuthors.push(jsonAdditionalAuthors[i]);
      }
    }
    bulletin.additionalAuthors = additionalAuthors;

    if (json.ownerRegion) {
      bulletin.ownerRegion = json.ownerRegion;
    }

    if (json.saveDate) {
      bulletin.saveDate = new Date(json.saveDate);
    }

    if (json.publicationDate) {
      bulletin.publicationDate = new Date(json.publicationDate);
    }

    bulletin.validFrom = new Date(json.validity.from);
    bulletin.validUntil = new Date(json.validity.until);

    const jsonSuggestedRegions = json.suggestedRegions;
    const suggestedRegions = new Array<string>();
    for (const i in jsonSuggestedRegions) {
      if (jsonSuggestedRegions[i] !== null) {
        suggestedRegions.push(jsonSuggestedRegions[i]);
      }
    }
    bulletin.suggestedRegions = suggestedRegions;

    const jsonSavedRegions = json.savedRegions;
    const savedRegions = new Array<string>();
    for (const i in jsonSavedRegions) {
      if (jsonSavedRegions[i] !== null) {
        savedRegions.push(jsonSavedRegions[i]);
      }
    }
    bulletin.savedRegions = savedRegions;

    const jsonPublishedRegions = json.publishedRegions;
    const publishedRegions = new Array<string>();
    for (const i in jsonPublishedRegions) {
      if (jsonPublishedRegions[i] !== null) {
        publishedRegions.push(jsonPublishedRegions[i]);
      }
    }
    bulletin.publishedRegions = publishedRegions;

    bulletin.hasDaytimeDependency = json.hasDaytimeDependency;

    if (json.forenoon) {
      bulletin.forenoon = BulletinDaytimeDescriptionModel.parse(json.forenoon);
    }
    if (json.afternoon) {
      bulletin.afternoon = BulletinDaytimeDescriptionModel.parse(json.afternoon);
    }

    if (json.highlightsTextcat) {
      bulletin.highlightsTextcat = json.highlightsTextcat;
    }
    if (json.highlights) {
      bulletin.highlights$ = toLangTexts(json.highlights);
    }

    if (json.avActivityHighlightsTextcat) {
      bulletin.avActivityHighlightsTextcat = json.avActivityHighlightsTextcat;
    }
    if (json.avActivityHighlights) {
      bulletin.avActivityHighlights$ = toLangTexts(json.avActivityHighlights);
    }
    if (json.avActivityHighlightsNotes) {
      bulletin.avActivityHighlightsNotes = json.avActivityHighlightsNotes;
    }

    if (json.avActivityCommentTextcat) {
      bulletin.avActivityCommentTextcat = json.avActivityCommentTextcat;
    }
    if (json.avActivityComment) {
      bulletin.avActivityComment$ = toLangTexts(json.avActivityComment);
    }
    if (json.avActivityCommentNotes) {
      bulletin.avActivityCommentNotes = json.avActivityCommentNotes;
    }

    if (json.snowpackStructureHighlightsTextcat) {
      bulletin.snowpackStructureHighlightsTextcat = json.snowpackStructureHighlightsTextcat;
    }
    if (json.snowpackStructureHighlights) {
      bulletin.snowpackStructureHighlights$ = toLangTexts(json.snowpackStructureHighlights);
    }
    if (json.snowpackStructureHighlightsNotes) {
      bulletin.snowpackStructureHighlightsNotes = json.SnowpackStructureHighlightsNotes;
    }

    if (json.snowpackStructureCommentTextcat) {
      bulletin.snowpackStructureCommentTextcat = json.snowpackStructureCommentTextcat;
    }
    if (json.snowpackStructureComment) {
      bulletin.snowpackStructureComment$ = toLangTexts(json.snowpackStructureComment);
    }
    if (json.snowpackStructureCommentNotes) {
      bulletin.snowpackStructureCommentNotes = json.snowpackStructureCommentNotes;
    }

    if (json.tendencyCommentTextcat) {
      bulletin.tendencyCommentTextcat = json.tendencyCommentTextcat;
    }
    if (json.tendencyComment) {
      bulletin.tendencyComment$ = toLangTexts(json.tendencyComment);
    }
    if (json.tendencyCommentNotes) {
      bulletin.tendencyCommentNotes = json.tendencyCommentNotes;
    }

    if (json.tendency) {
      bulletin.tendency = json.tendency;
    }

    if (json.generalHeadlineCommentTextcat) {
      bulletin.generalHeadlineCommentTextcat = json.generalHeadlineCommentTextcat;
    }
    if (json.generalHeadlineComment) {
      bulletin.generalHeadlineComment$ = toLangTexts(json.generalHeadlineComment);
    }
    if (json.generalHeadlineCommentNotes) {
      bulletin.generalHeadlineCommentNotes = json.generalHeadlineCommentNotes;
    }

    if (json.synopsisCommentTextcat) {
      bulletin.synopsisCommentTextcat = json.synopsisCommentTextcat;
    }
    if (json.synopsisComment) {
      bulletin.synopsisComment$ = toLangTexts(json.synopsisComment);
    }

    if (json.dangerPattern1) {
      bulletin.dangerPattern1 = json.dangerPattern1;
    }
    if (json.dangerPattern2) {
      bulletin.dangerPattern2 = json.dangerPattern2;
    }

    if (json.strategicMindset) {
      bulletin.strategicMindset = json.strategicMindset;
    }

    return bulletin;
  }

  constructor(bulletin?: BulletinModel) {
    this.author = undefined;
    this.saveDate = undefined;
    this.publicationDate = undefined;
    if (bulletin) {
      this.additionalAuthors = bulletin.additionalAuthors;
      this.ownerRegion = bulletin.ownerRegion;
      this.validFrom = bulletin.validFrom;
      this.validUntil = bulletin.validUntil;
      this.suggestedRegions = bulletin.suggestedRegions;
      this.savedRegions = bulletin.savedRegions;
      this.publishedRegions = bulletin.publishedRegions;
      this.forenoon = new BulletinDaytimeDescriptionModel(bulletin.forenoon);
      this.afternoon = new BulletinDaytimeDescriptionModel(bulletin.afternoon);
      this.highlightsTextcat = bulletin.highlightsTextcat;
      this.avActivityHighlightsTextcat = bulletin.avActivityHighlightsTextcat;
      this.avActivityCommentTextcat = bulletin.avActivityCommentTextcat;
      this.snowpackStructureHighlightsTextcat = bulletin.snowpackStructureHighlightsTextcat;
      this.snowpackStructureCommentTextcat = bulletin.snowpackStructureCommentTextcat;
      this.tendencyCommentTextcat = bulletin.tendencyCommentTextcat;
      this.generalHeadlineCommentTextcat = bulletin.generalHeadlineCommentTextcat;
      this.synopsisCommentTextcat = bulletin.synopsisCommentTextcat;
      this.avActivityHighlightsNotes = bulletin.avActivityHighlightsNotes;
      this.avActivityCommentNotes = bulletin.avActivityCommentNotes;
      this.snowpackStructureHighlightsNotes = bulletin.snowpackStructureHighlightsNotes;
      this.snowpackStructureCommentNotes = bulletin.snowpackStructureCommentNotes;
      this.tendencyCommentNotes = bulletin.tendencyCommentNotes;
      this.generalHeadlineCommentTextcat = bulletin.generalHeadlineCommentTextcat;
      this.generalHeadlineCommentNotes = bulletin.generalHeadlineCommentNotes;

      this.highlights$ = { ...bulletin.highlights$ };
      this.avActivityHighlights$ = { ...bulletin.avActivityHighlights$ };
      this.avActivityComment$ = { ...bulletin.avActivityComment$ };
      this.snowpackStructureHighlights$ = { ...bulletin.snowpackStructureHighlights$ };
      this.snowpackStructureComment$ = { ...bulletin.snowpackStructureComment$ };
      this.tendencyComment$ = { ...bulletin.tendencyComment$ };
      this.generalHeadlineComment$ = { ...bulletin.generalHeadlineComment$ };
      this.synopsisComment$ = { ...bulletin.synopsisComment$ };

      this.tendency = bulletin.tendency;
      this.dangerPattern1 = bulletin.dangerPattern1;
      this.dangerPattern2 = bulletin.dangerPattern2;
      this.strategicMindset = bulletin.strategicMindset;
      this.hasDaytimeDependency = bulletin.hasDaytimeDependency;
    } else {
      this.additionalAuthors = new Array<string>();
      this.ownerRegion = undefined;
      this.validFrom = undefined;
      this.validUntil = undefined;
      this.suggestedRegions = new Array<string>();
      this.savedRegions = new Array<string>();
      this.publishedRegions = new Array<string>();
      this.forenoon = BulletinDaytimeDescriptionModel.parse({});
      this.afternoon = BulletinDaytimeDescriptionModel.parse({});
      this.highlightsTextcat = undefined;
      this.avActivityHighlightsTextcat = undefined;
      this.avActivityCommentTextcat = undefined;
      this.snowpackStructureHighlightsTextcat = undefined;
      this.snowpackStructureCommentTextcat = undefined;
      this.tendencyCommentTextcat = undefined;
      this.avActivityHighlightsNotes = undefined;
      this.avActivityCommentNotes = undefined;
      this.snowpackStructureHighlightsNotes = undefined;
      this.snowpackStructureCommentNotes = undefined;
      this.tendencyCommentNotes = undefined;
      this.generalHeadlineCommentTextcat = undefined;
      this.generalHeadlineCommentNotes = undefined;
      this.synopsisCommentTextcat = undefined;
      this.highlights$ = {} as LangTexts;
      this.avActivityHighlights$ = {} as LangTexts;
      this.avActivityComment$ = {} as LangTexts;
      this.snowpackStructureHighlights$ = {} as LangTexts;
      this.snowpackStructureComment$ = {} as LangTexts;
      this.tendencyComment$ = {} as LangTexts;
      this.generalHeadlineComment$ = {} as LangTexts;
      this.synopsisComment$ = {} as LangTexts;
      this.tendency = undefined;
      this.dangerPattern1 = undefined;
      this.dangerPattern2 = undefined;
      this.strategicMindset = undefined;
      this.hasDaytimeDependency = false;
    }
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

  toJson(): BulletinModelAsJSON {
    return this;
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
