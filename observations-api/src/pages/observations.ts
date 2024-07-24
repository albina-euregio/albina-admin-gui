import type { APIRoute } from "astro";
import { serveObservations } from "../../observations";

export const GET: APIRoute = async ({ url }) => {
  const json = JSON.stringify(await serveObservations(url));
  return new Response(json, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
