import * as Enums from "../enums/enums";
import { z } from "zod/v4";

export const UserSchema = z.object({
  name: z.string(),
  email: z.string(),
  organization: z.string().optional(),
  image: z.string().optional(),
  password: z.string().optional(),
  roles: z
    .enum(Enums.UserRole)
    .array()
    .default(() => []),
  regions: z
    .string()
    .array()
    .default(() => []),
  languageCode: z.string().optional(),
});

export type UserModel = z.infer<typeof UserSchema>;
