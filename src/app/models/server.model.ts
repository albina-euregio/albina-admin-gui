import type { AuthenticationResponse } from "../providers/authentication-service/authentication.service";

export class ServerModel {
  public accessToken: string;
  public refreshToken: string;
  public name: string;
  public email: string;
  public roles: string[];
  public regions: string[];
  public apiUrl: string;

  static createFromJson(json: Partial<AuthenticationResponse | ServerModel>) {
    const author = new ServerModel();
    author.setName(json.name);
    author.setEmail(json.email);
    author.setRoles(json.roles);
    author.setRegions((json.regions ?? []).map((r) => (typeof r === "string" ? r : r.id)));
    author.setAccessToken((json as ServerModel).accessToken ?? (json as AuthenticationResponse).access_token);
    author.setRefreshToken((json as ServerModel).refreshToken ?? (json as AuthenticationResponse).refresh_token);
    author.setApiUrl((json as ServerModel).apiUrl ?? (json as AuthenticationResponse).api_url);
    return author;
  }

  constructor() {
    this.accessToken = undefined;
    this.refreshToken = undefined;
    this.name = undefined;
    this.email = undefined;
    this.roles = undefined;
    this.regions = undefined;
    this.apiUrl = undefined;
  }

  getAccessToken() {
    return this.accessToken;
  }

  setAccessToken(accessToken) {
    this.accessToken = accessToken;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  setRefreshToken(refreshToken) {
    this.refreshToken = refreshToken;
  }

  getName() {
    return this.name;
  }

  setName(name) {
    this.name = name;
  }

  getEmail() {
    return this.email;
  }

  setEmail(email) {
    this.email = email;
  }

  getRoles(): string[] {
    return this.roles;
  }

  setRoles(roles: string[]) {
    this.roles = roles;
  }

  hasRole(role: string) {
    return this.roles.includes(role);
  }

  getRegions(): string[] {
    return this.regions;
  }

  setRegions(regions: string[]) {
    this.regions = regions;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  setApiUrl(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  toJson() {
    const json = Object();

    if (this.name) {
      json["name"] = this.name;
    }
    if (this.email) {
      json["email"] = this.email;
    }

    return json;
  }
}
