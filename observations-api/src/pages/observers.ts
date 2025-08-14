import { getAwsObservers } from "../fetch/observers";
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const json = JSON.stringify(getAwsObservers());
  return new Response(json, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
