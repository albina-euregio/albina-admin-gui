import { IControl, Map as MlMap } from "maplibre-gl";

export interface ToggleableLayer {
  id: string;
  name: string;
}

/**
 * Checkbox control toggling the visibility of named map layers.
 * Replaces the Leaflet `LayersControl` overlays list.
 */
export class LayerToggleControl implements IControl {
  private container?: HTMLElement;

  constructor(private readonly layers: ToggleableLayer[]) {}

  onAdd(map: MlMap): HTMLElement {
    const container = document.createElement("div");
    container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    container.style.padding = "4px 6px";
    for (const layer of this.layers) {
      const label = document.createElement("label");
      label.style.display = "block";
      label.style.cursor = "pointer";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = map.getLayoutProperty(layer.id, "visibility") !== "none";
      input.addEventListener("change", () =>
        map.setLayoutProperty(layer.id, "visibility", input.checked ? "visible" : "none"),
      );
      label.append(input, ` ${layer.name}`);
      container.append(label);
    }
    this.container = container;
    return container;
  }

  onRemove(): void {
    this.container?.remove();
    this.container = undefined;
  }
}
