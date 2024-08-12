import { PolygonObject } from "./polygon-object.model";

export interface DangerSourceModel extends PolygonObject {
  id: number;
  creationDate: Date;
  description: string;
}
