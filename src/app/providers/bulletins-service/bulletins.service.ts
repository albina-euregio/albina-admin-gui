import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, ResponseOptions } from '@angular/http';
import { ConstantsService } from '../constants-service/constants.service';
import { AuthenticationService } from '../authentication-service/authentication.service';
import { Observable } from 'rxjs/Observable';
import { BulletinModel } from '../../models/bulletin.model';
import * as Enums from '../../enums/enums';
import { RegionsService } from '../regions-service/regions.service';
import * as io from 'socket.io-client';


@Injectable()
export class BulletinsService {

  private activeDate: Date;
  private copyDate: Date;
  private isEditable: boolean;

  public statusMapTrentino: Map<Date, Enums.BulletinStatus>;
  public statusMapSouthTyrol: Map<Date, Enums.BulletinStatus>;
  public statusMapTyrol: Map<Date, Enums.BulletinStatus>;

  private socket;

  constructor(
    public http: Http,
    private constantsService: ConstantsService,
    private authenticationService: AuthenticationService)
  {
    this.activeDate = undefined;
    this.copyDate = undefined;
    this.isEditable = false;
    this.statusMapTrentino = new Map<Date, Enums.BulletinStatus>();
    this.statusMapSouthTyrol = new Map<Date, Enums.BulletinStatus>();
    this.statusMapTyrol = new Map<Date, Enums.BulletinStatus>();
  }

  getActiveDate() : Date {
    return this.activeDate;
  }

  setActiveDate(date: Date) {
    this.activeDate = date;
  }

  getCopyDate() : Date {
    return this.copyDate;
  }

  setCopyDate(date: Date) {
    this.copyDate = date;
  }

  getIsEditable() : boolean {
    return this.isEditable;
  }

  setIsEditable(isEditable: boolean) {
    this.isEditable = isEditable;
  }

  getUserRegionStatus(date: Date) : Enums.BulletinStatus {
    let region = this.authenticationService.getUserRegion();
    switch (region) {
      case "IT-32-TN":
        return this.statusMapTrentino.get(date);
      case "IT-32-BZ":
        return this.statusMapSouthTyrol.get(date);
      case "AT-07":
        return this.statusMapTyrol.get(date);
      
      default:
        return undefined;
    }
  }
  
  setUserRegionStatus(date: Date, status: Enums.BulletinStatus) {
    let region = this.authenticationService.getUserRegion();
    switch (region) {
      case "IT-32-TN":
        this.statusMapTrentino.set(date, status);
      case "IT-32-BZ":
        this.statusMapSouthTyrol.set(date, status);
      case "AT-07":
        this.statusMapTyrol.set(date, status);
      
      default:
        return undefined;
    }
  }
  
  getStatus(region: string, date: Date) : Observable<Response> {
    // TODO check how to encode date with timezone in url
    let url = this.constantsService.getServerUrl() + 'bulletins/status?date=' + this.constantsService.getISOStringWithTimezoneOffset(date) + '&region=' + region;
    let authHeader = 'Bearer ' + this.authenticationService.getToken();
    let headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader });
    let options = new RequestOptions({ headers: headers });

    return this.http.get(url, options);
  }

  loadBulletins(date: Date, regions?: String[]) : Observable<Response> {
    // TODO check how to encode date with timezone in url
    let url = this.constantsService.getServerUrl() + 'bulletins?date=' + this.constantsService.getISOStringWithTimezoneOffset(date);
    if (regions) {
      for (let region of regions)
        url += "&regions=" + region;
    }
    let authHeader = 'Bearer ' + this.authenticationService.getToken();
    let headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader });
    let options = new RequestOptions({ headers: headers });

    return this.http.get(url, options);
  }

  loadCaamlBulletins(date: Date) : Observable<Response> {
    // TODO check how to encode date with timezone in url
    let url = this.constantsService.getServerUrl() + 'bulletins?date=' + this.constantsService.getISOStringWithTimezoneOffset(date);
    let authHeader = 'Bearer ' + this.authenticationService.getToken();
    let headers = new Headers({
      'Content-Type': 'application/xml',
      'Accept': 'application/xml',
      'Authorization': authHeader });
    let options = new RequestOptions({ headers: headers });
 
    return this.http.get(url, options);
  }

  saveBulletin(bulletin: BulletinModel) : Observable<Response> {
    let url = this.constantsService.getServerUrl() + 'bulletins';
    let authHeader = 'Bearer ' + this.authenticationService.getToken();
    let headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader });
    let body = JSON.stringify(bulletin.toJson());
    console.log("SAVE bulletin:");
    console.log(body);
    let options = new RequestOptions({ headers: headers });

    return this.http.post(url, body, options);
  }

  updateBulletin(bulletin: BulletinModel) : Observable<Response> {
    let url = this.constantsService.getServerUrl() + 'bulletins/' + bulletin.getId();
    let authHeader = 'Bearer ' + this.authenticationService.getToken();
    let headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader });
    let body = JSON.stringify(bulletin.toJson());
    console.log(body);
    let options = new RequestOptions({ headers: headers });

    return this.http.put(url, body, options);
  }

  deleteBulletin(bulletinId: string) : Observable<Response> {
    let url = this.constantsService.getServerUrl() + 'bulletins/' + bulletinId;
    let authHeader = 'Bearer ' + this.authenticationService.getToken();
    let headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader });
    let options = new RequestOptions({ headers: headers });

    return this.http.delete(url, options);
  }

  publishBulletins(date: Date, region: string) : Observable<Response> {
    let url = this.constantsService.getServerUrl() + 'bulletins/publish?date=' + this.constantsService.getISOStringWithTimezoneOffset(date) + '&region=' + region;
    let authHeader = 'Bearer ' + this.authenticationService.getToken();
    let headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader });
    let body = JSON.stringify("");
    let options = new RequestOptions({ headers: headers });

    return this.http.post(url, body, options);
  }

  checkBulletins(date: Date, region: string) : Observable<Response> {
    let url = this.constantsService.getServerUrl() + 'bulletins/check?date=' + this.constantsService.getISOStringWithTimezoneOffset(date) + '&region=' + region;
    let authHeader = 'Bearer ' + this.authenticationService.getToken();
    let headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader });
    let options = new RequestOptions({ headers: headers });

    return this.http.get(url, options);
  }

  sendMessage() {
    let message = "BULLETIN UPDATE!";
    this.socket.emit('bulletinUpdate', message);
    console.log("SocketIO message sent: " + message);
  }
}