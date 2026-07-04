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
  class?: string;
  unit?: string;
  valueI18n?: `${string}#${string}`;
  /** Full i18n key overriding the derived `labelI18n` for this field (e.g. when the same field name needs a different label than in other schemas). */
  labelI18n?: string;
  /** Full i18n key overriding the derived `helpI18n` for this field. */
  helpI18n?: string;
  showIf?: ShowIf[];
  icon?: `ph ph-${string}`;
  important?: boolean;
  public?: boolean;
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
