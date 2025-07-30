export const LANGUAGES = Object.freeze(["de", "en", "fr", "it", "es", "ca", "oc"] as const);

export type LangTexts = Record<(typeof LANGUAGES)[number], string>;

export interface TextModel {
  languageCode: string;
  text: string;
}

export function toLangTexts(models: TextModel[]): LangTexts {
  return Object.fromEntries(models.map((t) => [t.languageCode, t.text])) as LangTexts;
}

export function concatenateLangTexts(t1: LangTexts, t2: LangTexts): LangTexts {
  return Object.fromEntries(LANGUAGES.map((l) => [l, `${t1[l] || ""} ${t2[l] || ""}`.trim()])) as LangTexts;
}

export function convertLangTextsToJSON(t: LangTexts): { languageCode: string; text: string }[] {
  return Object.entries(t).map(([languageCode, text]) => ({ languageCode, text }));
}

export function emptyLangTexts(): LangTexts {
  return toLangTexts(LANGUAGES.map((l) => ({ languageCode: l, text: "" })));
}
