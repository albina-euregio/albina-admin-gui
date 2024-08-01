import type { APIRoute } from "astro";
import { getAwsWeatherStations } from "../fetch/weather-stations";

export const GET: APIRoute = async () => {
  const json = JSON.stringify(await getAwsWeatherStations());
  return new Response(json, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
