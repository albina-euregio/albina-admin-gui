import { mergeFeatureCollections } from "./mergeFeatureCollections";

let $regions = undefined;

/**
 * @returns {Promise<import("geojson").FeatureCollection[]>}
 */
export function loadRegions() {
  return ($regions ??= loadAndMerge(
    import("@eaws/micro-regions/AT-02_micro-regions.geojson.json"),
    import("@eaws/micro-regions/AT-03_micro-regions.geojson.json"),
    import("@eaws/micro-regions/AT-04_micro-regions.geojson.json"),
    import("@eaws/micro-regions/AT-05_micro-regions.geojson.json"),
    import("@eaws/micro-regions/AT-06_micro-regions.geojson.json"),
    import("@eaws/micro-regions/AT-07_micro-regions.geojson.json"),
    import("@eaws/micro-regions/AT-08_micro-regions.geojson.json"),
    import("@eaws/micro-regions/DE-BY_micro-regions.geojson.json"),
    import("@eaws/micro-regions/SI_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-32-BZ_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-32-TN_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-21_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-23_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-25_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-34_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-36_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-57_micro-regions.geojson.json"),
    import("@eaws/micro-regions/CH_micro-regions.geojson.json"),
    import("@eaws/micro-regions/ES-AR_micro-regions.geojson.json"),
    import("@eaws/micro-regions/ES-CT-L_micro-regions.geojson.json"),
    import("@eaws/micro-regions/SK_micro-regions.geojson.json"),
    import("@eaws/micro-regions/PL-12_micro-regions.geojson.json"),
  ));
}

/**
 * @param {Promise<import("geojson").FeatureCollection>} imports
 * @returns {Promise<import("geojson").FeatureCollection>}
 */
async function loadAndMerge(...imports) {
  const collections = await Promise.all(imports);
  return mergeFeatureCollections(...collections);
}
