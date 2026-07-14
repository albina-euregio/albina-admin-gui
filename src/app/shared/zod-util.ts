import { z } from "zod/v4";

import { widgetRegistry } from "./zod-schema-form.widget-registry";
import type { ShowIf } from "./zod-schema-form.widget-registry";

// https://github.com/colinhacks/zod/issues/38#issuecomment-1938821172
export interface ZSchemaInterface<T extends z.ZodRawShape, TObject = z.ZodObject<T>> {
  new (data: z.infer<z.ZodObject<T>>): z.infer<z.ZodObject<T>>;

  schema: TObject;

  parse<TFinal extends new (data: z.infer<z.ZodObject<T>>) => InstanceType<TFinal>>(
    this: TFinal,
    value: unknown,
  ): InstanceType<TFinal>;
}

export function ZSchema<T extends z.ZodRawShape, Type = ZSchemaInterface<T> & z.infer<z.ZodObject<T>>>(
  schema: z.ZodObject<T>,
): Type {
  const res = class {
    static schema = schema;
    constructor(value: z.infer<z.ZodObject<T>>) {
      Object.assign(this, schema.parse(value));
    }
    static parse<T extends typeof res>(this: T, value: unknown): any {
      return new this(schema.parse(value)) as any;
    }
  };
  return res as typeof res & any;
}

export function zEnumValues<T extends z.util.EnumLike>(
  x:
    | z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodEnum<T>>>>
    | z.ZodOptional<z.ZodNullable<z.ZodEnum<T>>>
    | z.ZodArray<z.ZodEnum<T>>
    | z.ZodEnum<T>,
): T[keyof T][] {
  switch (x.type) {
    case "optional":
      return zEnumValues(x.unwrap().unwrap());
    case "array":
      return zEnumValues(x.unwrap());
    case "enum":
      return x.options;
  }
}

// Recursively strips optional/nullable/default wrappers at the type level so the
// return type matches what the runtime loop produces (e.g. `z.boolean().default()`
// → `z.ZodBoolean`). Distributes over unions via the naked type parameter.
export type Unwrap<T> = T extends z.ZodOptional<infer Inner> | z.ZodNullable<infer Inner> | z.ZodDefault<infer Inner>
  ? Unwrap<Inner>
  : T;

export function unwrap<T extends z.ZodType>(t: T): Unwrap<T> {
  while (isFieldOptional(t)) {
    t = t.unwrap() as T;
  }
  return t as unknown as Unwrap<T>;
}

export function isFieldOptional(zodType: z.ZodType): zodType is z.ZodOptional | z.ZodNullable | z.ZodDefault {
  return zodType.type === "optional" || zodType.type === "nullable" || zodType.type === "default";
}

// Attaches showIf visibility predicates after the schema definition so the rules can
// reference sibling fields with full type-checking: each predicate receives the parsed
// model (typed from the schema) and returns a truthy value when the field should be shown.
export function withShowIf<T extends z.ZodObject>(
  schema: T,
  rules: { [F in keyof z.output<T>]?: (model: z.output<T>) => unknown },
): T {
  for (const field in rules) {
    const inner = unwrap(schema.shape[field]);
    // Predicates are authored against the schema's `z.output<T>`; the registry stores the
    // structural `ShowIf`, so coerce the truthy result and re-type the model on the way in.
    const predicate = rules[field]!;
    const showIf: ShowIf = (model) => Boolean(predicate(model as z.output<T>));
    widgetRegistry.add(inner, { ...widgetRegistry.get(inner), showIf });
  }
  return schema;
}

// An enum that additionally allows free-form text via an "Other" option in the UI.
// Modelled as a union so the schema form can render the enum buttons plus a custom
// text input (see EnumOtherComponent / isEnumWithOther).
export function enumWithOther<T extends z.ZodEnum>(enumType: T) {
  return z.union([enumType, z.string().min(1)]);
}

// Detects a `z.union([z.enum([...]), z.string()])` field: an enum that additionally
// allows free-form text via an "Other" option (see model's `enumWithOther`).
export function isEnumWithOther(zodType: z.ZodType): zodType is z.ZodUnion {
  if (zodType.type !== "union") return false;
  const options = (zodType as z.ZodUnion).def.options as z.ZodType[];
  return options.some((o) => o.type === "enum") && options.some((o) => o.type === "string");
}

// Returns the enum values of an `enumWithOther` union (excluding the free-form branch).
export function enumWithOtherValues(zodType: z.ZodType): string[] {
  const options = (zodType as z.ZodUnion).def.options as z.ZodType[];
  const enumOption = options.find((o) => o.type === "enum") as z.ZodEnum | undefined;
  return enumOption ? Object.keys(enumOption.def.entries) : [];
}

export function isFieldValid(schema: z.ZodType, val: unknown): boolean {
  return hasValue(val) && schema.safeParse(val).success;
}

// Parses only the fields that are currently visible (showIf conditions satisfied).
// Hidden fields are omitted from the schema so they don't block tab completion, then
// the remaining (visible) fields are validated in one safeParse.
export function safeParseVisibleFields(schema: z.ZodObject, value: Record<string, unknown>) {
  const hidden: Record<string, true> = {};
  for (const [key, fieldType] of Object.entries(schema.shape)) {
    const showIf = widgetRegistry.get(unwrap(fieldType as z.ZodType))?.showIf;
    if (showIf && !showIf(value)) {
      hidden[key] = true;
    }
  }
  return schema.omit(hidden as Parameters<typeof schema.omit>[0]).safeParse(value);
}

export function isVisibleFieldsValid(schema: z.ZodObject, value: Record<string, unknown>): boolean {
  return safeParseVisibleFields(schema, value).success;
}

export function hasValue(val: unknown): boolean {
  return val !== undefined && val !== null && val !== "" && (!Array.isArray(val) || val.length > 0);
}
export function pickPublicFields<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.pick(
    Object.fromEntries(
      Object.entries(schema.shape)
        .filter(([, fieldType]) => widgetRegistry.get(unwrap(fieldType as z.ZodType))?.public)
        .map(([key]) => [key, true as const]),
    ) as any,
  );
}

export function zodCssClass<T>(zodType: z.ZodType<T>, value: T, mainClass = "form-control") {
  const result = zodType.safeParse(value);
  // A required (non-optional) array needs at least one element, even though zod parses `[]` as valid.
  const emptyRequiredArray = !isFieldOptional(zodType) && unwrap(zodType).type === "array" && !hasValue(value);
  return {
    [mainClass]: true,
    "is-valid": hasValue(value) && result.success,
    "is-invalid": !!result.error || emptyRequiredArray,
  };
}
