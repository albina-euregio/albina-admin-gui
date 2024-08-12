import { BulletinDaytimeDescriptionModel } from "./bulletin-daytime-description.model";
import { convertLangTextsToJSON, LangTexts, TextModel } from "./text.model";
import { AuthorModel } from "./author.model";
import * as Enums from "../enums/enums";
import { RegionStatus } from "../enums/enums";
import { formatDate } from "@angular/common";
import { GenericMapObject } from "app/danger-sources/models/generic-map-object.model";

export class BulletinModel implements GenericMapObject {
  public id: string;

  public author: AuthorModel;
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

  public avActivityHighlightsNotes: string;
  public avActivityCommentNotes: string;
  public snowpackStructureHighlightsNotes: string;
  public snowpackStructureCommentNotes: string;
  public tendencyCommentNotes: string;

  public highlights$: LangTexts;
  public avActivityHighlights$: LangTexts;
  public avActivityComment$: LangTexts;
  public snowpackStructureHighlights$: LangTexts;
  public snowpackStructureComment$: LangTexts;
  public tendencyComment$: LangTexts;

  public tendency: Enums.Tendency;

  public dangerPattern1: Enums.DangerPattern;
  public dangerPattern2: Enums.DangerPattern;

  static createFromJson(json) {
    const bulletin = new BulletinModel();

    bulletin.setId(json.id);
    bulletin.setAuthor(AuthorModel.createFromJson(json.author));
    const jsonAdditionalAuthors = json.additionalAuthors;
    const additionalAuthors = new Array<string>();
    for (const i in jsonAdditionalAuthors) {
      if (jsonAdditionalAuthors[i] !== null) {
        additionalAuthors.push(jsonAdditionalAuthors[i]);
      }
    }
    bulletin.setAdditionalAuthors(additionalAuthors);

    if (json.ownerRegion) {
      bulletin.setOwnerRegion(json.ownerRegion);
    }

    if (json.publicationDate) {
      bulletin.setPublicationDate(new Date(json.publicationDate));
    }

    bulletin.setValidFrom(new Date(json.validity.from));
    bulletin.setValidUntil(new Date(json.validity.until));

    const jsonSuggestedRegions = json.suggestedRegions;
    const suggestedRegions = new Array<string>();
    for (const i in jsonSuggestedRegions) {
      if (jsonSuggestedRegions[i] !== null) {
        suggestedRegions.push(jsonSuggestedRegions[i]);
      }
    }
    bulletin.setSuggestedRegions(suggestedRegions);

    const jsonSavedRegions = json.savedRegions;
    const savedRegions = new Array<string>();
    for (const i in jsonSavedRegions) {
      if (jsonSavedRegions[i] !== null) {
        savedRegions.push(jsonSavedRegions[i]);
      }
    }
    bulletin.setSavedRegions(savedRegions);

    const jsonPublishedRegions = json.publishedRegions;
    const publishedRegions = new Array<string>();
    for (const i in jsonPublishedRegions) {
      if (jsonPublishedRegions[i] !== null) {
        publishedRegions.push(jsonPublishedRegions[i]);
      }
    }
    bulletin.setPublishedRegions(publishedRegions);

    bulletin.setHasDaytimeDependency(json.hasDaytimeDependency);

    if (json.forenoon) {
      bulletin.setForenoon(BulletinDaytimeDescriptionModel.createFromJson(json.forenoon));
    }
    if (json.afternoon) {
      bulletin.setAfternoon(BulletinDaytimeDescriptionModel.createFromJson(json.afternoon));
    }

    if (json.highlightsTextcat) {
      bulletin.highlightsTextcat = json.highlightsTextcat;
    }
    const jsonHighlights = json.highlights;
    const highlights = new Array<TextModel>();
    for (const i in jsonHighlights) {
      if (jsonHighlights[i] !== null) {
        highlights.push(TextModel.createFromJson(jsonHighlights[i]));
      }
    }
    bulletin.highlights$ = TextModel.toLangTexts(highlights);

    if (json.avActivityHighlightsTextcat) {
      bulletin.avActivityHighlightsTextcat = json.avActivityHighlightsTextcat;
    }
    const jsonAvActivityHighlights = json.avActivityHighlights;
    const avActivityHighlights = new Array<TextModel>();
    for (const i in jsonAvActivityHighlights) {
      if (jsonAvActivityHighlights[i] !== null) {
        avActivityHighlights.push(TextModel.createFromJson(jsonAvActivityHighlights[i]));
      }
    }
    bulletin.avActivityHighlights$ = TextModel.toLangTexts(avActivityHighlights);
    if (json.avActivityHighlightsNotes) {
      bulletin.avActivityHighlightsNotes = json.avActivityHighlightsNotes;
    }

    if (json.avActivityCommentTextcat) {
      bulletin.avActivityCommentTextcat = json.avActivityCommentTextcat;
    }
    const jsonAvActivityComment = json.avActivityComment;
    const avActivityComment = new Array<TextModel>();
    for (const i in jsonAvActivityComment) {
      if (jsonAvActivityComment[i] !== null) {
        avActivityComment.push(TextModel.createFromJson(jsonAvActivityComment[i]));
      }
    }
    bulletin.avActivityComment$ = TextModel.toLangTexts(avActivityComment);
    if (json.avActivityCommentNotes) {
      bulletin.avActivityCommentNotes = json.avActivityCommentNotes;
    }

    if (json.snowpackStructureHighlightsTextcat) {
      bulletin.snowpackStructureHighlightsTextcat = json.snowpackStructureHighlightsTextcat;
    }
    const jsonSnowpackStructureHighlight = json.snowpackStructureHighlights;
    const snowpackStructureHighlights = new Array<TextModel>();
    for (const i in jsonSnowpackStructureHighlight) {
      if (jsonSnowpackStructureHighlight[i] !== null) {
        snowpackStructureHighlights.push(TextModel.createFromJson(jsonSnowpackStructureHighlight[i]));
      }
    }
    bulletin.snowpackStructureHighlights$ = TextModel.toLangTexts(snowpackStructureHighlights);
    if (json.snowpackStructureHighlightsNotes) {
      bulletin.snowpackStructureHighlightsNotes = json.SnowpackStructureHighlightsNotes;
    }

    if (json.snowpackStructureCommentTextcat) {
      bulletin.snowpackStructureCommentTextcat = json.snowpackStructureCommentTextcat;
    }
    const jsonSnowpackStructureComment = json.snowpackStructureComment;
    const snowpackStructureComment = new Array<TextModel>();
    for (const i in jsonSnowpackStructureComment) {
      if (jsonSnowpackStructureComment[i] !== null) {
        snowpackStructureComment.push(TextModel.createFromJson(jsonSnowpackStructureComment[i]));
      }
    }
    bulletin.snowpackStructureComment$ = TextModel.toLangTexts(snowpackStructureComment);
    if (json.snowpackStructureCommentNotes) {
      bulletin.snowpackStructureCommentNotes = json.snowpackStructureCommentNotes;
    }

    if (json.tendencyCommentTextcat) {
      bulletin.tendencyCommentTextcat = json.tendencyCommentTextcat;
    }
    const jsonTendencyComment = json.tendencyComment;
    const tendencyComment = new Array<TextModel>();
    for (const i in jsonTendencyComment) {
      if (jsonTendencyComment[i] !== null) {
        tendencyComment.push(TextModel.createFromJson(jsonTendencyComment[i]));
      }
    }
    bulletin.tendencyComment$ = TextModel.toLangTexts(tendencyComment);
    if (json.tendencyCommentNotes) {
      bulletin.tendencyCommentNotes = json.tendencyCommentNotes;
    }

    if (json.tendency) {
      bulletin.tendency = json.tendency;
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
      this.avActivityHighlightsNotes = bulletin.avActivityHighlightsNotes;
      this.avActivityCommentNotes = bulletin.avActivityCommentNotes;
      this.snowpackStructureHighlightsNotes = bulletin.snowpackStructureHighlightsNotes;
      this.snowpackStructureCommentNotes = bulletin.snowpackStructureCommentNotes;
      this.tendencyCommentNotes = bulletin.tendencyCommentNotes;

      this.highlights$ = { ...bulletin.highlights$ };
      this.avActivityHighlights$ = { ...bulletin.avActivityHighlights$ };
      this.avActivityComment$ = { ...bulletin.avActivityComment$ };
      this.snowpackStructureHighlights$ = { ...bulletin.snowpackStructureHighlights$ };
      this.snowpackStructureComment$ = { ...bulletin.snowpackStructureComment$ };
      this.tendencyComment$ = { ...bulletin.tendencyComment$ };

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
      this.avActivityHighlights$ = {} as LangTexts;
      this.avActivityComment$ = {} as LangTexts;
      this.snowpackStructureHighlights$ = {} as LangTexts;
      this.snowpackStructureComment$ = {} as LangTexts;
      this.tendencyComment$ = {} as LangTexts;
      this.tendency = undefined;
      this.dangerPattern1 = undefined;
      this.dangerPattern2 = undefined;
      this.strategicMindset = undefined;
      this.hasDaytimeDependency = false;
    }
  }

