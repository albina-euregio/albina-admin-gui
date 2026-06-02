import { z } from "zod/v4";

export function zodCssClass<T>(zodType: z.ZodType<T>, value: T, mainClass = "form-control") {
  const result = zodType.safeParse(value);
  const entered = value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0);
  return {
    [mainClass]: true,
    "is-valid": entered && result.success,
    "is-invalid": entered && !!result.error,
  };
}
