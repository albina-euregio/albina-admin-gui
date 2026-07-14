import { IControl } from "maplibre-gl";

/** Hover region-name badge, ported from the Leaflet `RegionNameControl`. */
export class RegionNameControl implements IControl {
  private div?: HTMLDivElement;

  onAdd(): HTMLElement {
    const div = document.createElement("div");
    div.className = "maplibregl-ctrl info";
    div.style.background = "rgba(255, 255, 255, 0.9)";
    div.style.borderRadius = "2px";
    div.style.padding = "2px 8px";
    div.style.color = "#000";
    this.div = div;
    this.update("");
    return div;
  }

  onRemove(): void {
    this.div?.remove();
    this.div = undefined;
  }

  update(name: string): void {
    if (!this.div) return;
    this.div.textContent = name ?? "";
    // hide the empty badge when nothing is hovered
    this.div.style.display = name ? "block" : "none";
  }
}
