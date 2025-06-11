import * as Enums from "../enums/enums";
import { z } from "zod/v4";

export const MatrixInformationSchema = z
  .object({
    dangerRating: z.enum(Enums.DangerRating).nullable(),
    dangerRatingModificator: z.enum(Enums.DangerRatingModificator).nullable(),
    avalancheSize: z.enum(Enums.AvalancheSize).nullable(),
    snowpackStability: z.enum(Enums.SnowpackStability).nullable(),
    frequency: z.enum(Enums.Frequency).nullable(),
    avalancheSizeValue: z.number(),
    snowpackStabilityValue: z.number(),
    frequencyValue: z.number(),
  })
  .partial();

export type MatrixInformationModel = z.infer<typeof MatrixInformationSchema>;
