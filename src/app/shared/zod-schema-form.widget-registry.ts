import { z } from "zod/v4";

export type ShowIfValue = string | number | boolean;
export type ShowIf = [field: string, ...values: ShowIfValue[]];

export interface WidgetType {
  class?: string;
  unit?: string;
  valueI18n?: `${string}#${string}`;
  showIf?: ShowIf;
  widget?:
    | "slider"
    | "radio"
    | "checkbox"
    | "select"
    | "textarea"
    | "rich-text"
    | "none"
    | "date"
    | "aspect"
    | "grainShape"
    | "dangerRating"
    | "avalancheProblem";
}

export const widgetRegistry = z.registry<WidgetType>();
