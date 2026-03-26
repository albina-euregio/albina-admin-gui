import { FeatureCollectionSchema } from "@albina-euregio/linea/listing";
import { FeatureCollectionSchema as LegacyFeatureCollectionSchema } from "@albina-euregio/linea/listing-legacy";
import { Injectable } from "@angular/core";

import sources from "../../assets/config/stations.json";

type LineaStationSource = {
  stations: string;
  smetOperators: string;
  smet: string[];
};

export interface LineaStationFeature {
  id: string;
  name: string;
  shortName: string;
  smetId: string;
  smet: string[];
  latitude: number;
  longitude: number;
  hasPsum: boolean;
}

@Injectable({ providedIn: "root" })
export class GraphicsService {
  async loadLineaStations(): Promise<LineaStationFeature[]> {
    const stationById = new Map<string, LineaStationFeature>();

    for (const source of sources as LineaStationSource[]) {
      const response = await fetch(source.stations);
      const json = await response.json();
      const searchParams = new URL(source.stations, location.href).searchParams;
      const isLegacy = searchParams.get("v") === "legacy";
      const schema = isLegacy ? LegacyFeatureCollectionSchema : FeatureCollectionSchema;
      const collection = schema.parse(json, { reportInput: true });

      for (const feature of collection.features) {
        if (!new RegExp(source.smetOperators).test(feature.properties.operator)) {
          continue;
        }

        const id = feature.id;
        if (stationById.has(id)) {
          continue;
        }

        stationById.set(id, {
          id,
          name: feature.properties?.name,
          shortName: feature.properties?.shortName ?? feature.properties?.name ?? id,
          smetId: feature.properties?.shortName ?? id,
          smet: source.smet,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          hasPsum: feature.properties.PSUM_6.value != undefined,
        });
      }
    }

    return [...stationById.values()];
  }

  getSmetUrl(station: Pick<LineaStationFeature, "smet" | "smetId"> | undefined, index: number): string | undefined {
    const template = station?.smet?.[index];
    const smetId = station?.smetId;
    return template && smetId ? template.replace(/\{id\}/g, smetId) : undefined;
  }

  getSmetUrlsByIds(
    ids: string[],
    stations: Pick<LineaStationFeature, "id" | "smet" | "smetId">[],
    index: number,
  ): string[] {
    const stationById = new Map(stations.map((station) => [station.id, station]));
    return ids.map((id) => this.getSmetUrl(stationById.get(id), index)).filter((url): url is string => !!url);
  }

  resolveStationSrc(
    station: Pick<LineaStationFeature, "smet" | "smetId"> | undefined,
    preferredIndexes: number[],
    fallback: string,
  ): string {
    for (const index of preferredIndexes) {
      const url = this.getSmetUrl(station, index);
      if (url) {
        return url;
      }
    }
    return fallback;
  }
}
