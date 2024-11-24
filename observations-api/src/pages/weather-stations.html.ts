import type { APIRoute } from "astro";
import { getAwsWeatherStations } from "../fetch/weather-stations";
import { average, sum, min, max, median } from "simple-statistics";
import { newDate } from "../util/newDate";

const format = new Intl.NumberFormat("en", {
  useGrouping: false,
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export const GET: APIRoute = async ({ url }) => {
  const startDate =
    typeof url.searchParams.get("startDate") === "string"
      ? new Date(url.searchParams.get("startDate"))
      : newDate({ days: -7 });
  const endDate =
    typeof url.searchParams.get("endDate") === "string"
      ? new Date(url.searchParams.get("endDate"))
      : newDate({ days: 0 });

  let html = "";
  html += `<meta charset="utf-8" />`;
  html += `startDate: ${startDate.toISOString()} &mdash; endDate: ${endDate.toISOString()}`;
  const stations = await getAwsWeatherStations("");

  for (const station of stations) {
    if (station.$data.operator !== "LWD Tirol") {
      continue;
    }
    console.log(station);
    const id = station.$data["LWD-Nummer"];
    const url = `https://api.avalanche.report/lawine/grafiken/smet/woche/${id}.smet.gz`;
    const smet = await (await fetch(url)).text();
    const data = parseData(smet, startDate, endDate);
    html += `<h1>${id}</h1>`;
    html += `<table>`;
    html += `<tr>`;
    html += `<th>parameter</th>`;
    html += `<th>unit</th>`;
    html += `<th>min</th>`;
    html += `<th>average</th>`;
    html += `<th>median</th>`;
    html += `<th>max</th>`;
    html += `<th>sum</th>`;
    html += `</tr>`;
    for (const { parameter, unit, values } of Object.values(data)) {
      html += `<tr>`;
      html += `<td>${parameter}</td>`;
      html += `<td>${unit}</td>`;
      if (!values.length) {
        values.push(NaN);
      }
      html += `<td>${format.format(min(values))}</td>`;
      html += `<td>${format.format(average(values))}</td>`;
      html += `<td>${format.format(median(values))}</td>`;
      html += `<td>${format.format(max(values))}</td>`;
      html += `<td>${format.format(sum(values))}</td>`;
      html += `</tr>`;
    }
    html += `</table>`;
  }

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

function parseData(smet: string, startDate: Date, endDate: Date) {
  // https://code.wsl.ch/snow-models/meteoio/-/blob/master/doc/SMET_specifications.pdf
  let fields = [] as ParameterType[];
  let units = [] as string[];
  let nodata = "-777";
  const result: { parameter: ParameterType; unit: string; values: number[] }[] = [];
  smet.split(/\r?\n/).forEach((line) => {
    if (line.startsWith("fields =")) {
      fields = line.slice("fields =".length).trim().split(" ") as ParameterType[];
      return;
    } else if (line.startsWith("#units =")) {
      units = line.slice("#units =".length).trim().split(" ");
      return;
    } else if (line.startsWith("nodata =")) {
      nodata = line.slice("nodata =".length).trim();
      return;
    } else if (!/^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/.test(line)) {
      return;
    }
    if (!result.length) {
      result.push(
        ...fields.map((parameter, i) => ({
          parameter,
          unit: units.map((u) => UNIT_MAPPING[u]?.to ?? u)[i],
          values: [],
        })),
      );
    }
    const cells = line.split(" ");
    const date = new Date(cells[0]);
    if (+date < +startDate || +date > +endDate) {
      return;
    }
    result.forEach((p, i) => {
      if (cells[i] === nodata) return;
      const value = +cells[i].replace(",", ".");
      p.values.push(UNIT_MAPPING[units[i]]?.convert(value) ?? value);
    });
  });
  return result.slice(1);
}
