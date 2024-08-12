import { GenericMapObject } from "./generic-map-object.model";

export interface DangerSourceModel extends GenericMapObject {
  id: number;
  creationDate: Date;
  description: string;
}
