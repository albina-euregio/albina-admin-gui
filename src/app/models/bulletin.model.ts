import * as Enums from "../enums/enums";
import { DangerRating, RegionStatus } from "../enums/enums";
import { BulletinDaytimeDescriptionModel } from "./bulletin-daytime-description.model";
import { convertLangTextsToJSON, LangTexts, TextModel, toLangTexts } from "./text.model";
import { UserModel, UserSchema } from "./user.model";
import { formatDate } from "@angular/common";
import { PolygonObject } from "app/danger-sources/models/polygon-object.model";

export type BulletinModelAsJSON = BulletinModel & {
  validity: { from: Date; until: Date };
  highlights: TextModel[];
  avActivityHighlights: TextModel[];
  avActivityComment: TextModel[];
  snowpackStructureHighlights: TextModel[];
  snowpackStructureComment: TextModel[];
  tendencyComment: TextModel[];
};

export class BulletinModel implements PolygonObject {
  public id: string;

  public author: UserModel;
  public additionalAuthors: string[];
  public ownerRegion: string;

  public publicationDate: Date;

  public validFrom: Date;
  public validUntil: Date;

  public suggestedRegions: string[];
  public savedRegions: string[];
  public publishedRegions: string[];

  public strategicMindset: Enums.StrategicMindset;

  public hasDaytimeDependency: boolean;

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
      bulletin.forenoon = BulletinDaytimeDescriptionModel.createFromJson(json.forenoon);
    }
    if (json.afternoon) {
      bulletin.afternoon = BulletinDaytimeDescriptionModel.createFromJson(json.afternoon);
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
      this.forenoon = new BulletinDaytimeDescriptionModel();
      this.afternoon = new BulletinDaytimeDescriptionModel();
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
    const json = Object();

    if (this.id) {
      json["id"] = this.id;
    }
    if (this.author) {
      json["author"] = this.author;
    }
    if (this.additionalAuthors && this.additionalAuthors.length > 0) {
      const additionalAuthors = [];
      for (let i = 0; i <= this.additionalAuthors.length - 1; i++) {
        additionalAuthors.push(this.additionalAuthors[i]);
      }
      json["additionalAuthors"] = additionalAuthors;
    }

    if (this.ownerRegion) {
      json["ownerRegion"] = this.ownerRegion;
    }

    if (this.publicationDate) {
      json["publicationDate"] = formatDate(this.publicationDate, "yyyy-MM-ddTHH:mm:ssZZZZZ", "en-US");
    }

    const validity = Object();
    if (this.validFrom) {
      validity["from"] = formatDate(this.validFrom, "yyyy-MM-ddTHH:mm:ssZZZZZ", "en-US");
    }
    if (this.validUntil) {
      validity["until"] = formatDate(this.validUntil, "yyyy-MM-ddTHH:mm:ssZZZZZ", "en-US");
    }
    json["validity"] = validity;

    if (this.suggestedRegions && this.suggestedRegions.length > 0) {
      const suggestedRegions = [];
      for (let i = 0; i <= this.suggestedRegions.length - 1; i++) {
        suggestedRegions.push(this.suggestedRegions[i]);
      }
      json["suggestedRegions"] = suggestedRegions;
    }

    if (this.savedRegions && this.savedRegions.length > 0) {
      const savedRegions = [];
      for (let i = 0; i <= this.savedRegions.length - 1; i++) {
        savedRegions.push(this.savedRegions[i]);
      }
      json["savedRegions"] = savedRegions;
    }

    if (this.publishedRegions && this.publishedRegions.length > 0) {
      const publishedRegions = [];
      for (let i = 0; i <= this.publishedRegions.length - 1; i++) {
        publishedRegions.push(this.publishedRegions[i]);
      }
      json["publishedRegions"] = publishedRegions;
    }

    json["hasDaytimeDependency"] = this.hasDaytimeDependency;

    if (this.forenoon) {
      json["forenoon"] = this.forenoon.toJson();
    }

    if (this.hasDaytimeDependency && this.afternoon) {
      json["afternoon"] = this.afternoon.toJson();
    }

    if (this.highlightsTextcat) {
      json["highlightsTextcat"] = this.highlightsTextcat;
    }

    if (this.avActivityHighlightsTextcat) {
      json["avActivityHighlightsTextcat"] = this.avActivityHighlightsTextcat;
    }

    if (this.avActivityCommentTextcat) {
      json["avActivityCommentTextcat"] = this.avActivityCommentTextcat;
    }

    if (this.snowpackStructureHighlightsTextcat) {
      json["snowpackStructureHighlightsTextcat"] = this.snowpackStructureHighlightsTextcat;
    }

    if (this.snowpackStructureCommentTextcat) {
      json["snowpackStructureCommentTextcat"] = this.snowpackStructureCommentTextcat;
    }

    if (this.tendencyCommentTextcat) {
      json["tendencyCommentTextcat"] = this.tendencyCommentTextcat;
    }

    if (this.generalHeadlineCommentTextcat) {
      json["generalHeadlineCommentTextcat"] = this.generalHeadlineCommentTextcat;
    }

    if (this.synopsisCommentTextcat) {
      json["synopsisCommentTextcat"] = this.synopsisCommentTextcat;
    }

    if (this.avActivityHighlightsNotes) {
      json["avActivityHighlightsNotes"] = this.avActivityHighlightsNotes;
    }

    if (this.avActivityCommentNotes) {
      json["avActivityCommentNotes"] = this.avActivityCommentNotes;
    }

    if (this.snowpackStructureHighlightsNotes) {
      json["snowpackStructureHighlightsNotes"] = this.snowpackStructureHighlightsNotes;
    }

    if (this.snowpackStructureCommentNotes) {
      json["snowpackStructureCommentNotes"] = this.snowpackStructureCommentNotes;
    }

    if (this.tendencyCommentNotes) {
      json["tendencyCommentNotes"] = this.tendencyCommentNotes;
    }

    if (this.generalHeadlineCommentNotes) {
      json["generalHeadlineCommentNotes"] = this.generalHeadlineCommentNotes;
    }

    if (this.highlights$) {
      json["highlights"] = convertLangTextsToJSON(this.highlights$);
    }

    if (this.avActivityHighlights$) {
      json["avActivityHighlights"] = convertLangTextsToJSON(this.avActivityHighlights$);
    }

    if (this.avActivityComment$) {
      json["avActivityComment"] = convertLangTextsToJSON(this.avActivityComment$);
    }

    if (this.snowpackStructureHighlights$) {
      json["snowpackStructureHighlights"] = convertLangTextsToJSON(this.snowpackStructureHighlights$);
    }

    if (this.snowpackStructureComment$) {
      json["snowpackStructureComment"] = convertLangTextsToJSON(this.snowpackStructureComment$);
    }

    if (this.tendencyComment$) {
      json["tendencyComment"] = convertLangTextsToJSON(this.tendencyComment$);
    }

    if (this.generalHeadlineComment$) {
      json["generalHeadlineComment"] = convertLangTextsToJSON(this.generalHeadlineComment$);
    }

    if (this.synopsisComment$) {
      json["synopsisComment"] = convertLangTextsToJSON(this.synopsisComment$);
    }

    if (this.tendency) {
      json["tendency"] = this.tendency;
    }

    if (this.dangerPattern1) {
      json["dangerPattern1"] = this.dangerPattern1;
    }

    if (this.dangerPattern2) {
      json["dangerPattern2"] = this.dangerPattern2;
    }

    if (this.strategicMindset) {
      json["strategicMindset"] = this.strategicMindset;
    }

    return json;
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
