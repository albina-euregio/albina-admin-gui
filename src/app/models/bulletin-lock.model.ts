export class BulletinLockModel {
  public bulletin: string;
  public date: Date;
  public userEmail: string;
  public userName: string;
  public lock: boolean;

  static createFromJson(json) {
    const bulletinLock = new BulletinLockModel();

    bulletinLock.setDate(new Date(json.date));
    bulletinLock.setBulletin(json.bulletin);
    bulletinLock.setUserEmail(json.userEmail);
    bulletinLock.setUserName(json.userName);
    bulletinLock.setLock(json.lock);

    return bulletinLock;
  }

  constructor() {
    this.bulletin = undefined;
    this.date = undefined;
    this.userEmail = undefined;
    this.userName = undefined;
    this.lock = undefined;
  }

  getBulletin() {
    return this.bulletin;
  }

  setBulletin(bulletin: string) {
    this.bulletin = bulletin;
  }

  getDate() {
    return this.date;
  }

  setDate(date: Date) {
    this.date = date;
  }

  getUserEmail() {
    return this.userEmail;
  }

  setUserEmail(userEmail: string) {
    this.userEmail = userEmail;
  }

  getUserName() {
    return this.userName;
  }

  setUserName(userName: string) {
    this.userName = userName;
  }

  getLock() {
    return this.lock;
  }

  setLock(lock: boolean) {
    this.lock = lock;
  }

  toJson() {
    const json = Object();

    if (this.bulletin) {
      json["bulletin"] = this.bulletin;
    }
    if (this.date) {
      json["date"] = this.getISOStringWithTimezoneOffset(this.date);
    }
    if (this.userName) {
      json["userName"] = this.userName;
    }
    if (this.userEmail) {
      json["userEmail"] = this.userEmail;
    }
    json["lock"] = this.lock;

    return json;
  }

  private getISOStringWithTimezoneOffset(date: Date) {
    const offset = -date.getTimezoneOffset();
    const dif = offset >= 0 ? "+" : "-";

    return (
      date.getFullYear() +
      "-" +
      this.extend(date.getMonth() + 1) +
      "-" +
      this.extend(date.getDate()) +
      "T" +
      this.extend(date.getHours()) +
      ":" +
      this.extend(date.getMinutes()) +
      ":" +
      this.extend(date.getSeconds()) +
      dif +
      this.extend(offset / 60) +
      ":" +
      this.extend(offset % 60)
    );
  }

  private extend(num: number) {
    const norm = Math.abs(Math.floor(num));
    return (norm < 10 ? "0" : "") + norm;
  }
}
