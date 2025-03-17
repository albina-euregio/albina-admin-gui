import { createConnection, insertObservation, selectObservations } from "./db/database";
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
} from "./fetch/observations/lola-kronos.model";
import { ObservationSource } from "./generic-observation";

main();

export async function main() {
  const connection = await createConnection();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 8);
  const endDate = new Date();
  try {
    const observations = await selectObservations(connection, startDate, endDate);
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
        const fileContent = buffer.toString("base64");
        const eventDate = new Date(observation.eventDate).toISOString().slice(0, "2025-03-08".length);
        const metadata = {
          name: `${eventDate} ${observation.locationName} [${observation.authorName}]`,
          location: observation.locationName,
          creator: observation.authorName,
          dateevent: eventDate, //FIXE no UTC?
        };
        const body = new FormData();
        body.set("metadata", JSON.stringify(metadata));
        body.set("filecontent", fileContent);
        const request = new Request(process.env.LOKANDO_API, {
          method: "POST",
          headers: { "Api-Key": process.env.LOKANDO_API_KEY },
          body,
        });
        console.log(`Posting image to ${request.url}`);
        const response2 = await fetch(request);
        console.log(`Posting image to ${request.url} yields ${response2.status} ${response2.statusText}`);
        if (!response2.ok) continue;
        const success: {
          result: "OK";
          msg: string;
          objid: number;
          url_original: string;
          url_1200_watermark: string;
        } = await response2.json();
        if (success.result !== "OK") continue;
        console.log(`Adding external image ${success.url_original}`);
        const externalImg = success.url_1200_watermark ?? success.url_original;
        observation.$externalImgs ??= [];
        observation.$externalImgs.push(externalImg + "?objid=" + success.objid);
        await insertObservation(connection, observation);
      }
    }
  } finally {
    connection.destroy();
  }
}
