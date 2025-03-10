import { createConnection, selectObservations } from "./db/database";
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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function sync() {
  const connection = await createConnection();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
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
      for (const image of data.images) {
        const url = "https://www.lola-kronos.info/api/lolaImages/image/servePDF/" + image.fileName;
        console.log(`Fetching image from ${url}`);
        const response = await fetch(url);
        const blob = await response.blob();
        const fileContent = await blobToBase64(blob);
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
      }
    }
  } finally {
    connection.destroy();
  }
}
