import dayjs from "dayjs";
import express from "express";
import { createConnection, selectObservations } from "./database";
import { fetchAndInsert } from "./fetch";
import { GenericObservation } from "../src/app/observations/models/generic-observation.model";

const app = express();
app.get("/observations", async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const observations = await serveObservations(url);
  return res.send(observations);
});
app.listen(3000, () => console.log("observations-api listening on :3000"));

let lastFetch = 0;

async function serveObservations(url: URL): Promise<GenericObservation[]> {
  if (Date.now() - lastFetch > 5 * 3600) {
    await fetchAndInsert();
    lastFetch = Date.now();
  }
  const startDate =
    typeof url.searchParams.get("startDate") === "string"
      ? dayjs(url.searchParams.get("startDate"))
      : dayjs().millisecond(0).subtract(1, "week");
  const endDate =
    typeof url.searchParams.get("endDate") === "string"
      ? dayjs(url.searchParams.get("endDate"))
      : dayjs().millisecond(0);
  const connection = await createConnection();
  try {
    const observations = await Array.fromAsync(selectObservations(connection, startDate, endDate));
    return observations;
  } finally {
    connection.destroy();
  }
}
