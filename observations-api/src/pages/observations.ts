import type { APIRoute } from "astro";
import type { GenericObservation } from "../../../src/app/observations/models/generic-observation.model";
import { fetchAndInsert } from "../fetch/observations";
import { createConnection, selectObservations } from "../db/database";

let lastFetch = 0;

export async function serveObservations(url: URL): Promise<GenericObservation[]> {
  const startDate =
    typeof url.searchParams.get("startDate") === "string"
      ? new Date(url.searchParams.get("startDate"))
      : newDate({ days: -7 });
  const endDate =
    typeof url.searchParams.get("endDate") === "string"
      ? new Date(url.searchParams.get("endDate"))
      : newDate({ days: 0 });

  if (Date.now() - lastFetch > 5 * 3600e3) {
    await fetchAndInsert(startDate, endDate);
    lastFetch = Date.now();
  }

  const connection = await createConnection();
  try {
    return await selectObservations(connection, startDate, endDate);
  } finally {
    connection.destroy();
  }
}

function newDate(delta: { days: number }): Date {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setDate(date.getDate() + delta.days);
  return date;
}

export const GET: APIRoute = async ({ url }) => {
  const json = JSON.stringify(await serveObservations(url));
  return new Response(json, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
