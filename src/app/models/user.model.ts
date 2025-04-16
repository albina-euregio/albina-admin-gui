export class UserModel {
  public name: string;
  public email: string;
  public organization: string;
  public image: string;
  public password: string;
  public roles: string[];
  public regions: string[];
  public languageCode: string;

  constructor() {
    this.name = undefined;
    this.email = undefined;
    this.organization = undefined;
    this.roles = [];
    this.image = undefined;
    this.regions = [];
    this.password = undefined;
    this.languageCode = undefined;
  }

  toJson() {
    const json = Object();

    if (this.image) {
      json["image"] = this.image;
    }
    if (this.name) {
      json["name"] = this.name;
    }
    if (this.email) {
      json["email"] = this.email;
    }
    if (this.password) {
      json["password"] = this.password;
    }
    if (this.organization) {
      json["organization"] = this.organization;
    }
    if (this.regions && this.regions.length > 0) {
      const regions = [];
      for (let i = 0; i <= this.regions.length - 1; i++) {
        regions.push(this.regions[i]);
      }
      json["regions"] = regions;
    }
    if (this.roles && this.roles.length > 0) {
      const roles = [];
      for (let i = 0; i <= this.roles.length - 1; i++) {
        roles.push(this.roles[i]);
      }
      json["roles"] = roles;
    }
    if (this.languageCode) {
      json["languageCode"] = this.languageCode;
    }

    return json;
  }
}
