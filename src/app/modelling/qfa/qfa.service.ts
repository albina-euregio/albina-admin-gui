import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { LatLngExpression } from "leaflet";
import { firstValueFrom, map } from "rxjs";
import { z } from "zod";

import { GetDustParamService } from "./dust.service";
import { ParamService } from "./param.service";
import { QfaFile } from "./qfa-file.model";
import * as types from "./qfa-types";

export const CaddyListingItemSchema = z.object({
  name: z.string(),
  size: z.number(),
  url: z.string(),
  mod_time: z.coerce.date(),
  mode: z.number(),
  is_dir: z.boolean(),
  is_symlink: z.boolean(),
});

export type CaddyListingItem = z.infer<typeof CaddyListingItemSchema>;

const QfaItemSchema = z.object({
  date: z.string(),
  hours: z.string(),
  minutes: z.string(),
  startDay: z.string(),
  endDay: z.string(),
  city: z.string(),
  qfa: z.string(),
  filename: z.string(),
});

export type QfaItem = z.infer<typeof QfaItemSchema>;

export const QfaFilenameSchema = z.object({
  filename: z.string(),
});

export type QfaFilename = z.infer<typeof QfaFilenameSchema>;

export const QfaResultSchema = z.object({
  data: z.custom<types.data>(),
  date: z.string(),
  dates: z.array(z.string()),
  parameters: z.array(z.string()),
  file: QfaFilenameSchema,
});

export type QfaResult = z.infer<typeof QfaResultSchema>;

type City = "bozen" | "innsbruck" | "lienz";

@Injectable()
export class QfaService {
  dustParamService = inject(GetDustParamService);
  paramService = inject(ParamService);
  private http = inject(HttpClient);

  baseUrl = "https://static.avalanche.report/zamg_qfa/";
  dustParams = {};
  coords = {
    bozen: {
      lng: 11.33,
      lat: 46.47,
    },
    innsbruck: {
      lng: 11.35,
      lat: 47.27,
    },
    lienz: {
      lng: 12.8,
      lat: 46.83,
    },
  } satisfies Record<City, LatLngExpression>;
  files = {
    innsbruck: [] as QfaItem[],
    bozen: [] as QfaItem[],
    lienz: [] as QfaItem[],
  } satisfies Record<City, QfaItem[]>;
  cities = Object.keys(this.files) as City[];

  async loadDustParams() {
    this.dustParams = await this.dustParamService.parseDustParams();
  }

  private getHTMLResponse() {
    // Caddy serves directory index as JSON for Accept=application/json
    // https://github.com/caddyserver/caddy/blob/e8ad9b32c9730ddb162b6fb1443fc0b36fcef7dc/modules/caddyhttp/fileserver/browse.go#L105-L109
    return this.http.get(this.baseUrl).pipe(map((r) => CaddyListingItemSchema.array().parse(r)));
  }

  async getFilenames(baseUrl: string, city: string) {
    this.baseUrl = baseUrl;
    const response = await firstValueFrom(this.getHTMLResponse());
    const files = response.reverse();
    // console.log(files);
    const filteredFiles = files.filter((file) => file.name.includes(city));
    return filteredFiles;
  }

  parseFilename(filename: string): QfaItem {
    const parts = filename.split("_");
    return QfaItemSchema.parse({
      date: parts[0],
      hours: parts[1].substring(0, 2),
      minutes: parts[1].substring(2, 4),
      startDay: parts[4].substring(0, 2),
      endDay: parts[4].substring(2, 4),
      city: parts[3],
      qfa: parts[2],
      filename: filename,
    });
  }

  stringifyFile(file: QfaItem): string {
    return `${file.date}_${file.hours}${file.minutes}_${file.qfa}_${file.city}_${file.startDay}${file.endDay}.txt`;
  }

  changeDay(file: QfaItem, startDay: string, endDay: string): QfaItem {
    file.startDay = startDay;
    file.endDay = endDay;
    file.filename = this.stringifyFile(file);
    return file;
  }

  getCityName(files: QfaItem[]): string | void {
    if (files.length) {
      const name = files[0].city.charAt(0).toUpperCase() + files[0].city.slice(1);
      return name;
    }
  }

  async getFiles() {
    for (const city of this.cities) {
      const filenames = await this.getFilenames(this.baseUrl, city);
      const parsedFiles = [];
      for (const file of filenames) {
        const parsedFile = this.parseFilename(file.name);
        parsedFiles.push(parsedFile);
      }
      this.files[city] = parsedFiles.filter((el) => el.startDay === "00");
    }

    return this.files;
  }

  async getRun(file: QfaFilename, startDay: number, first: boolean): Promise<QfaResult> {
    const days = `0${startDay}0${startDay + 2}`;
    const filename = file.filename.replace(/\d{4}\.txt/g, `${days}.txt`);
    const run = new QfaFile();
    const plainText = await firstValueFrom(
      this.http.get(`${this.baseUrl}/${filename}`, { responseType: "text", observe: "body" }),
    );
    run.parseText(plainText);

    const parameters = Object.keys(run.data.parameters);

    if (first) {
      const city = run.data.metadata.location.split(" ")[2].toLowerCase();
      if (this.dustParams) {
        const dust = this.dustParams[city][startDay / 3];
        run.data.parameters["DUST"] = dust;
        parameters.unshift("DUST");
      }
    }

    return QfaResultSchema.parse({
      data: run.data,
      date: run.date,
      dates: run.paramDates,
      parameters: parameters,
      file: file,
    });
  }
}
