import { getAwsWeatherStations } from "../fetch/weather-stations";
import { newDate } from "../util/newDate";

export const GET = async (request: Bun.BunRequest) => {
  const url = new URL(request.url);
  const startDate =
    typeof url.searchParams.get("startDate") === "string"
      ? new Date(url.searchParams.get("startDate"))
      : newDate({ days: -7 });
  const endDate =
    typeof url.searchParams.get("endDate") === "string"
      ? new Date(url.searchParams.get("endDate"))
      : newDate({ days: 0 });

  const json = JSON.stringify(await getAwsWeatherStations(startDate, endDate));
  return new Response(json, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
