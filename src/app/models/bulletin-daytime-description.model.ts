import * as Enums from "../enums/enums";
import { AvalancheProblemModel, AvalancheProblemSchema } from "./avalanche-problem.model";
import { z } from "zod/v4";
import { ZSchema } from "../danger-sources/models/zod-util";

export const BulletinDaytimeDescriptionSchema = z.object({
  dangerRatingAbove: z.enum(Enums.DangerRating).nullish().default(Enums.DangerRating.low),
  dangerRatingBelow: z.enum(Enums.DangerRating).nullish().default(Enums.DangerRating.low),
  hasElevationDependency: z.boolean().default(false),
  elevation: z.number().nullish(),
  treeline: z.boolean().default(false),
  avalancheProblem1: AvalancheProblemSchema.nullish().transform((v) =>
    v ? AvalancheProblemModel.parse(v) : undefined,
  ),
  avalancheProblem2: AvalancheProblemSchema.nullish().transform((v) =>
    v ? AvalancheProblemModel.parse(v) : undefined,
  ),
  avalancheProblem3: AvalancheProblemSchema.nullish().transform((v) =>
    v ? AvalancheProblemModel.parse(v) : undefined,
  ),
  avalancheProblem4: AvalancheProblemSchema.nullish().transform((v) =>
    v ? AvalancheProblemModel.parse(v) : undefined,
  ),
  avalancheProblem5: AvalancheProblemSchema.nullish().transform((v) =>
    v ? AvalancheProblemModel.parse(v) : undefined,
  ),
});

export class BulletinDaytimeDescriptionModel extends ZSchema(BulletinDaytimeDescriptionSchema) {
  public isAvalancheProblemOpen = Array(5).fill(false);

  getSecondDangerRating(up: boolean): Enums.DangerRating {
    const dangerRatings: Enums.DangerRating[] = [
      this.getDangerRating(this.avalancheProblem2, up),
      this.getDangerRating(this.avalancheProblem3, up),
      this.getDangerRating(this.avalancheProblem4, up),
      this.getDangerRating(this.avalancheProblem5, up),
    ];
    return dangerRatings
      .filter((r) => !!r)
      .reduce((r1, r2) => (Enums.WarnLevel[r1] > Enums.WarnLevel[r2] ? r1 : r2), Enums.DangerRating.low);
  }

  getDangerRating(avalancheProblem: AvalancheProblemModel, up: boolean): Enums.DangerRating {
    let boundaryAvalancheProblem;
    let boundaryBulletin;

    if (avalancheProblem) {
      if (up) {
        if (avalancheProblem.treelineLow) {
          boundaryAvalancheProblem = 2000;
        } else {
          boundaryAvalancheProblem = avalancheProblem.elevationLow;
        }
      } else {
        if (avalancheProblem.treelineHigh) {
          boundaryAvalancheProblem = 1800;
        } else {
          boundaryAvalancheProblem = avalancheProblem.elevationHigh;
        }
      }

      if (up) {
        if (this.treeline) {
          boundaryBulletin = 2000;
        } else {
          boundaryBulletin = this.elevation;
        }
        if (boundaryAvalancheProblem === undefined || boundaryAvalancheProblem < boundaryBulletin) {
          return avalancheProblem.getDangerRating();
        }
      } else {
        if (this.treeline) {
          boundaryBulletin = 1800;
        } else {
          boundaryBulletin = this.elevation;
        }
        if (
          boundaryAvalancheProblem === undefined ||
          boundaryAvalancheProblem === null ||
          boundaryAvalancheProblem > boundaryBulletin
        ) {
          return avalancheProblem.getDangerRating();
        }
      }
    }
  }

  updateDangerRating() {
    if (this.avalancheProblem1) {
      // ap.1
      if (this.avalancheProblem1.elevationHigh > 0 || this.avalancheProblem1.treelineHigh) {
        if (this.avalancheProblem1.elevationLow > 0 || this.avalancheProblem1.treelineLow) {
          // band
          if (
            this.avalancheProblem1.dangerRatingDirection &&
            this.avalancheProblem1.dangerRatingDirection.toString() === Enums.DangerRatingDirection.down
          ) {
            if (this.avalancheProblem1.treelineHigh) {
              this.treeline = true;
              this.elevation = undefined;
            } else {
              this.treeline = false;
              this.elevation = this.avalancheProblem1.elevationHigh;
            }
            this.hasElevationDependency = true;
            this.dangerRatingBelow = this.avalancheProblem1.getDangerRating();
            this.dangerRatingAbove = this.getSecondDangerRating(false);
          } else if (
            this.avalancheProblem1.dangerRatingDirection &&
            this.avalancheProblem1.dangerRatingDirection.toString() === Enums.DangerRatingDirection.up
          ) {
            if (this.avalancheProblem1.treelineLow) {
              this.treeline = true;
              this.elevation = undefined;
            } else {
              this.treeline = false;
              this.elevation = this.avalancheProblem1.elevationLow;
            }
            this.hasElevationDependency = true;
            this.dangerRatingAbove = this.avalancheProblem1.getDangerRating();
            this.dangerRatingBelow = this.getSecondDangerRating(true);
          } else {
            this.treeline = false;
            this.elevation = undefined;
            this.hasElevationDependency = false;
            this.dangerRatingAbove = this.avalancheProblem1.getDangerRating();
            this.dangerRatingBelow = this.avalancheProblem1.getDangerRating();
          }
        } else {
          // only elevation high
          if (this.avalancheProblem1.treelineHigh) {
            this.treeline = true;
            this.elevation = undefined;
          } else {
            this.treeline = false;
            this.elevation = this.avalancheProblem1.elevationHigh;
          }
          this.hasElevationDependency = true;
          this.dangerRatingBelow = this.avalancheProblem1.getDangerRating();
          this.dangerRatingAbove = this.getSecondDangerRating(false);
        }
      } else if (this.avalancheProblem1.elevationLow > 0 || this.avalancheProblem1.treelineLow) {
        // only elevation low
        if (this.avalancheProblem1.treelineLow) {
          this.treeline = true;
          this.elevation = undefined;
        } else {
          this.treeline = false;
          this.elevation = this.avalancheProblem1.elevationLow;
        }
        this.hasElevationDependency = true;
        this.dangerRatingAbove = this.avalancheProblem1.getDangerRating();
        this.dangerRatingBelow = this.getSecondDangerRating(true);
      } else {
        // no elevation
        this.treeline = false;
        this.elevation = undefined;
        this.hasElevationDependency = false;
        this.dangerRatingAbove = this.avalancheProblem1.getDangerRating();
        this.dangerRatingBelow = this.avalancheProblem1.getDangerRating();
      }
    } else {
      this.treeline = false;
      this.elevation = undefined;
      this.hasElevationDependency = false;
      this.dangerRatingAbove = Enums.DangerRating.low;
      this.dangerRatingBelow = Enums.DangerRating.low;
    }
  }
}
