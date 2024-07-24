import type { APIRoute } from "astro";
import { serveWebcams } from "../../webcams";

export const GET: APIRoute = async () => {
  const json = JSON.stringify(await serveWebcams());
  return new Response(json, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
