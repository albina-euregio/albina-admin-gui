export const LANGUAGES = Object.freeze(["de", "en", "fr", "it", "es", "ca", "oc"] as const);

export type LangTexts = Record<(typeof LANGUAGES)[number], string>;

export class TextModel {
  public languageCode: string;
  public text: string;

  static createFromJson(json) {
    const text = new TextModel();

    text.setLanguageCode(json.languageCode);
    text.setText(json.text);

    return text;
  }

  constructor() {
    this.languageCode = undefined;
    this.text = undefined;
  }

  getLanguageCode(): string {
    return this.languageCode;
  }

  setLanguageCode(languageCode: string) {
    this.languageCode = languageCode;
  }

  getText(): string {
    return this.text;
  }

  setText(text: string) {
    this.text = text;
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
    return Object.fromEntries(models.map((t) => [t.getLanguageCode(), t.getText()])) as LangTexts;
  }
}

export function concatenateLangTexts(t1: LangTexts, t2: LangTexts): LangTexts {
  return Object.fromEntries(LANGUAGES.map((l) => [l, `${t1[l] || ""} ${t2[l] || ""}`.trim()])) as LangTexts;
}

export function convertLangTextsToJSON(t: LangTexts): { languageCode: string; text: string }[] {
  return Object.entries(t).map(([languageCode, text]) => ({ languageCode, text }));
}
