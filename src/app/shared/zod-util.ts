import type { z } from "zod/v4";

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

export function isFieldValid(schema: z.ZodType, val: unknown): boolean {
  return hasValue(val) && schema.safeParse(val).success;
}

export function hasValue(val: unknown): boolean {
  return val !== undefined && val !== null && val !== "" && (!Array.isArray(val) || val.length > 0);
}
