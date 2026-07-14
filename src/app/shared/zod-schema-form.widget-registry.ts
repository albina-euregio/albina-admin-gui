import { z } from "zod/v4";

/** A field-visibility predicate: receives the sibling field values (the parsed model)
and returns whether the field should be shown. Authored per-schema (and type-checked
against that schema's inferred type) via the `withShowIf` helper. */
export type ShowIf = (model: Record<string, unknown>) => boolean;

export interface WidgetType {
  /** CSS classes applied to the field wrapper (e.g. Bootstrap grid `col-6`, background helpers). */
  class?: string;
  /** Unit label shown in brackets after the field label (e.g. `m`, `cm`). */
  unit?: string;
  /** i18n key template for enum option labels; `#` is replaced with each option value. */
  valueI18n?: `${string}#${string}`;
  /** Full i18n key overriding the derived `labelI18n` for this field (e.g. when the same field name needs a different label than in other schemas). */
  labelI18n?: string;
  /** Full i18n key overriding the derived `helpI18n` for this field. */
  helpI18n?: string;
  /** Predicate controlling whether the field is shown; build via the `withShowIf` helper. */
  showIf?: ShowIf;
  /** Phosphor icon class rendered before the field label. */
  icon?: `ph ph-${string}`;
  /** Marks the field as most-relevant (intended for a "most relevant" edit/preview view). */
  important?: boolean;
  /** Field is included in the public preview (`DisplayMode.Public`); others are hidden there. */
  public?: boolean;
  /** Input control to render; `"none"` hides the field entirely. */
  widget?:
    | "slider"
    | "checkbox"
    | "switch"
    | "yes-no"
    | "select"
    | "textarea"
    | "rich-text"
    | "rich-text-multilang"
    | "none"
    | "date"
    | "aspect"
    | "grainShape"
    | "dangerRating"
    | "avalancheProblem";
}

export const widgetRegistry = z.registry<WidgetType>();
