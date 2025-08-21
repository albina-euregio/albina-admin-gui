import { filterFeature } from "./filterFeature";
import { formatDate } from "@angular/common";

export function mergeFeatureCollections<G extends GeoJSON.Geometry, P>(
  ...collections: GeoJSON.FeatureCollection<G, P>[]
): GeoJSON.FeatureCollection<G, P> {
  const today = formatDate(Date.now(), "yyyy-MM-dd", "en-US");
  return {
    type: "FeatureCollection",
    features: []
      .concat(...collections.map((collection) => collection.features))
      .filter((feature) => filterFeature(feature, today)),
  };
}
