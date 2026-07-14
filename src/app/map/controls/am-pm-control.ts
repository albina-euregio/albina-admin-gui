import { IControl } from "maplibre-gl";

/** AM/PM daytime badge, ported from the Leaflet `AmPmControl`. */
export class AmPmControl implements IControl {
  private container?: HTMLElement;

  constructor(private text = "") {}

  onAdd(): HTMLElement {
    const container = document.createElement("div");
    container.className = "maplibregl-ctrl maplibregl-ctrl-group leaflet-control-custom am-pm-control";
    container.style.backgroundColor = "white";
    container.style.width = "75px";
    container.style.height = "35px";
    this.container = container;
    this.render();
    return container;
  }

  onRemove(): void {
    this.container?.remove();
    this.container = undefined;
  }

  setText(text: string): this {
    this.text = text;
    this.render();
    return this;
  }

  private render(): void {
    if (!this.container) return;
    this.container.innerHTML = `<p style="font-size: 1.75em; color: #989898; position: absolute; top: 50%; left: 50%; margin-right: -50%; transform: translate(-50%, -50%)"><b>${this.text}</b></p>`;
  }
}
