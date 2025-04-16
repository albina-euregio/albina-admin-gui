export const LANGUAGES = Object.freeze(["de", "en", "fr", "it", "es", "ca", "oc"] as const);

export type LangTexts = Record<(typeof LANGUAGES)[number], string>;

export interface TextModelAsJSON {
  languageCode: string;
  text: string;
}

export class TextModel implements TextModelAsJSON {
  public languageCode: string;
  public text: string;

  static createFromJson(json) {
    const text = new TextModel();
    text.languageCode = json.languageCode;
    text.text = json.text;
    return text;
  }

  constructor() {
    this.languageCode = undefined;
    this.text = undefined;
  }

  toJson() {
    const json = Object();

    if (this.languageCode) {
      json["languageCode"] = this.languageCode;
    }
    if (this.text) {
      json["text"] = this.text;
    }

    return json;
  }

  static toLangTexts(models: TextModel[]): LangTexts {
    return Object.fromEntries(models.map((t) => [t.languageCode, t.text])) as LangTexts;
  }
}

export function concatenateLangTexts(t1: LangTexts, t2: LangTexts): LangTexts {
  return Object.fromEntries(LANGUAGES.map((l) => [l, `${t1[l] || ""} ${t2[l] || ""}`.trim()])) as LangTexts;
}

export function convertLangTextsToJSON(t: LangTexts): { languageCode: string; text: string }[] {
  return Object.entries(t).map(([languageCode, text]) => ({ languageCode, text }));
}
