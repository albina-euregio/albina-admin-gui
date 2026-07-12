import { IControl } from "maplibre-gl";

/** Hover region-name badge, ported from the Leaflet `RegionNameControl`. */
export class RegionNameControl implements IControl {
  private div?: HTMLDivElement;

  onAdd(): HTMLElement {
    this.div = document.createElement("div");
    this.div.className = "info";
    this.update("");
    return this.div;
  }

  onRemove(): void {
    this.div?.remove();
    this.div = undefined;
  }

  update(name: string): void {
    if (this.div) this.div.textContent = name ?? "";
  }
}
