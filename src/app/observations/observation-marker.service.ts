import { Injectable } from "@angular/core";
import { formatDate } from "@angular/common";
import { Canvas, CircleMarker, DivIcon, Icon, LatLng, Marker, MarkerOptions } from "leaflet";
import {
  degreeToAspect,
  GenericObservation,
  ImportantObservation,
  ObservationSource,
  ObservationType,
  WeatherStationParameter,
} from "./models/generic-observation.model";
import { Aspect, SnowpackStability } from "../enums/enums";
import { FilterSelectionData } from "./filter-selection-data";
import { makeIcon } from "./make-icon";

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
  public markerLabel: FilterSelectionData | undefined = undefined;
  public weatherStationLabel: WeatherStationParameter | undefined = undefined;
  public markerClassify: FilterSelectionData | undefined;

  constructor() {}

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
    marker.bindTooltip(
      () =>
        [
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
          .join("<br>"),
      {
        opacity: 1,
        className: "obs-tooltip",
      },
    );
  }

  toMarkerRadius(observation: GenericObservation): number {
    if (this.isWebcam(observation)) {
      return 20;
    } else if (this.isObserver(observation)) {
      return 20;
    } else if (this.isWeatherStation(observation)) {
      return 30;
    }
    return 40;
  }

  getBorderColor(observation: GenericObservation) {
    if (this.isWeatherStation(observation)) {
      return "#555555";
    } else if (this.isWebcam(observation)) {
      return "#000";
    } else if (observation?.$source === ObservationSource.SnowLine) {
      return "#777777";
    } else {
      return "#000";
    }
  }

  getLabelFontSize(observation: GenericObservation) {
    if (this.isWebcam(observation)) {
      return "6";
    } else if (this.isWeatherStation(observation)) {
      return "10";
    } else {
      return "12";
    }
  }

  toMarkerColor(observation: GenericObservation): string {
    if (this.isWebcam(observation)) {
      return "black";
    } else if (this.isObserver(observation)) {
      return "#ca0020";
    } else if (this.isWeatherStation(observation)) {
      return this.toMarkerColorWeatherStation(observation);
    } else {
      return this.markerClassify?.findForObservation(observation)?.color ?? "white";
    }
  }

  private toMarkerColorWeatherStation(observation: GenericObservation) {
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

  private isWebcam(observation: GenericObservation) {
    return observation?.$type === ObservationType.Webcam;
  }

  private isObserver(observation: GenericObservation) {
    return observation?.$type === ObservationType.TimeSeries && observation?.$source === ObservationSource.Observer;
  }

  private isWeatherStation(observation: GenericObservation) {
    return (
      observation?.$type === ObservationType.TimeSeries &&
      observation?.$source === ObservationSource.AvalancheWarningService
    );
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

  private getLabel(observation: GenericObservation) {
    if (this.isWeatherStation(observation)) {
      return this.getLabelWeatherStation(observation);
    } else if (this.markerLabel?.key === "elevation") {
      return isFinite(observation.elevation) ? Math.round(observation.elevation / 100) : "";
    } else {
      return this.markerLabel?.findForObservation(observation)?.label ?? "";
    }
  }

  private getLabelWeatherStation(observation: GenericObservation) {
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

  toZIndex(observation: GenericObservation) {
    return zIndex[observation.stability ?? "unknown"] ?? 0;
  }

  private getIcon(observation: GenericObservation, isHighlighted: boolean): Icon | DivIcon {
    const iconSize = this.toMarkerRadius(observation);
    const iconColor = isHighlighted ? "#ff0000" : this.toMarkerColor(observation);
    const labelColor = isHighlighted ? "#fff" : "#000";
    const label = this.getLabel(observation);
    const borderColor = this.getBorderColor(observation);
    const labelFont =
      this.markerLabel?.key === "importantObservations"
        ? "snowsymbolsiacs"
        : `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'`;
    const labelFontSize = this.getLabelFontSize(observation);
    const aspect = observation.aspect;
    const aspectColor = "#898989";
    return makeIcon(aspect, aspectColor, iconSize, iconColor, borderColor, labelColor, labelFontSize, labelFont, label);
  }
}
