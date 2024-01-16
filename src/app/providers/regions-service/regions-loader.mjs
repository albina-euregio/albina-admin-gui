const today = new Date().toISOString().slice(0, "2006-01-02".length);

let $regions = undefined;

/**
 * @returns {Promise<import("geojson").FeatureCollection[]>}
 */
export function loadRegions() {
  return ($regions ??= loadAndMerge(
    import("@eaws/micro-regions/AT-07_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-32-BZ_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-32-TN_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-21_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-23_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-25_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-34_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-36_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-57_micro-regions.geojson.json"),
    import("@eaws/micro-regions/ES-CT-L_micro-regions.geojson.json"),
    import("@eaws/micro-regions/CH_micro-regions.geojson.json"),
    import("@eaws/micro-regions/SK_micro-regions.geojson.json"),
    import("@eaws/micro-regions/PL-12_micro-regions.geojson.json"),
  ));
}

/**
 * @returns {Promise<import("geojson").FeatureCollection[]>}
 */
export function loadRegionsAran() {
  return loadAndMerge(import("@eaws/micro-regions/ES-CT-L_micro-regions.geojson.json"));
}

/**
 * @returns {Promise<import("geojson").FeatureCollection[]>}
 */
export function loadRegionsEuregio() {
  return loadAndMerge(
    import("@eaws/micro-regions/AT-07_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-32-BZ_micro-regions.geojson.json"),
    import("@eaws/micro-regions/IT-32-TN_micro-regions.geojson.json"),
  );
}

/**
 * @returns {Promise<import("geojson").FeatureCollection[]>}
 */
export function loadRegionsSwitzerland() {
  return loadAndMerge(import("@eaws/micro-regions/CH_micro-regions.geojson.json"));
}

let $regionsWithElevation = undefined;

/**
 * @returns {Promise<import("geojson").FeatureCollection[]>}
 */
export function loadRegionsWithElevation() {
  return ($regionsWithElevation ??= loadAndMerge(
    import("@eaws/micro-regions_elevation/AT-07_micro-regions_elevation.geojson.json"),
    import("@eaws/micro-regions_elevation/IT-32-BZ_micro-regions_elevation.geojson.json"),
    import("@eaws/micro-regions_elevation/IT-32-TN_micro-regions_elevation.geojson.json"),
    import("@eaws/micro-regions_elevation/IT-21_micro-regions_elevation.geojson.json"),
    import("@eaws/micro-regions_elevation/IT-23_micro-regions_elevation.geojson.json"),
    import("@eaws/micro-regions_elevation/IT-25_micro-regions_elevation.geojson.json"),
    import("@eaws/micro-regions_elevation/IT-34_micro-regions_elevation.geojson.json"),
    import("@eaws/micro-regions_elevation/IT-36_micro-regions_elevation.geojson.json"),
    import("@eaws/micro-regions_elevation/IT-57_micro-regions_elevation.geojson.json"),
    import("@eaws/micro-regions_elevation/ES-CT-L_micro-regions_elevation.geojson.json"),
    import("@eaws/micro-regions_elevation/CH_micro-regions_elevation.geojson.json"),
    import("@eaws/micro-regions_elevation/SK_micro-regions_elevation.geojson.json"),
    import("@eaws/micro-regions_elevation/PL-12_micro-regions_elevation.geojson.json"),
  ));
}

/**
 * @param {Promise<import("geojson").FeatureCollection>} imports
 * @returns {Promise<import("geojson").FeatureCollection>}
 */
async function loadAndMerge(...imports) {
  const collections = await Promise.all(imports);
  return mergeFeatureCollections(collections);
}

/**
 * @param {import("geojson").FeatureCollection[]} collections
 * @returns {import("geojson").FeatureCollection}
 */
function mergeFeatureCollections(collections) {
  return {
    type: "FeatureCollection",
    features: [].concat(...collections.map((collection) => collection.features)).filter((feature) => {
      const properties = feature.properties;
      return (
        (!properties.start_date || properties.start_date <= today) &&
        (!properties.end_date || properties.end_date > today)
      );
    }),
  };
}
