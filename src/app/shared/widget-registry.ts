import { z } from "zod/v4";

export const widgetRegistry = z.registry<{ widget: string }>();
