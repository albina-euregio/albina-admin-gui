import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import * as types from "./qfa-types";
import { QfaFile } from "./qfa-file.model";
import { GetFilenamesService } from "./filenames.service";
import { GetDustParamService } from "./dust.service";
import { ParamService } from "./param.service";

export interface QfaFilename {
  filename: string;
}

export interface QfaResult {
  data: types.data;
  date: string;
  dates: string[];
  parameters: string[];
  file: QfaFilename;
}

@Injectable()
export class QfaService {
  filenamesService = inject(GetFilenamesService);
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
  };
  files = {
    innsbruck: [],
    bozen: [],
    lienz: [],
  };
  cities = Object.keys(this.files);

  async loadDustParams() {
    this.dustParams = await this.dustParamService.parseDustParams();
  }

  async getFiles() {
    for (const city of this.cities) {
      const filenames = await this.filenamesService.getFilenames(this.baseUrl, city);
      const parsedFiles = [];
      for (const file of filenames) {
        const parsedFile = this.filenamesService.parseFilename(file.name);
        parsedFiles.push(parsedFile);
      }
      this.files[city] = parsedFiles.filter((el) => el.startDay === "00");
    }

    return this.files;
  }

  async getRun(file: QfaFilename, startDay: number, first: boolean): Promise<QfaResult> {
    const days = `0${startDay}0${startDay + 2}`;
    const filename = file.filename.replace(/\d{4}\.txt/g, `${days}.txt`);
    const run = new QfaFile(this.http);
    await run.loadFromURL(filename);

    const parameters = Object.keys(run.data.parameters);

    if (first) {
      const city = run.data.metadata.location.split(" ")[2].toLowerCase();
      if (this.dustParams) {
        const dust = this.dustParams[city][startDay / 3];
        run.data.parameters["DUST"] = dust;
        parameters.unshift("DUST");
      }
    }

    const qfa = {
      data: run.data,
      date: run.date,
      dates: run.paramDates,
      parameters: parameters,
      file: file,
    };

    return qfa;
  }
}
