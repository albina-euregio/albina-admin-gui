import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map, Observable } from "rxjs";
import { ConstantsService } from "../constants-service/constants.service";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { StressLevel } from "../../models/stress-level.model";
import { UserModel, UserSchema } from "../../models/user.model";

@Injectable()
export class UserService {
  http = inject(HttpClient);
  constantsService = inject(ConstantsService);
  authenticationService = inject(AuthenticationService);

  public changePassword(oldPassword: string, newPassword: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/change";
    const body = JSON.stringify({ oldPassword, newPassword });
    return this.http.put<Response>(url, body);
  }

  public resetPassword(userId: string, newPassword: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/" + userId + "/reset";
    const body = JSON.stringify({ newPassword });
    return this.http.put<Response>(url, body);
  }

  public checkPassword(password: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/check";
    const body = JSON.stringify({ password });
    return this.http.put<Response>(url, body);
  }

  public createUser(user: UserModel): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/create";
    const body = JSON.stringify(user);
    return this.http.post<Response>(url, body);
  }

  public updateUser(user: UserModel): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/" + user.email;
    const body = JSON.stringify(user);
    return this.http.put<Response>(url, body);
  }

  public updateOwnUser(user: UserModel): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user";
    const body = JSON.stringify(user);
    return this.http.put<Response>(url, body);
  }

  public getUsers(): Observable<UserModel[]> {
    const url = this.constantsService.getServerUrl() + "user";
    return this.http.get(url).pipe(map((json) => UserSchema.array().parse(json)));
  }

  public getRoles(): Observable<string[]> {
    const url = this.constantsService.getServerUrl() + "user/roles";
    return this.http.get<string[]>(url);
  }

  public getRegions(): Observable<string[]> {
    const url = this.constantsService.getServerUrl() + "user/regions";
    return this.http.get<string[]>(url);
  }

  public deleteUser(userId: UserModel["email"]): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "user/" + userId;
    return this.http.delete<Response>(url);
  }

  public postStressLevel(stressLevel: StressLevel): Observable<StressLevel> {
    const url = this.constantsService.getServerUrl() + "user/stress-level";
    return this.http.post<StressLevel>(url, stressLevel);
  }

  public getStressLevels(date: [Date, Date]): Observable<StressLevel[]> {
    const url = this.constantsService.getServerUrl() + "user/stress-level";
    const params = {
      startDate: date[0].toISOString(),
      endDate: date[1].toISOString(),
    };
    return this.http.get<StressLevel[]>(url, { params });
  }

  public getTeamStressLevels(date: [Date, Date]): Observable<Record<string, StressLevel[]>> {
    const url = this.constantsService.getServerUrl() + "user/stress-level/team";
    const params = {
      region: this.authenticationService.getActiveRegionId(),
      startDate: date[0].toISOString(),
      endDate: date[1].toISOString(),
    };
    return this.http.get<Record<string, StressLevel[]>>(url, { params });
  }
}
