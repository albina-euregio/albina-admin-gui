import { z } from "zod/v4";

export const LANGUAGES = Object.freeze(["de", "en", "it", "fr", "es", "ca", "oc"] as const);

export const LanguageSchema = z.enum(LANGUAGES);

export type AlbinaLanguage = z.infer<typeof LanguageSchema>;

export const LangTextsSchema = z.record(LanguageSchema, z.string().nullish());
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

const NBSP = /&nbsp;| /g;

/**
 * Replace paste-artifact non-breaking spaces in a rich-text (HTML) string with
 * ordinary spaces.
 *
 * If non-breaking spaces are the *majority* of the whitespace they are
 * almost certainly a paste artifact and should become ordinary spaces; if
 * ordinary spaces dominate the text is left untouched.
 */
export function normalizeCopiedNbsp<T extends string | null | undefined>(html: T): T {
  if (!html) return html;
  // Count whitespace on the visible text only, so tag names and attribute
  // values (e.g. `style="..."`) don't skew the ratio.
  const text = html.replace(/<[^>]*>/g, "");
  const nbspCount = (text.match(NBSP) || []).length;
  if (nbspCount === 0) return html;
  const spaceCount = (text.match(/ /g) || []).length;
  // Ordinary spaces dominate -> treat remaining nbsp as intentional, keep as-is.
  if (nbspCount <= spaceCount) return html;
  return html.replace(NBSP, " ") as T;
}

/** Apply {@link normalizeCopiedNbsp} to every language of a rich-text field. */
export function normalizeLangTextsNbsp<T extends LangTexts | null | undefined>(texts: T): T {
  if (!texts) return texts;
  return Object.fromEntries(Object.entries(texts).map(([lang, text]) => [lang, normalizeCopiedNbsp(text)])) as T;
}
