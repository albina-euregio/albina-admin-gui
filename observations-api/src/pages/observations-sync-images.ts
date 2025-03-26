import type { APIRoute } from "astro";
import child_process from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
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
        let buffer: Buffer;
        try {
          buffer = child_process.execFileSync("curl", ["--fail", "--show-error", "--silent", url]);
          console.log(`Fetching image from ${url} yields ${buffer.length} bytes`);
        } catch (e: unknown) {
          console.log(`Failed fetching image from ${url} using curl`, e);
          continue;
        }
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
  const file = path.join(os.tmpdir(), crypto.randomUUID());
  const args = [
    "--fail-with-body",
    "--show-error",
    "--silent",
    process.env.LOKANDO_API,
    "--header",
    `Api-Key:${process.env.LOKANDO_API_KEY}`,
    "--header",
    "User-Agent:albina-admin-gui observations-sync-images",
    "--form",
    `metadata=${metadata}`,
    "--form",
    `filecontent=<${file}`,
  ];

  let success: {
    result: "OK";
    msg: string;
    objid: number;
    url_original: string;
    url_1200_watermark: string;
  };
  try {
    const base64 = image.toString("base64");
    console.log(`Writing ${base64.length} bytes to ${file}`);
    await fs.writeFile(file, image.toString("base64"), { encoding: "utf-8" });
    console.log("Posting image using curl", metadata);
    const response = child_process.execFileSync("curl", args, { encoding: "utf-8" });
    success = JSON.parse(response);
    if (success.result !== "OK") {
      throw new Error(response);
    }
  } catch (e: unknown) {
    console.warn("Failed posting image using curl", e);
    return;
  } finally {
    await fs.unlink(file);
  }
  const externalImg = success.url_1200_watermark ?? success.url_original;
  return externalImg + "?objid=" + success.objid;
}
