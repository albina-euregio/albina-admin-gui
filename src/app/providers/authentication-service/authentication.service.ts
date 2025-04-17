import { inject, Injectable, SecurityContext } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ConstantsService } from "../constants-service/constants.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { AuthorModel } from "../../models/author.model";
import { ServerModel } from "../../models/server.model";
import { RegionConfiguration, ServerConfiguration } from "../configuration-service/configuration.service";
import { LocalStorageService } from "../local-storage-service/local-storage.service";
import * as Enums from "../../enums/enums";

@Injectable()
export class AuthenticationService {
  private localStorageService = inject(LocalStorageService);
  private http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private sanitizer = inject(DomSanitizer);

  currentAuthor: AuthorModel;
  private internalRegions: RegionConfiguration[];
  private externalServers: ServerModel[];
  private jwtHelper: JwtHelperService;
  private activeRegion: RegionConfiguration | undefined;

  constructor() {
    this.externalServers = [];
    try {
      this.setCurrentAuthor(this.localStorageService.getCurrentAuthor());
    } catch (e) {
      this.localStorageService.setCurrentAuthor(undefined);
    }
    try {
      this.setActiveRegion(this.localStorageService.getActiveRegion());
    } catch (e) {
      this.localStorageService.setActiveRegion(undefined);
    }
    try {
      this.setInternalRegions(this.localStorageService.getInternalRegions());
    } catch (e) {
      this.localStorageService.setInternalRegions(undefined);
    }
    try {
      this.setExternalServers(this.localStorageService.getExternalServers());
    } catch (e) {
      this.localStorageService.setExternalServers(undefined);
    }
    this.jwtHelper = new JwtHelperService();
  }

  public login(username: string, password: string): Observable<boolean> {
    const url = this.constantsService.getServerUrl() + "authentication";
    const body = JSON.stringify({ username, password });
    return this.http.post<AuthenticationResponse>(url, body).pipe(
      map((data) => {
        if (data.access_token) {
          this.setCurrentAuthor(data);
          const authorRegions = this.getCurrentAuthorRegions();
          const activeRegionFromLocalStorage = this.localStorageService.getActiveRegion();
          this.setActiveRegion(
            authorRegions.find((r) => r.id === activeRegionFromLocalStorage?.id) ?? authorRegions?.[0],
          );
          this.loadInternalRegions();
          this.externalServerLogins();
          return true;
        } else {
          return false;
        }
      }),
    );
  }

  public isUserLoggedIn(): boolean {
    return this.currentAuthor?.accessToken && !this.jwtHelper.isTokenExpired(this.currentAuthor.accessToken);
  }

  public logout() {
    console.debug("[" + this.currentAuthor?.name + "] Logged out!");
    this.currentAuthor = null;
    this.activeRegion = undefined;
    this.localStorageService.setCurrentAuthor(undefined);
    this.localStorageService.setInternalRegions(undefined);
    this.localStorageService.setExternalServers(undefined);
    this.externalServers = [];
  }

  private loadInternalRegions(): void {
    const url = this.constantsService.getServerUrl() + "regions";
    this.http.get<RegionConfiguration[]>(url).subscribe((regions) => this.setInternalRegions(regions));
  }

  private setInternalRegions(regions: RegionConfiguration[]) {
    this.internalRegions = regions;
    this.localStorageService.setInternalRegions(this.internalRegions);
  }

  private externalServerLogins() {
    const url = this.constantsService.getServerUrl() + "server/external";
    this.http.get<ServerConfiguration[]>(url).subscribe(
      (data) => {
        for (const entry of data) {
          this.externalServerLogin(entry).subscribe(
            (data) => {
              if (data === true) {
                console.debug("[" + entry.name + "] Logged in!");
              } else {
                console.error("[" + entry.name + "] Login failed!");
              }
            },
            (error) => {
              console.error("[" + entry.name + "] Login failed: " + JSON.stringify(error._body), error);
            },
          );
        }
      },
      (error) => {
        console.error("External server instances could not be loaded: " + JSON.stringify(error._body), error);
      },
    );
  }

  public externalServerLogin(server: ServerConfiguration): Observable<boolean> {
    if (server.userName.startsWith("https://")) {
      const tokenURL = server.userName;
      const headers = { "Content-Type": "application/x-www-form-urlencoded" };
      return this.http
        .post<{ access_token: string }>(tokenURL, server.password, { headers })
        .pipe(map((data) => this.addExternalServer(server, data)));
    }
    const url = server.apiUrl + "authentication";
    const body = JSON.stringify({ username: server.userName, password: server.password });
    return this.http.post<AuthenticationResponse>(url, body).pipe(map((data) => this.addExternalServer(server, data)));
  }

