import { Injectable, SecurityContext } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ConstantsService } from "../constants-service/constants.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { AuthorModel } from "../../models/author.model";
import { ServerModel } from "../../models/server.model";
import { RegionConfiguration } from "../configuration-service/configuration.service";
import { environment } from "../../../environments/environment";

@Injectable()
export class AuthenticationService {

  private currentAuthor: AuthorModel;
  private externalServers: ServerModel[];
  private jwtHelper: JwtHelperService;
  private activeRegion: RegionConfiguration | undefined;

  private env = environment.apiBaseUrl + "_";

  constructor(
    public http: HttpClient,
    public constantsService: ConstantsService,
    private sanitizer: DomSanitizer
  ) {
    this.externalServers = [];
    try {
      this.setCurrentAuthor(JSON.parse(localStorage.getItem(this.env + "currentAuthor")));
    } catch (e) {
      localStorage.removeItem(this.env + "currentAuthor");
    }
    try {
      this.setActiveRegion(JSON.parse(localStorage.getItem("activeRegion")));
    } catch (e) {
      localStorage.removeItem("activeRegion");
    }
    try {
      this.setExternalServers(JSON.parse(localStorage.getItem("externalServers")));
    } catch (e) {
      localStorage.removeItem("externalServers");
    }
    this.jwtHelper = new JwtHelperService();
  }

  public login(username: string, password: string): Observable<boolean> {
    const url = this.constantsService.getServerUrl() + "authentication";
    const body = JSON.stringify({username, password});
    const headers = new HttpHeaders({
      "Content-Type": "application/json"
    });
    const options = { headers: headers };

    return this.http.post<AuthenticationResponse>(url, body, options)
    .pipe(map(data => {
      if ((data ).access_token) {
          this.setCurrentAuthor(data);
          if (this.getCurrentAuthorRegions().length > 0) {
            this.setActiveRegion(this.getCurrentAuthorRegions()[0]);
          }
          return true;
        } else {
          return false;
        }
      }));
  }

  public isUserLoggedIn(): boolean {
    return this.currentAuthor?.accessToken && !this.jwtHelper.isTokenExpired(this.currentAuthor.accessToken);
  }

  public logout() {
    localStorage.removeItem(this.env + "currentAuthor");
    if (this.currentAuthor && this.currentAuthor !== undefined) {
      console.debug("[" + this.currentAuthor.name + "] Logged out!");
    }
    this.currentAuthor = null;
    this.activeRegion = undefined;
    localStorage.removeItem("activeRegion");
    localStorage.removeItem("externalServers");
    this.externalServers = [];
  }

  public externalServerLogins() {
    this.loadExternalServerInstances().subscribe(
      data => {
        for (const entry of (data as any)) {
          this.externalServerLogin(entry.apiUrl, entry.userName, entry.password, entry.name).subscribe(
            data => {
              if (data === true) {
                console.debug("[" + entry.name + "] Logged in!");
              } else {
                console.error("[" + entry.name + "] Login failed!");
              }
            },
            error => {
              console.error("[" + entry.name + "] Login failed: " + JSON.stringify(error._body));
            }
          );
        }
      },
      error => {
        console.error("External server instances could not be loaded: " + JSON.stringify(error._body));
      }
    )
  }

  public loadExternalServerInstances(): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "server/external";
    const options = { headers: this.newAuthHeader() };

