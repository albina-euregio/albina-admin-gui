import { z } from "zod/v4";

export const WidgetSchema = z
  .object({
    showIf: z.string().array(),
    widget: z.enum(["slider", "radio", "checkbox"]),
  })
  .partial();
type Widget = z.infer<typeof WidgetSchema>;
export const widgetRegistry = z.registry<Widget>();
