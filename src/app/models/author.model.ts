import { RegionConfiguration } from "app/providers/configuration-service/configuration.service";

export class AuthorModel {
  public accessToken: string;
  public refreshToken: string;
  public name: string;
  public email: string;
  public phone: string;
  public organization: string;
  public roles: string[];
  public image: string;
  public regions: RegionConfiguration[];
  public apiUrl: string;
  public languageCode: string;

  static createFromJson(
    json: Partial<AuthorModel> & { access_token?: string; refresh_token?: string; api_url?: string },
  ) {
    const author = new AuthorModel();

    author.name = json.name;
    author.email = json.email;
    author.phone = json.phone;
    author.organization = json.organization;
    const jsonRoles = json.roles;
    const roles = new Array<string>();
    for (const i in jsonRoles) {
      if (jsonRoles[i] !== null) {
        roles.push(jsonRoles[i]);
      }
    }
    author.roles = roles;
    author.image = json.image;
    const jsonRegions = json.regions;
    const regions = new Array<RegionConfiguration>();
    for (const i in jsonRegions) {
      if (jsonRegions[i] !== null) {
        regions.push(jsonRegions[i]);
      }
    }
    author.regions = regions;

    author.accessToken = json.accessToken ?? json.access_token;
    author.refreshToken = json.refreshToken ?? json.refresh_token;
    author.apiUrl = json.apiUrl ?? json.api_url;
    author.languageCode = json.languageCode;

    return author;
  }

  constructor() {
    this.accessToken = undefined;
    this.refreshToken = undefined;
    this.name = undefined;
    this.email = undefined;
    this.phone = undefined;
    this.organization = undefined;
    this.roles = undefined;
    this.image = undefined;
    this.regions = undefined;
    this.apiUrl = undefined;
    this.languageCode = undefined;
  }

  toJson() {
    const json = Object();

    if (this.name) {
      json["name"] = this.name;
    }
    if (this.email) {
      json["email"] = this.email;
    }
    if (this.phone) {
      json["phone"] = this.phone;
    }
    if (this.organization) {
      json["organization"] = this.organization;
    }
    if (this.regions && this.regions.length > 0) {
      const regions = [];
      for (let i = 0; i <= this.regions.length - 1; i++) {
        regions.push(this.regions[i].id);
      }
      json["regions"] = regions;
    }
    if (this.roles && this.roles.length > 0) {
      const roles = [];
      [...new Set(this.roles)].forEach((role) => roles.push(role));
      json["roles"] = roles;
    }
    if (this.languageCode) {
      json["languageCode"] = this.languageCode;
    }

    return json;
  }
}
