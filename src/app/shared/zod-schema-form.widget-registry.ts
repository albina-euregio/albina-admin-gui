import { z } from "zod/v4";

export interface WidgetType {
  class?: string;
  unit?: string;
  valueI18n?: `${string}#${string}`;
  showIf?: string[];
  widget?:
    | "slider"
    | "radio"
    | "checkbox"
    | "select"
    | "textarea"
    | "rich-text"
    | "none"
    | "aspect"
    | "grainShape"
    | "dangerRating"
    | "avalancheProblem";
}

export const widgetRegistry = z.registry<WidgetType>();
