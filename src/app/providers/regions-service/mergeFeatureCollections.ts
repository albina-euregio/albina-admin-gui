import { filterFeature } from "./filterFeature";

export function mergeFeatureCollections<G extends GeoJSON.Geometry, P>(
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
