import { GenericObservation } from "../src/app/observations/models/generic-observation.model";
import { convertRasWebcam, webcams as rasWebcams } from "../src/app/observations/models/ras-webcam.model";
import { FotoWebcamEUResponse, convertFotoWebcamEU } from "../src/app/observations/models/foto-webcam.model";
import {
  convertPanoCloudWebcam,
  webcams as panoCloudWebcams,
} from "../src/app/observations/models/panocloud-webcam.mode";
import {
  PanomaxCamResponse,
  PanomaxThumbnailResponse,
  convertPanomax,
} from "../src/app/observations/models/panomax.model";
import { fetchJSON } from "./fetchJSON";
import { getRegionForLatLng } from "../src/app/providers/regions-service/augmentRegion";

let lastFetch = 0;
let webcams: Promise<GenericObservation[]>;

export async function serveWebcams(): Promise<GenericObservation[]> {
  if (Date.now() - lastFetch > 60 * 3600) {
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
