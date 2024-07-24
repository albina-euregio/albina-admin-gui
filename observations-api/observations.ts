import { createConnection, selectObservations } from "./database";
import { fetchAndInsert } from "./fetch";
import { type GenericObservation } from "./models";

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
    const observations = await selectObservations(connection, startDate, endDate);
    return observations;
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
