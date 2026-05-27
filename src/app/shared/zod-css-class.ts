import { z } from "zod/v4";

export function zodCssClass<T>(zodType: z.ZodType<T>, value: T, mainClass = "form-control") {
  const result = zodType.safeParse(value);
  return {
    [mainClass]: true,
    "is-valid": (Array.isArray(value) ? value.length : value) && result.success,
    "is-invalid": result.error,
  };
}