  getId(): string {
    return this.id;
  }

  setId(id: string) {
    this.id = id;
  }

  getAuthor(): AuthorModel {
    return this.author;
  }

  setAuthor(author: AuthorModel) {
    this.author = author;
  }

  getAdditionalAuthors(): string[] {
    return this.additionalAuthors;
  }

  setAdditionalAuthors(additionalAuthors: string[]) {
    this.additionalAuthors = additionalAuthors;
  }

  addAdditionalAuthor(author: string) {
    if (!this.additionalAuthors.includes(author)) {
      this.additionalAuthors.push(author);
    }
  }

  getOwnerRegion() {
    return this.ownerRegion;
  }

  setOwnerRegion(ownerRegion: string) {
    this.ownerRegion = ownerRegion;
  }

  getPublicationDate() {
    return this.publicationDate;
  }

  setPublicationDate(publicationDate: Date) {
    this.publicationDate = publicationDate;
  }

  getValidFrom(): Date {
    return this.validFrom;
  }

  setValidFrom(validFrom: Date) {
    this.validFrom = validFrom;
  }

  getValidUntil(): Date {
    return this.validUntil;
  }

  setValidUntil(validUntil: Date) {
    this.validUntil = validUntil;
  }

  getSuggestedRegions(): string[] {
    return this.suggestedRegions;
  }

