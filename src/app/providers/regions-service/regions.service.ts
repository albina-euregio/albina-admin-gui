import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { FeatureCollection, MultiPolygon, Geometry } from "geojson";
import { mergeFeatureCollections } from "./mergeFeatureCollections";
import { ConstantsService } from "../constants-service/constants.service";
import aggregatedRegions from "../../../assets/aggregated_regions.json"
// @ts-ignore
import RegionsEuregio_AT_07 from "@eaws/micro-regions/AT-07_micro-regions.geojson.json";
// @ts-ignore
import RegionsEuregio_IT_32_BZ from "@eaws/micro-regions/IT-32-BZ_micro-regions.geojson.json";
// @ts-ignore
import RegionsEuregio_IT_32_TN from "@eaws/micro-regions/IT-32-TN_micro-regions.geojson.json";
//
const RegionsEuregio: FeatureCollection<MultiPolygon, RegionProperties> = mergeFeatureCollections(
  RegionsEuregio_AT_07 as FeatureCollection<MultiPolygon, RegionProperties>,
  RegionsEuregio_IT_32_BZ as FeatureCollection<MultiPolygon, RegionProperties>,
  RegionsEuregio_IT_32_TN as FeatureCollection<MultiPolygon, RegionProperties>,
);

// @ts-ignore
import RegionsAran_ES_CT_L from "@eaws/micro-regions/ES-CT-L_micro-regions.geojson.json";
//
const RegionsAran: FeatureCollection<MultiPolygon, RegionProperties> = mergeFeatureCollections(
  RegionsAran_ES_CT_L as FeatureCollection<MultiPolygon, RegionProperties>
);

// @ts-ignore
import RegionsSwitzerland_CH from "@eaws/micro-regions/CH_micro-regions.geojson.json";

const RegionsSwitzerland: FeatureCollection<MultiPolygon, RegionProperties> = mergeFeatureCollections(
  RegionsSwitzerland_CH as FeatureCollection<MultiPolygon, RegionProperties>
);

import {default as regionsNamesDe} from "@eaws/micro-regions_names/de.json";
import {default as regionsNamesIt} from "@eaws/micro-regions_names/it.json";
import {default as regionsNamesEn} from "@eaws/micro-regions_names/en.json";
import {default as regionsNamesFr} from "@eaws/micro-regions_names/fr.json";
import {default as regionsNamesEs} from "@eaws/micro-regions_names/es.json";
import {default as regionsNamesCa} from "@eaws/micro-regions_names/ca.json";
import {default as regionsNamesOc} from "@eaws/micro-regions_names/oc.json";

import {
  loadRegions,
  loadRegionsAran,
  loadRegionsEuregio,
  loadRegionsSwitzerland,
  loadRegionsWithElevation,
} from "./regions-loader.mjs";

@Injectable()
export class RegionsService {
  initialAggregatedRegion: Record<string, string[]> = {
    "AT-07": RegionsEuregio.features.map(f => f.properties.id).filter(id => id.startsWith("AT-07")),
    "IT-32-BZ": RegionsEuregio.features.map(f => f.properties.id).filter(id => id.startsWith("IT-32-BZ")),
    "IT-32-TN": RegionsEuregio.features.map(f => f.properties.id).filter(id => id.startsWith("IT-32-TN")),
    "ES-CT-L": RegionsAran.features.map(f => f.properties.id).filter(id => id.startsWith("ES-CT-L")),
    "CH": RegionsSwitzerland.features.map(f => f.properties.id).filter(id => id.startsWith("CH")),
  };

  // Level 1 regions: parts of provinces
  level1: string[][] = aggregatedRegions.level1
  // Level 2 regions: provinces
  level2: string[][] = aggregatedRegions.level2

  constructor(
    private translateService: TranslateService,
    private constantsService: ConstantsService,
  ) {}

  getLevel1Regions(id: string): string[] {
    for (let i = 0; i < this.level1.length; i++) {
      if (this.level1[i].includes(id)) {
        return this.level1[i];
      }
    }
    return [];
  }

  getLevel2Regions(id: string): string[] {
    for (let i = 0; i < this.level2.length; i++) {
      if (this.level2[i].includes(id)) {
        return this.level2[i];
      }
    }
    return [];
  }

  getRegionsAsync(): Promise<FeatureCollection<MultiPolygon, RegionProperties>> {
    return loadRegions().then((r) => this.translateNames(r))
  }

  getRegionsWithElevationAsync(): Promise<FeatureCollection<MultiPolygon, RegionWithElevationProperties>> {
    return loadRegionsWithElevation().then((r) => this.translateNames(r));
  }

  async getActiveRegion(activeRegionCode: string): Promise<FeatureCollection<MultiPolygon, RegionProperties>> {
    switch (activeRegionCode) {
      case this.constantsService.codeAran:
        return loadRegionsAran();
      case this.constantsService.codeSwitzerland:
        return loadRegionsSwitzerland();
      case this.constantsService.codeTyrol:
      case this.constantsService.codeSouthTyrol:
      case this.constantsService.codeTrentino:
        return loadRegionsEuregio();
      default:
        return this.getRegionsAsync();
    }
  }

  getRegionsEuregio(): FeatureCollection<MultiPolygon, RegionProperties> {
    return RegionsEuregio;
  }

  getRegionNames(): typeof regionsNamesDe {
    switch (this.translateService.currentLang) {
      case 'de':
        return regionsNamesDe;
      case 'it':
        return regionsNamesIt;
      case 'en':
        return regionsNamesEn;
      case 'fr':
        return regionsNamesFr;
      case 'es':
        return regionsNamesEs;
      case 'ca':
        return regionsNamesCa;
      case 'oc':
        return regionsNamesOc;
      default:
        return regionsNamesEn;
    }
  }

  private translateNames(data: FeatureCollection<Geometry, RegionProperties>) {
    data.features.forEach((feature) => (feature.properties.name = this.getRegionName(feature.properties.id)));
    return data;
  }

  getRegionName(id: string) {
    return this.getRegionNames()[id];
  }
}

export interface RegionProperties {
  id: string;
  name?: string;
  name_ar?: string;
  name_cat?: string;
  name_de?: string;
  name_en?: string;
  name_it?: string;
  name_sp?: string;
}

export interface RegionWithElevationProperties extends RegionProperties {
  elevation: "high" | "low" | "low_high";
}
