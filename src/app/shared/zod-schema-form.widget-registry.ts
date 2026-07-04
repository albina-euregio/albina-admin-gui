import { z } from "zod/v4";

export type ShowIfValue = string | number | boolean;

/** Build via the `withShowIf` / `not` helpers rather than by hand.
Examples: 
withShowIf(GroupInformationSchema, {
  // single condition — show if trigger == one of the values
  typeOfControlledTerrain: ["incidentTerrainType", "ControlledTerrainOpen", "ControlledTerrainClosed"],

  // negated — show if trigger != the value
  incidentActivity: not("typeOfControlledTerrain", "IndoorInsideBuilding"),

  // AND — show only if every condition holds (mix plain + not() freely)
  vehicleType: [
    ["incidentActivity", "InsideVehicle"],
    not("typeOfControlledTerrain", "IndoorInsideBuilding"),
  ],
});
**/
export interface ShowIf {
  field: string;
  values: ShowIfValue[];
  negate?: boolean;
}

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
  /** Conditions controlling whether the field is shown; build via the `withShowIf` / `not` helpers. */
  showIf?: ShowIf[];
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
