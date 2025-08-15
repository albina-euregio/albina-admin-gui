import type { FeatureProperties } from "../../../observations-api/src/fetch/weather-stations";
import { Aspect } from "../enums/enums";
import { makeIcon } from "./make-icon";
import { degreeToAspect, GenericObservation } from "./models/generic-observation.model";
import { ObservationMarkerService } from "./observation-marker.service";
import { inject, Injectable } from "@angular/core";
import { Marker } from "leaflet";

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

const drySnowfallLevelThresholds = [
  0, 500, 700, 900, 1100, 1300, 1500, 1700, 1900, 2100, 2300, 2500, 2700, 2900, 3100, 4000,
];
const drySnowfallLevelColors = {
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
  "15": "#330000",
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

const relativeHumidityThresholds = [0.0, 0.2, 0.4, 0.6, 0.8, 1];
const relativeHumidityColors = {
  "0": "#fff",
  "1": "#f7fbff",
  "2": "#deebf7",
  "3": "#9ecae1",
  "4": "#4292c6",
  "5": "#08306b",
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

const surfaceHoarCalculationThresholds = [
  0, 100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000,
];
const surfaceHoarCalculationColors = {
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

export enum WeatherStationParameter {
  GlobalRadiation = "GlobalRadiation",
  SnowHeight = "SnowHeight",
  SnowDifference = "SnowDifference",
  AirTemperature = "AirTemperature",
  AirTemperatureMax = "AirTemperatureMax",
  AirTemperatureMin = "AirTemperatureMin",
  SurfaceTemperature = "SurfaceTemperature",
  SurfaceHoar = "SurfaceHoar",
  SurfaceHoarCalc = "SurfaceHoarCalc",
  DewPoint = "DewPoint",
  RelativeHumidity = "RelativeHumidity",
  WindDirection = "WindDirection",
  WindSpeed = "WindSpeed",
  WindGust = "WindGust",
  DrySnowfallLevel = "DrySnowfallLevel",
}

@Injectable()
export class ObservationMarkerWeatherStationService<T extends Partial<GenericObservation<FeatureProperties>>> {
  private observationMarkerService = inject<ObservationMarkerService<T>>(ObservationMarkerService);

  public weatherStationLabel: WeatherStationParameter | undefined = undefined;

  readonly allParameters: WeatherStationParameter[] = Object.values(WeatherStationParameter);

  createMarker(observation: T, isHighlighted = false): Marker | undefined {
    try {
      const filterSelectionValue = isHighlighted ? this.observationMarkerService.highlighted : undefined;
      const icon = makeIcon(
        observation.aspect,
        "#898989",
        filterSelectionValue?.radius ?? 30,
        filterSelectionValue?.color ?? this.toMarkerColor(observation),
        filterSelectionValue?.borderColor ?? "#555555",
        filterSelectionValue?.labelColor ?? "#000",
        filterSelectionValue?.labelFontSize ?? 10,
        undefined,
        this.getLabel(observation),
      );
      return this.observationMarkerService.createMarkerForIcon(observation, icon, filterSelectionValue);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  toLabelKey(parameter: WeatherStationParameter): `observations.weatherStations.tooltips.${string}` {
    switch (parameter) {
      case WeatherStationParameter.SnowHeight:
        return "observations.weatherStations.tooltips.snowHeight";
      case WeatherStationParameter.SnowDifference:
        return "observations.weatherStations.tooltips.snowDifference";
      case WeatherStationParameter.AirTemperature:
        return "observations.weatherStations.tooltips.airTemperature";
      case WeatherStationParameter.AirTemperatureMax:
        return "observations.weatherStations.tooltips.airTemperatureMax";
      case WeatherStationParameter.AirTemperatureMin:
        return "observations.weatherStations.tooltips.airTemperatureMin";
      case WeatherStationParameter.SurfaceTemperature:
        return "observations.weatherStations.tooltips.surfaceTemperature";
      case WeatherStationParameter.DewPoint:
        return "observations.weatherStations.tooltips.dewPoint";
      case WeatherStationParameter.SurfaceHoar:
        return "observations.weatherStations.tooltips.surfaceHoar";
      case WeatherStationParameter.SurfaceHoarCalc:
        return "observations.weatherStations.tooltips.surfaceHoarCalc";
      case WeatherStationParameter.WindSpeed:
        return "observations.weatherStations.tooltips.windSpeed";
      case WeatherStationParameter.WindGust:
        return "observations.weatherStations.tooltips.windGust";
      case WeatherStationParameter.WindDirection:
        return "observations.weatherStations.tooltips.windDirection";
      case WeatherStationParameter.RelativeHumidity:
        return "observations.weatherStations.tooltips.relativeHumidity";
      case WeatherStationParameter.GlobalRadiation:
        return "observations.weatherStations.tooltips.globalRadiation";
      case WeatherStationParameter.DrySnowfallLevel:
        return "observations.weatherStations.tooltips.drySnowfallLevel";
    }
  }

  toIcon(parameter: WeatherStationParameter): `ph ph-${string}` {
    switch (parameter) {
      case WeatherStationParameter.SnowHeight:
        return "ph ph-arrows-vertical";
      case WeatherStationParameter.SnowDifference:
        return "ph ph-trend-up";
      case WeatherStationParameter.AirTemperature:
        return "ph ph-thermometer-simple";
      case WeatherStationParameter.AirTemperatureMax:
        return "ph ph-thermometer-simple";
      case WeatherStationParameter.AirTemperatureMin:
        return "ph ph-thermometer-simple";
      case WeatherStationParameter.SurfaceTemperature:
        return "ph ph-thermometer-cold";
      case WeatherStationParameter.DewPoint:
        return "ph ph-thermometer-hot";
      case WeatherStationParameter.SurfaceHoar:
        return "ph ph-caret-down";
      case WeatherStationParameter.SurfaceHoarCalc:
        return "ph ph-caret-line-down";
      case WeatherStationParameter.WindSpeed:
        return "ph ph-wind";
      case WeatherStationParameter.WindGust:
        return "ph ph-tornado";
      case WeatherStationParameter.WindDirection:
        return "ph ph-arrow-up-right";
      case WeatherStationParameter.RelativeHumidity:
        return "ph ph-drop";
      case WeatherStationParameter.GlobalRadiation:
        return "ph ph-sun";
      case WeatherStationParameter.DrySnowfallLevel:
        return "ph ph-drop-half";
    }
  }

  toStatistics(observation: T): FeatureProperties["statistics"][keyof FeatureProperties["statistics"]] {
    const data: FeatureProperties = observation.$data;
    const statistics = data.statistics;
    switch (this.weatherStationLabel) {
      case WeatherStationParameter.GlobalRadiation:
        return statistics?.ISWR;
      case WeatherStationParameter.SnowHeight:
        return statistics?.HS;
      case WeatherStationParameter.SnowDifference:
        return statistics?.HS;
      case WeatherStationParameter.AirTemperature:
        return statistics?.TA;
      case WeatherStationParameter.AirTemperatureMax:
        return statistics?.TA;
      case WeatherStationParameter.AirTemperatureMin:
        return statistics?.TA;
      case WeatherStationParameter.SurfaceTemperature:
        return statistics?.TSS;
      case WeatherStationParameter.DewPoint:
        return statistics?.TD;
      case WeatherStationParameter.RelativeHumidity:
        return statistics?.RH;
      case WeatherStationParameter.WindSpeed:
        return statistics?.VW;
      case WeatherStationParameter.WindDirection:
        return statistics?.DW;
      case WeatherStationParameter.WindGust:
        return statistics?.VW_MAX;
      case WeatherStationParameter.DrySnowfallLevel:
        return statistics?.SnowLine;
      default:
        return undefined;
    }
  }

  toValue(observation: T): number {
    const data: FeatureProperties = observation.$data;
    switch (this.weatherStationLabel) {
      case WeatherStationParameter.GlobalRadiation:
        return this.toStatistics(observation)?.average;
      case WeatherStationParameter.SnowHeight:
        return this.toStatistics(observation)?.average;
      case WeatherStationParameter.SnowDifference:
        return this.toStatistics(observation)?.delta;
      case WeatherStationParameter.AirTemperature:
        return this.toStatistics(observation)?.average;
      case WeatherStationParameter.AirTemperatureMax:
        return this.toStatistics(observation)?.max;
      case WeatherStationParameter.AirTemperatureMin:
        return this.toStatistics(observation)?.min;
      case WeatherStationParameter.SurfaceTemperature:
        return this.toStatistics(observation)?.average;
      case WeatherStationParameter.SurfaceHoar:
        return this.getSurfaceHoar(data);
      case WeatherStationParameter.SurfaceHoarCalc:
        return this.calcSurfaceHoarProbability(data);
      case WeatherStationParameter.DewPoint:
        return this.toStatistics(observation)?.average;
      case WeatherStationParameter.RelativeHumidity:
        return this.toStatistics(observation)?.average;
      case WeatherStationParameter.WindSpeed:
        return this.toStatistics(observation)?.average;
      case WeatherStationParameter.WindDirection:
        return this.toStatistics(observation)?.median;
      case WeatherStationParameter.WindGust:
        return this.toStatistics(observation)?.max;
      case WeatherStationParameter.DrySnowfallLevel:
        return this.toStatistics(observation)?.max;
      default:
        return NaN;
    }
  }

  toMarkerColor(observation: T): string {
    const value = this.toValue(observation);
    if (typeof value !== "number" || !isFinite(value)) {
      return "white";
    }
    switch (this.weatherStationLabel) {
      case WeatherStationParameter.GlobalRadiation:
        return this.globalRadiationColor(value);
      case WeatherStationParameter.SnowHeight:
        return this.snowHeightColor(value);
      case WeatherStationParameter.SnowDifference:
        return this.snowDifferenceColor(value);
      case WeatherStationParameter.AirTemperature:
        return this.temperatureColor(value);
      case WeatherStationParameter.AirTemperatureMax:
        return this.temperatureColor(value);
      case WeatherStationParameter.AirTemperatureMin:
        return this.temperatureColor(value);
      case WeatherStationParameter.SurfaceTemperature:
        return this.temperatureColor(value);
      case WeatherStationParameter.SurfaceHoar:
        return this.surfaceHoarColor(value);
      case WeatherStationParameter.SurfaceHoarCalc:
        return this.surfaceHoarCalculationColor(value);
      case WeatherStationParameter.DewPoint:
        return this.dewPointColor(value);
      case WeatherStationParameter.RelativeHumidity:
        return this.relativeHumidityColor(value);
      case WeatherStationParameter.WindSpeed:
        return this.windColor(value);
      case WeatherStationParameter.WindDirection:
        return value ? aspectColors[degreeToAspect(value)] : "white";
      case WeatherStationParameter.WindGust:
        return this.windColor(value);
      case WeatherStationParameter.DrySnowfallLevel:
        return this.drySnowfallLevelColor(value);
      default:
        return "white";
    }
  }

  private getSurfaceHoar(data: T["$data"]): number {
    const tempDiff = data.TD - data.OFT;
    if (data.OFT < 0 && tempDiff > 0) {
      return tempDiff;
    } else {
      return undefined;
    }
  }

  // Lehning et. al. 2002
  private calcSurfaceHoarProbability(data: T["$data"]): number {
    const grainSize = 1; // assumption
    //z0 0.5 to 2.4 mm for snow surfaces.
    const z0 = (0.003 + grainSize / 5) / 1000; //Lehning 2000, for grainSize = 1 mm only 0,203

    const lw = 2256 * 1000;
    const li = 2838 * 1000;

    let result = -1;

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
    const index = snowHeightThresholds.findIndex((e) => e >= snowHeight);
    return index >= 0 ? elevationColors[index] : "white";
  }

  private snowDifferenceColor(snowDifference: number) {
    const index = snowDifferenceThresholds.findIndex((e) => e >= snowDifference);
    return index >= 0 ? snowDifferenceColors[index] : "white";
  }

  private drySnowfallLevelColor(value: number) {
    const index = drySnowfallLevelThresholds.findIndex((e) => e >= value);
    return index >= 0 ? drySnowfallLevelColors[index] : "white";
  }

  private temperatureColor(temperature: number) {
    const index = temperatureThresholds.findIndex((e) => e >= temperature);
    return index >= 0 ? temperatureColors[index] : "white";
  }

  private surfaceHoarColor(surfaceHoar: number) {
    const index = surfaceHoarThresholds.findIndex((e) => e >= surfaceHoar);
    return index >= 0 ? surfaceHoarColors[index] : "white";
  }

  private surfaceHoarCalculationColor(surfaceHoarCalculation: number) {
    const index = surfaceHoarCalculationThresholds.findIndex((e) => e >= surfaceHoarCalculation);
    return index >= 0 ? surfaceHoarCalculationColors[index] : "white";
  }

  private dewPointColor(dewPoint: number) {
    const index = dewPointThresholds.findIndex((e) => e >= dewPoint);
    return index >= 0 ? dewPointColors[index] : "white";
  }

  private relativeHumidityColor(relativeHumidity: number) {
    const index = relativeHumidityThresholds.findIndex((e) => e >= relativeHumidity);
    return index >= 0 ? relativeHumidityColors[index] : "white";
  }

  private windColor(wind: number) {
    const index = windThresholds.findIndex((e) => e >= wind);
    return index >= 0 ? windColors[index] : "white";
  }

  private globalRadiationColor(globalRadiation: number) {
    const index = globalRadiationThresholds.findIndex((e) => e >= globalRadiation);
    return index >= 0 ? windColors[index] : "white";
  }

  private getLabel(observation: T) {
    const value = this.toValue(observation);
    if (typeof value !== "number" || !isFinite(value)) {
      return "";
    } else if (this.weatherStationLabel === WeatherStationParameter.WindDirection) {
      return degreeToAspect(value);
    } else if (this.weatherStationLabel === WeatherStationParameter.DrySnowfallLevel) {
      return Math.round(value / 100);
    } else if (this.weatherStationLabel === WeatherStationParameter.RelativeHumidity) {
      return Math.round(parseFloat(value.toFixed(2)) * 100);
    } else if (this.weatherStationLabel === WeatherStationParameter.SurfaceHoarCalc) {
      return Math.round(value / 100000);
    } else {
      return Math.round(value);
    }
  }
}
