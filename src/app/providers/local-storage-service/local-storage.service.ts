import { Injectable } from "@angular/core";
import { BulletinModel } from "../../models/bulletin.model";


@Injectable()
export class LocalStorageService {

  constructor() {
  }

  clear() {
    localStorage.removeItem("date");
    localStorage.removeItem("region");
    localStorage.removeItem("author");
    localStorage.removeItem("bulletins");
  }

  getDate(): Date {
    return new Date(+localStorage.getItem("date"));
  }

  getRegion(): string {
    return localStorage.getItem("region");
  }

  getAuthor(): string {
    return localStorage.getItem("author");
  }
}
