import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { map, mergeAll } from "rxjs/operators";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { SettingsService } from "../providers/settings-service/settings.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { UserService } from "../providers/user-service/user.service";
import { DangerSourceModel } from "./models/danger-source.model";
import { DangerSourceVariantModel } from "./models/danger-source-variant.model";

@Injectable()
export class DangerSourcesService {
  private activeDate: [Date, Date];
  private isEditable: boolean;
  private isReadOnly: boolean;

  public statusMap: Map<string, Map<number, DangerSourceVariantModel>>;

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

  loadDangerSources(date: [Date, Date], regions: string[]): Observable<DangerSourceModel[]> {
    let url =
      this.constantsService.getServerUrl() +
      "danger-sources?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["regions", regions],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get<DangerSourceModel[]>(url, { headers });
  }

  updateDangerSource(dangerSource: DangerSourceModel, date: [Date, Date]) {
    // check if danger source has ID
    const url =
      this.constantsService.getServerUrl() +
      "danger-sources/" +
      dangerSource.id +
      "?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", this.authenticationService.getActiveRegionId()],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify(dangerSource);
    return this.http.post(url, body, { headers });
  }

  loadDangerSourceVariants(
    date: [Date, Date],
    regions: string[],
    dangerSourceId?: string,
  ): Observable<DangerSourceVariantModel[]> {
    let url;
    if (dangerSourceId && dangerSourceId !== "") {
      url =
        this.constantsService.getServerUrl() +
        "danger-sources/" +
        dangerSourceId +
        "/edit?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["regions", regions],
          ])
          .toString();
    } else {
      url =
        this.constantsService.getServerUrl() +
        "danger-sources/edit?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["regions", regions],
          ])
          .toString();
    }
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get<DangerSourceVariantModel[]>(url, { headers });
  }

  createDangerSourceVariant(
    dangerSourceVariant: DangerSourceVariantModel,
    date: [Date, Date],
  ): Observable<DangerSourceVariantModel[]> {
    const url =
      this.constantsService.getServerUrl() +
      "danger-sources/variants?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", this.authenticationService.getActiveRegionId()],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify(dangerSourceVariant);
    return this.http.put<DangerSourceVariantModel[]>(url, body, { headers });
  }

  updateDangerSourceVariant(
    dangerSourceVariant: DangerSourceVariantModel,
    date: [Date, Date],
  ): Observable<DangerSourceVariantModel[]> {
    // check if danger source has ID
    const url =
      this.constantsService.getServerUrl() +
      "danger-sources/variants/" +
      dangerSourceVariant.id +
      "?" +
      this.constantsService.createSearchParams([
        ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
        ["region", this.authenticationService.getActiveRegionId()],
      ]);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify(dangerSourceVariant);
    return this.http.post<DangerSourceVariantModel[]>(url, body, { headers });
  }

  deleteDangerSourceVariant(
    variant: DangerSourceVariantModel,
    date: [Date, Date],
  ): Observable<DangerSourceVariantModel[]> {
    // check if variant has ID
    const url =
      this.constantsService.getServerUrl() +
      "danger-sources/variants/" +
      variant.id +
      "?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", this.authenticationService.getActiveRegionId()],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    return this.http.delete<DangerSourceVariantModel[]>(url, { headers });
  }

  saveDangerSourceVariants(variants: DangerSourceVariantModel[], date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "danger-sources/variants?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", this.authenticationService.getActiveRegionId()],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify(variants);
    return this.http.post(url, body, { headers });
  }
}
