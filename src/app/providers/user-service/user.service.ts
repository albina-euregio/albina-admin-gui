import {
  StressLevel,
  StressLevelSchema,
  TeamStressLevels,
  TeamStressLevelsSchema,
} from "../../models/stress-level.model";
import { UserModel, UserSchema } from "../../models/user.model";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";

@Injectable()
export class UserService {
  http = inject(HttpClient);
  constantsService = inject(ConstantsService);
  authenticationService = inject(AuthenticationService);

  public changePassword(oldPassword: string, newPassword: string): Observable<Response> {
    const url = this.constantsService.getServerUrlPUT("/user/change");
    const body = JSON.stringify({ oldPassword, newPassword });
    return this.http.put<Response>(url, body);
  }

  public resetPassword(userId: string, newPassword: string): Observable<Response> {
    const url = this.constantsService.getServerUrlPUT("/user/{id}/reset", null as never, { id: userId });
    const body = JSON.stringify({ newPassword });
    return this.http.put<Response>(url, body);
  }

  public checkPassword(password: string): Observable<Response> {
    const url = this.constantsService.getServerUrlPUT("/user/check");
    const body = JSON.stringify({ password });
    return this.http.put<Response>(url, body);
  }

  public postUser(user: UserModel): Observable<Response> {
    const url = this.constantsService.getServerUrlPOST("/user");
    const body = JSON.stringify(user);
    return this.http.post<Response>(url, body);
  }

  public getUsers(): Observable<UserModel[]> {
    const url = this.constantsService.getServerUrlGET("/user");
    return this.http.get(url).pipe(map((json) => UserSchema.array().parse(json)));
  }

  public getRoles(): Observable<string[]> {
    const url = this.constantsService.getServerUrlGET("/user/roles");
    return this.http.get<string[]>(url);
  }

  public getRegions(): Observable<string[]> {
    const url = this.constantsService.getServerUrlGET("/user/regions");
    return this.http.get<string[]>(url);
  }

  public deleteUser(userId: UserModel["email"]): Observable<Response> {
    const url = this.constantsService.getServerUrlDELETE("/user/{id}", null as never, { id: userId });
    return this.http.delete<Response>(url);
  }

  public postStressLevel(stressLevel: StressLevel): Observable<StressLevel> {
    const url = this.constantsService.getServerUrlPOST("/user/stress-level");
    return this.http.post<StressLevel>(url, stressLevel);
  }

  public getStressLevels(date: [Date, Date]): Observable<StressLevel[]> {
    const url = this.constantsService.getServerUrlGET("/user/stress-level");
    const params = {
      startDate: date[0].toISOString(),
      endDate: date[1].toISOString(),
    };
    return this.http.get(url, { params }).pipe(map((json) => StressLevelSchema.array().parse(json)));
  }

  public getTeamStressLevels(date: [Date, Date]): Observable<TeamStressLevels> {
    const url = this.constantsService.getServerUrlGET("/user/stress-level/team");
    const params = {
      region: this.authenticationService.getActiveRegionId(),
      startDate: date[0].toISOString(),
      endDate: date[1].toISOString(),
    };
    return this.http.get(url, { params }).pipe(map((json) => TeamStressLevelsSchema.parse(json)));
  }
}