  private addExternalServer(server0: ServerConfiguration, json: Partial<AuthenticationResponse>): boolean {
    if (!json.access_token) {
      return false;
    }
    const server = ServerModel.createFromJson(json);
    server.apiUrl = server0.apiUrl;
    server.name = server0.name;
    this.externalServers.push(server);
    this.localStorageService.setExternalServers(this.externalServers);
    return true;
  }

  private setExternalServers(json: Partial<ServerModel>[]) {
    if (!json) {
      return;
    }
    for (const server of json) {
      this.externalServers.push(ServerModel.createFromJson(server));
    }
  }

  public checkExternalServerLogin() {
    for (const server of this.externalServers) {
      if (this.jwtHelper.isTokenExpired(server.accessToken)) {
        this.externalServers = [];
        this.localStorageService.setExternalServers(undefined);
        this.externalServerLogins();
        break;
      }
    }
  }

  public getCurrentAuthor() {
    return this.currentAuthor;
  }

  private setCurrentAuthor(json: Partial<AuthorModel>) {
    if (!json) {
      return;
    }
    this.currentAuthor = AuthorModel.createFromJson(json);
    this.localStorageService.setCurrentAuthor(this.currentAuthor);
  }

  public getUsername(): string {
    return this.currentAuthor?.name;
  }

  public getEmail(): string {
    return this.currentAuthor?.email;
  }

  public getUserImage() {
    return this.currentAuthor?.image;
  }

  public getUserImageSanitized(image) {
    if (image) {
      return image.startsWith("data")
        ? this.sanitizer.sanitize(SecurityContext.URL, image)
        : this.sanitizer.sanitize(SecurityContext.URL, "data:image/jpeg;base64," + image);
    } else {
      return null;
    }
  }

  public getActiveRegionAvalancheProblems(): Enums.AvalancheProblem[] {
    return [
      Enums.AvalancheProblem.new_snow,
      Enums.AvalancheProblem.wind_slab,
      Enums.AvalancheProblem.persistent_weak_layers,
      Enums.AvalancheProblem.wet_snow,
      Enums.AvalancheProblem.gliding_snow,
      this.getActiveRegion().enableAvalancheProblemCornices && Enums.AvalancheProblem.cornices,
      this.getActiveRegion().enableAvalancheProblemNoDistinctAvalancheProblem &&
        Enums.AvalancheProblem.no_distinct_avalanche_problem,
    ].filter((p) => !!p);
  }

  public getActiveRegion(): RegionConfiguration | undefined {
    return this.activeRegion;
  }

  public getActiveRegionId(): string | undefined {
    return this.activeRegion?.id;
  }

  public setActiveRegion(region: RegionConfiguration | string) {
    if (!this.currentAuthor) {
      return;
    }
    region = this.currentAuthor.regions.find((r) => r.id === (typeof region === "string" ? region : region.id));
    if (region) {
      this.activeRegion = region;
      this.localStorageService.setActiveRegion(this.activeRegion);
    } else {
      this.logout();
    }
  }

  public getUserLat() {
    return this.activeRegion?.mapCenterLat ?? 47.1;
  }

  public getUserLng() {
    return this.activeRegion?.mapCenterLng ?? 11.44;
  }

  public isCurrentUserInRole(role: string): boolean {
    const roles = this.currentAuthor?.roles ?? [];
    // if the user is an observer and has training mode enabled then they are temporarily upgraded to forecaster
    if (roles.includes(this.constantsService.roleObserver) && this.localStorageService.isTrainingEnabled) {
      const updatedRoles = roles.map((r) =>
        r === this.constantsService.roleObserver ? this.constantsService.roleForecaster : r,
      );
      return updatedRoles.includes(role);
    }
    return roles.includes(role);
  }

  public getCurrentAuthorRegions(): RegionConfiguration[] {
    return this.currentAuthor?.regions || [];
  }

  public getInternalRegions(): string[] {
    return this.internalRegions.map((r) => r.id);
  }

  public getExternalServers(): ServerModel[] {
    return this.externalServers;
  }

  public isInternalRegion(region: string): boolean {
    return this.getInternalRegions().some((r) => region?.startsWith(r));
  }

  public isExternalRegion(region: string): boolean {
    if (this.isInternalRegion(region)) {
      return false;
    }
    for (const externalServer of this.externalServers) {
      if (externalServer.regions.includes(region)) return true;
    }
    return false;
  }
}

export interface AuthenticationResponse {
  email: string;
  name: string;
  roles: string[];
  regions: RegionConfiguration[];
  access_token: string;
  refresh_token: string;
  api_url: string;
}
