import { fetchJSON } from "../../util/fetchJSON";
import { type GenericObservation, ObservationSource, ObservationType } from "../../generic-observation";

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
  while (+endDate > +startDate) {
    const date = formatDate(endDate);
    const url = API.replace("{{date}}", date);
    try {
      const json: GeoJSON.FeatureCollection<GeoJSON.Point, Properties> = await fetchJSON(url);
      for (const feature of json.features) {
        yield {
          $type: ObservationType.DrySnowfallLevel,
          $source: ObservationSource.AvalancheWarningService,
          $id: date + "-" + feature.properties.station_number,
          $data: feature.properties,
          eventDate: endDate,
          reportDate: endDate,
          locationName: feature.properties.station_name,
          $externalImgs: [WEB.replace("{{date}}", date).replace("{{plot}}", feature.properties.plot_name)],
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          elevation: feature.properties.snowfall_limit,
        } satisfies GenericObservation;
      }
    } catch (err) {
      console.log(`Failed to fetch ${url}`, err);
    }
    endDate = new Date(endDate);
    endDate.setDate(endDate.getDate() - 1);
  }
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, "2006-01-02".length);
}
