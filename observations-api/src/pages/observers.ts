import type { APIRoute } from "astro";
import { getAwsObservers } from "../fetch/observers";

export const GET: APIRoute = () => {
  const json = JSON.stringify(getAwsObservers());
  return new Response(json, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
