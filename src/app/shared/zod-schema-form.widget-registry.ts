import { z } from "zod/v4";

export const widgetRegistry = z.registry<{
  class?: string;
  unit?: string;
  valueI18n?: `${string}#${string}`;
  showIf?: string[];
  widget?: "slider" | "radio" | "checkbox" | "select" | "textarea" | "rich-text" | "none" | "aspect";
}>();
