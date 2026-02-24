import { z } from "zod/v4";

export const LANGUAGES = Object.freeze(["de", "en", "fr", "it", "es", "ca", "oc"] as const);

export const LanguageSchema = z.enum(LANGUAGES);

export type AlbinaLanguage = z.infer<typeof LanguageSchema>;

export const LangTextsSchema = z.record(LanguageSchema, z.string());
export type LangTexts = z.infer<typeof LangTextsSchema>;

export const TextSchema = z.object({
  languageCode: LanguageSchema.or(z.string()),
  text: z.string().nullish(),
});
export type TextModel = z.infer<typeof TextSchema>;

export const TextCodec = z.codec(TextSchema.array(), LangTextsSchema, {
  decode: (x) => toLangTexts(x),
  encode: (x) => convertLangTextsToJSON(x),
});

export function toLangTexts(models: TextModel[]): LangTexts {
  return Object.fromEntries(models.map((t) => [t.languageCode, t.text])) as LangTexts;
}

export function concatenateLangTexts(t1: LangTexts, t2: LangTexts): LangTexts {
  return Object.fromEntries(LANGUAGES.map((l) => [l, `${t1[l] || ""} ${t2[l] || ""}`.trim()])) as LangTexts;
}

export function convertLangTextsToJSON(t: LangTexts): TextModel[] {
  return Object.entries(t).map(([languageCode, text]) => ({ languageCode: languageCode as AlbinaLanguage, text }));
}

export function emptyLangTexts(): LangTexts {
  return toLangTexts(LANGUAGES.map((l) => ({ languageCode: l, text: "" })));
}
