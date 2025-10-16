import { z } from "zod/v4";

export function zodCssClass<T>(zodType: z.ZodType<T>, value: T) {
  const result = zodType.safeParse(value);
  return {
    "form-control": true,
    "is-valid": (Array.isArray(value) ? value.length : value) && result.success,
    "is-invalid": result.error,
  };
}
