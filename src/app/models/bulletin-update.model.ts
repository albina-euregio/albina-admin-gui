import * as Enums from "../enums/enums";
import { formatDate } from "@angular/common";

export class BulletinUpdateModel {
  public region: string;
  public date: Date;
  public status: Enums.BulletinStatus;

  static createFromJson(json) {
    const bulletinUpdate = new BulletinUpdateModel();

    bulletinUpdate.setRegion(json.region);
    bulletinUpdate.setDate(new Date(json.date));
    bulletinUpdate.setStatus(Enums.BulletinStatus[json.status as string]);

    return bulletinUpdate;
  }

  constructor() {
    this.region = undefined;
    this.date = undefined;
    this.status = undefined;
  }

  getRegion() {
    return this.region;
  }

  setRegion(region: string) {
    this.region = region;
  }

  getDate() {
    return this.date;
  }

  setDate(date: Date) {
    this.date = date;
  }

  getStatus() {
    return this.status;
  }

  setStatus(status: Enums.BulletinStatus) {
    this.status = status;
  }

  toJson() {
    const json = Object();

    if (this.region) {
      json["region"] = this.region;
    }
    if (this.date) {
      json["date"] = formatDate(this.date, "yyyy-MM-ddTHH:mm:ssZZZZZ", "en-US");
    }
    if (this.status !== null && this.status !== undefined) {
      json["status"] = this.status;
    }

    return json;
  }
}
