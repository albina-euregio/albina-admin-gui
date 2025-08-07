import type MicroRegions from "@eaws/micro-regions/AT-07_micro-regions.geojson.json";
import whichPolygon from "which-polygon";
import { loadRegions } from "./regions-loader.mjs";

type Properties = (typeof MicroRegions)["features"][number]["properties"];

let query: whichPolygon.Query<{
  id: string;
}>;

export async function initAugmentRegion() {
  query ??= whichPolygon(await loadRegions());
}

export function getRegionForLatLng(observation: { latitude?: number; longitude?: number }): string {
  if (!query) throw new Error("Call initAugmentRegion first!");
  if (observation.latitude && observation.longitude) {
    const region = query([observation.longitude, observation.latitude], false) as Properties;
    return region?.id;
  }
  return undefined;
}

export function augmentRegion<T extends { latitude?: number; longitude?: number; region?: string }>(observation: T): T {
  observation.region = getRegionForLatLng(observation);
  return observation;
}
