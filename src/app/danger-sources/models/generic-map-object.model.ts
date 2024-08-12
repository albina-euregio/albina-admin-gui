import * as Enums from "../../enums/enums";

export interface GenericMapObject {
  getAllRegions();
  getRegionsByStatus(status: Enums.RegionStatus);
  getForenoonDangerRatingAbove();
  getAfternoonDangerRatingAbove();
  getForenoonDangerRatingBelow();
  getAfternoonDangerRatingBelow();
}
