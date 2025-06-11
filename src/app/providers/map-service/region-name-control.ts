import { Control, DomUtil } from "leaflet";

export const RegionNameControl = Control.extend({
  onAdd() {
    this._div = DomUtil.create("div", "info"); // create a div with a class "info"
    this.update();
    return this._div;
  },
  // method that we will use to update the control based on feature properties passed
  update(props) {
    this._div.innerHTML = props ? "<b>" + props.name_de + "</b>" : " ";
  },
});
