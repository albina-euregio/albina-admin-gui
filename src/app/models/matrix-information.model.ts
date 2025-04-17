import * as Enums from "../enums/enums";
import { z } from "zod";

export const MatrixInformationSchema = z
  .object({
    dangerRating: z.enum(Enums.DangerRating),
    dangerRatingModificator: z.enum(Enums.DangerRatingModificator),
    avalancheSize: z.enum(Enums.AvalancheSize),
    snowpackStability: z.enum(Enums.SnowpackStability),
    frequency: z.enum(Enums.Frequency),
    avalancheSizeValue: z.number(),
    snowpackStabilityValue: z.number(),
    frequencyValue: z.number(),
  })
  .partial();

export type MatrixInformationModel = z.infer<typeof MatrixInformationSchema>;