  setSuggestedRegions(suggestedRegions: string[]) {
    this.suggestedRegions = suggestedRegions;
  }

  getSavedRegions(): string[] {
    return this.savedRegions;
  }

  setSavedRegions(savedRegions: string[]) {
    this.savedRegions = savedRegions;
  }

  getPublishedRegions(): string[] {
    return this.publishedRegions;
  }

  setPublishedRegions(publishedRegions: string[]) {
    this.publishedRegions = publishedRegions;
  }

  getHasDaytimeDependency() {
    return this.hasDaytimeDependency;
  }

  setHasDaytimeDependency(hasDaytimeDependency: boolean) {
    this.hasDaytimeDependency = hasDaytimeDependency;
  }

  getForenoon(): BulletinDaytimeDescriptionModel {
    return this.forenoon;
  }

  setForenoon(forenoon: BulletinDaytimeDescriptionModel) {
    this.forenoon = forenoon;
  }

  getAfternoon(): BulletinDaytimeDescriptionModel {
    return this.afternoon;
  }

  setAfternoon(afternoon: BulletinDaytimeDescriptionModel) {
    this.afternoon = afternoon;
  }

  getForenoonDangerRatingAbove(): Enums.DangerRating {
    return this.forenoon.dangerRatingAbove;
  }

  getAfternoonDangerRatingAbove(): Enums.DangerRating {
    const test: any = this.afternoon.dangerRatingAbove;
    if (this.hasDaytimeDependency && this.afternoon && this.afternoon.dangerRatingAbove && test !== "missing") {
      return this.afternoon.dangerRatingAbove;
    } else {
      return this.forenoon.dangerRatingAbove;
    }
  }

  getForenoonDangerRatingBelow(): Enums.DangerRating {
    if (this.forenoon.hasElevationDependency) {
      return this.forenoon.dangerRatingBelow;
    } else {
      return this.getForenoonDangerRatingAbove();
    }
  }

  getAfternoonDangerRatingBelow(): Enums.DangerRating {
    if (this.hasDaytimeDependency) {
      if (this.afternoon.hasElevationDependency) {
        const test: any = this.afternoon.dangerRatingBelow;
        if (this.afternoon && this.afternoon.dangerRatingBelow && test !== "missing") {
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

  getSavedAndPublishedRegions() {
    return this.getPublishedRegions().concat(this.getSavedRegions());
  }

  getAllRegions(): string[] {
    return this.getPublishedRegions().concat(this.getSavedRegions()).concat(this.getSuggestedRegions());
  }

  toJson() {
    const json = Object();

    if (this.id) {
      json["id"] = this.id;
    }
    if (this.author) {
      json["author"] = this.author.toJson();
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
        return this.getSuggestedRegions();
      case RegionStatus.saved:
        return this.getSavedRegions();
      case RegionStatus.published:
        return this.getPublishedRegions();
      default:
        return this.getAllRegions();
    }
  }
}
