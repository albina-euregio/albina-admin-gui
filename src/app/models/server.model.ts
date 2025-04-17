import { z } from "zod";

export const ServerSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  name: z.string(),
  email: z.string().optional(),
  roles: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  apiUrl: z.string(),
});

export type ServerModel = z.infer<typeof ServerSchema>;
