// Do not use formatDate from @angular/common here (not supported in observations-api)
const TODAY = new Date().toISOString().slice(0, "2006-01-02".length);

export function filterFeature(feature: GeoJSON.Feature, today = TODAY): boolean {
  const properties = feature.properties;
  return (
    (!properties.start_date || properties.start_date <= today) && (!properties.end_date || properties.end_date > today)
  );
}
