import type { TranslateService } from "@ngx-translate/core";

/** The dashboard text of a key in the awsome block of the translations, the key itself when it has none. */
export function awsomeText(translate: TranslateService, key: string, params?: Record<string, unknown>): string {
  const text = translate.instant(`awsome.${key}`, params);
  return typeof text === "string" && !text.startsWith("awsome.") ? text : key;
}
