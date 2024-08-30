import * as Enums from "../../enums/enums";

export interface PolygonObject {
  getAllRegions(): string[];
  getRegionsByStatus(status: Enums.RegionStatus): string[];
  getForenoonDangerRatingAbove(): Enums.DangerRating;
  getAfternoonDangerRatingAbove(): Enums.DangerRating;
  getForenoonDangerRatingBelow(): Enums.DangerRating;
  getAfternoonDangerRatingBelow(): Enums.DangerRating;
}
