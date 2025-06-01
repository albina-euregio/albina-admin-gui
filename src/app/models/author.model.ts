import * as Enums from "../enums/enums";
import { RegionConfigurationSchema } from "./region-configuration.model";
import { z } from "zod/v4";

export const AuthorSchema = z.object({
  apiUrl: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  roles: z
    .enum(Enums.UserRole)
    .array()
    .default(() => []),
  image: z.string().optional(),
  regions: RegionConfigurationSchema.array().optional(),
  languageCode: z.string().optional(),
});

export type AuthorModel = z.infer<typeof AuthorSchema>;
