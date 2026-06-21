import type { QfaItem } from "./qfa.service";

export interface coordinates {
  lat: number;
  lng: number;
}

export interface metadata {
  location: string;
  coords: coordinates;
  height: number;
  orog: number;
  date: Date;
  timezone: string;
  model: string;
  nDays: number;
  dates?: Date[];
}

export type parameters = Record<string, any[]>;

export class QfaFile {
  public metadata = {} as metadata;
  public parameters = {} as parameters;

  constructor(public readonly file: QfaItem) {}

  get coordinates() {
    return this.metadata.coords;
  }

  get height(): number {
    return this.metadata.height;
  }

  get date(): string {
    const date = new Intl.DateTimeFormat("de", {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
      timeZoneName: "short",
    });
    const stringDate = date.format(this.metadata.date).replace(/\./, "").replace(" um", ",");
    return stringDate;
  }

  get paramDates(): string[] {
    const intlDates = this.metadata.dates.map((date) =>
      new Intl.DateTimeFormat("de", {
        weekday: "short",
        day: "2-digit",
        month: "long",
        timeZone: "UTC",
      }).format(date),
    );

    const prettyDates = intlDates.map((date) => date.replace(/\./, ""));

    return prettyDates;
  }

  get parameterKeys() {
    return Object.keys(this.parameters);
  }

  private parseMetaData = (plainText: string): metadata => {
    const plainMetadata = plainText.split(
      "=======================================================================================",
    )[0];
    const data = plainMetadata
      .split(/[\s]{2,}/g)
      .map((field) => field.trim())
      .filter(Boolean);

    // The header comes in two layouts that differ in how height, orog and date are spaced:
    //   v1: ["11120 OS Innsbruck", "11.35", "47.27", "579", "Orog : 1262", "AGL : Montag, 20.April 2026", "00 UTC", "ZAMG/ECMWF (0.125 Grad)", "Tage 0-2"]
    //   v2: ["11120 OS INNSBRUCK-FLUGHAFEN", "11.35", "47.26", "581 Orog : 1294.0\nAGL : Freitag, 01.Mai 2026", "00 UTC", "MODEL/ECMWF 0.1deg", "Tage 0002"]
    // In v2 the height/orog/date are collapsed into a single field (separated by single spaces/newlines).
    // Uncollapse it so both layouts share the same indices before reading the fields.
    const collapsed = data.findIndex((field) => /^\d+\s+Orog/.test(field));
    if (collapsed >= 0) {
      const [, height, orog, date] = data[collapsed].match(/^(\d+)\s+(Orog\s*:\s*[\d.]+)\s*(AGL.+)/s)!;
      data.splice(collapsed, 1, height, orog, date);
    }

    const days = plainMetadata.match(/Tage (\d\d?)-?(\d\d?)/);
    const nDays = Number(days![2]) - Number(days![1] || 0) + 1;

    return {
      location: data[0].split(/[- ]/)[2],
      coords: {
        lng: Number(data[1]),
        lat: Number(data[2]),
      },
      height: Number(data[3]),
      orog: Number(data[4].match(/[\d.]+/)),
      date: this.parseDate(data[5]),
      timezone: data[6].split(" ")[1],
      model: data[7],
      nDays: nDays,
    };
  };

  private parseDate = (date: string): Date => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    const day = Number(date.match(/[\d]+/));
    const month = months.filter((month) => date.includes(month))[0];
    const year = Number(date.match(/[\d]{4}/));
    const parameters = new Date(Date.UTC(year, months.indexOf(month), day));
    return parameters;
  };

  private parseParameters = (plainText: string): parameters => {
    let data = plainText.split(
      "=======================================================================================",
    )[1];
    data = data.replace("=", "");
    // data = data.replace(/[\s]{2,}/g, " ");
    data = data.replace(/[-]{5,}\|/g, "");
    const allLines = data.split("\n");
    const plainDates = allLines[1].split(" |");
    this.metadata.dates = [this.parseDate(plainDates[1]), this.parseDate(plainDates[2]), this.parseDate(plainDates[3])];
    const dateStrings = this.metadata.dates.map((el) => el.toISOString().split("T")[0]);
    const lines = allLines.filter((el, i) => el !== "" && i > 3);

    const parameters = {} as parameters;
    for (const line of lines) {
      let sub = line.substring(0, line.length - 2);
      sub = sub.replace(/[\s]{24,}/g, " --- --- --- --- ");
      sub = sub.replace(/[\s]{18,}/g, " --- --- ---");
      sub = sub.replace(/[\s]{12,}/g, " --- --- ");
      sub = sub.replace(/[\s]{6,}/g, " --- ");
      sub = sub.replace(/[\s]+/g, " ");
      // console.log(sub);
      const cols = sub.split(" | ");
      // console.log(cols);

      const partial = [];
      for (const strKey of Object.keys(dateStrings)) {
        // console.log(key, value)
        const key = parseInt(strKey) + 1;
        // console.log(key);
        partial.push({
          "00": cols[key].split(" ")[0],
          "06": cols[key].split(" ")[1],
          "12": cols[key].split(" ")[2],
          "18": cols[key].split(" ")[3],
        });
      }
      const parameterName = cols[0].split(" ---")[0];
      parameters[parameterName] = partial;
    }

    return parameters;
  };

  public parseText = (plainText: string) => {
    this.metadata = this.parseMetaData(plainText);
    this.parameters = this.parseParameters(plainText);
  };
}
