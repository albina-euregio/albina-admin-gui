export interface ServerConfiguration {
  id: string;
  name: string;
  apiUrl: string;
  userName: string;
  password: string;
  externalServer: boolean;
  publishAt5PM: boolean;
  publishAt8AM: boolean;
  pdfDirectory: string;
  htmlDirectory: string;
  mapsPath: string;
  mediaPath: string;
  mapProductionUrl: string;
  serverImagesUrl: string;
  dangerLevelElevationDependency: boolean;
  isNew: boolean;
}
