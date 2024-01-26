import dayjs from "dayjs";
import { createConnection, selectObservations } from "./database";
import { fetchAndInsert } from "./fetch";

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    switch (url.pathname) {
      case "/observations":
        return await serveObservations(url);
      default:
        new Response("Not Found!", { status: 404 });
    }
  },
});

let lastFetch = 0;

async function serveObservations(url: URL) {
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
    const json = JSON.stringify(observations);
    const headers = { "Content-Type": "applications/json" };
    return new Response(json, { headers });
  } finally {
    connection.destroy();
  }
}
