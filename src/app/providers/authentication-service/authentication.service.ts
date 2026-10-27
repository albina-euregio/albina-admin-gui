import { HttpClient } from "@angular/common/http";
import { inject, Injectable, SecurityContext } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { JwtHelperService } from "@auth0/angular-jwt";
import {
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import { BehaviorSubject, from, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { z } from "zod/v4";

import * as Enums from "../../enums/enums";
import { TextcatTextfield } from "../../enums/enums";
import type { BulletinModel } from "../../models/bulletin.model";
import { RegionConfiguration, RegionConfigurationSchema } from "../../models/region-configuration.model";
import { ServerConfiguration } from "../../models/server-configuration.model";
import { ServerModel, ServerSchema } from "../../models/server.model";
import * as albinaApi from "../albina-api";
import { zAuthenticationServiceAuthenticationResponse, zRegion } from "../albina-api/zod.gen";
import { LocalStorageService } from "../local-storage-service/local-storage.service";

@Injectable({ providedIn: "root" })
export class AuthenticationService {
  private localStorageService = inject(LocalStorageService);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  private authentication: AuthenticationResponse;
  private internalRegions: RegionConfiguration[] = [];
  private externalServers: ServerModel[];
  private jwtHelper: JwtHelperService;
  private activeRegion: RegionConfiguration | undefined;
  /**
   * The one granted role whose permissions currently apply. A user holding several roles acts as
   * only one of them at a time, e.g. a user who is both forecaster and admin works as forecaster
   * and only gets admin permissions after switching to admin. `undefined` only when logged out or
   * without any role. Kept in the tab's sessionStorage only, so that it survives a reload, while
   * every login starts with the initial role and thus behaves the same on every computer.
   */
  public get effectiveRole(): Enums.UserRole | undefined {
    return this._effectiveRole;
  }
  public set effectiveRole(role: Enums.UserRole | undefined) {
    this._effectiveRole = role;
    if (role) {
      sessionStorage.setItem(this.localStorageService.key("effectiveRole"), role);
    } else {
      sessionStorage.removeItem(this.localStorageService.key("effectiveRole"));
    }
  }
  private _effectiveRole: Enums.UserRole | undefined;
  private activeRegionSubject = new BehaviorSubject<RegionConfiguration | undefined>(undefined);
  public readonly activeRegion$ = this.activeRegionSubject.asObservable();

  constructor() {
    this.externalServers = [];
    try {
      this.authentication = this.localStorageService.getCurrentAuthor();
      const storedRole = sessionStorage.getItem(this.localStorageService.key("effectiveRole")) as Enums.UserRole;
      this.effectiveRole = this.getCurrentAuthorRoles().includes(storedRole)
        ? storedRole
        : this.getInitialEffectiveRole();
    } catch {
      this.localStorageService.setCurrentAuthor(undefined);
    }
    try {
      this.setActiveRegion(this.localStorageService.getActiveRegion());
    } catch {
      this.localStorageService.setActiveRegion(undefined);
    }
    try {
      this.setInternalRegions(this.localStorageService.getInternalRegions());
    } catch {
      this.localStorageService.setInternalRegions(undefined);
    }
    try {
      this.setExternalServers(this.localStorageService.getExternalServers());
    } catch {
      this.localStorageService.setExternalServers(undefined);
    }
    this.jwtHelper = new JwtHelperService();
  }

  public login(username: string, password: string): Observable<boolean> {
    return from(albinaApi.login({ body: { username, password }, throwOnError: true })).pipe(
      map((res) => {
        const data = AuthenticationResponseSchema.or(AuthenticationResponseSchema2024).parse(res.data, {
          reportInput: true,
        });
        return this.applyAuthenticationResponse(data);
      }),
    );
  }

  /**
   * Signs in with a previously registered passkey. Prompts the browser's WebAuthn UI, unless
   * `useBrowserAutofill` is given, in which case it waits silently for the user to pick a passkey
   * from the username field's autofill dropdown (see login.component.ts).
   */
  public loginWithPasskey(username?: string, options?: { useBrowserAutofill?: boolean }): Observable<boolean> {
    return from(albinaApi.beginLogin({ body: { username }, throwOnError: true })).pipe(
      switchMap((res) => {
        const challenge = res.data;
        // the server's `type` fields are plain `string` (they come from an OpenAPI schema), but
        // @simplewebauthn/browser wants the literal "public-key" — always what the server sends
        return from(
          startAuthentication({
            optionsJSON: challenge.publicKey as unknown as PublicKeyCredentialRequestOptionsJSON,
            useBrowserAutofill: options?.useBrowserAutofill,
          }),
        ).pipe(
          switchMap((credential) =>
            albinaApi.finishLogin({
              body: {
                state: challenge.state,
                credential: {
                  id: credential.id,
                  type: credential.type,
                  response: {
                    clientDataJSON: credential.response.clientDataJSON,
                    authenticatorData: credential.response.authenticatorData,
                    signature: credential.response.signature,
                    userHandle: credential.response.userHandle,
                  },
                },
              },
              throwOnError: true,
            }),
          ),
        );
      }),
      map((res) => {
        const data = AuthenticationResponseSchema.parse(res.data, { reportInput: true });
        return this.applyAuthenticationResponse(data);
      }),
    );
  }

  private applyAuthenticationResponse(data: AuthenticationResponse): boolean {
    if (!data.access_token) {
      return false;
    }
    this.authentication = data;
    this.localStorageService.setCurrentAuthor(data);
    this.effectiveRole = this.getInitialEffectiveRole();
    const authorRegions = this.getCurrentAuthorRegions();
    const activeRegionFromLocalStorage = this.localStorageService.getActiveRegion();
    this.setActiveRegion(authorRegions.find((r) => r.id === activeRegionFromLocalStorage?.id) ?? authorRegions?.[0]);
    this.loadInternalRegions();
    this.externalServerLogins();
    return true;
  }

  /** The roles granted to the current user, in order of {@link effectiveRolePriority}. */
  public getCurrentAuthorRoles(): Enums.UserRole[] {
    const roles = this.currentAuthor?.roles ?? [];
    return effectiveRolePriority.filter((role) => roles.includes(role));
  }

  /** The effective role to apply after login: the first granted role. */
  private getInitialEffectiveRole(): Enums.UserRole | undefined {
    return this.getCurrentAuthorRoles()[0];
  }

  /** Registers a new passkey for the current (already-authenticated) user. Prompts the browser's WebAuthn UI. */
  public registerPasskey(name?: string): Observable<albinaApi.PasskeyServicePasskeyInfo> {
    return from(albinaApi.beginRegistration({ throwOnError: true })).pipe(
      switchMap((res) => {
        const challenge = res.data;
        return from(
          startRegistration({ optionsJSON: challenge.publicKey as unknown as PublicKeyCredentialCreationOptionsJSON }),
        ).pipe(
          switchMap((credential) =>
            albinaApi.finishRegistration({
              body: {
                state: challenge.state,
                name,
                credential: {
                  id: credential.id,
                  type: credential.type,
                  response: {
                    clientDataJSON: credential.response.clientDataJSON,
                    attestationObject: credential.response.attestationObject,
                  },
                },
              },
              throwOnError: true,
            }),
          ),
        );
      }),
      map((res) => res.data),
    );
  }

  public listPasskeys(): Observable<albinaApi.PasskeyServicePasskeyInfo[]> {
    return from(albinaApi.listPasskeys({ throwOnError: true })).pipe(map((res) => res.data));
  }

  public deletePasskey(id: string): Observable<void> {
    return from(albinaApi.deletePasskey({ path: { id }, throwOnError: true })).pipe(map(() => undefined));
  }

  get accessToken(): string {
    return this.authentication?.access_token;
  }

  public isUserLoggedIn(): boolean {
    return this.accessToken && !this.jwtHelper.isTokenExpired(this.accessToken);
  }

  public logout() {
    console.debug("[" + this.currentAuthor?.name + "] Logged out!");
    this.authentication = null;
    this.effectiveRole = undefined;
    this.activeRegion = undefined;
    this.activeRegionSubject.next(undefined);
    this.localStorageService.setCurrentAuthor(undefined);
    this.localStorageService.setInternalRegions(undefined);
    this.localStorageService.setExternalServers(undefined);
    this.externalServers = [];
  }

  private loadInternalRegions(): void {
    from(albinaApi.getRegions({ throwOnError: true })).subscribe((res) =>
      this.setInternalRegions(res.data as unknown as RegionConfiguration[]),
    );
  }

  private setInternalRegions(regions: RegionConfiguration[]) {
    this.internalRegions = RegionConfigurationSchema.array().parse(regions);
    this.localStorageService.setInternalRegions(this.internalRegions);
  }

  private externalServerLogins() {
    from(albinaApi.getExternalServerConfigurations({ throwOnError: true })).subscribe(
      (res) => {
        for (const entry of res.data as unknown as ServerConfiguration[]) {
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
    return this.http.post(url, body).pipe(
      map((json) => {
        const data = ExternalServerLoginSchema.parse(json);
        return this.addExternalServer(server, data);
      }),
    );
  }

  private addExternalServer(server0: ServerConfiguration, json: ExternalServerLogin): boolean {
    if (!json.access_token) {
      return false;
    }
    const server = ServerSchema.parse({
      ...server0,
      regions: json.regions?.map((r) => r.id),
      accessToken: json.access_token,
    });
    this.externalServers.push(server);
    this.localStorageService.setExternalServers(this.externalServers);
    return true;
  }

  private setExternalServers(json: ServerModel[]) {
    if (!json) {
      return;
    }
    for (const server of json) {
      this.externalServers.push(server);
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

  get currentAuthor(): albinaApi.User {
    return this.authentication?.user;
  }

  public getCurrentAuthor(): albinaApi.User {
    return this.currentAuthor;
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
      this.getActiveRegion()?.enableAvalancheProblemCornices && Enums.AvalancheProblem.cornices,
      this.getActiveRegion()?.enableAvalancheProblemNoDistinctAvalancheProblem &&
        Enums.AvalancheProblem.no_distinct_avalanche_problem,
    ].filter((p) => !!p);
  }

  public isTextfieldEnabled(textfield: keyof typeof TextcatTextfield): boolean {
    return (
      this.getActiveRegion()?.enabledTextcatFields?.includes(TextcatTextfield[textfield]) ||
      this.getActiveRegion()?.enabledEditableFields?.includes(TextcatTextfield[textfield]) ||
      false
    );
  }

  /** Editable if enabled for the active region; when read-only, shown whenever the bulletin has text. */
  public isTextfieldShown(
    textfield: keyof typeof TextcatTextfield,
    bulletin: BulletinModel,
    readonly: boolean,
  ): boolean {
    return this.isTextfieldEnabled(textfield) || (readonly && bulletin[textfield].some((t) => !!t.text));
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
    region = this.getCurrentAuthorRegions().find((r) => r.id === (typeof region === "string" ? region : region.id));
    if (region) {
      this.activeRegion = region;
      this.activeRegionSubject.next(this.activeRegion);
      this.localStorageService.setActiveRegion(this.activeRegion);
    } else {
      this.logout();
    }
  }

  public isCurrentUserInRole(...roles0: (keyof typeof Enums.UserRole)[]): boolean {
    let roles: albinaApi.Role[] = this.currentAuthor?.roles ?? [];
    // only the effective role applies, see effectiveRole
    if (this.effectiveRole) {
      roles = roles.includes(this.effectiveRole) ? [this.effectiveRole] : [];
    }
    // if the user is an observer and has training mode enabled then they are temporarily upgraded to forecaster
    if (roles.includes(Enums.UserRole.OBSERVER) && this.localStorageService.isTrainingEnabled) {
      roles = roles.map((r) => (r === Enums.UserRole.OBSERVER ? Enums.UserRole.FORECASTER : r));
    }
    return roles0.some((role) => roles.includes(Enums.UserRole[role]));
  }

  public getCurrentAuthorRegions(): RegionConfiguration[] {
    return this.authentication?.regions.sort((a, b) => a.id.localeCompare(b.id)) || [];
  }

  public getInternalRegions(filter?: (r: RegionConfiguration) => boolean): string[] {
    return this.internalRegions
      .filter(filter || (() => true))
      .map((r) => r.id)
      .sort((a, b) => a.localeCompare(b));
  }

  public getInternalRegionsWithoutSuperRegions(filter?: (r: RegionConfiguration) => boolean): string[] {
    return this.internalRegions
      .filter((r) => r.subRegions && r.subRegions.length === 0)
      .filter(filter || (() => true))
      .map((r) => r.id)
      .sort((a, b) => a.localeCompare(b));
  }

  public getExternalServers(): ServerModel[] {
    return this.externalServers;
  }

  public isActiveRegion(region: string): boolean {
    return region?.startsWith(this.getActiveRegionId());
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

/** Order in which roles are listed and the effective role is picked after login. */
const effectiveRolePriority: Enums.UserRole[] = [
  Enums.UserRole.FORECASTER,
  Enums.UserRole.FOREMAN,
  Enums.UserRole.OBSERVER,
  Enums.UserRole.ADMIN,
  Enums.UserRole.SUPERADMIN,
];

export const AuthenticationResponseSchema = zAuthenticationServiceAuthenticationResponse;
export type AuthenticationResponse = z.infer<typeof AuthenticationResponseSchema>;

/**
 * External instances (GeoSphere, …) run their own ALBINA version, whose user and region
 * configuration need not validate against ours (different languages, unset fields sent as
 * `null`, …). We only ever store the token and the region IDs, so parse just those.
 */
export const ExternalServerLoginSchema = zAuthenticationServiceAuthenticationResponse
  .pick({ access_token: true })
  .extend({
    regions: zRegion.pick({ id: true }).array().nullish(),
  });
export type ExternalServerLogin = z.infer<typeof ExternalServerLoginSchema>;

/**
 * @deprecated
 */
export const AuthenticationResponseSchema2024 = z
  .object({
    email: z.string(),
    name: z.string(),
    roles: z.enum(Enums.UserRole).array(),
    regions: RegionConfigurationSchema.array(),
    access_token: z.string(),
    refresh_token: z.string().nullish(),
    api_url: z.string().nullish(),
  })
  .transform((a) =>
    AuthenticationResponseSchema.parse({
      user: {
        email: a.email,
        name: a.name,
        roles: a.roles,
      },
      regions: a.regions,
      access_token: a.access_token,
    }),
  );
