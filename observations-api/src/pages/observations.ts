import {
  type GenericObservation,
  genericObservationSchema,
  genericObservationWithIdSchema,
  ObservationSource,
  type RawGenericObservation,
} from "../../../src/app/observations/models/generic-observation.model";
import { ObservationDatabaseConnection } from "../db/database";
import { fetchAndInsert } from "../fetch/observations";
import { newDate } from "../util/newDate.ts";
import type { APIRoute } from "astro";

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

  if (Date.now() - lastFetch > 300e3) {
    await fetchAndInsert(startDate, endDate);
    lastFetch = Date.now();
  }

  const connection = await ObservationDatabaseConnection.createConnection();
  try {
    const observations = await connection.selectObservations(startDate, endDate);
    for (const o of observations) {
      if (o.$source !== ObservationSource.LoLaKronos) continue;
      o.$externalURL += "/" + process.env.ALBINA_LOLA_KRONOS_API_TOKEN;
    }
    return observations;
  } finally {
    connection.destroy();
  }
}

export const GET: APIRoute = async ({ url }) => {
  const json = JSON.stringify(await serveObservations(url));
  return new Response(json, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response("Expecting application/json", { status: 415 });
  }
  let observation: RawGenericObservation;
  try {
    const body = await request.json();
    console.info("Creating/updating observation", body);
    observation = genericObservationSchema.parse(body);
    observation.$id ??= crypto.randomUUID();
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 400 });
  }
  try {
    const connection = await ObservationDatabaseConnection.createConnection();
    try {
      const ex = await connection.selectObservation(observation);
      if (ex?.$source === ObservationSource.LoLaKronos) {
        // retain $externalURL for LoLaKronos (do not store ALBINA_LOLA_KRONOS_API_TOKEN)
        observation.$externalURL = ex.$externalURL;
      }
      await connection.augmentAndInsertObservation(observation);
    } finally {
      connection.destroy();
    }
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
  return new Response(JSON.stringify(observation), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response("Expecting application/json", { status: 415 });
  }
  let observation: RawGenericObservation;
  try {
    const body = await request.json();
    console.info("Deleting observation", body);
    observation = genericObservationWithIdSchema.parse(body);
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 400 });
  }
  try {
    const connection = await ObservationDatabaseConnection.createConnection();
    try {
      await connection.deleteObservation(observation);
    } finally {
      connection.destroy();
    }
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
  return new Response("", { status: 200 });
};
