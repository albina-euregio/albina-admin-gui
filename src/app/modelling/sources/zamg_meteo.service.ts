import { Injectable, inject, signal } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { ImageSource, Map as MlMap } from "maplibre-gl";

/** A single `{ range: [from, to], color }` entry from the live config.json. */
export interface RemoteThreshold {
  range: [number | null, number | null];
  color: string;
}

/** A single entry from the live config.json's `timeRanges`. */
interface RemoteTimeRange {
  timeRange: number;
  timeStepHours: number;
  imageOverlayURL: string;
  dataOverlayURL: string;
  initialValidity: [string, string];
  initialTimestamp: string;
  maxForecastTimestamp: string;
  maxAnalysisTimestamp: string;
}

/**
 * The shape of `.../zamg_meteo/overlays/{domain}/config.json`. The payload
 * also carries `startDateURL`, a wiski.tirol.gv.at URL (no CORS headers)
 * serving the same `startDate` this config already states — nothing reads it,
 * so it is left out.
 */
interface RemoteDomainConfig {
  parameter: string;
  units: string;
  thresholds: RemoteThreshold[];
  timeRanges: RemoteTimeRange[];
  startDate: string;
  startDateModifyTimestamp: string;
}

function formatThreshold({ range: [from, to] }: RemoteThreshold, units: string): string {
  if (from === null) return `<${to} ${units}`;
  if (to === null) return `>${from} ${units}`;
  return `${from}–${to} ${units}`;
}

const domains = [
  "snow-height",
  "new-snow",
  "diff-snow",
  "relative-snow",
  "snow-line",
  "temp",
  "wind",
  "gust",
  "wind700hpa",
] as const;

type Domain = (typeof domains)[number];

@Injectable()
export class ZamgMeteoSourceService {
  private translateService = inject(TranslateService);

  maps = signal<readonly MapLink[]>([]);

  constructor() {
    void this.loadMaps();
  }

  private async loadMaps(): Promise<void> {
    const maps = await Promise.all(domains.map((domain) => this.loadDomain(domain)));
    this.maps.set(Object.freeze(maps.flat()));
  }

  private async loadDomain(domain: Domain): Promise<MapLink[]> {
    try {
      const response = await fetch(`https://static.avalanche.report/zamg_meteo/overlays/${domain}/config.json`, {
        cache: "no-cache",
      });
      if (!response.ok) return [];
      const config: RemoteDomainConfig = await response.json();
      const attribution = config.thresholds
        .map((threshold) => `<i style="color:${threshold.color}">■</i> ${formatThreshold(threshold, config.units)}`)
        .join(", ");
      const label = this.domainLabel(domain);
      return config.timeRanges.map(
        (timeRange) =>
          new MapLink({
            href: timeRange.imageOverlayURL.replace(
              "https://wiski.tirol.gv.at/lawine",
              "https://static.avalanche.report",
            ),
            date: Temporal.Instant.from(timeRange.initialTimestamp),
            dateMin: Temporal.Instant.from(timeRange.maxAnalysisTimestamp),
            dateMax: Temporal.Instant.from(timeRange.maxForecastTimestamp),
            dateStepHour: timeRange.timeStepHours,
            label: config.timeRanges.length > 1 ? `${timeRange.timeRange}h ${label}` : label,
            attribution,
          }),
      );
    } catch (e) {
      console.error(`Failed to load ZAMG meteo config for domain "${domain}"`, e);
      return [];
    }
  }

  private domainLabel(domain: Domain): string {
    const tooltip = (key: string) => this.translateService.instant(`observations.weatherStations.tooltips.${key}`);
    switch (domain) {
      case "snow-height":
        return tooltip("snowHeight");
      case "new-snow":
        return tooltip("newSnow");
      case "diff-snow":
        return tooltip("snowDifference");
      case "relative-snow":
        return domain;
      case "snow-line":
        return tooltip("snowLine");
      case "temp":
        return tooltip("airTemperature");
      case "wind":
        return `${tooltip("windSpeed")} 10m`;
      case "gust":
        return `${tooltip("windGust")} 10m`;
      case "wind700hpa":
        return `${tooltip("windSpeed")} 3000m`;
    }
  }
}

class MapLink {
  href: string;
  label: string;
  date: Temporal.Instant;
  dateMin?: Temporal.Instant;
  dateMax?: Temporal.Instant;
  dateStepHour?: number;
  attribution?: string;
  selected: boolean;

  private static seq = 0;
  readonly imageId = `zamg-meteo-${MapLink.seq++}`;
  private map?: MlMap;
  // image corners (TL, TR, BR, BL) in [lng, lat]
  private static readonly coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
    [9.4, 47.8167],
    [13.0333, 47.8167],
    [13.0333, 45.6167],
    [9.4, 45.6167],
  ];

  constructor(data: Partial<MapLink>) {
    Object.assign(this, data);
    this.href = data.href!;
    this.label = data.label!;
    this.date = data.date!;
  }

  change(change: 1 | -1 | Temporal.Instant) {
    if (!this.dateStepHour) {
      return this;
    }
    this.date = change instanceof Temporal.Instant ? change : this.date.add({ hours: change * this.dateStepHour });
    this.updateImage();
  }

  get epochMilliseconds(): number {
    return this.date.epochMilliseconds;
  }

  get linkHref(): string {
    const isoString = this.date.toString();
    const [date0, time] = isoString.split("T");
    return this.href
      .replaceAll("$year", date0.slice(0, "2006".length))
      .replaceAll("$date", date0)
      .replaceAll("$hour", time.slice(0, "15".length));
  }

  private updateImage(): void {
    const source = this.map?.getSource(this.imageId) as ImageSource | undefined;
    source?.updateImage({ url: this.linkHref });
  }

  addImageOverlay(map: MlMap): void {
    this.map = map;
    if (map.getSource(this.imageId)) {
      this.updateImage();
      return;
    }
    map.addSource(this.imageId, { type: "image", url: this.linkHref, coordinates: MapLink.coordinates });
    // TODO(maplibre-migration): legend attribution + multiply blend not yet ported
    map.addLayer({ id: this.imageId, type: "raster", source: this.imageId });
  }

  removeImageOverlay(map: MlMap): void {
    if (map.getLayer(this.imageId)) map.removeLayer(this.imageId);
    if (map.getSource(this.imageId)) map.removeSource(this.imageId);
    if (this.map === map) this.map = undefined;
  }
}
