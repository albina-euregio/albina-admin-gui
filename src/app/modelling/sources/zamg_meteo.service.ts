import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { ImageOverlay } from "leaflet";
import L from "leaflet";

function legend(label: string, color: string) {
  return `<i style="color:${color}">■</i> ${label}`;
}

@Injectable()
export class ZamgMeteoSourceService {
  constructor(private translateService: TranslateService) {}

  maps = Object.freeze([
    ...[6, 12, 24, 48, 72].map(
      (i) =>
        new MapLink({
          href: `https://static.avalanche.report/zamg_meteo/overlays/new-snow/{{date}}_new-snow_${String(i)}h_V2.gif`,
          dateHref: "https://static.avalanche.report/zamg_meteo/overlays/new-snow/startDate.ok",
          dateForceHour: i >= 24 ? "00:00" : undefined,
          dateOffsetHour: i,
          dateStepHour: Math.min(i, 24),
          dateMin: i,
          dateMax: i >= 48 ? i : 72,
          label: i + "h " + this.translateService.instant("observations.weatherStations.tooltips.newSnow"),
          attribution: [
            legend("<1cm", "#fffffe"),
            legend("1–5cm", "#ffffb3"),
            legend("5–10cm", "#b0ffbc"),
            legend("10–20cm", "#8cffff"),
            legend("20–30cm", "#03cdff"),
            legend("30–50cm", "#0481ff"),
            legend("50–75cm", "#035bbe"),
            legend("75–100cm", "#784bff"),
            legend(">100cm", "#cc0ce8"),
          ].join(", "),
        }),
    ),
    new MapLink({
      href: "https://static.avalanche.report/zamg_meteo/overlays/snow-line/{{date}}_snow-line_V3.gif",
      dateHref: "https://static.avalanche.report/zamg_meteo/overlays/snow-line/startDate.ok",
      dateOffsetHour: 1,
      dateStepHour: 1,
      dateMin: 1,
      dateMax: 60,
      label: this.translateService.instant("observations.weatherStations.tooltips.snowLine"),
      attribution: [
        legend("", "#c060ff"),
        legend("", "#9b00e0"),
        legend("", "#8000ff"),
        legend("", "#6600c0"),
        legend("500 m", "#330080"),
        legend("", "#0000c0"),
        legend("", "#00f"),
        legend("", "#39f"),
        legend("", "#80ccff"),
        legend("1000 m", "#80ffff"),
        legend("", "#00ffc0"),
        legend("", "#00ff80"),
        legend("", "#00e400"),
        legend("", "#00c000"),
        legend("1500 m", "#009b00"),
        legend("", "green"),
        legend("", "#609b00"),
        legend("", "#9b9b00"),
        legend("", "#c09b00"),
        legend("2000 m", "#c0c000"),
        legend("", "#c0e000"),
        legend("", "#c0ff00"),
        legend("", "#ff0"),
        legend("", "#ffc000"),
        legend("2500 m", "#ff9b00"),
        legend("", "#ff8000"),
        legend("", "red"),
        legend("", "#e00000"),
        legend("", "#c00000"),
        legend("3000 m", "#b00000"),
        legend("", "maroon"),
        legend("", "#906"),
        legend("", "#c00066"),
        legend("", "#c06"),
        legend("3500 m", "#cc005c"),
      ].join(", "),
    }),
    new MapLink({
      href: "https://static.avalanche.report/zamg_meteo/overlays/temp/{{date}}_temp_V3.gif",
      dateHref: "https://static.avalanche.report/zamg_meteo/overlays/temp/startDate.ok",
      dateOffsetHour: 1,
      dateStepHour: 1,
      dateMin: 1,
      dateMax: 60,
      label: this.translateService.instant("observations.weatherStations.tooltips.airTemperature"),
      attribution: [
        legend("-25 \u00b0C", "#9f80ff"),
        legend("-25–-20 \u00b0C", "#784cff"),
        legend("-20–-15 \u00b0C", "#0f5abe"),
        legend("-15–-10 \u00b0C", "#1380ff"),
        legend("-10–-5 \u00b0C", "#19cdff"),
        legend("-5–0 \u00b0C", "#8fffff"),
        legend("0–5 \u00b0C", "#b0ffbc"),
        legend("5–10 \u00b0C", "#ffff73"),
        legend("10–15 \u00b0C", "#ffbe7d"),
        legend("15–20 \u00b0C", "#ff9b41"),
        legend("20–25 \u00b0C", "#ff5a41"),
        legend("25–30 \u00b0C", "#ff1e23"),
        legend(">30 \u00b0C", "#fa3c96"),
      ].join(", "),
    }),
    new MapLink({
      href: "https://static.avalanche.report/zamg_meteo/overlays/wind700hpa/{{date}}_wind700hpa.gif",
      dateHref: "https://static.avalanche.report/zamg_meteo/overlays/wind/startDate.ok",
      dateOffsetHour: 1,
      dateStepHour: 1,
      dateMin: 1,
      dateMax: 72,
      label: this.translateService.instant("observations.weatherStations.tooltips.windSpeed") + " 3000m",
      attribution: [
        legend("0–5 km/h", "#ffff64"),
        legend("5–10 km/h", "#c8ff64"),
        legend("10–20 km/h", "#96ff96"),
        legend("20–40 km/h", "#32c8ff"),
        legend("40–60 km/h", "#6496ff"),
        legend("60–80 km/h", "#9664ff"),
        legend(">80 km/h", "#ff3232"),
      ].join(", "),
    }),
    new MapLink({
      href: "https://static.avalanche.report/zamg_meteo/overlays/wind/{{date}}_wind_V3.gif",
      dateHref: "https://static.avalanche.report/zamg_meteo/overlays/wind/startDate.ok",
      dateStepHour: 1,
      dateMax: 60,
      label: this.translateService.instant("observations.weatherStations.tooltips.windSpeed") + " 10m",
      attribution: [
        legend("0–5 km/h", "#ffff64"),
        legend("5–10 km/h", "#c8ff64"),
        legend("10–20 km/h", "#96ff96"),
        legend("20–40 km/h", "#32c8ff"),
        legend("40–60 km/h", "#6496ff"),
        legend("60–80 km/h", "#9664ff"),
        legend(">80 km/h", "#ff3232"),
      ].join(", "),
    }),
    new MapLink({
      href: "https://static.avalanche.report/zamg_meteo/overlays/gust/{{date}}_gust_V3.gif",
      dateHref: "https://static.avalanche.report/zamg_meteo/overlays/wind/startDate.ok",
      dateStepHour: 1,
      dateMax: 60,
      label: this.translateService.instant("observations.weatherStations.tooltips.windGust") + " 10m",
      attribution: [
        legend("0–5 km/h", "#ffff64"),
        legend("5–10 km/h", "#c8ff64"),
        legend("10–20 km/h", "#96ff96"),
        legend("20–40 km/h", "#32c8ff"),
        legend("40–60 km/h", "#6496ff"),
        legend("60–80 km/h", "#9664ff"),
        legend(">80 km/h", "#ff3232"),
      ].join(", "),
    }),
  ]);
}

class MapLink {
  href: string;
  label: string;
  date?: Date;
  dateMin?: number | Date;
  dateMax?: number | Date;
  dateHref?: string;
  dateForceHour?: string;
  dateOffsetHour?: number;
  dateStepHour?: number;
  attribution?: string;
  imageOverlay: L.ImageOverlay;
  selected: boolean;

  constructor(data: Partial<MapLink>) {
    Object.assign(this, data);
    this.href = data.href!;
    this.label = data.label!;
    this.imageOverlay = new ImageOverlay(
      this.href,
      [
        [45.6167, 9.4],
        [47.8167, 13.0333],
      ],
      {
        attribution: this.attribution,
        pane: "tilePane",
        className: "mix-blend-mode-multiply",
      },
    );
  }

  change(change: 1 | -1 | Date) {
    if (!this.date || !this.dateStepHour) {
      return this;
    }
    this.date = change instanceof Date ? change : new Date(+this.date + change * this.dateStepHour * 3600 * 1000);
    this.imageOverlay.setUrl(this.linkHref);
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
