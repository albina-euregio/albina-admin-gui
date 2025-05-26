import * as Enums from "../enums/enums";
import { z } from "zod";

export const ServerSchema = z.object({
  apiUrl: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  name: z.string(),
  email: z.string().optional(),
  roles: z.enum(Enums.UserRole).array().optional(),
  regions: z.string().array().optional(),
});

export type ServerModel = z.infer<typeof ServerSchema>;
