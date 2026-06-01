import { z } from "zod/v4";

export const WidgetSchema = z
  .object({
    showIf: z.string().array(),
    widget: z.string(),
  })
  .partial();
type Widget = z.infer<typeof WidgetSchema>;
export const widgetRegistry = z.registry<Widget>();
