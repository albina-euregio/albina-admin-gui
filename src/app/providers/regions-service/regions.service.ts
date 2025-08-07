import { Injectable, inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { FeatureCollection, MultiPolygon, Geometry } from "geojson";
import aggregatedRegions from "../../../assets/aggregated_regions.json";
import { default as regionsNamesDe } from "@eaws/micro-regions_names/de.json";
import { default as regionsNamesIt } from "@eaws/micro-regions_names/it.json";
import { default as regionsNamesEn } from "@eaws/micro-regions_names/en.json";
import { default as regionsNamesFr } from "@eaws/micro-regions_names/fr.json";
import { default as regionsNamesEs } from "@eaws/micro-regions_names/es.json";
import { default as regionsNamesCa } from "@eaws/micro-regions_names/ca.json";
import { default as regionsNamesOc } from "@eaws/micro-regions_names/oc.json";
import { loadRegions, loadRegionsEuregio } from "./regions-loader.mjs";

@Injectable()
export class RegionsService {
  private translateService = inject(TranslateService);

  // Level 1 regions: parts of provinces
  getLevel1Regions(id: string): string[] {
    return aggregatedRegions.level1.find((ids) => ids.includes(id)) ?? [];
  }

  // Level 2 regions: provinces
  getLevel2Regions(id: string): string[] {
    return aggregatedRegions.level2.find((ids) => ids.includes(id)) ?? [];
  }

  getRegionsAsync(): Promise<FeatureCollection<MultiPolygon, RegionProperties>> {
    return loadRegions().then((r) => this.translateNames(r));
  }

  async getRegionsEuregio(): Promise<FeatureCollection<MultiPolygon, RegionProperties>> {
    return loadRegionsEuregio();
  }

  getRegionNames(): typeof regionsNamesDe {
    switch (this.translateService.currentLang) {
      case "de":
        return regionsNamesDe;
      case "it":
        return regionsNamesIt;
      case "en":
        return regionsNamesEn;
      case "fr":
        return regionsNamesFr;
      case "es":
        return regionsNamesEs;
      case "ca":
        return regionsNamesCa;
      case "oc":
        return regionsNamesOc;
      default:
        return regionsNamesEn;
    }
  }

  private translateNames(data: FeatureCollection<Geometry, RegionProperties>) {
    data.features.forEach((feature) => (feature.properties.name = this.getRegionName(feature.properties.id)));
    return data;
  }

  getRegionName(id: string): string {
    return this.getRegionNames()[id] ?? id;
  }
}

export interface RegionProperties {
  id: string;
  name?: string;
}

export interface RegionWithElevationProperties extends RegionProperties {
  elevation: "high" | "low" | "low_high";
  threshold?: number;
}
