import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { ImageOverlay } from "leaflet";
import L from "leaflet";

@Injectable()
export class ZamgMeteoSourceService {
  constructor(private translateService: TranslateService) {}

  maps = Object.freeze([
    ...[6, 12, 24, 48, 72].map(
      (i) =>
        new MapLink({
          cls: "Prognosen",
          href: `https://static.avalanche.report/zamg_meteo/overlays/new-snow/{{date}}_new-snow_${String(i)}h_V2.gif`,
          dateHref: "https://static.avalanche.report/zamg_meteo/overlays/new-snow/startDate.ok",
          dateForceHour: i >= 24 ? "00:00" : undefined,
          dateOffsetHour: i,
          dateStepHour: Math.min(i, 24),
          dateMin: i,
          dateMax: i >= 48 ? i : 72,
          label: i + "h " + this.translateService.instant("observations.weatherStations.tooltips.newSnow"),
        }),
    ),
    new MapLink({
      cls: "Prognosen",
      href: "https://static.avalanche.report/zamg_meteo/overlays/snow-line/{{date}}_snow-line_V3.gif",
      dateHref: "https://static.avalanche.report/zamg_meteo/overlays/snow-line/startDate.ok",
      dateOffsetHour: 1,
      dateStepHour: 1,
      dateMin: 1,
      dateMax: 60,
      label: this.translateService.instant("observations.weatherStations.tooltips.snowLine"),
    }),
    new MapLink({
      cls: "Prognosen",
      href: "https://static.avalanche.report/zamg_meteo/overlays/temp/{{date}}_temp_V3.gif",
      dateHref: "https://static.avalanche.report/zamg_meteo/overlays/temp/startDate.ok",
      dateOffsetHour: 1,
      dateStepHour: 1,
      dateMin: 1,
      dateMax: 60,
      label: this.translateService.instant("observations.weatherStations.tooltips.airTemperature"),
    }),
    new MapLink({
      cls: "Prognosen",
      href: "https://static.avalanche.report/zamg_meteo/overlays/wind700hpa/{{date}}_wind700hpa.gif",
      dateHref: "https://static.avalanche.report/zamg_meteo/overlays/wind/startDate.ok",
      dateOffsetHour: 1,
      dateStepHour: 1,
      dateMin: 1,
      dateMax: 72,
      label: this.translateService.instant("observations.weatherStations.tooltips.windSpeed") + " 3000m",
    }),
    new MapLink({
      cls: "Prognosen",
      href: "https://static.avalanche.report/zamg_meteo/overlays/wind/{{date}}_wind_V3.gif",
      dateHref: "https://static.avalanche.report/zamg_meteo/overlays/wind/startDate.ok",
      dateStepHour: 1,
      dateMax: 60,
      label: this.translateService.instant("observations.weatherStations.tooltips.windSpeed") + " 10m",
    }),
    new MapLink({
      cls: "Prognosen",
      href: "https://static.avalanche.report/zamg_meteo/overlays/gust/{{date}}_gust_V3.gif",
      dateHref: "https://static.avalanche.report/zamg_meteo/overlays/wind/startDate.ok",
      dateStepHour: 1,
      dateMax: 60,
      label: this.translateService.instant("observations.weatherStations.tooltips.windGust") + " 10m",
    }),
  ]);
}

class MapLink {
  cls?: string;
  badge?: string;
  href: string;
  label: string;
  isNew?: boolean;
  date?: Date;
  dateMin?: number | Date;
  dateMax?: number | Date;
  dateHref?: string;
  dateForceHour?: string;
  dateOffsetHour?: number;
  dateStepHour?: number;
  attribution?: string;
  latlng?: L.LatLngExpression;
  imageOverlay: L.ImageOverlay;
  selected: boolean;

  constructor(data: Partial<MapLink>) {
    this.href = data.href!;
    this.label = data.label!;
    this.imageOverlay = new ImageOverlay(
      this.href,
      [
        [45.6167, 9.4],
        [47.8167, 13.0333],
      ],
      { className: "mix-blend-mode-multiply" },
    );
    Object.assign(this, data);
  }

  withChange(change: 1 | -1 | Date): MapLink {
    if (!this.date || !this.dateStepHour) {
      return this;
    }
    return new MapLink({
      ...this,
      date: change instanceof Date ? change : new Date(+this.date + change * this.dateStepHour * 3600 * 1000),
    });
  }

  async fetchDate(): Promise<void> {
    if (!this.dateHref) {
      return;
    }
    const response = await fetch(this.dateHref, { cache: "no-cache" });
    this.dateHref = undefined;
    if (!response.ok) return;
    let dateString = await response.text();
    if (this.dateForceHour) {
      dateString = dateString.replace(/T\d\d:\d\d/, `T${this.dateForceHour}`);
    }
    const parsedDate = Date.parse(dateString.trim());
    this.date = new Date(parsedDate + (this.dateOffsetHour ?? 0) * 3600 * 1000);
    if (typeof this.dateMin === "number") {
      this.dateMin = new Date(parsedDate + this.dateMin * 3600 * 1000);
    }
    if (typeof this.dateMax === "number") {
      this.dateMax = new Date(parsedDate + this.dateMax * 3600 * 1000);
    }
    this.imageOverlay.setUrl(this.linkHref);
  }

  get linkHref(): string {
    const isoString = this.date?.toISOString() ?? "";
    return this.href
      .replace("{{date}}", isoString.replace("T", "_").replace(":", "-").substring(0, "2006-01-02_15-04".length))
      .replace("{{date0}}", isoString.slice(0, "2006-01-02".length))
      .replace("{{year}}", String(this.date?.getFullYear()));
  }

  get isMapDateMin(): boolean {
    return Boolean(this.date && this.dateMin && +this.date <= +this.dateMin);
  }

  get isMapDateMax(): boolean {
    return Boolean(this.date && this.dateMax && +this.date >= +this.dateMax);
  }

  async addImageOverlay(map: L.Map | L.LayerGroup) {
    await this.fetchDate();
    this.imageOverlay.addTo(map);
  }
}
