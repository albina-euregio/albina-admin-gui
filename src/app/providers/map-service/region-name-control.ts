import { Control, DomUtil } from "leaflet";

export class RegionNameControl extends Control {
  declare _div: HTMLDivElement;

  onAdd() {
    // create a div with a class "info"
    this._div = DomUtil.create("div", "info");
    this.update("");
    return this._div;
  }

  // method that we will use to update the control based on feature properties passed
  update(name: string) {
    this._div.textContent = name;
  }
}
