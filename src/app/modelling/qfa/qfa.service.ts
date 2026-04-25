import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { LatLngExpression } from "leaflet";
import { firstValueFrom, map } from "rxjs";
import { z } from "zod";

import { GetDustParamService } from "./dust.service";
import { ParamService } from "./param.service";
import { QfaFile } from "./qfa-file.model";

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

export type City = "bozen" | "innsbruck" | "lienz";

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
  allFiles = {
    innsbruck: [] as QfaItem[],
    bozen: [] as QfaItem[],
    lienz: [] as QfaItem[],
  } satisfies Record<City, QfaItem[]>;
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

  async getFilenames(baseUrl: string, city: string): Promise<QfaItem[]> {
    this.baseUrl = baseUrl;
    const response = await firstValueFrom(this.getHTMLResponse());
    const files = response.reverse();
    // console.log(files);
    const filteredFiles = files.filter((file) => file.name.includes(city));
    return filteredFiles.map((file) => this.parseFilename(file.name));
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
      const parsedFiles = await this.getFilenames(this.baseUrl, city);
      this.allFiles[city] = parsedFiles;
      this.files[city] = parsedFiles.filter((el) => el.startDay === "00");
    }

    return this.files;
  }

  async getRun(file: QfaItem, startDay: number, first: boolean): Promise<QfaFile> {
    const file0 = this.allFiles[file.city as City].find(
      (f) =>
        f.date === file.date &&
        f.qfa === file.qfa &&
        f.city === file.city &&
        f.startDay === startDay.toString().padStart(2, "0"),
    );
    const run = new QfaFile(file0);
    const plainText = await firstValueFrom(
      this.http.get(`${this.baseUrl}/${file0.filename}`, { responseType: "text", observe: "body" }),
    );
    run.parseText(plainText);

    if (first) {
      const city = run.metadata.location.split(" ")[2].toLowerCase();
      if (this.dustParams) {
        const dust = this.dustParams[city][startDay / 3];
        run.parameters["DUST"] = dust;
      }
    }

    return run;
  }
}
