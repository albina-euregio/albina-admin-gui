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

export interface QFA {
  metadata: metadata;
  parameters: parameters;
  coordinates: coordinates;
  height: number;
  date: string;
  paramDates: string[];
}
