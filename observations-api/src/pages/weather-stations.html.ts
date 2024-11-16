import type { APIRoute } from "astro";
import { getAwsWeatherStations } from "../fetch/weather-stations";
import { average, sum, min, max, median } from "simple-statistics";

const format = new Intl.NumberFormat("en", {
  useGrouping: false,
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export const GET: APIRoute = async () => {
  const stations = await getAwsWeatherStations("");
  const [stationData] = stations
    .filter((s) => s.$data.operator === "LWD Tirol")
    .filter((s) => s.locationName === "Gallreideschrofen");
  console.log(stationData);
  const id = stationData.$data["LWD-Nummer"];
  const url = `https://api.avalanche.report/lawine/grafiken/smet/woche/${id}.smet.gz`;
  const smet = await (await fetch(url)).text();
  const data = parseData(smet, ["TA", "HS", "ISWR"]);
  let html = `<h1>${id}</h1>`;
  html += `<table>`;
  for (const [date, values] of Object.entries(data)) {
    html += `<tr>`;
    html += `<td>${date}</td>`;
    values.forEach(({ parameter, values: v }) => {
      html += `<td>${parameter}</td>`;
      html += `<td>${format.format(min(v))}</td>`;
      html += `<td>${format.format(average(v))}</td>`;
      html += `<td>${format.format(median(v))}</td>`;
      html += `<td>${format.format(max(v))}</td>`;
      html += `<td>${format.format(sum(v))}</td>`;
    });
    html += `</tr>`;
  }
  html += `</table>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
};

// P Air pressure, in Pa
// TA Temperature Air, in Kelvin
// TD Temperature Dew Point, in Kelvin
// TSS Temperature Snow Surface, in Kelvin
// TSG Temperature Surface Ground, in Kelvin
// RH Relative Humidity, between 0 and 1
// VW_MAX Maximum wind velocity, in m/s
// VW Velocity Wind, in m/s
// DW Direction Wind, in degrees, clockwise and north being zero degrees
// ISWR Incoming Short Wave Radiation, in W/m2
// RSWR Reflected Short Wave Radiation, in W/m2 (previously OSWR)
// ILWR Incoming Long Wave Radiation, in W/m2
// OLWR Outgoing Long Wave Radiation, in W/m2
// PINT Precipitation Intensity, in mm/h, as an average over the timestep
// PSUM Precipitation accumulation, in mm, summed over the last timestep
// HS Height Snow, in m
type ParameterType =
  | "P"
  | "TA"
  | "TD"
  | "TSS"
  | "TSG"
  | "RH"
  | "VW_MAX"
  | "VW"
  | "DW"
  | "ISWR"
  | "RSWR"
  | "ILWR"
  | "OLWR"
  | "PINT"
  | "PSUM"
  | "HS";

const UNIT_MAPPING: Record<string, { to: string; convert: (v: number) => number }> = {
  K: { to: "°C", convert: (v) => v - 273.15 },
  m: { to: "cm", convert: (v) => v * 100 },
  "m/s": { to: "km/h", convert: (v) => v * 3.6 },
};

function parseData(smet: string, parameters: ParameterType[]) {
  // https://code.wsl.ch/snow-models/meteoio/-/blob/master/doc/SMET_specifications.pdf
  let index = [] as number[];
  let units = [] as string[];
  let nodata = "-777";
  const result: Record<string, { parameter: string; unit: string; values: number[] }[]> = {};
  smet.split(/\r?\n/).forEach((line) => {
    if (line.startsWith("fields =")) {
      const fields = line.slice("fields =".length).trim().split(" ");
      index = parameters.map((p) => fields.indexOf(p));
      return;
    } else if (line.startsWith("#units =") && index[0] >= 0) {
      units = line.slice("#units =".length).trim().split(" ");
      return;
    } else if (line.startsWith("nodata =")) {
      nodata = line.slice("nodata =".length).trim();
      return;
    } else if (!/^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/.test(line)) {
      return;
    } else if (index[0] < 0) {
      return;
    }
    const cells = line.split(" ");
    const date = new Date(cells[0]);
    date.setUTCHours((date.getUTCHours() % 6) * 6, 0, 0, 0);
    result[date.toISOString()] ??= parameters.map((parameter, i) => ({
      parameter,
      unit: units.map((u) => UNIT_MAPPING[u]?.to ?? u)[i],
      values: [],
    }));
    const values = result[date.toISOString()];
    index.forEach((i, k) => {
      if (i < 0 || cells[i] === nodata) return;
      const value = +cells[i].replace(",", ".");
      values[k].values.push(UNIT_MAPPING[units[i]]?.convert(value) ?? value);
    });
  });
  return result;
}
