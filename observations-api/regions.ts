import whichPolygon from "which-polygon";
import RegionsEuregio_AT_07 from "@eaws/micro-regions/AT-07_micro-regions.geojson.json";
import RegionsEuregio_IT_32_BZ from "@eaws/micro-regions/IT-32-BZ_micro-regions.geojson.json";
import RegionsEuregio_IT_32_TN from "@eaws/micro-regions/IT-32-TN_micro-regions.geojson.json";

const query = whichPolygon(
  mergeFeatureCollections(RegionsEuregio_AT_07, RegionsEuregio_IT_32_BZ, RegionsEuregio_IT_32_TN),
);

export function getRegionForLatLng(observation: { latitude?: number; longitude?: number }): string {
  if (observation.latitude && observation.longitude) {
    return query([observation.longitude, observation.latitude], false)?.id;
  }
  return undefined;
}

export function augmentRegion<T extends { latitude?: number; longitude?: number; region?: string }>(observation: T): T {
  observation.region = getRegionForLatLng(observation);
  return observation;
}

function mergeFeatureCollections<G extends GeoJSON.Geometry, P>(
  ...collections: GeoJSON.FeatureCollection<G, P>[]
): GeoJSON.FeatureCollection<G, P> {
  const today = "2022-12-01";
  return {
    type: "FeatureCollection",
    features: []
      .concat(...collections.map((collection) => collection.features))
      .filter((feature) => filterFeature(feature, today)),
  };
}

function filterFeature(
  feature: GeoJSON.Feature,
  today = new Date().toISOString().slice(0, "2006-01-02".length),
): boolean {
  const properties = feature.properties;
  return (
    (!properties.start_date || properties.start_date <= today) && (!properties.end_date || properties.end_date > today)
  );
}
