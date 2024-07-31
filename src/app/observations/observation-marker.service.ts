import { Injectable } from "@angular/core";
import { formatDate } from "@angular/common";
import { Canvas, CircleMarker, DivIcon, Icon, LatLng, Marker, MarkerOptions } from "leaflet";
import {
  degreeToAspect,
  GenericObservation,
  ImportantObservation,
  LocalFilterTypes,
  ObservationSource,
  ObservationType,
  WeatherStationParameter,
} from "./models/generic-observation.model";
import { memoize } from "lodash";
import { ObservationFilterService } from "./observation-filter.service";
import { Aspect, SnowpackStability } from "../enums/enums";

const zIndex: Record<SnowpackStability, number> = {
  [SnowpackStability.good]: 1,
  [SnowpackStability.fair]: 5,
  [SnowpackStability.poor]: 10,
  [SnowpackStability.very_poor]: 20,
};

const snowHeightThresholds = [0, 1, 10, 25, 50, 100, 200, 300, 1000];
const elevationColors = {
  "0": "#FFFFFE",
  "1": "#FFFFB3",
  "2": "#B0FFBC",
  "3": "#8CFFFF",
  "4": "#03CDFF",
  "5": "#0481FF",
  "6": "#035BBE",
  "7": "#784BFF",
  "8": "#CC0CE8",
};

const snowDifferenceThresholds = [-20, -10, -5, 1, 5, 10, 20, 30, 50, 75, 500];
const snowDifferenceColors = {
  "0": "#ff6464",
  "1": "#ffa0a0",
  "2": "#ffd2d2",
  "3": "#fff",
  "4": "#FFFFB3",
  "5": "#B0FFBC",
  "6": "#8CFFFF",
  "7": "#03CDFF",
  "8": "#0481FF",
  "9": "#035BBE",
  "10": "#784BFF",
  "11": "#CC0CE8",
};

const temperatureThresholds = [-25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 100];
const temperatureColors = {
  "0": "#9f80ff",
  "1": "#784cff",
  "2": "#0f5abe",
  "3": "#1380ff",
  "4": "#19cdff",
  "5": "#8fffff",
  "6": "#b0ffbc",
  "7": "#ffff73",
  "8": "#ffbe7d",
  "9": "#ff9b41",
  "10": "#ff5a41",
  "11": "#ff1e23",
  "12": "#fa3c96",
};

const dewPointThresholds = [-25, -20, -15, -10, -5, -3, -2, -1.5, -1, -0.8, -0.6, -0.4, -0.2, 100];
const dewPointColors = {
  "0": "#9f80ff",
  "1": "#784cff",
  "2": "#0f5abe",
  "3": "#1380ff",
  "4": "#19cdff",
  "5": "#8fffff",
  "6": "#b0ffbc",
  "7": "#ffff73",
  "8": "#ffbe7d",
  "9": "#fc9272",
  "10": "#fb6a4a",
  "11": "#ef3b2c",
  "12": "#cb181d",
  "13": "#a50f15",
  "14": "#67000d",
};

const relativeHumidityThresholds = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 150];
const relativeHumidityColors = {
  "0": "#fff",
  "1": "#ced1d8",
  "2": "#9ca4b1",
  "3": "#648594",
  "4": "#4499c0",
  "5": "#1cafe2",
  "6": "#1cc3ef",
  "7": "#76cfc9",
  "8": "#c4dd99",
  "9": "#f0de70",
  "10": "#f9c442",
  "11": "#fbad0b",
  "12": "#ff8b00",
  "13": "#fc6d04",
  "14": "#ff4802",
  "15": "#dc3000",
  "16": "#b31901",
  "17": "#8a0007",
};

const surfaceHoarThresholds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 100];
const surfaceHoarColors = {
  "0": "#fff",
  "1": "#f7fbff",
  "2": "#deebf7",
  "3": "#c6dbef",
  "4": "#9ecae1",
  "5": "#6baed6",
  "6": "#4292c6",
  "7": "#2171b5",
  "8": "#08519c",
  "9": "#08306b",
};

const globalRadiationThresholds = [200, 400, 600, 800, 1000, 1200, 2000];
const windThresholds = [5, 10, 20, 40, 60, 80, 300];
const windColors = {
  "0": "#ffff64",
  "1": "#c8ff64",
  "2": "#96ff96",
  "3": "#32c8ff",
  "4": "#6496ff",
  "5": "#9664ff",
  "6": "#ff3232",
};

// FATMAP
const aspectColors = {
  [Aspect.N]: "#2f74f9",
  [Aspect.NE]: "#96c0fc",
  [Aspect.E]: "#b3b3b3",
  [Aspect.SE]: "#f6ba91",
  [Aspect.S]: "#ef6d25",
  [Aspect.SW]: "#6c300b",
  [Aspect.W]: "#000000",
  [Aspect.NW]: "#113570",
};

const grainShapes = {
  PP: { name: "Precipitation Particles", color: "#00FF00", key: "a" },
  MM: { name: "Machine Made snow", color: "#FFD700", key: "b" },
  DF: {
    name: "Decomposing and Fragmented precipitation particles",
    color: "#228B22",
    key: "c",
  },
  RG: { name: "Rounded Grains", color: "#FFB6C1", key: "d" },
  FC: { name: "Faceted Crystals", color: "#ADD8E6", key: "e" },
  DH: { name: "Depth Hoar", color: "#0000FF", key: "f" },
  SH: { name: "Surface Hoar", color: "#FF00FF", key: "g" },
  MF: { name: "Melt Forms", color: "#FF0000", key: "h" },
  IF: { name: "Ice Formations", color: "#00FFFF", key: "i" },
  PPco: { name: "Columns", color: "#00FF00", key: "j" },
  PPnd: { name: "Needles", color: "#00FF00", key: "k" },
  PPpl: { name: "Plates", color: "#00FF00", key: "l" },
  PPsd: { name: "Stellars, Dendrites", color: "#00FF00", key: "m" },
  PPir: { name: "Irregular crystals", color: "#00FF00", key: "n" },
  PPgp: { name: "Graupel", color: "#808080", key: "o" },
  PPhl: { name: "Hail", color: "#00FF00", key: "p" },
  PPip: { name: "Ice pellets", color: "#00FF00", key: "q" },
  PPrm: { name: "Rime", color: "#00FF00", key: "r" },
  MMrp: { name: "Round polycrystalline particles", color: "#FFD700", key: "s" },
  MMci: { name: "Crushed ice particles", color: "#FFD700", key: "t" },
  DFdc: {
    name: "Partly decomposed precipitation particles",
    color: "#228B22",
    key: "u",
  },
  DFbk: {
    name: "Wind-broken precipitation particles",
    color: "#228B22",
    key: "v",
  },
  RGsr: { name: "Small rounded particles", color: "#FFB6C1", key: "w" },
  RGlr: { name: "Large rounded particles", color: "#FFB6C1", key: "x" },
  RGwp: { name: "Wind packed", color: "#FFB6C1", key: "y" },
  RGxf: { name: "Faceted rounded particles", color: "#FFB6C1", key: "z" },
  FCso: { name: "Solid faceted particles", color: "#ADD8E6", key: "A" },
  FCsf: { name: "Near surface faceted particles", color: "#ADD8E6", key: "B" },
  FCxr: { name: "Rounding faceted particles", color: "#ADD8E6", key: "C" },
  DHcp: { name: "Hollow cups", color: "#0000FF", key: "D" },
  DHpr: { name: "Hollow prisms", color: "#0000FF", key: "E" },
  DHch: { name: "Chains of depth hoar", color: "#0000FF", key: "F" },
  DHla: { name: "Large striated crystals", color: "#0000FF", key: "G" },
  DHxr: { name: "Rounding depth hoar", color: " #0000FF", key: "H" },
  SHsu: { name: "Surface hoar crystals", color: "#FF00FF", key: "I" },
  SHcv: { name: "Cavity or crevasse hoar", color: "#FF00FF", key: "J" },
  SHxr: { name: "Rounding surface hoar", color: "#FF00FF", key: "K" },
  MFcl: { name: "Clustered rounded grains", color: "#FF0000", key: "L" },
  MFpc: { name: "Rounded polycrystals", color: "#FF0000", key: "M" },
  MFsl: { name: "Slush", color: "#FF0000", key: "N" },
  MFcr: { name: "Melt-freeze crust", color: "#FF0000", key: "O" },
  IFil: { name: "Ice layer", color: "#00FFFF", key: "P" },
  IFic: { name: "Ice column", color: "#00FFFF", key: "Q" },
  IFbi: { name: "Basal ice", color: "#00FFFF", key: "R" },
  IFrc: { name: "Rain crust", color: "#00FFFF", key: "S" },
  IFsc: { name: "Sun crust, Firnspiegel", color: "#00FFFF", key: "T" },
};

