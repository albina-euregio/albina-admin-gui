import type RegionAT_07 from "@eaws/micro-regions/AT-07_micro-regions.geojson.json";
import whichPolygon from "which-polygon";
import { loadRegions } from "./regions-loader.mjs";

type Properties = (typeof RegionAT_07)["features"][number]["properties"];

let query: whichPolygon.Query<{
  id: string;
}>;

export async function getRegionForLatLng(observation: { latitude?: number; longitude?: number }): Promise<string> {
  query ??= whichPolygon(await loadRegions());
  if (observation.latitude && observation.longitude) {
    const region = query([observation.longitude, observation.latitude], false) as Properties;
    return region?.id;
  }
  return undefined;
}

export async function augmentRegion<T extends { latitude?: number; longitude?: number; region?: string }>(
  observation: T,
): Promise<T> {
  observation.region = await getRegionForLatLng(observation);
  return observation;
}
