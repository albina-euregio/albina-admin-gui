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
  showIf?: ShowIf[];
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
