import * as Enums from "../enums/enums";
import { MatrixInformationSchema } from "./matrix-information.model";
import { z } from "zod/v4";
import { ZSchema } from "../danger-sources/models/zod-util";

export const AvalancheProblemSchema = z.object({
  avalancheProblem: z.enum(Enums.AvalancheProblem).nullish(),
  avalancheType: z.enum(Enums.AvalancheType).nullish(),
  aspects: z
    .enum(Enums.Aspect)
    .array()
    .default(() => []),
  elevationHigh: z.number().nullish(),
  treelineHigh: z.boolean().default(false),
  elevationLow: z.number().nullish(),
  treelineLow: z.boolean().default(false),
  dangerRatingDirection: z.enum(Enums.DangerRatingDirection).nullish(),
  eawsMatrixInformation: MatrixInformationSchema.default(() => MatrixInformationSchema.parse({})),
});

export class AvalancheProblemModel extends ZSchema(AvalancheProblemSchema) {
  setAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    this.avalancheProblem = avalancheProblem;
    this.avalancheType = undefined;
    switch (this.avalancheProblem) {
      case "wind_slab":
      case "persistent_weak_layers":
        this.avalancheType = Enums.AvalancheType.slab;
        break;
      case "gliding_snow":
        this.avalancheType = Enums.AvalancheType.glide;
        break;
      default:
        break;
    }
  }

  get matrixInformation() {
    return this.eawsMatrixInformation;
  }

  set matrixInformation(v) {
    this.eawsMatrixInformation = v;
  }

  getDangerRating() {
    return this.matrixInformation.dangerRating;
  }

  hasElevationHigh() {
    return this.treelineHigh || this.elevationHigh;
  }

  hasElevationLow() {
    return this.treelineLow || this.elevationLow;
  }
}
