import { type GenericObservation, ObservationSource, ObservationType, degreeToAspect } from "../../generic-observation";

export interface PanomaxCam {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  zeroDirection: number;
  viewAngle: number;
  iconUrl: string;
  mapMarkerGravity: string;
  nightVision: boolean;
  types?: unknown[];
  elevation?: number;
  tourCam?: boolean;
  country?: string;
  countryName?: string;
  firstPano?: string;
  lastPano?: string;
}

export interface PanomaxInstance {
  id: number;
  name: string;
  frontentryUrl?: string;
  logo?: string;
  initialDirection: number;
  cam: PanomaxCam;
}

type DateString = string;

export interface PanomaxThumbnailResponse {
  mode: string;
  name: string;
  url: string;
  tourCam: boolean;
  zeroDirection: number;
  viewAngle: number;
  initialDirection: number;
  clipping: unknown;
  logo: string;
  images: Record<DateString, Record<"default" | "h572" | "optimized" | "reduced" | "small" | "thumb", string>>;
  instance: PanomaxInstance;
  culture: unknown;
  country: string;
  position: {
    latitude: number;
    longitude: number;
  };
  latest: string;
}

export interface PanomaxCamResponse {
  id: string;
  slug: string;
  type: string;
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  otherInstances: unknown[];
  instanceLogos: unknown[];
  hotSpots: unknown[];
  categories: unknown[];
  sources: unknown[];
  clusteringZoomLevel: number;
  refreshInterval: number;
  instances: {
    [key: string]: PanomaxInstance;
  };
}

export function convertPanomax(thumb: PanomaxThumbnailResponse): GenericObservation<PanomaxThumbnailResponse> {
  const cam = thumb.instance.cam;
  //set thumb.latest to the latest image from res.images
  if (thumb.images) {
    thumb.latest = thumb.images[Object.keys(thumb.images).sort().pop()].small;
  }
  return {
    $data: thumb,
    $externalURL: thumb.url,
    $source: ObservationSource.Panomax,
    $type: ObservationType.Webcam,
    authorName: "panomax.com",
    content: cam.name,
    elevation: cam.elevation,
    eventDate: new Date(Date.now()),
    latitude: cam.latitude,
    longitude: cam.longitude,
    locationName: thumb.instance.name,
    aspect: cam.viewAngle !== 360 ? degreeToAspect(cam.zeroDirection) : undefined,
  } as GenericObservation<PanomaxThumbnailResponse>;
}
