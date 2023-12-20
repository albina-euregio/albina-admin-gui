import {
  type GenericObservation,
  ObservationSource,
  ObservationType,
  degreeToAspect,
} from "./generic-observation.model";

export interface FotoWebcamEU {
  id: string;
  name: string;
  title: string;
  keywords: string;
  offline: boolean;
  hidden: boolean;
  imgurl: string;
  link: string;
  localLink: string;
  modtime: number;
  details: number;
  sortscore: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number;
  direction: number;
  focalLen: number;
  radius_km: number;
  sector: number;
  partner: boolean;
  captureInterval: number;
}

export interface FotoWebcamEUResponse {
  cams: FotoWebcamEU[];
}

export function convertFotoWebcamEU(webcam: FotoWebcamEU): GenericObservation<FotoWebcamEU> {
  webcam["latest"] = webcam.imgurl;
  return {
    $data: webcam,
    $externalURL: webcam.link,
    $source: ObservationSource.FotoWebcamsEU,
    $type: ObservationType.Webcam,
    authorName: "foto-webcam.eu",
    content: webcam.title,
    elevation: webcam.elevation,
    eventDate: new Date(webcam.modtime * 1000),
    latitude: webcam.latitude,
    longitude: webcam.longitude,
    locationName: webcam.name,
    aspect: degreeToAspect(webcam.direction),
  } as GenericObservation<FotoWebcamEU>;
}

export function addLolaCadsData(cam: GenericObservation<FotoWebcamEU>, lolaCadsData: any): GenericObservation<any> {
  if (lolaCadsData.length === 0) return cam;
  return {
    $data: cam,
    $externalURL: cam.$externalURL,
    $source: ObservationSource.FotoWebcamsEU,
    $type: ObservationType.Avalanche,
    authorName: `foto-webcam.eu, ${lolaCadsData[0].label}, ${Math.round(lolaCadsData[0].conf * 100)}%`,
    content: cam.content,
    elevation: cam.elevation,
    eventDate: new Date(Date.now()),
    latitude: cam.latitude,
    longitude: cam.longitude,
    locationName: cam.locationName,
    region: cam.region,
    aspect: cam.aspect,
  };
}
