import { ObservationDatabaseConnection } from "../db/database.ts";
import type {
  LaDokObservation,
  LaDokSimpleObservation,
  LolaAvalancheEvent,
  LolaEarlyObservation,
  LolaEvaluation,
  LolaRainBoundary,
  LolaSimpleObservation,
  LolaSnowProfile,
  LolaSnowStabilityTest,
} from "../fetch/observations/lola-kronos.model.ts";
import { type GenericObservation, ObservationSource } from "../generic-observation.ts";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  if (
    !process.env.LOKANDO_API_SYNC_TOKEN ||
    process.env.LOKANDO_API_SYNC_TOKEN !== request.headers.get("X-Lokando-Sync-Token")
  ) {
    console.warn("Invalid sync token", {
      t1: process.env.LOKANDO_API_SYNC_TOKEN,
      t2: request.headers.get("X-Lokando-Sync-Token"),
    });
    return new Response("", { status: 403, statusText: "Forbidden" });
  }
  await syncLoLa();
  return new Response("", { status: 204, statusText: "No Content" });
};

export async function syncLoLa() {
  const connection = await ObservationDatabaseConnection.createConnection();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 8);
  const endDate = new Date();
  try {
    const observations = await connection.selectObservations(startDate, endDate);
    for (const observation of observations) {
      if (observation.$source !== ObservationSource.LoLaKronos) continue;
      if (observation.$externalImgs?.length) continue;
      const data = observation.$data as
        | LolaSimpleObservation
        | LolaAvalancheEvent
        | LolaSnowProfile
        | LolaEvaluation
        | LolaRainBoundary
        | LolaSnowStabilityTest
        | LolaEarlyObservation
        | LaDokSimpleObservation
        | LaDokObservation;
      if (!data.images?.length) continue;
      for (const image of data.images) {
        const url = "https://www.lola-kronos.info/api/lolaImages/image/servePDF/" + image.fileName;
        console.log(`Fetching image from ${url}`);
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(
          `Fetching image from ${url} yields ${response.status} ${response.statusText} (${arrayBuffer.byteLength} bytes)`,
        );
        if (!response.ok) continue;
        const externalImg = await syncImage(buffer, observation);
        if (!externalImg) continue;
        console.log(`Adding external image ${externalImg}`);
        observation.$externalImgs ??= [];
        observation.$externalImgs.push(externalImg);
        await connection.insertObservation(observation);
      }
    }
  } finally {
    connection.destroy();
  }
}

async function syncImage(image: Buffer, observation: GenericObservation) {
  const data = observation.$data as
    | LolaSimpleObservation
    | LolaAvalancheEvent
    | LolaSnowProfile
    | LolaEvaluation
    | LolaRainBoundary
    | LolaSnowStabilityTest
    | LolaEarlyObservation
    | LaDokSimpleObservation
    | LaDokObservation;
  const eventDate = new Date(observation.eventDate).toISOString().slice(0, "2025-03-08".length);
  const metadata = JSON.stringify({
    name: `${eventDate} ${observation.locationName} [${observation.authorName}]`,
    location: observation.locationName,
    creator: observation.authorName,
    copyright: observation.authorName,
    dateevent: eventDate, //FIXE no UTC?
    fname_orig: observation.$id + ".jpg",
    description: data.comment ?? "",
  });
  const body = new FormData();
  body.set("metadata", metadata);
  body.set("filecontent", image.toString("base64"));
  const request = new Request(process.env.LOKANDO_API, {
    method: "POST",
    headers: { "Api-Key": process.env.LOKANDO_API_KEY },
    body,
  });
  console.log(`Posting image to ${request.url}`);
  const response = await fetch(request);
  console.log(`Posting image to ${request.url}`, metadata, request, response);
  if (!response.ok) {
    return;
  }
  const success: {
    result: "OK";
    msg: string;
    objid: number;
    url_original: string;
    url_1200_watermark: string;
  } = await response.json();
  if (success.result !== "OK") {
    console.warn(`Failed posting image to ${request.url}`, response.headers, success);
    return;
  }
  const externalImg = success.url_1200_watermark ?? success.url_original;
  return externalImg + "?objid=" + success.objid;
}
