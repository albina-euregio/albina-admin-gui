import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";

enum Cities {
  INNSBRUCK = "innsbruck",
  BOZEN = "bozen",
  LIENZ = "lienz",
}

type DustParams = Partial<Record<Cities, Promise<string[]>[]>>;

@Injectable()
export class GetDustParamService {
  private http = inject(HttpClient);

  private pxOfCity = {
    bozen: {
      x: 278,
      y: 170,
    },
    innsbruck: {
      x: 275,
      y: 164,
    },
    lienz: {
      x: 285,
      y: 162,
    },
  };

  private colorToDust = {
    "rgb(255,255,255)": "-",
    "rgb(238,229,204)": "1-10",
    "rgb(233,214,170)": "10-25",
    "rgb(233,187,146)": "25-50",
    "rgb(217,172,137)": "50-100",
    "rgb(217,146,113)": "100-500",
    "rgb(202,126,113)": "500-1000",
    "rgb(202,102,80)": ">1000",
  };

  private rgbToHex = {
    "rgb(255,255,255)": "#FFFFFF",
    "rgb(238,229,204)": "#EEE5CC",
    "rgb(233,214,170)": "#E9D6AA",
    "rgb(233,187,146)": "#E9BB92",
    "rgb(217,172,137)": "#D9AC89",
    "rgb(217,146,113)": "#D99271",
    "rgb(202,126,113)": "#CA7E71",
    "rgb(202,102,80)": "#CA6650",
  };

  private readonly URL = "https://admin.avalanche.report/forecast.uoa.gr/0day/DUST/GRID1/zoomdload/%d.zoomdload.png";

  private loadForecast = (time: number): Promise<Blob> => {
    const paddedNumber = time.toString().padStart(3, "0");
    const url = this.URL.replace("%d", paddedNumber);
    const headers = new HttpHeaders({
      Accept: "image/avif,image/webp,*/*",
    });
    const response = this.http.get(url, {
      responseType: "blob",
      observe: "body",
      headers: headers,
    });

    return response.toPromise();
  };

  private createImageFromBlob = (blob: Blob): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const objectURL = URL.createObjectURL(blob);
      const img = new Image();
      img.src = objectURL;
      img.onload = () => resolve(img);
    });
  };

  private getColorFromPx = (image: HTMLImageElement, x: number, y: number): Promise<number[]> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      canvas.getContext("2d")?.drawImage(image, x, y, 1, 1, 0, 0, 1, 1);
      const rgba = [...(canvas.getContext("2d")?.getImageData(0, 0, 1, 1).data ?? [])];
      rgba.pop();
      resolve(rgba);
    });
  };

  private getDustFromColor = (rgb: number[]): Promise<string> => {
    return new Promise((resolve) => {
      const colorStr = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      resolve(this.colorToDust[colorStr] ? this.colorToDust[colorStr] : "-");
    });
  };

  public dustToColor = (dust: string) => {
    const rgb = Object.entries(this.colorToDust).reduce((ret, entry) => {
      const [key, value] = entry;
      ret[value] = key;
      return ret;
    }, {});
    const hex = this.rgbToHex[rgb[dust]];
    return hex;
  };

  private getParamsForCity = (city: string): Promise<string[]>[] => {
    const nSteps = 35;
    const promises = [];

    const px = this.pxOfCity[city];

    for (let i = 0; i <= nSteps * 6; i += 6) {
      const imageBlobPromise = this.loadForecast(i);
      const dustPromise = imageBlobPromise
        .then((blob) => this.createImageFromBlob(blob))
        .then((image) => this.getColorFromPx(image, px.x, px.y))
        .then((rgb) => this.getDustFromColor(rgb))
        .catch((error) => {
          return new Promise((resolve) => {
            resolve("-");
          });
        });

      promises.push(dustPromise);
    }

    return promises;
  };

  public getDustParams = (): DustParams => {
    const dustParams: DustParams = {};
    for (const city of Object.keys(this.pxOfCity)) {
      const promises = this.getParamsForCity(city);
      dustParams[city] = promises;
    }
    return dustParams;
  };

  public parseDustParams = async () => {
    const promises = this.getDustParams();
    const dustForCity = {};
    for (const key of Object.keys(promises)) {
      const values = await Promise.all(promises[key]);
      const runs = [];
      while (values.length) runs.push(values.splice(0, 12));
      for (let i = 0; i < runs.length; i++) {
        const days = [];
        while (runs[i].length) {
          const day = runs[i].splice(0, 4);
          const parsedDay = {
            "00": day[0],
            "06": day[1],
            "12": day[2],
            "18": day[3],
          };
          days.push(parsedDay);
        }
        runs[i] = days;
      }
      dustForCity[key] = runs;
    }

    return dustForCity;
  };
}
