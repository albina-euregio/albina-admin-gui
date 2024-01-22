export function filterFeature(
  feature: GeoJSON.Feature,
  today = new Date().toISOString().slice(0, "2006-01-02".length),
): boolean {
  const properties = feature.properties;
  return (
    (!properties.start_date || properties.start_date <= today) && (!properties.end_date || properties.end_date > today)
  );
}
