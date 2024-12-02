import type { APIRoute } from "astro";
import {
  genericObservationSchema,
  genericObservationWithIdSchema,
  type GenericObservation,
  type RawGenericObservation,
} from "../../../src/app/observations/models/generic-observation.model";
import { augmentAndInsertObservation, createConnection, deleteObservation, selectObservations } from "../db/database";
import { fetchAndInsert } from "../fetch/observations";

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

  const connection = await createConnection();
  try {
    return await selectObservations(connection, startDate, endDate);
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
    observation = genericObservationSchema.parse(body);
    observation.$id ??= crypto.randomUUID();
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 400 });
  }
  try {
    const connection = await createConnection();
    try {
      await augmentAndInsertObservation(connection, observation);
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
    observation = genericObservationWithIdSchema.parse(body);
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 400 });
  }
  try {
    const connection = await createConnection();
    try {
      await deleteObservation(connection, observation);
    } finally {
      connection.destroy();
    }
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
  return new Response("", { status: 200 });
};
