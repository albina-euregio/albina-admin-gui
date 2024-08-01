import type { APIRoute } from "astro";
import { getAwsWeatherStations } from "../fetch/weather-stations";

export const GET: APIRoute = async ({ url }) => {
  const json = JSON.stringify(await getAwsWeatherStations(endDate(url)));
  return new Response(json, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

function endDate(url: URL) {
  let endDate = url.searchParams.get("endDate");
  if (typeof endDate === "string") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0);
    if (new Date(endDate) > startOfToday) {
      endDate = undefined;
    } else {
      endDate = endDate.slice(0, "2024-08-01".length);
    }
  }
  return endDate;
}
