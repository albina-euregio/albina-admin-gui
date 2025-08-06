import * as Enums from "../enums/enums";
import { RegionConfigurationSchema } from "./region-configuration.model";
import { z } from "zod/v4";

export const AuthorSchema = z.object({
  apiUrl: z.string().nullish(),
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullish(),
  organization: z.string().nullish(),
  roles: z
    .enum(Enums.UserRole)
    .array()
    .default(() => []),
  image: z.string().nullish(),
  regions: RegionConfigurationSchema.array().nullish(),
  languageCode: z.string().nullish(),
});

export type AuthorModel = z.infer<typeof AuthorSchema>;
