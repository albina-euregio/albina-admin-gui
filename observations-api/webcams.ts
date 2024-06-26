import { GenericObservation } from "./models";
import { convertRasWebcam, webcams as rasWebcams } from "./models/ras-webcam.model";
import { FotoWebcamEUResponse, convertFotoWebcamEU } from "./models/foto-webcam.model";
import { convertPanoCloudWebcam, webcams as panoCloudWebcams } from "./models/panocloud-webcam.modes";
import { PanomaxCamResponse, PanomaxThumbnailResponse, convertPanomax } from "./models/panomax.model";
import { fetchJSON } from "./fetchJSON";
import { getRegionForLatLng } from "../src/app/providers/regions-service/augmentRegion";
import { readFile } from "node:fs/promises";

let lastFetch = 0;
let webcams: Promise<GenericObservation[]>;

export async function serveWebcams(): Promise<GenericObservation[]> {
  if (Date.now() - lastFetch > 60 * 3600e3) {
    lastFetch = Date.now();
    webcams = fetchWebcamsPromise();
  }
  return await webcams;
}

async function fetchWebcamsPromise(): Promise<GenericObservation[]> {
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
