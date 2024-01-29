import dayjs from "dayjs";
import express from "express";
import { createConnection, selectObservations } from "./database";
import { fetchAndInsert } from "./fetch";
import { GenericObservation } from "../src/app/observations/models/generic-observation.model";

const port = process.env.PORT || 3000;

const app = express();
app.get("/observations", async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const observations = await serveObservations(url);
  return res.send(observations);
});
app.listen(port, () => console.log(`observations-api listening on :${port}`));

let lastFetch = 0;

async function serveObservations(url: URL): Promise<GenericObservation[]> {
  const startDate =
    typeof url.searchParams.get("startDate") === "string"
      ? dayjs(url.searchParams.get("startDate"))
      : dayjs().millisecond(0).subtract(1, "week");
  const endDate =
    typeof url.searchParams.get("endDate") === "string"
      ? dayjs(url.searchParams.get("endDate"))
      : dayjs().millisecond(0);

  if (Date.now() - lastFetch > 5 * 3600) {
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
