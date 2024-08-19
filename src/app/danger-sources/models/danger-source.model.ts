import { RegionStatus, DangerRating } from "app/enums/enums";
import { PolygonObject } from "./polygon-object.model";

export class DangerSourceModel implements PolygonObject {
  id: string;
  creationDate: Date;
  title: string;
  description: string;

  static createFromJson(json) {
    const dangerSource = new DangerSourceModel();
    dangerSource.id = json.id;
    dangerSource.creationDate = json.creationDate;
    dangerSource.title = json.title;
    dangerSource.description = json.description;

    return dangerSource;
  }

  constructor(dangerSource?: DangerSourceModel) {
    if (dangerSource) {
      this.creationDate = dangerSource.creationDate;
      this.title = dangerSource.title;
      this.description = dangerSource.description;
    } else {
      this.creationDate = new Date();
      this.title = "";
      this.description = "";
    }
  }

  getAllRegions(): string[] {
    throw new Error("Method not implemented.");
  }
  getRegionsByStatus(status: RegionStatus): string[] {
    return this.getAllRegions();
  }
  getForenoonDangerRatingAbove(): DangerRating {
    return DangerRating.missing;
  }
  getAfternoonDangerRatingAbove(): DangerRating {
    return DangerRating.missing;
  }
  getForenoonDangerRatingBelow(): DangerRating {
    return DangerRating.missing;
  }
  getAfternoonDangerRatingBelow(): DangerRating {
    return DangerRating.missing;
  }
}
