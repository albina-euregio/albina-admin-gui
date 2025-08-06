import * as Enums from "../enums/enums";
import { z } from "zod/v4";

export const MatrixInformationSchema = z
  .object({
    dangerRating: z.enum(Enums.DangerRating).nullish(),
    dangerRatingModificator: z.enum(Enums.DangerRatingModificator).nullish(),
    avalancheSize: z.enum(Enums.AvalancheSize).nullish(),
    snowpackStability: z.enum(Enums.SnowpackStability).nullish(),
    frequency: z.enum(Enums.Frequency).nullish(),
    avalancheSizeValue: z.number(),
    snowpackStabilityValue: z.number(),
    frequencyValue: z.number(),
  })
  .partial();

export type MatrixInformationModel = z.infer<typeof MatrixInformationSchema>;
