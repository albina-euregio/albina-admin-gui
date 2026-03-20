import { z } from "zod/v4";

import * as Enums from "../enums/enums";

export const ServerSchema = z.object({
  apiUrl: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().nullish(),
  name: z.string(),
  email: z.string().nullish(),
  roles: z.enum(Enums.UserRole).array().nullish(),
  regions: z.string().array().nullish(),
});

export type ServerModel = z.infer<typeof ServerSchema>;
