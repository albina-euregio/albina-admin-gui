import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { map, mergeAll } from "rxjs/operators";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { SettingsService } from "../providers/settings-service/settings.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { UserService } from "../providers/user-service/user.service";
import { DangerSourceModel } from "./models/danger-source.model";
import { DangerSourceVariant } from "./models/danger-source-schema.model";

@Injectable()
export class DangerSourcesService {
  private activeDate: [Date, Date];
  private isEditable: boolean;
  private isReadOnly: boolean;

  public statusMap: Map<string, Map<number, DangerSourceVariant>>;

  public dates: [Date, Date][];

  constructor(
    public http: HttpClient,
    private constantsService: ConstantsService,
    private authenticationService: AuthenticationService,
    private settingsService: SettingsService,
    private userService: UserService,
  ) {
    this.init();
  }

  init({ days } = { days: 10 }) {
    this.dates = [];
    this.isEditable = false;
    this.isReadOnly = false;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    endDate.setHours(0, 0, 0, 0);

    for (let i = 0; i <= days; i++) {
      const date = new Date(endDate.valueOf());
      date.setDate(endDate.getDate() - i);
      this.dates.push(this.getValidFromUntil(date));
    }
  }

  getActiveDate(): [Date, Date] {
    return this.activeDate;
  }

  setActiveDate(date: [Date, Date]) {
    this.activeDate = date;
  }

  getValidFromUntil(date: Date): [Date, Date] {
    const validFrom = new Date(date);
    validFrom.setTime(validFrom.getTime() - 7 * 60 * 60 * 1000);
    const validUntil = new Date(date);
    validUntil.setTime(validUntil.getTime() + 17 * 60 * 60 * 1000);
    return [validFrom, validUntil];
  }

  hasBeenPublished5PM(date: [Date, Date]): boolean {
    // date[0] = validFrom = 17:00 = published at
    const published = date[0];
    return Date.now() >= published.getTime();
  }

  /**
   * Returns a date that's offset from the activeDate by a given amount.
   *
   * @param offset - Number of days to offset. Can be positive (future) or negative (past).
   * @returns Date offset from the activeDate or null if not found or out of bounds.
   */
  private getDateOffset(offset: number): [Date, Date] | null {
    if (!this.activeDate) {
      return null;
    }

    const index = this.dates.findIndex((d) => d[0].getTime() === this.activeDate[0].getTime());

    if (index === -1 || index + offset < 0 || index + offset >= this.dates.length) {
      return null;
    }

    return this.dates[index + offset];
  }

  private defaultParams(date: [Date, Date]) {
    return new URLSearchParams({
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      region: this.authenticationService.getActiveRegionId(),
    });
  }

  getNextDate(): [Date, Date] | null {
    return this.getDateOffset(1);
  }

  getPreviousDate(): [Date, Date] | null {
    return this.getDateOffset(-1);
  }

  getIsEditable(): boolean {
    return this.isEditable && !this.isReadOnly;
  }

  setIsEditable(isEditable: boolean) {
    this.isEditable = isEditable;
  }

  getIsReadOnly(): boolean {
    return this.isReadOnly;
  }

  setIsReadOnly(isReadOnly: boolean) {
    this.isReadOnly = isReadOnly;
  }

  loadDangerSources(date: [Date, Date], regions: string[], etag?: string) {
    let url =
      this.constantsService.getServerUrl() +
      "danger-sources/edit?date=" +
      this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date[0]);
    if (regions) {
      for (const region of regions) {
        url += "&regions=" + region;
      }
    }
    const headers = this.authenticationService.newAuthHeader();
    if (etag) headers.set("If-None-Match", etag);
    return this.http.get(url, { headers, observe: "response" });
  }

  createDangerSource(dangerSource: DangerSourceModel, date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "danger-sources?date=" +
      this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date[0]) +
      "&region=" +
      this.authenticationService.getActiveRegionId();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify(dangerSource);
    return this.http.put(url, body, { headers });
  }

  updateDangerSource(dangerSource: DangerSourceModel, date: [Date, Date]) {
    // check if danger source has ID
    const url =
      this.constantsService.getServerUrl() + "danger-sources/" + dangerSource.id + "?" + this.defaultParams(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify(dangerSource);
    return this.http.post(url, body, { headers });
  }

  loadDangerSourceVariants(date: [Date, Date], regions: string[]): Observable<DangerSourceVariant[]> {
    let url =
      this.constantsService.getServerUrl() +
      "danger-sources/variants/edit?date=" +
      this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date[0]);
    if (regions) {
      for (const region of regions) {
        url += "&regions=" + region;
      }
    }
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get<DangerSourceVariant[]>(url, { headers });
  }

  createDangerSourceVariant(dangerSourceVariant: DangerSourceVariant, date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "danger-sources/variants?date=" +
      this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date[0]) +
      "&region=" +
      this.authenticationService.getActiveRegionId();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify(dangerSourceVariant);
    return this.http.put(url, body, { headers });
  }

  updateDangerSourceVariant(dangerSourceVariant: DangerSourceVariant, date: [Date, Date]) {
    // check if danger source has ID
    const url =
      this.constantsService.getServerUrl() +
      "danger-sources/variants/" +
      dangerSourceVariant.id +
      "?date=" +
      this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date[0]) +
      "&region=" +
      this.authenticationService.getActiveRegionId();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify(dangerSourceVariant);
    return this.http.post(url, body, { headers });
  }

  deleteDangerSourceVariant(variant: DangerSourceVariant, date: [Date, Date]) {
    // check if variant has ID
    const url =
      this.constantsService.getServerUrl() +
      "danger-sources/variants/" +
      variant.id +
      "?date=" +
      this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date[0]) +
      "&region=" +
      this.authenticationService.getActiveRegionId();
    const headers = this.authenticationService.newAuthHeader();
    return this.http.delete(url, { headers });
  }
}
