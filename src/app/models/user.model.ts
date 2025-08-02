import * as Enums from "../enums/enums";
import { z } from "zod/v4";

export const UserSchema = z.object({
  name: z.string(),
  email: z.string(),
  organization: z.string().nullish(),
  image: z.string().nullish(),
  password: z.string().nullish(),
  roles: z
    .enum(Enums.UserRole)
    .array()
    .default(() => []),
  regions: z
    .string()
    .array()
    .default(() => []),
  languageCode: z.string().nullish(),
});

export type UserModel = z.infer<typeof UserSchema>;
