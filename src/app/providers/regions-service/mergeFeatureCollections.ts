import { filterFeature } from "./filterFeature";

export function mergeFeatureCollections<G extends GeoJSON.Geometry, P>(
  ...collections: GeoJSON.FeatureCollection<G, P>[]
): GeoJSON.FeatureCollection<G, P> {
  return {
    type: "FeatureCollection",
    features: []
      .concat(...collections.map((collection) => collection.features))
      .filter((feature) => filterFeature(feature)),
  };
}
