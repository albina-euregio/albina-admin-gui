import { inject, Injectable } from "@angular/core";
import { from, map, Observable } from "rxjs";

import {
  StressLevel,
  StressLevelSchema,
  TeamStressLevels,
  TeamStressLevelsSchema,
} from "../../models/stress-level.model";
import { UserModel, UserSchema } from "../../models/user.model";
import * as albinaApi from "../albina-api";
import { AuthenticationService } from "../authentication-service/authentication.service";

@Injectable({ providedIn: "root" })
export class UserService {
  authenticationService = inject(AuthenticationService);

  public changePassword(oldPassword: string, newPassword: string): Observable<Response> {
    return from(albinaApi.changePassword({ body: { oldPassword, newPassword }, throwOnError: true })).pipe(
      map((res) => res.data as unknown as Response),
    );
  }

  public resetPassword(userId: string, newPassword: string): Observable<Response> {
    return from(albinaApi.resetPassword({ path: { id: userId }, body: { newPassword }, throwOnError: true })).pipe(
      map((res) => res.data as unknown as Response),
    );
  }

  public checkPassword(password: string): Observable<Response> {
    return from(albinaApi.checkPassword({ body: { password }, throwOnError: true })).pipe(
      map((res) => res.data as unknown as Response),
    );
  }

  public postUser(user: UserModel): Observable<Response> {
    return from(albinaApi.saveUser({ body: user as unknown as albinaApi.User, throwOnError: true })).pipe(
      map((res) => res.data as unknown as Response),
    );
  }

  public getUsers(): Observable<UserModel[]> {
    return from(albinaApi.getUsers({ throwOnError: true })).pipe(map((res) => UserSchema.array().parse(res.data)));
  }

  public getRoles(): Observable<string[]> {
    return from(albinaApi.getRoles({ throwOnError: true })).pipe(
      // The spec types the response as a single Role, but it is an array of roles.
      map((res) => res.data as unknown as string[]),
    );
  }

  public getRegions(): Observable<string[]> {
    return from(albinaApi.getRegions1({ throwOnError: true })).pipe(map((res) => res.data));
  }

  public deleteUser(userId: UserModel["email"]): Observable<Response> {
    return from(albinaApi.deleteUser({ path: { id: userId }, throwOnError: true })).pipe(
      map((res) => res.data as unknown as Response),
    );
  }

  public postStressLevel(stressLevel: StressLevel): Observable<StressLevel> {
    return from(
      albinaApi.postStressLevel({ body: stressLevel as unknown as albinaApi.StressLevel, throwOnError: true }),
    ).pipe(map((res) => res.data as unknown as StressLevel));
  }

  public getStressLevels(date: [Date, Date]): Observable<StressLevel[]> {
    return from(
      albinaApi.getStressLevels({
        query: {
          startDate: date[0].toISOString(),
          endDate: date[1].toISOString(),
        },
        throwOnError: true,
      }),
    ).pipe(map((res) => StressLevelSchema.array().parse(res.data)));
  }

  public getTeamStressLevels(date: [Date, Date]): Observable<TeamStressLevels> {
    return from(
      albinaApi.getTeamStressLevels({
        query: {
          region: this.authenticationService.getActiveRegionId(),
          startDate: date[0].toISOString(),
          endDate: date[1].toISOString(),
        },
        throwOnError: true,
      }),
    ).pipe(map((res) => TeamStressLevelsSchema.parse(res.data)));
  }
}