    return this.http.get<Response>(url, options);
  }

  public externalServerLogin(apiUrl: string, username: string, password: string, name: string): Observable<boolean> {
    const url = apiUrl + "authentication";
    const body = JSON.stringify({username, password});
    const headers = new HttpHeaders({
      "Content-Type": "application/json"
    });
    const options = { headers: headers };

    return this.http.post<AuthenticationResponse>(url, body, options)
      .pipe(map(data => {
        if ((data ).access_token) {
          this.addExternalServer(data, apiUrl, name, username, password);
          return true;
        } else {
          return false;
        }
      }));
  }

  private addExternalServer(json: Partial<AuthenticationResponse>, apiUrl: string, serverName: string, username: string, password: string) {
    if (!json) {
      return;
    }
    var server = ServerModel.createFromJson(json);
    server.setApiUrl(apiUrl);
    server.setName(serverName);
    this.externalServers.push(server);
    localStorage.setItem("externalServers", JSON.stringify(this.externalServers));
  }

  private setExternalServers(json: Partial<ServerModel>[]) {
    if (!json) {
      return;
    }
    for (const server of json)
      this.externalServers.push(ServerModel.createFromJson(server));
  }

  public checkExternalServerLogin() {
    for (let server of this.externalServers) {
      if (this.jwtHelper.isTokenExpired(server.accessToken)) {
        this.externalServers = [];
        localStorage.removeItem("externalServers");
        this.externalServerLogins();
        break;
      }
    };
  }

  public getAuthor() {
    return this.currentAuthor;
  }

  public getUsername(): string {
    return this.currentAuthor?.name;
  }

  public getEmail(): string {
    return this.currentAuthor?.email;
  }

  public newAuthHeader(mime = "application/json"): HttpHeaders {
    const authHeader = "Bearer " + this.currentAuthor?.accessToken;
    return new HttpHeaders({
      "Content-Type": mime,
      "Accept": mime,
      "Authorization": authHeader
    });
  }

  public newFileAuthHeader(mime = "application/json"): HttpHeaders {
    const authHeader = "Bearer " + this.currentAuthor?.accessToken;
    return new HttpHeaders({
      "Accept": mime,
      "Authorization": authHeader
    });
  }

  public newExternalServerAuthHeader(externalAuthor: ServerModel, mime = "application/json"): HttpHeaders {
    const authHeader = "Bearer " + externalAuthor.accessToken;
    return new HttpHeaders({
      "Content-Type": mime,
      "Accept": mime,
      "Authorization": authHeader
    });
  }

  public getUserImage() {
    return this.currentAuthor?.image;
  }

  public getUserImageSanitized() {
    if (this.currentAuthor && this.currentAuthor.image) {
      return this.sanitizer.sanitize(SecurityContext.URL, "data:image/jpg;base64," + this.currentAuthor.image);
    } else {
      return null;
    }
  }

  public getActiveRegion(): RegionConfiguration | undefined {
    return this.activeRegion;
  }

  public getActiveRegionId(): string | undefined {
    return this.activeRegion?.id;
  }

  public setActiveRegion(region: RegionConfiguration) {
    if (this.currentAuthor.getRegions().map(region => region.id).includes(region.id)) {
      this.activeRegion = region;
      localStorage.setItem("activeRegion", JSON.stringify(this.activeRegion));
    } else {
      this.logout();
    }
  }

  public isEuregio(): boolean {
    return (
      environment.isEuregio ||
      this.getActiveRegionId() === this.constantsService.codeTyrol ||
      this.getActiveRegionId() === this.constantsService.codeSouthTyrol ||
      this.getActiveRegionId() === this.constantsService.codeTrentino
    );
  }

  public getUserLat() {
    return this.activeRegion?.mapCenterLat ?? 47.1;
  }

  public getUserLng() {
    return this.activeRegion?.mapCenterLng ?? 11.44;
  }

  public isCurrentUserInRole(role: string): boolean {
    return this.currentAuthor?.getRoles?.()?.includes(role);
  }

  public getCurrentAuthor() {
    return this.currentAuthor;
  }

  private setCurrentAuthor(json: Partial<AuthorModel>) {
    if (!json) {
      return;
    }
    this.currentAuthor = AuthorModel.createFromJson(json);
    localStorage.setItem(this.env + "currentAuthor", JSON.stringify(this.currentAuthor));
  }

  public getCurrentAuthorRegions() {
    if (this.currentAuthor) {
      return this.currentAuthor.getRegions();
    } else {
      return [];
    }
  }

  public getExternalServers(): ServerModel[] {
    return this.externalServers;
  }

  public isInSuperRegion(region: string) {
    if(region.startsWith(this.getActiveRegionId())) return true;
    if(this.activeRegion.neighborRegions.some(aNeighbor => region.startsWith(aNeighbor))) return true;
    return false;
  }

  public isInternalRegion(region: string) {
    return region.startsWith(this.constantsService.codeTyrol) || region.startsWith(this.constantsService.codeSouthTyrol) || region.startsWith(this.constantsService.codeTrentino);
  }

  public isExternalRegion(region: string) {
    if (this.constantsService.codeTyrol === region || this.constantsService.codeSouthTyrol === region || this.constantsService.codeTrentino === region)
      return false;
    for (const externalServer of this.externalServers) {
      if (externalServer.getRegions().indexOf(region) > -1)
        return true;
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
