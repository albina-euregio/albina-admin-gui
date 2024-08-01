import { fetchJSON } from "../../util/fetchJSON";
import { type GenericObservation, ImportantObservation, ObservationSource, ObservationType } from "../../models";

const API = "https://static.avalanche.report/snow-fall-level-calculator/geojson/{{date}}.geojson";
const WEB = "https://static.avalanche.report/snow-fall-level-calculator/Plots/weekly/{{date}}/{{plot}}";

interface Properties {
  station_number: string;
  station_name: string;
  subregion: string;
  region: string;
  extended_region: string;
  snowfall_limit: number;
  plot_name: string;
}

/**
 * Calculated snow fall levels from weather stations
 * https://gitlab.com/lwd.met/lwd-internal-projects/snow-fall-level-calculator
 */
export async function* fetchSnowLineCalculations(
  startDate: Date,
  endDate: Date,
): AsyncGenerator<GenericObservation, void, unknown> {
  try {
    const date = formatDate(endDate);
    const url = API.replace("{{date}}", date);
    const json: GeoJSON.FeatureCollection<GeoJSON.Point, Properties> = await fetchJSON(url);
    for (const feature of json.features) {
      yield {
        $type: ObservationType.SimpleObservation,
        $source: ObservationSource.SnowLine,
        $id: date + "-" + feature.properties.station_number,
        $data: feature.properties,
        eventDate: endDate,
        reportDate: endDate,
        locationName: feature.properties.station_name,
        $externalImg: WEB.replace("{{date}}", date).replace("{{plot}}", feature.properties.plot_name),
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        elevation: feature.properties.snowfall_limit,
        importantObservations: [ImportantObservation.SnowLine],
      } satisfies GenericObservation;
    }
  } catch (err) {
    if (+endDate > +startDate) {
      const dayBefore = new Date(endDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      yield* fetchSnowLineCalculations(startDate, dayBefore);
    } else {
      throw err;
    }
  }
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, "2006-01-02".length);
}
