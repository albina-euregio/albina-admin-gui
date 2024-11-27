import { Injectable, inject } from "@angular/core";
import { Marker } from "leaflet";
import { degreeToAspect, GenericObservation, WeatherStationParameter } from "./models/generic-observation.model";
import { Aspect } from "../enums/enums";
import { makeIcon } from "./make-icon";
import { ObservationMarkerService } from "./observation-marker.service";
import type { FeatureProperties } from "../../../observations-api/src/fetch/weather-stations";

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

@Injectable()
export class ObservationMarkerWeatherStationService<T extends Partial<GenericObservation<FeatureProperties>>> {
  private observationMarkerService = inject<ObservationMarkerService<T>>(ObservationMarkerService);

  public weatherStationLabel: WeatherStationParameter | undefined = undefined;

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

  toValue(observation: T): number {
    switch (this.weatherStationLabel) {
      case WeatherStationParameter.GlobalRadiation:
        return observation.$data.GS_O;
      case WeatherStationParameter.SnowHeight:
        return observation.$data.HS;
      case WeatherStationParameter.SnowDifference24h:
        return observation.$data.HSD24;
      case WeatherStationParameter.SnowDifference48h:
        return observation.$data.HSD48;
      case WeatherStationParameter.SnowDifference72h:
        return observation.$data.HSD72;
      case WeatherStationParameter.AirTemperature:
        return observation.$data.LT;
      case WeatherStationParameter.AirTemperatureMax:
        return observation.$data.LT_MAX;
      case WeatherStationParameter.AirTemperatureMin:
        return observation.$data.LT_MIN;
      case WeatherStationParameter.SurfaceTemperature:
        return observation.$data.OFT;
      case WeatherStationParameter.SurfaceHoar:
        return this.getSurfaceHoar(observation.$data);
      case WeatherStationParameter.SurfaceHoarCalc:
        return this.calcSurfaceHoarProbability(observation.$data);
      case WeatherStationParameter.DewPoint:
        return observation.$data.TD;
      case WeatherStationParameter.RelativeHumidity:
        return observation.$data.RH;
      case WeatherStationParameter.WindSpeed:
        return observation.$data.WG;
      case WeatherStationParameter.WindDirection:
        return observation.$data.WR;
      case WeatherStationParameter.WindGust:
        return observation.$data.WG_BOE;
      default:
        return NaN;
    }
  }

  toMarkerColor(observation: T): string {
    const value = this.toValue(observation);
    switch (this.weatherStationLabel) {
      case WeatherStationParameter.GlobalRadiation:
        return this.globalRadiationColor(value);
      case WeatherStationParameter.SnowHeight:
        return this.snowHeightColor(value);
      case WeatherStationParameter.SnowDifference24h:
        return this.snowDifferenceColor(value);
      case WeatherStationParameter.SnowDifference48h:
        return this.snowDifferenceColor(value);
      case WeatherStationParameter.SnowDifference72h:
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
        return this.surfaceHoarColor(value);
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

  private getLabel(observation: T) {
    const value = this.toValue(observation);
    if (this.weatherStationLabel === WeatherStationParameter.WindDirection) {
      return value ? degreeToAspect(value) : "";
    } else {
      return value ? Math.round(value) : "";
    }
  }
}