export const importantObservationTexts = {
  [ImportantObservation.SnowLine]: grainShapes.IFrc.key,
  [ImportantObservation.SurfaceHoar]: grainShapes.SH.key,
  [ImportantObservation.Graupel]: grainShapes.PPgp.key,
  [ImportantObservation.StabilityTest]: grainShapes.PPnd.key,
  [ImportantObservation.IceFormation]: grainShapes.IF.key,
  [ImportantObservation.VeryLightNewSnow]: grainShapes.PPsd.key,
};

@Injectable()
export class ObservationMarkerService {
  public markerLabel: LocalFilterTypes | undefined = undefined;
  public weatherStationLabel: WeatherStationParameter | undefined = undefined;
  public markerClassify: LocalFilterTypes = LocalFilterTypes.Stability;

  constructor(private filter: ObservationFilterService) {}

  // This is very important! Use a canvas otherwise the chart is too heavy for the browser when
  // the number of points is too high
  public myRenderer = new Canvas({
    padding: 0.5,
  });

  createMarker(observation: GenericObservation, isHighlighted: boolean = false): Marker | undefined {
    if (!isFinite(observation.latitude) || !isFinite(observation.longitude)) return;
    try {
      const ll = new LatLng(observation.latitude, observation.longitude);
      const marker = new Marker(ll, {
        bubblingMouseEvents: false,
        icon: this.getIcon(observation, isHighlighted),
        opacity: 1,
        pane: "markerPane",
        radius: this.toMarkerRadius(observation),
        renderer: this.myRenderer,
        weight: isHighlighted ? 1 : 0,
        zIndexOffset: this.toZIndex(observation),
      } as MarkerOptions);

      this.bindTooltip(marker, observation);
      return marker;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  bindTooltip(marker: Marker | CircleMarker, observation: GenericObservation) {
    marker.bindTooltip(this.createTooltip(observation), {
      opacity: 1,
      className: "obs-tooltip",
    });
  }

  createTooltip(observation: GenericObservation): string {
    return [
      `<i class="ph ph-calendar"></i> ${
        observation.eventDate instanceof Date
          ? formatDate(observation.eventDate, "yyyy-MM-dd HH:mm", "en-US")
          : undefined
      }`,
      `<i class="ph ph-globe"></i> ${observation.locationName || undefined}`,
      `<i class="ph ph-user"></i> ${observation.authorName || undefined}`,
      `[${observation.$source}, ${observation.$type}]`,
    ]
      .filter((s) => !s.includes("undefined"))
      .join("<br>");
  }

  toMarkerRadius(observation: GenericObservation): number {
    if (observation?.$type === ObservationType.Webcam) {
      return 20;
    } else if (
      observation?.$type === ObservationType.TimeSeries &&
      observation?.$source === ObservationSource.Observer
    ) {
      return 20;
    } else if (
      observation?.$type === ObservationType.TimeSeries &&
      observation?.$source === ObservationSource.AvalancheWarningService
    ) {
      return 30;
    }
    return 40;
  }

  getBorderColor(observation: GenericObservation) {
    if (
      observation?.$type === ObservationType.TimeSeries &&
      observation?.$source === ObservationSource.AvalancheWarningService
    ) {
      return "#555555";
    } else if (observation?.$type === ObservationType.Webcam) {
      return "#000";
    } else if (observation?.$source === ObservationSource.SnowLine) {
      return "#777777";
    } else {
      return "#000";
    }
  }

  getLabelFontSize(observation: GenericObservation) {
    if (observation?.$type === ObservationType.Webcam) {
      return "6";
    } else if (
      observation?.$type === ObservationType.TimeSeries &&
      observation?.$source === ObservationSource.AvalancheWarningService
    ) {
      return "10";
    } else {
      return "12";
    }
  }

  toMarkerColor(observation: GenericObservation): string {
    if (observation?.$type === ObservationType.Webcam) {
      return "black";
    } else if (
      observation?.$type === ObservationType.TimeSeries &&
      observation?.$source === ObservationSource.Observer
    ) {
      return "#ca0020";
    } else if (
      observation?.$type === ObservationType.TimeSeries &&
      observation?.$source === ObservationSource.AvalancheWarningService
    ) {
      switch (this.weatherStationLabel) {
        case WeatherStationParameter.GlobalRadiation:
          return this.globalRadiationColor(observation.$data.GS_O);
        case WeatherStationParameter.SnowHeight:
          return this.snowHeightColor(observation.$data.HS);
        case WeatherStationParameter.SnowDifference24h:
          return this.snowDifferenceColor(observation.$data.HSD24);
        case WeatherStationParameter.SnowDifference48h:
          return this.snowDifferenceColor(observation.$data.HSD48);
        case WeatherStationParameter.SnowDifference72h:
          return this.snowDifferenceColor(observation.$data.HSD72);
        case WeatherStationParameter.AirTemperature:
          return this.temperatureColor(observation.$data.LT);
        case WeatherStationParameter.AirTemperatureMax:
          return this.temperatureColor(observation.$data.LT_MAX);
        case WeatherStationParameter.AirTemperatureMin:
          return this.temperatureColor(observation.$data.LT_MIN);
        case WeatherStationParameter.SurfaceTemperature:
          return this.temperatureColor(observation.$data.OFT);
        case WeatherStationParameter.SurfaceHoar:
          return this.surfaceHoarColor(this.getSurfaceHoar(observation.$data));
        case WeatherStationParameter.SurfaceHoarCalc:
          return this.surfaceHoarColor(this.calcSurfaceHoarProbability(observation.$data));
        case WeatherStationParameter.DewPoint:
          return this.dewPointColor(observation.$data.TD);
        case WeatherStationParameter.RelativeHumidity:
          return this.relativeHumidityColor(observation.$data.RH);
        case WeatherStationParameter.WindSpeed:
          return this.windColor(observation.$data.WG);
        case WeatherStationParameter.WindDirection:
          return observation.$data.WR ? aspectColors[degreeToAspect(observation.$data.WR)] : "white";
        case WeatherStationParameter.WindGust:
          return this.windColor(observation.$data.WG_BOE);
        default:
          return "white";
      }
    }

    if (!this.markerClassify) {
      return "white";
    }

    const value = this.filter.findFilterSelection(this.markerClassify, observation);
    return value?.color ?? "white";
  }

  private getSurfaceHoar(data) {
    const tempDiff = data.TD - data.OFT;
    if (data.OFT < 0 && tempDiff > 0) {
      return tempDiff;
    } else {
      return undefined;
    }
  }

  // Lehning et. al. 2002
  private calcSurfaceHoarProbability(data) {
    const grainSize = 1; // assumption
    //z0 0.5 to 2.4 mm for snow surfaces.
    const z0 = (0.003 + grainSize / 5) / 1000; //Lehning 2000, for grainSize = 1 mm only 0,203

    const lw = 2256 * 1000;
    const li = 2838 * 1000;

    var result = -1;

    if (data.HS > 0 && data.OFT <= 0) {
      const satp_w = 610.5 * Math.exp((lw * data.LT) / (461.9 * (data.LT + 273.16) * 273.16));
      const satp_i = 610.5 * Math.exp((li * data.OFT) / (461.9 * (data.OFT + 273.16) * 273.16));
      result =
        ((((-Math.pow(0.4, 2) * data.WG) / (0.74 * Math.pow(Math.log(2 / z0), 2))) * 0.622 * li) / (287 * data.LT)) *
        (satp_w * data.RH - satp_i);
    }

    return result;
  }

  private snowHeightColor(snowHeight: number) {
    if (snowHeight) {
      const index = isFinite(snowHeight) ? snowHeightThresholds.findIndex((e) => e >= snowHeight) : -1;
      return index >= 0 ? elevationColors[index] : "white";
    } else {
      return "white";
    }
  }

  private snowDifferenceColor(snowDifference: number) {
    if (snowDifference) {
      const index = isFinite(snowDifference) ? snowDifferenceThresholds.findIndex((e) => e >= snowDifference) : -1;
      return index >= 0 ? snowDifferenceColors[index] : "white";
    } else {
      return "white";
    }
  }

  private temperatureColor(temperature: number) {
    if (temperature) {
      const index = isFinite(temperature) ? temperatureThresholds.findIndex((e) => e >= temperature) : -1;
      return index >= 0 ? temperatureColors[index] : "white";
    } else {
      return "white";
    }
  }

  private surfaceHoarColor(surfaceHoar: number) {
    if (surfaceHoar) {
      const index = isFinite(surfaceHoar) ? surfaceHoarThresholds.findIndex((e) => e >= surfaceHoar) : -1;
      return index >= 0 ? surfaceHoarColors[index] : "white";
    } else {
      return "white";
    }
  }

  private dewPointColor(dewPoint: number) {
    if (dewPoint) {
      const index = isFinite(dewPoint) ? dewPointThresholds.findIndex((e) => e >= dewPoint) : -1;
      return index >= 0 ? dewPointColors[index] : "white";
    } else {
      return "white";
    }
  }

  private relativeHumidityColor(relativeHumidity: number) {
    if (relativeHumidity) {
      const index = isFinite(relativeHumidity)
        ? relativeHumidityThresholds.findIndex((e) => e >= relativeHumidity)
        : -1;
      return index >= 0 ? relativeHumidityColors[index] : "white";
    } else {
      return "white";
    }
  }

  private windColor(wind: number) {
    if (wind) {
      const index = isFinite(wind) ? windThresholds.findIndex((e) => e >= wind) : -1;
      return index >= 0 ? windColors[index] : "white";
    } else {
      return "white";
    }
  }

  private globalRadiationColor(globalRadiation: number) {
    if (globalRadiation) {
      const index = isFinite(globalRadiation) ? globalRadiationThresholds.findIndex((e) => e >= globalRadiation) : -1;
      return index >= 0 ? windColors[index] : "white";
    } else {
      return "white";
    }
  }

  private getLabel(observation: GenericObservation<any>) {
    if (
      observation?.$type === ObservationType.TimeSeries &&
      observation?.$source === ObservationSource.AvalancheWarningService
    ) {
      switch (this.weatherStationLabel) {
        case WeatherStationParameter.GlobalRadiation:
          return observation.$data.GS_O ? Math.round(observation.$data.GS_O) : "";
        case WeatherStationParameter.SnowHeight:
          return observation.$data.HS ? Math.round(observation.$data.HS) : "";
        case WeatherStationParameter.SnowDifference24h:
          return observation.$data.HSD24 ? Math.round(observation.$data.HSD24) : "";
        case WeatherStationParameter.SnowDifference48h:
          return observation.$data.HSD48 ? Math.round(observation.$data.HSD48) : "";
        case WeatherStationParameter.SnowDifference72h:
          return observation.$data.HSD72 ? Math.round(observation.$data.HSD72) : "";
        case WeatherStationParameter.AirTemperature:
          return observation.$data.LT ? Math.round(observation.$data.LT) : "";
        case WeatherStationParameter.AirTemperatureMax:
          return observation.$data.LT_MAX ? Math.round(observation.$data.LT_MAX) : "";
        case WeatherStationParameter.AirTemperatureMin:
          return observation.$data.LT_MIN ? Math.round(observation.$data.LT_MIN) : "";
        case WeatherStationParameter.SurfaceTemperature:
          return observation.$data.OFT ? Math.round(observation.$data.OFT) : "";
        case WeatherStationParameter.DewPoint:
          return observation.$data.TD ? Math.round(observation.$data.TD) : "";
        case WeatherStationParameter.RelativeHumidity:
          return observation.$data.RH ? Math.round(observation.$data.RH) : "";
        case WeatherStationParameter.WindDirection:
          return observation.$data.WR ? degreeToAspect(observation.$data.WR) : "";
        case WeatherStationParameter.WindSpeed:
          return observation.$data.WG ? Math.round(observation.$data.WG) : "";
        case WeatherStationParameter.WindGust:
          return observation.$data.WG_BOE ? Math.round(observation.$data.WG_BOE) : "";
        default:
          return "";
      }
    }

    if (!this.markerLabel) {
      return "";
    } else if (this.markerLabel === LocalFilterTypes.Elevation) {
      return isFinite(observation.elevation) ? Math.round(observation.elevation / 100) : "";
    }
    const value = this.filter.findFilterSelection(this.markerLabel, observation);
    return value?.label ?? "";
  }

  toZIndex(observation: GenericObservation) {
    return zIndex[observation.stability ?? "unknown"] ?? 0;
  }

  private getIcon(observation: GenericObservation<any>, isHighlighted: boolean): Icon | DivIcon {
    const iconSize = this.toMarkerRadius(observation);
    const iconColor = isHighlighted ? "#ff0000" : this.toMarkerColor(observation);
    const labelColor = isHighlighted ? "#fff" : "#000";
    const label = this.getLabel(observation);
    const borderColor = this.getBorderColor(observation);
    const labelFont =
      this.markerLabel === LocalFilterTypes.ImportantObservation
        ? "snowsymbolsiacs"
        : `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'`;
    const labelFontSize = this.getLabelFontSize(observation);
    const aspect = observation.aspect;
    const aspectColor = "#898989";
    return icon(aspect, aspectColor, iconSize, iconColor, borderColor, labelColor, labelFontSize, labelFont, label);
  }
}

const snowsymbolsiacs = `
    <defs><style type="text/css">
        @font-face {
            font-family: snowsymbolsiacs;
            src: url(data:application/vnd.ms-opentype;base64,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Q29weXJpZ2h0IChjKSAyMDA4IGJ5IHd3dy5zaWduYWx3ZXJrLmNoLiBBbGwgcmlnaHRzIHJlc2VydmVkLgAAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHMAaQBnAG4AYQBsAHcAZQByAGsALgBjAGgALwAAaHR0cDovL3d3dy5zaWduYWx3ZXJrLmNoLwAAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHMAaQBnAG4AYQBsAHcAZQByAGsALgBjAGgALwAAaHR0cDovL3d3dy5zaWduYWx3ZXJrLmNoLwAAWQBvAHUAIABtAGEAeQAgAHUAcwBlACAAdABoAGkAcwAgAGYAbwBuAHQAIAB0AG8AIABkAGkAcwBwAGwAYQB5ACAAYQBuAGQAIABwAHIAaQBuAHQAIABjAG8AbgB0AGUAbgB0ACAAYQBzACAAcABlAHIAbQBpAHQAdABlAGQAIABiAHkAIAB0AGgAZQAgAGwAaQBjAGUAbgBzAGUAIAB0AGUAcgBtAHMAIABmAG8AcgAgAHQAaABlACAAcAByAG8AZAB1AGMAdAAgAGkAbgAgAHcAaABpAGMAaAAgAHQAaABpAHMAIABmAG8AbgB0ACAAaQBzACAAaQBuAGMAbAB1AGQAZQBkAC4AIABZAG8AdQAgAG0AYQB5ACAAbwBuAGwAeQAgACgAaQApACAAZQBtAGIAZQBkACAAdABoAGkAcwAgAGYAbwBuAHQAIABpAG4AIABjAG8AbgB0AGUAbgB0ACAAYQBzACAAcABlAHIAbQBpAHQAdABlAGQAIABiAHkAIAB0AGgAZQAgAGUAbQBiAGUAZABkAGkAbgBnACAAcgBlAHMAdAByAGkAYwB0AGkAbwBuAHMAIABpAG4AYwBsAHUAZABlAGQAIABpAG4AIAB0AGgAaQBzACAAZgBvAG4AdAA7ACAAYQBuAGQAIAAoAGkAaQApACAAdABlAG0AcABvAHIAYQByAGkAbAB5ACAAZABvAHcAbgBsAG8AYQBkACAAdABoAGkAcwAgAGYAbwBuAHQAIAB0AG8AIABhACAAcAByAGkAbgB0AGUAcgAgAG8AcgAgAG8AdABoAGUAcgAgAG8AdQB0AHAAdQB0ACAAZABlAHYAaQBjAGUAIAB0AG8AIABoAGUAbABwACAAcAByAGkAbgB0ACAAYwBvAG4AdABlAG4AdAAu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ufu092n3Z4v8Wf4biwUOHAuA1fsLFf8BA1VV/wCUqqv/AQNVVv8Ac1VV/wEDVVXd/wEDVVXd/wD+qqu0946L946L95Ni95g595g595f//4yqq/eW//9rVVVT/wDEqqv//6/VVf8ArSqq//+Xqqv/AJWqq///l6qr/wCVqqv//4eAAP8Afaqq//93VVX/AGWqqwj//3dVVf8AZaqr//9rKqv/AEyqqvs1/wAzqqv7Nf8AM6qr//9bgAD/ABnVVfs8i/s8i///W9VV///mKqv//1+qq///zFVV//9fqqv//8xVVf//ayqq//+zVVb//3aqq///mlVV//92qqv//5pVVf//hyqq//+CVVb//5eqq///alVV//+Xqqv//2pVVf//r9VV//9S1VZT//87VVUI98X35BX/AD1VVf8AaVVV/wBKqqvs4/8AWKqr4/8AWKqr/wBhVVXX/wBqqqv/AD9VVf8Aaqqr/wA/VVX3Bv8AMYAA/wB5VVX/ACOqq/8AeVVV/wAjqqv/AH5VVv8AEdVV/wCDVVWL/wCCqquL/wB+gAD//+4qq/8AelVV///cVVX/AHpVVf//3FVV/wBygAD//86AAP8Aaqqr///AqqsI/wBqqqv//8Cqq+w//wBXVVX//6dVVf8AV1VV//+nVVXWKv8APqqr//+Wqqv7UuX//zmqq/8ARVVV//8xVVX/ADCqq///MVVV/wAwqqv//ylVVv8AGFVV//8hVVWL//8hVVWL//8pVVb//+eqq///MVVV///PVVX//zFVVf//z1VV//86VVb//7qqq///Q1VVMQgOxPimBItD/wAGgAD//72qq5j//8NVVZj//8NVVf8AEaqr///Gqqv/ABZVVVX/ABZVVVX/ABqqq///zNVVqv//z6qrqv//z6qr/wAggAD//9CAAK3//9FVVQj3C+EFbbX//+Oqq/8AKiqr///lVVX/ACpVVf//5VVV/wAqVVX//+hVVv8ALNVW///rVVX/AC9VVf//61VV/wAvVVX//+/VVv8AMdVW///0VVX/ADRVVf//9FVV/wA0VVX///oqq/8AONVWi/8APVVVi8n/AAXVVf8AOSqr/wALqqv/ADRVVf8AC6qr/wA0VVX/ABAqqv8AMdVW/wAUqqv/AC9VVQj/ABSqq/8AL1VV/wAXqqr/ACzVVv8AGqqr/wAqVVX/ABqqq/8A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/Jj7vfiYBXX///Sqq3X///TVVXWAdYB1///z1VV1///yqqsIDvfs+e4V+B/9RAX/ACaqq///vqqr/wAuVVX//88qqsH//9+qq8H//9+qq/8AOFVV///v1VX/ADqqq4v/ADlVVYvD/wAQKqv/ADaqq/8AIFVV/wA2qqv/ACBVVf8ALlVV/wAw1Vax/wBBVVUI+B/5RPsV1fwf/UIF///oqqtj///kVVX//+HVVWv//+uqq2v//+uqq///4FVV///11VX//+Cqq4v//96qq4v//9+qqv8AClVV///gqqv/ABSqq///4Kqr/wAUqqtvqf//51VV/wAnVVUI/B/5QgUO+F35iBWL///VVVX/AAcqq///2FVW/wAOVVX//9tVVf8ADlVV///bVVX/ABNVVv//31VW/wAYVVX//+NVVf8AGFVV///jVVX/AB1VVv//56qr/wAiVVV3/wAiVVV3/wAk1Vb///NVVf8AJ1VV///6qqv///Kqq///3Kqr///5VVX//9eqqov//9Kqq4v//9NVVf8ACIAA///VgACc///XqqsInP//16qr/wAXgAD//9zVValtqW2uc7N5s3n/ACqqq4L/AC1VVYv/AC6qq4v/ACuAAJT/AChVVZ3/AChVVZ3/ACMqq6Opqamp/wAX1VWu/wARqquzCP8AEaqrs/8ACNVV/wAqqquL/wAtVVWLtf//+Kqr/wAoVVX///FVVf8AJqqr/wAnVVX/AAVVVf8AJNVW/wAMqqv/ACJVVZ//ACJVVZ//AB2qq/8AGFVVpP8AHKqrpP8AHKqr/wATqqv/ACDVVf8ADlVVsP8ADlVVsP8AByqr/wAngACLtQiL/wAsqqv///eAAP8AKoAAev8AKFVVev8AKFVV///ogAD/ACMqq22pbalo/wAXgABjnGOc///Uqqv/AAiAAP//0VVVi1eL///PVVX///Uqq///0qqr///qVVX//9Kqq///6lVV///Zqqr//+Iqq///4KqrZQhtsf//2tVV/wAd1VX//9Oqq/8AFaqr///Tqqv/ABWqq///z9VV/wAK1VVXi12L///U1VX///eAAP//16qrev//16qrev//3NVV///ogABtbW1t///ogABoemN6Y///94AA///VVVWL///SqqsI9ycWi/8AGKqr/wAE1VX/ABeAAP8ACaqr/wAWVVX/AAmqq/8AFlVVmP8AE1VW/wAQVVX/ABBVVf8AEFVV/wAQVVX/ABNVVpj/ABZVVf8ACaqr/wAWVVX/AAmqq/8AGCqr/wAE1VWli7+L/wArgAD//+5VVa7//9yqq67//9yqq/8AEYAAYIv//81VVQiLV///7oAA///UKqto///cVVVo///cVVX//9SAAP//7iqrV4v//+aqq4tz/wAE1VX//+lVVf8ACaqr///pVVX/AAmqq///7IAAmP//76qr/wAQVVX//++qq/8AEFVVfv8AE4AA///2VVX/ABaqq///9lVV/wAWqqv///sqq/8AGFVVi6UI95b8VRWLv/8AEaqr/wAr1VX/ACNVVf8AI6qr/wAjVVX/ACOqq7b/ABHVVf8AMqqri7+L/wAsKqv//+4qq/8AJFVV///cVVX/ACRVVf//3FVV/wASKqv//9Qqq4tXi///zVVV///t1VVg///bqqv//9yqq///26qr///cqqv//9PVVf//7lVVV4sIWYv//9Uqq/8AEaqr///cVVX/ACNVVf//3FVV/wAjVVX//+4qq7aL/wAyqqsI95T4TRWLk4uRBf8AAqqr/wAxVVX/ABMqqv8AKaqr/wAjqqut/wAjqqut/wArKqqc/wAyqquL/wAzVVWL/wArgAD//+5VVf8AI6qr///cqqv/ACOqq///3Kqr/wAR1VVgi///zVVVi1f//+5VVf//1Cqr///cqqv//9xVVf//3Kqr///cVVX//9RVVf//7iqrV4sI///NVVWL///U1Vb/ABEqq///3FVV/wAiVVX//9xVVf8AIlVV///s1Vb/ACnVVv///VVV/wAxVVUIDvhd+YgVi///1qqr/wAHKqv//9iqqv8ADlVV///aqqv/AA5VVf//2qqr/wATqqtqpP//41VVpP//41VV/wAdVVX//+eqq/8AIaqrd/8AIaqrd/8AJIAA///yqqv/ACdVVf//+VVV///5VVX//+yqq4b//+yAAP///Kqr///sVVX///yqq///7FVV///+VVX//+vVVov//+tVVQiL///TVVX/AAiAAP//1YAAnP//16qrnP//16qr/wAXgAD//9zVValtqW3/ACMqq3P/AChVVXn/AChVVXn/ACuAAIL/AC6qq4v/ACyqq4v/ACqAAJT/AChVVZ3/AChVVZ3/ACMqq6OpqQipqf8AF9VVrv8AEaqrs/8AEaqrs/8ACNVV/wAqqquL/wAtVVWLt///+VVV/wAnqqv///Kqq/8AI1VV/wAnVVX/AAaqq/8AJNVW/wANVVX/ACJVVZ//ACJVVZ//AB1VVv8AGFVV/wAYVVX/AByqq/8AGFVV/wAcqqv/ABNVVv8AISqq/wAOVVX/ACWqqwj/AA5VVf8AJaqr/wAHKqv/ACcqqov/ACiqq4v/ACyqq///94AA/wAqgAB6/wAoVVV6/wAoVVX//+iAAP8AIyqrbaltqWj/ABeAAGOcY5z//9Sqq/8ACIAA///RVVWLV4v//8/VVf//9Sqr///Tqqv//+pVVQj//9Oqq///6lVV///aKqr//+Iqq///4KqrZWux///Z1VX/AB3VVf//06qr/wAVqqv//9Oqq/8AFaqr///P1VX/AArVVVeL///SqquL///VVVX///eAAGN6Y3po///ogABtbW1t///oKqto///uVVVjCP//7lVVY///9yqr///VVVWL///SqqsI9ycWi73/ABGqq/8AKtVV/wAjVVX/ACOqq/8AI1VV/wAjqqv/ACuqq/8AEdVVv4v/ADKqq4v/ACuAAP//7lVV/wAkVVX//9yqq/8AJFVV///cqqv/ABIqq2CL///NVVUI9ycGi73/ABHVVf8AKtVV/wAjqqv/ACOqq/8AI6qr/wAjqqv/ACvVVf8AEdVVv4v/ADNVVYv/ACuAAP//7lVV/wAjqqv//9yqq/8AI6qr///cqqv/ABHVVWCL///NVVWLV///7lVV///UKqv//9yqq///3FVV///cqqv//9xVVf//1FVV///uKqtXiwhvi///4aqr/wAHqqv//99VVf8AD1VVCEb7EwX/ABtVVf//7Kqr/wAVKqv//+hVVZpvmm//AAeAAP//4lVVi///4Kqri///zVVV///uVVVg///cqqv//9yqq///3Kqr///cqqv//9RVVf//7lVVV4tXi///1Cqr/wARqqv//9xVVf8AI1VV///cVVX/ACNVVf//7iqrtov/ADKqqwiL/wAfVVX/AAeAAP8AHaqrmqeap/8AFSqr/wAXqqv/ABtVVf8AE1VVCEH3EwX//+Sqq///8Kqr///jVVX///hVVW2L///MqquL///UgAD/ABHVVf//3FVV/wAjqqv//9xVVf8AI6qr///uKqv/ACvVVYu/CA73ufppFYth/wAH1VX//9jVVf8AD6qr///bqqv/AA+qq///26qr/wAVgAD//+Aqqv8AG1VV///kqqv/ABtVVf//5Kqr/wAgKqv//+qAALD///BVVbD///BVVf8AJtVV///4Kqv/ACiqq4u1i/8AJyqr/wAH1VX/ACRVVf8AD6qr/wAkVVX/AA+qq/8AH9VW/wAVgAD/ABtVVf8AG1VVCP8AG1VV/wAbVVX/ABWAAP8AH9VW/wAPqqv/ACRVVf8AD6qr/wAkVVX/AAfVVf8AJyqri7WL/wAoqqv///gqq/8AJtVV///wVVWw///wVVWw///qgAD/AB/VVf//5Kqr/wAaqqv//+Sqq/8AGqqr///gKqr/ABUqqv//26qr/wAPqqv//9uqq/8AD6qr///Y1VX/AAfVVWGLCP//1qqri2T///gqq///21VV///wVVX//9tVVf//8FVVa///6tVW///kqqv//+VVVf//5Kqr///lVVX//+qAAP//4Cqr///wVVVm///wVVVm///4Kqv//9kqq4v//9dVVQj3JxaLtf8ADyqr/wAj1VX/AB5VVf8AHaqr/wAeVVX/AB2qq/8AJCqr/wAO1VW1i/8AK1VVi6////Eqq/8AHKqr///iVVX/AByqq///4lVV/wAOVVX//9wqq4thi1////HVVf//21VV///jqqv//+Kqq///46qr///iqqv//9vVVf//8VVVX4sI///VVVWL///bqqv/AA6qq23/AB1VVW3/AB1VVXz/ACSqq4u3CPfB/aQVi///1VVV/wAH1VX//9iqq/8AD6qrZ/8AD6qrZ/8AFdVV///gVVWn///kqqun///kqqv/ACCAAP//6oAAsP//8FVVsP//8FVV/wAm1VX///gqq/8AKKqri/8AKVVVi/8AJqqr/wAH1VWv/wAPqquv/wAPqqur/wAVgACn/wAbVVUIp/8AG1VVof8AH9VWm/8AJFVVm/8AJFVVk/8AJyqri7WL/wAoqquD/wAm1VV7sHuwdf8AICqrb/8AG1VVb/8AG1VV///f1VX/ABWAAP//26qr/wAPqqv//9uqq/8AD6qr///ZgAD/AAfVVf//11VViwj//9dVVYv//9kqq///+CqrZv//8FVVZv//8FVV///fgAD//+qAAG///+Sqq2///+Sqq///6iqr///f1VX///BVVWb///BVVWb///gqq///2Sqri///11VV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Cyqr/wA4VVX/ABZVVf8ANKqr/wAWVVX/ADSqq6r/AC3VVf8AJ6qrsv8AJ6qrsv8ALiqq/wAeqqv/ADSqq/8AFlVV/wA0qqv/ABZVVf8AOFVV/wALKqvHiwj/ADqqq4v/ADeqqv//9NVV/wA0qqv//+mqq/8ANKqr///pqqv/AC2qqv//4VVV/wAmqqtk/wAmqqtk/wAeqqr//9Iqq/8AFqqr///LVVX/ABaqq///y1VV/wALVVX//8eqq4tPCPcnBov/AFCqq3z/AEuAAG3/AEZVVW3/AEZVVf//1tVV/wA9VVb//8uqq/8ANFVV///Lqqv/ADRVVf//wqqq/wApqqv//7mqq6r//7mqq6r//7Uqqv8AD4AA//+wqquL//+vVVWL//+0gAD///CAAP//uaqrbP//uaqrbP//woAA///WVVX//8tVVf//y6qrCP//y1VV///Lqqv//9ZVVv//wqqq///hVVX//7mqq///4VVV//+5qqv///Cqq///tIAAi///r1VVi0////TVVVP//+mqq1f//+mqq1ds///Sqqv//9hVVf//2VVV///YVVX//9lVVf//0dVW///hVVb//8tVVf//6VVV///LVVX//+lVVf//x6qr///0qqtPiwhPi1P/AAtVVVf/ABaqq1f/ABaqq///0qqr/wAeqqr//9lVVf8AJqqr///ZVVX/ACaqq///4VVW/wAtVVX//+lVVb///+lVVb////Sqq8OLx4v/AFCqq3z/AEuAAG3/AEZVVW3/AEZVVf//1qqr/wA9VVb//8tVVf8ANFVVCP//y1VV/wA0VVX//8KAAP8AKaqr//+5qquq//+5qquq//+0gAD/AA+AAP//r1VVizuL//+01VX///CAAP//uaqrbP//uaqrbP//wtVV///WVVVX///LqqtX///Lqqv//9aqq///wqqq///hVVX//7mqq///4VVV//+5qqv///Cqq///tIAAi///r1VVCItP///0qqtT///pVVVX///pVVVXbP//0qqr///Yqqv//9lVVf//2Kqr///ZVVVd///hVVb//8tVVf//6VVV///LVVX//+lVVf//x6qr///0qqtPi0+LU/8AC1VVV/8AFqqrV/8AFqqr///SgAD/AB6qqmT/ACaqqwhk/wAmqqv//+FVVf8ALVVV///pqqu////pqqu////01VXDi8eL/wBQqqv///CAAP8AS4AAbP8ARlVVbP8ARlVV///Wqqv/AD1VVv//zFVV/wA0VVX//8xVVf8ANFVV///Cqqv/ACmqq0SqRKr//7TVVf8AD4AA//+wqquLCP//r1VVi///tIAA///wgAD//7mqq2z//7mqq2z//8Kqqv//1lVV///Lqqv//8uqq///y6qr///Lqqv//9ZVVf//wqqqbP//uaqrbP//uaqr///wgAD//7SAAIv//69VVYtP///01VVT///pqqtX///pqqtX///hVVX//9Kqq2T//9lVVQhk///ZVVX//9Iqq///4VVW///LVVX//+lVVf//y1VV///pVVX//8eqq///9KqrT4tPi///yCqr/wALVVX//8xVVf8AFqqr///MVVX/ABaqq///0lVW/wAeqqr//9hVVf8AJqqr///YVVX/ACaqq///4NVW/wAtVVX//+lVVb///+lVVb////Sqq8OLxwiL/wBQqqt8/wBLgABt/wBGVVVt/wBGVVX//9aqq/8APVVW///LVVX/ADRVVf//y1VV/wA0VVX//8Kqq/8AKaqrRapFqv//tVVV/wAPgAD//7Cqq4v//69VVYv//7SAAP//8IAA//+5qqts//+5qqts///CgAD//9ZVVf//y1VV///LqqsI///LVVX//8uqq///1lVW///Cqqr//+FVVf//uaqr///hVVX//7mqq///8Kqr//+0gACL//+vVVWLT///9KqrU///6VVVV///6VVVV2z//9Kqq///2Kqr///ZVVX//9iqq///2VVVXf//4VVW///LVVX//+lVVf//y1VV///pVVX//8hVVv//9Kqr///FVVWLCE+L///Hqqv/AAtVVf//y1VV/wAWqqv//8tVVf8AFqqr///SKqv/AB6qqmT/ACaqq2T/ACaqq///4VVV/wAtVVX//+mqq7///+mqq7////TVVcOLxwgOHB6AcgT/AHKqq4v/AG3VVf8AESqr9P8AIlVV9P8AIlVV/wBgqqv/AC/VVv8AWFVV/wA9VVX/AFhVVf8APVVV/wBNqqvUzv8AVKqrzv8AVKqr/wA1Kqvo/wAnVVX/AGVVVf8AJ1VV//+aqqv/ADUqqy7O//+rVVXO//+rVVX/AE2AAELj///CqqsI4///wqqr/wBggAD//9AqqvT//92qq/T//92qq/8AbdVV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1VX/AGNVVf8AVKqr/wBUqqv/AFSqq/8AVKqr7v8AQtVV/wBxVVW8/wBxVVW8/wB5qqv/ABiAAPcWiwj3Jwf//41VVYv//5JVVnr//5dVVWn//5dVVWn//5+qq///0KqrM///w1VVM///w1VV//+yKqv//7dVVv//vFVV//+rVVX//7xVVf//q1VV///KgAAu///Yqqv//5qqq///2Kqr/wBlVVX//8rVVehI/wBUqqtI/wBUqqv//7KAAP8ASKqqM/8APKqrCDP/ADyqq///n1VV/wAvVVX//5aqq63//5aqq637Apz//41VVYv//41VVYv//5Iqq3oiaSJp//+fgAD//9BVVTP//8KqqzP//8Kqq///soAAQkj//6tVVUj//6tVVf//ytVVLv//2Kqr//+aqqsIY/8AZVVV///Kqqvo//+9VVX/AFSqq///vVVV/wBUqqv//7KAANT//6eqq/8APVVV//+nqqv/AD1VVf//n1VV/wAvqqsirSKt//+SKquc//+NVVWL//+NVVWL+wJ6//+Wqqtp//+Wqqtp//+fVVX//9CqqzP//8NVVQgz///DVVX//7Iqq///t1VW//+8VVX//6tVVf//vFVV//+rVVX//8qAAC7//9iqq///mqqr///Yqqv/AGVVVf//ytVV6Ej/AFSqq0j/AFSqq///soAA/wBIqqoz/wA8qqsz/wA8qqv//59VVf8AL1VV//+Wqqut//+Wqqut+wKc//+NVVWLCP//jVVVi///kiqreiJpImn//5+AAP//0FVVM///wqqrM///wqqr//+ygABCSP//q1VVSP//q1VV///K1VUu///Yqqv//5qqq2P/AGVVVf//yqqr6P//vVVV/wBUqqv//71VVf8AVKqr//+ygADU//+nqqv/AD1VVQj//6eqq/8APVVV//+fVVX/AC+qqyKtIq3//5Iqq5z//41VVYsIDhwegFj42hXxJPhb+Fv6hv6K+ov6jPqI/oj6iPqI+of+iPqI+oj6iP6I+MH4vyXy/Fv8Wf6I+oj+iP6I/of6iAX+iP6I/oj6iP6H/oj+hvqKBQ74lvhdFfhf/F33J/hd+F33J/xd+F/7J/xf/F8GDviA+KYVJQr3JxYmCvcFFigK9ycWKQoO+E7AFfIh+ub6uST1BQ746vimFSoKDviWFiIK9yr+KBX5kvmS/ZIHDvgj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VVb//+dVVf8AG1VVCN3bBa///9tVVf8AG9VV///Vqqv/ABOqq1v/ABOqq1v/AAnVVf//zKqri///yVVVi1P///WAAP//y4AAdlp2Wm5gZmZmZmBuWnZadv//y4AA///1gABTiwj//8aqq4tV/wAKqqv//81VVf8AFVVV///NVVX/ABVVVf//1FVW/wAeVVb//9tVVf8AJ1VVCPdQ90gV92P3XQWXff8ACdVV///w1VX/AAeqq///76qr/wAHqqv//++qq/8AA9VV///uKqqL///sqquL///Yqqt9aW///+NVVW///+NVVf//3lVV///xqqv//9iqq4v//9aqq4to/wAOVVX//+NVVf8AHKqrCA74TsAV8iH65vq5JPUFDvhOwBXyIQX/ACdVVf8AJKqr/wAqVVa0/wAtVVX/AC1VVf8AJ1VVsf8ALVVW/wArKqv/ADNVVf8AMFVV/wAzVVX/ADBVVf8ANlVW/wA0Kqv/ADlVVcMIJPYF///GqqtT///Jqqr//8uqq///zKqr///PVVX//8yqq///z1VV///Sqqr//9Sqq///2KqrZf//0qqr///Sqqv//9WqqmL//9iqq///21VVCPk6+SAV8iAF/wAnVVX/ACSqq/8AKlVWtP8ALVVV/wAtVVX/ACdVVbH/AC2qq/8AK1VVv/8AMKqrv/8AMKqr/wA2qqv/ADRVVf8AOVVVwwgk9QX//8aqq1P//8lVVf//y6qrV///z1VVV///z1VV///SVVX//9Sqq///2KqrZf//0qqr///TVVX//9Wqqv//11VW///Yqqv//9tVVQgO+er4phWL///mqqv/AAUqq///56qq/wAKVVX//+iqq/8AClVV///oqqv/AA2qq///69VVnHqcep////JVVaL///Wqq6L///Wqq/8AGIAA///61VWli6WL/wAYqqv/AAUqq/8AF1VV/wAKVVX/ABdVVf8AClVV/wAUgAD/AA2qq/8AEaqrnAj/ABGqq5z/AA2qqp//AAmqq6L/AAmqq6L/AATVVf8AGIAAi6WLpf//+yqr/wAYqqv///ZVVf8AF1VV///2VVX/ABdVVf//8lVW/wAUKqv//+5VVZz//+5VVZz//+uAAP8ADaqr///oqqv/AApVVf//6Kqr/wAKVVX//+dVVf8ABSqrcYsI///mqquL///nqqr///rVVf//6Kqr///1qqv//+iqq///9aqr///r1VX///JVVXp6enr///JVVf//69VV///1qqv//+iqq///9aqr///oqqv///rVVf//51VVi3EIDvjq+KYVKgoO+E7AFfIh9333dQX/ACaqq///5Kqr/wAp1VX//+qAALj///BVVbj///BVVf8AL9VV///4Kqv/ADKqq4v/AD1VVYv/ADmAAP8AC6qr/wA1qqv/ABdVVf8ANaqr/wAXVVX/AC9VVau0/wAoqqu0/wAoqqv/ACAqq/8AL1VV/wAXVVXB/wAXVVXB/wALqqv/ADmqq4v/AD1VVQiL/wAuqqv///kqq/8ALNVV///yVVW2///yVVW2///s1Vb/ACcqq///51VV/wAjVVUI94D3diT1+3/7dQX//9qqq/8AHKqrYv8AFiqq///TVVX/AA+qq///01VV/wAPqqv//9BVVv8AB9VV///NVVWLTYv//8XVVf//9FVV///Jqqv//+iqq///yaqr///oqqv//9BVVf//39VVYmJiYv//39VV///QKqv//+iqq///yVVV///oqqv//8lVVf//9FVVUYv//8KqqwiLW/8ABtVVXv8ADaqrYf8ADaqrYf8AEyqq///ZVVX/ABiqq///3KqrCA746vg8FYv//8Kqq/8AC6qrUf8AF1VV///JVVX/ABdVVf//yVVV/wAgKqv//9Aqq7RitGL/AC9VVf//39VV/wA1qqv//+iqq/8ANaqr///oqqv/ADmAAP//9FVV/wA9VVWLyYv/ADoqq/8AC6qr/wA2VVX/ABdVVf8ANlVV/wAXVVX/AC+qq/8AICqrtLQItLT/ACAqq/8AL9VV/wAXVVX/ADaqq/8AF1VV/wA2qqv/AAuqq8WL/wA9VVUI+RP+Ewf3J/0FFfhv+O38eweL/wAoqquD/wAm1VV7sHuw///qgAD/AB/VVXD/ABqqq3D/ABqqq///39VV/wAVKqr//9qqq/8AD6qr///aqqv/AA+qq2T/AAfVVf//11VVi///11VVi2X///iAAP//3KqrfP//3KqrfGz//+uAAP//5VVVcQj//+VVVXH//+pVVv//4YAA///vVVVo///vVVVogv//2tVV///+qqv//9iqqwgO+YsO+IkOHAUKDviJDhwFCg73gg72DnIOcg4xDqcO+1wOpw72DvlMiwT6a/pr/msGDvuzDvgfDhwIKxT3sxX8mPiY+f75UwaLDAmLDAocABoTAAwCAAECSgJTAlsCbwKEBCAE9AT8BnwHFwiDCI6LP/8ADlVV//+41VX/AByqq///vaqr/wAcqqv//72qq/8AJyqq///F1VX/ADGqq1n/ADGqq1nF///Yqqv/AEJVVf//41VV/wBCVVX//+NVVf8AR4AA///xqqv/AEyqq4vxi/8AXKqrpP8AU1VVvf8AU1VVvf8AQaqrzbvdCP8AL1VVOc1J/wBUqqtZ/wBUqqtZ6HL/AGVVVYv/AEtVVYvS/wAOVVX/AEKqq/8AHKqr/wBCqqv/AByqq/8AOqqq/wAnVVX/ADKqq73/ADKqq73/ACeqqsX/AByqq83/AByqq83/AA5VVf8AR1VVi/8ATKqrCPsqBotT///1gAD//8vVVXb//8+qq3b//8+qq///41VVYf//26qr///cVVX//9uqq///3FVV///VVVX//+Oqq1p2Wnb//8wqq///9YAA///JVVWLU4v//8vVVf8ACoAA///Pqqug///Pqqug///Vqqr/ABxVVf//26qr/wAjqqsI///bqqv/ACOqq///41VVtXb/ADBVVXb/ADBVVf//9YAA/wA0KquLwwj7KgaLU///9YAA///L1VV2///Pqqt2///Pqqv//+NVVWH//9uqq///3FVV///bqqv//9xVVf//1aqq///jqqv//8+qq3b//8+qq3b//8vVVf//9YAAU4tTi///y6qr/wAKgAD//89VVaD//89VVaD//9Wqq/8AHFVVZ/8AI6qrCGf/ACOqq///41VVtf//6qqr/wAwVVX//+qqq/8AMFVV///1VVX/ADQqq4vDCAv3KBwHUvsoBgv6u/q7/rsGC/cTQfid+hf4mv4X9xPV/Rn69gUL+Rz+9vkZ+vb7E9f8mv4Z/J36GQULi///s1VV/wAOVVVD/wAcqqv//7yqq/8AHKqr//+8qqv/ACeAAP//xVVV/wAyVVVZ/wAyVVVZxv//2FVV/wBDqqv//+Kqq/8AQ6qr///iqqv/AEgqqv//8VVV/wBMqquL14v/AEfVVf8ADqqr/wBDqqv/AB1VVf8AQ6qr/wAdVVX/ADqqqv8AJ6qr/wAxqqu9CP8AMaqrvf8AJ6qq/wA6qqv/AB2qq/8AQ1VV/wAdqqv/AENVVf8ADtVV04v/AEyqq4v/AEyqq///8Sqr/wBIKqr//+JVVf8AQ6qr///iVVX/AEOqq///2FVW/wA6qqr//85VVf8AMaqr///OVVX/ADGqq///xYAA/wAngAD//7yqq/8AHVVV//+8qqv/AB1VVUP/AA6qq///s1VViwj//7NVVYv//7fVVv//8VVV//+8VVX//+Kqq///vFVV///iqqtQ///YgAD//82qq///zlVV///Nqqv//85VVf//2IAA///FVVb//+NVVf//vFVV///jVVX//7xVVf//8aqr//+31VaL//+zVVUIC4vD/wAKgADAoL2gvaj/ACtVVbD/ACSqq7D/ACSqq/8AK4AAqL3/ABVVVb3/ABVVVcD/AAqqq8OL/wA3VVWL/wA0VVb///VVVf8AMVVV///qqqv/ADFVVf//6qqr/wArKqtusP//21VVCLD//9tVVaj//9Sqq6BZoFn/AAqAAFaLU4tT///1gAD//8uAAHZadlpuYGZmZmZgblp2Wnb//8uAAP//9YAAU4sIU4tW/wAKgABZoFmg///UgACoZrBmsG62drx2vP//9YAA/wA0gACLwwgL+rv5RP67BguL///XVVX/AAfVVf//2dVW/wAPqqv//9xVVf8AD6qr///cVVX/ABUqqmz/ABqqq///5aqr/wAaqqv//+Wqq/8AHyqq///rVVX/ACOqq3z/ACOqq3z/ACYqqv//+IAA/wAoqquL/wAnVVWL/wAlVVb/AAeAAP8AI1VVmv8AI1VVmqr/ABSqq/8AGqqr/wAaVVUI/wAaqqv/ABpVVf8AFNVVqpr/ACOqq5r/ACOqq/8AB4AA/wAmKqqL/wAoqquL/wAnVVX///iAAP8AJYAAfP8AI6qrfP8AI6qr///rKqv/AB8qqv//5VVV/wAaqqv//+VVVf8AGqqrbP8AFNVV///cqqua///cqqua///aqqr/AAeAAP//2Kqriwj//9aqq4v//9mqqv//+IAA///cqqt8///cqqt8bP//6yqr///lVVX//+VVVf//5VVV///lVVX//+rVVv//4NVW///wVVX//9xVVf//8FVV///cVVX///gqq///2oAAi///2KqrCAuLs/8ADtVVrf8AHaqrp/8AHaqrp/8AIoAAmf8AJ1VVi/8AJ1VVi/8AIaqr///x1VWn///jqqun///jqquZ///eKqqL///YqquL///Yqqt9aW///+NVVW///+NVVf//3lVV///xqqv//9iqq4sIY4v//91VVf8ADlVV///iqqv/AByqq///4qqr/wAcqqv///FVVa2L/wAnVVUIC4v//8Kqq/8AC6qr///GVVX/ABdVVVX/ABdVVVX/ACAqq///0KqrtP//11VVtP//11VV/wAv1VVr/wA2qqv//+iqq/8ANqqr///oqqvF///0VVX/AD1VVYv/AD1VVYv/ADmAAP8AC6qr/wA1qqv/ABdVVf8ANaqr/wAXVVX/AC9VVau0/wAoqqsItP8AKKqr/wAgKqv/AC9VVf8AF1VVwf8AF1VVwf8AC6qr/wA5qquL/wA9VVWLyf//9FVV/wA6Kqv//+iqq/8ANlVV///oqqv/ADZVVf//39VV/wAvqqtitGK0///Qqqv/ACAqq///ylVV/wAXVVX//8pVVf8AF1VV///GgAD/AAuqq///wqqriwhNi///xdVV///0VVX//8mqq///6Kqr///Jqqv//+iqq///0FVV///f1VViYmJi///f1VX//9Aqq///6Kqr///JVVX//+iqq///yVVV///0VVVRi///wqqrCAscBTmL/S8cBIcFCwAAAAEAAAAMAAAAFgAAAAIAAQABAFMAAQAEAAAAAgAAAAAAAQAAAAoAHgAsAAFsYXRuAAgABAAAAAD//wABAAAAAWNhbHQACAAAAAEAAAABAAQABgAAAAIACgAmAAMAAQAWAAEADgAAAAAAAQACABMALgABAAEAHgADAAEAFgABAA4AAAAAAAEAAgAYAC8AAQABAB4AAAABAAAACgAcAB4AAWxhdG4ACAAEAAAAAP//AAAAAAAAAAAAAQAAAADaU5nwAAAAAMT7fOAAAAAA0Jn+2gLsAEQEFgAACJcASggrAEoMnwBKAVgAAAFY/+cNJgEECCsBBAgrAQQIKwEECCsBBAKbAQQGHgEECaMBBAiXAEoIKwICCCsCAggrAlYIKwGPCCsBqggrAY8IKwGTCCsBWAgrAY8IKwHTCCsBWAgrAckIKwHJCCsBJQZPAAAIKwICCCsCvAgrAgIIKwJ3CCsCdx+fAAAfn/+2H58AAB+fAAAfn//NCCsCAggrAewIKwG6CCsCVggrAgIIKwGPCCsBjwgrAewIKwICCCsCAggrAPoIKwGwCCsCJQgrAUwIKwF5CCsBeQgrAXkIKwJWCCsB7AgrAYcIKwG6CCsBuggrA1YIKwJWCCsBuggrAlYEFgAAAxQAAAYpAAADFAAABikAAAINAAABigAAAQYAAAEGAAAAxQAAATsAAABXAAABOwAAAYoAAAPXAAAAAAAAAqoAAA==) format("opentype");
        }
    </style></defs>
  `;

const aspects = {
  N: `<g id="sector-n" transform="translate(11.3648, 0)"><path d="M0.37786189,5.11723954 C0.37786189,10.9164064 2.72455784,16.1667004 6.52495662,19.9669805 L21.3778619,5.11723954 L0.37786189,5.11723954 Z" id="sector" transform="translate(10.8779, 12.5421) rotate(-247.5) translate(-10.8779, -12.5421)"></path></g>`,
  NE: `<g id="sector-ne" transform="translate(19.4015, 3.3285)"><path d="M2.04211,3.45299143 C2.04211,9.25215827 4.38880596,14.5024523 8.18920473,18.3027324 L23.04211,3.45299143 L2.04211,3.45299143 Z" id="sector" transform="translate(12.5421, 10.8779) rotate(-202.5) translate(-12.5421, -10.8779)"></path></g>`,
  E: `<g id="sector-e" transform="translate(25.0842, 11.3648)"><path d="M2.04211,3.45299143 C2.04211,9.25215827 4.38880596,14.5024523 8.18920473,18.3027324 L23.04211,3.45299143 L2.04211,3.45299143 Z" id="sector" transform="translate(12.5421, 10.8779) rotate(-157.5) translate(-12.5421, -10.8779)"></path></g>`,
  SE: `<g id="sector-se" transform="translate(25.0842, 19.4015)"><path d="M0.37786189,5.11723954 C0.37786189,10.9164064 2.72455784,16.1667004 6.52495662,19.9669805 L21.3778619,5.11723954 L0.37786189,5.11723954 Z" id="sector" transform="translate(10.8779, 12.5421) rotate(-112.5) translate(-10.8779, -12.5421)"></path></g>`,
  S: `<g id="sector-s" transform="translate(17.0479, 25.0842)"><path d="M0.37786189,5.11723954 C0.37786189,10.9164064 2.72455784,16.1667004 6.52495662,19.9669805 L21.3778619,5.11723954 L0.37786189,5.11723954 Z" id="sector" transform="translate(10.8779, 12.5421) rotate(-67.5) translate(-10.8779, -12.5421)"></path></g>`,
  SW: `<g id="sector-sw" transform="translate(5.6827, 25.0842)"><path d="M2.04211,3.45299143 C2.04211,9.25215827 4.38880596,14.5024523 8.18920473,18.3027324 L23.04211,3.45299143 L2.04211,3.45299143 Z" id="sector" transform="translate(12.5421, 10.8779) rotate(-22.5) translate(-12.5421, -10.8779)"></path></g>`,
  W: `<g id="sector-w" transform="translate(0, 17.0479)"><path d="M2.04211,3.45299143 C2.04211,9.25215827 4.38880596,14.5024523 8.18920473,18.3027324 L23.04211,3.45299143 L2.04211,3.45299143 Z" id="sector" transform="translate(12.5421, 10.8779) rotate(22.5) translate(-12.5421, -10.8779)"></path></g>`,
  NW: `<g id="sector-nw" transform="translate(3.3285, 5.6827)"><path d="M0.37786189,5.11723954 C0.37786189,10.9164064 2.72455784,16.1667004 6.52495662,19.9669805 L21.3778619,5.11723954 L0.37786189,5.11723954 Z" id="sector" transform="translate(10.8779, 12.5421) rotate(-292.5) translate(-10.8779, -12.5421)"></path></g>`,
};

const icon = memoize(icon0, (...args) => args.join("-"));

function icon0(
  aspect: Aspect,
  aspectColor: string,
  iconSize: number,
  iconColor: string,
  borderColor: string,
  labelColor: string,
  labelFontSize: string,
  labelFont: "snowsymbolsiacs" | string,
  label: number | string,
): L.Icon {
  // 700533 - drawImage() fails silently when drawing an SVG image without @width or @height
  // https://bugzilla.mozilla.org/show_bug.cgi?id=700533
  const svg = `
    <svg width="42px" height="42px" viewBox="0 0 42 42" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    ${labelFont === "snowsymbolsiacs" ? snowsymbolsiacs : ""}
    <g id="Symbols" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="map-marker">

            <g id="map-marker-sectors" transform="translate(-4.0842, -4.0842)" fill="${aspectColor}">
              ${aspects[aspect]}
            </g>

            <g id="map-marker-bg" transform="translate(10, 10)" fill="${iconColor}">
                <circle id="Oval" cx="11" cy="11" r="11"></circle>
            </g>

            <g id="map-marker-circle-inner" transform="translate(10, 10)" stroke="${borderColor}">
                <text x="11" y="15" text-anchor="middle" fill="${labelColor}" font-size="${labelFontSize}" font-weight="lighter" font-family="${labelFont}">${label}</text>

                <g id="line-bold" stroke-width="2">
                    <circle id="Oval" cx="11" cy="11" r="11"></circle>
                </g>
                <g id="line-thin">
                    <circle id="Oval" cx="11" cy="11" r="11"></circle>
                </g>
                <g id="dotted-bold" stroke-dasharray="0,2.99" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                    <path d="M11,22 C17.0751322,22 22,17.0751322 22,11 C22,4.92486775 17.0751322,0 11,0 C4.92486775,0 0,4.92486775 0,11 C0,17.0751322 4.92486775,22 11,22 Z" id="Oval"></path>
                </g>
                <g id="dotted-thin" stroke-dasharray="0,3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11,22 C17.0751322,22 22,17.0751322 22,11 C22,4.92486775 17.0751322,0 11,0 C4.92486775,0 0,4.92486775 0,11 C0,17.0751322 4.92486775,22 11,22 Z" id="Oval"></path>
                </g>
            </g>

        </g>
    </g>
</svg>
    `;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const iconUrl = URL.createObjectURL(blob);
  return new Icon({
    iconUrl,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
  });
}
