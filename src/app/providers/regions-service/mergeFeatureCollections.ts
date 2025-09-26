import { filterFeature } from "./filterFeature";

export function mergeFeatureCollections<G extends GeoJSON.Geometry, P>(
  ...collections: GeoJSON.FeatureCollection<G, P>[]
): GeoJSON.FeatureCollection<G, P> {
  const today = new Date().toISOString().slice(0, "2006-01-02".length);
  return {
    type: "FeatureCollection",
    features: []
      .concat(...collections.map((collection) => collection.features))
      .filter((feature) => filterFeature(feature, today)),
  };
}
