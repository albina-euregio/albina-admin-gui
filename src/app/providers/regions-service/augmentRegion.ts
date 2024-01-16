import whichPolygon from "which-polygon";
import RegionsEuregio_AT_07 from "@eaws/micro-regions/AT-07_micro-regions.geojson.json";
import RegionsEuregio_IT_32_BZ from "@eaws/micro-regions/IT-32-BZ_micro-regions.geojson.json";
import RegionsEuregio_IT_32_TN from "@eaws/micro-regions/IT-32-TN_micro-regions.geojson.json";
import type { RegionProperties } from "./regions.service";
import { mergeFeatureCollections } from "./mergeFeatureCollections";

const query = whichPolygon(
  mergeFeatureCollections(RegionsEuregio_AT_07, RegionsEuregio_IT_32_BZ, RegionsEuregio_IT_32_TN),
);

export function getRegionForLatLng(observation: { latitude?: number; longitude?: number }): string {
  if (observation.latitude && observation.longitude) {
    const region = query([observation.longitude, observation.latitude], false) as RegionProperties;
    return region?.id;
  }
  return undefined;
}

export function augmentRegion<T extends { latitude?: number; longitude?: number; region?: string }>(observation: T): T {
  observation.region = getRegionForLatLng(observation);
  return observation;
}
