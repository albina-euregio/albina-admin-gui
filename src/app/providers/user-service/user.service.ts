import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ConstantsService } from "../constants-service/constants.service";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { StressLevel } from "../../models/stress-level.model";

@Injectable()
export class UserService {
  constructor(
    public http: HttpClient,
    public constantsService: ConstantsService,
    public authenticationService: AuthenticationService,
  ) {}

  public changePassword(oldPassword: string, newPassword: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/change";
    const body = JSON.stringify({ oldPassword, newPassword });
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.put<Response>(url, body, options);
  }

  public resetPassword(userId: string, newPassword: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/" + userId + "/reset";
    const body = JSON.stringify({ newPassword });
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.put<Response>(url, body, options);
  }

  public checkPassword(password: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/check";
    const body = JSON.stringify({ password });
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.put<Response>(url, body, options);
  }

  public createUser(user): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/create";
    const body = JSON.stringify(user.toJson());
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  public updateUser(user): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/" + user.email;
    const body = JSON.stringify(user.toJson());
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.put<Response>(url, body, options);
  }

  public updateOwnUser(user): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user";
    const body = JSON.stringify(user.toJson());
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.put<Response>(url, body, options);
  }

  public getUsers(): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user";
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  public getRoles(): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/roles";
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  public getRegions(): Observable<string[]> {
    const url = this.constantsService.getServerUrl() + "user/regions";
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<string[]>(url, options);
  }

  public deleteUser(userId): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/" + userId;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.delete<Response>(url, options);
  }

  public postStressLevel(stressLevel: StressLevel): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/stress-level";
    const headers = this.authenticationService.newAuthHeader();
    return this.http.post<Response>(url, stressLevel, { headers });
  }

  public getStressLevels(date: [Date, Date]): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/stress-level";
    const headers = this.authenticationService.newAuthHeader();
    const params = {
      startDate: date[0].toISOString(),
      endDate: date[1].toISOString(),
    };
    return this.http.get<Response>(url, { headers, params });
  }
}
