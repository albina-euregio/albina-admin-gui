import { initAugmentRegion, getRegionForLatLng } from "../../../src/app/providers/regions-service/augmentRegion";
import type { GenericObservation } from "../generic-observation";
import { fetchJSON } from "../util/fetchJSON";
import { convertFotoWebcamEU, type FotoWebcamEUResponse } from "./webcams/foto-webcam.model";
import { convertPanoCloudWebcam, webcams as panoCloudWebcams } from "./webcams/panocloud-webcam.modes";
import { convertPanomax, type PanomaxCamResponse, type PanomaxThumbnailResponse } from "./webcams/panomax.model";
import { convertRasWebcam, webcams as rasWebcams } from "./webcams/ras-webcam.model";
import { readFile } from "node:fs/promises";

export async function fetchWebcamsPromise(): Promise<GenericObservation[]> {
  const webcams = [] as GenericObservation[];
  for await (const webcam of fetchWebcams()) {
    webcams.push(webcam);
  }
  return webcams;
}

async function* fetchWebcams(): AsyncGenerator<GenericObservation, void, unknown> {
  yield* fetchPanoCloudWebcams();
  yield* fetchRasWebcams();
  yield* fetchFotoWebcamsEU();
  yield* fetchPanomax();
}

function* fetchPanoCloudWebcams(): Generator<GenericObservation, void, unknown> {
  for (const webcam of panoCloudWebcams) {
    yield convertPanoCloudWebcam(webcam);
  }
}

function* fetchRasWebcams(): Generator<GenericObservation, void, unknown> {
  for (const webcam of rasWebcams) {
    yield convertRasWebcam(webcam);
  }
}

async function* fetchFotoWebcamsEU(): AsyncGenerator<GenericObservation, void, unknown> {
  const url = "https://www.foto-webcam.eu/webcam/include/metadata.php";
  const data: FotoWebcamEUResponse = await fetchJSON(url);
  try {
    const json = await readFile("./private.foto-webcam.eu.json", { encoding: "utf-8" });
    const data2: FotoWebcamEUResponse = JSON.parse(json);
    data.cams.push(...data2.cams);
  } catch (ignore) {}
  for (const webcam of data.cams) {
    yield convertFotoWebcamEU(webcam);
  }
}

async function* fetchPanomax(): AsyncGenerator<GenericObservation, void, unknown> {
  await initAugmentRegion();
  const url = "https://api.panomax.com/1.0/maps/panomaxweb";
  const data: PanomaxCamResponse = await fetchJSON(url);
  for (const webcam of Object.values(data.instances)) {
    if (!getRegionForLatLng(webcam.cam)) continue;
    const thumb: PanomaxThumbnailResponse = await fetchJSON(
      `https://api.panomax.com/1.0/instances/${webcam.id}/thumbnail`,
    );
    yield convertPanomax(thumb);
  }
}
