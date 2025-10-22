import { PolygonObject } from "./polygon-object.model";
import { ZSchema } from "./zod-util";
import { RegionStatus, DangerRating } from "app/enums/enums";
import { z } from "zod/v4";

export const DangerSourceSchema = z.object({
  id: z.string().nullish(),
  ownerRegion: z.string().nullish(),
  creationDate: z.coerce.date().nullish(),
  title: z.string().nullish(),
  description: z.string().nullish(),
});

export class DangerSourceModel extends ZSchema(DangerSourceSchema) implements PolygonObject {
  getAllRegions(): string[] {
    throw new Error("Method not implemented.");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
