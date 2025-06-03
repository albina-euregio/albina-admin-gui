import { Control, DomUtil } from "leaflet";

export const AmPmControl = Control.extend({
  onAdd() {
    const container = DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-custom");
    container.style.backgroundColor = "white";
    container.style.width = "75px";
    container.style.height = "35px";
    container.innerHTML = `<p style="font-size: 1.75em; color: #989898; position: absolute; top: 50%; left: 50%; margin-right: -50%; transform: translate(-50%, -50%)"><b>${this.options.text}</b></p>`;
    return container;
  },

  setText(text: string) {
    this.options.text = text;
    return this;
  },

  onRemove() {
    // Nothing to do here
  },
});
