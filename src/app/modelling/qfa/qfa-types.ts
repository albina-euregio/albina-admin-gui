export interface coordinates {
  lat: number;
  lng: number;
}

export interface metadata {
  location: string;
  coords: coordinates;
  height: number;
  orog: number;
  date: Date;
  timezone: string;
  model: string;
  nDays: number;
  dates?: Date[];
}

export type parameters = Record<string, any[]>;

export interface data {
  metadata: metadata;
  parameters: parameters;
}

export interface QFA {
  data: data;
  metadata: metadata;
  parameters: parameters;
  coordinates: coordinates;
  height: number;
  date: string;
  paramDates: string[];
  loadFromURL: (url: string) => Promise<void>;
  listParameters(): string[];
}

export type markers = Record<string, coordinates>;

export interface MarkerData {
  markers: markers;
  getCityName: (ll: coordinates) => string;
}
