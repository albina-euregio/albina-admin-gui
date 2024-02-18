import express from "express";
import { createConnection, selectObservations } from "./database";
import { fetchAndInsert } from "./fetch";
import { GenericObservation } from "../src/app/observations/models/generic-observation.model";
import { serveWebcams } from "./webcams";
import { getAwsObservers } from "./observers";
import { getAwsWeatherStations } from "./weather-stations";

const port = process.env.PORT || 3000;

const app = express();
app.get("/observations", async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const observations = await serveObservations(url);
  return res.send(observations);
});
app.get("/webcams", async (req, res) => res.send(await serveWebcams()));
app.get("/observers", async (req, res) => res.send(getAwsObservers()));
app.get("/weather-stations", async (req, res) => res.send(await getAwsWeatherStations()));
app.listen(port, () => console.log(`observations-api listening on :${port}`));

let lastFetch = 0;

async function serveObservations(url: URL): Promise<GenericObservation[]> {
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
