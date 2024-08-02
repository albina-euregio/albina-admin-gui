import type { APIRoute } from "astro";
import type { GenericObservation } from "../../../src/app/observations/models/generic-observation.model";
import { fetchWebcamsPromise } from "../fetch/webcams";

let lastFetch = 0;
let webcams: Promise<GenericObservation[]>;

export async function serveWebcams(): Promise<GenericObservation[]> {
  if (Date.now() - lastFetch > 60 * 3600e3) {
    lastFetch = Date.now();
    webcams = fetchWebcamsPromise();
  }
  return await webcams;
}

export const GET: APIRoute = async () => {
  const json = JSON.stringify(await serveWebcams());
  return new Response(json, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
