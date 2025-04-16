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
    author.name = json.name;
    author.email = json.email;
    author.roles = json.roles;
    author.regions = (json.regions ?? []).map((r) => (typeof r === "string" ? r : r.id));
    author.accessToken = (json as ServerModel).accessToken ?? (json as AuthenticationResponse).access_token;
    author.refreshToken = (json as ServerModel).refreshToken ?? (json as AuthenticationResponse).refresh_token;
    author.apiUrl = (json as ServerModel).apiUrl ?? (json as AuthenticationResponse).api_url;
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
