import { inject, Injectable, OnDestroy } from "@angular/core";
import { Map as MlMap } from "maplibre-gl";

import { albinaBasemapLayer, composeStyle, opentopoLayer } from "../map/base-map";
import { fitFeatureCollection } from "../map/bounds";
import { RegionNameControl } from "../map/controls/region-name-control";
import { createMap } from "../map/create-map";
import { addRegionLayer, RegionLayerHandle } from "../map/region-layer";
import { RegionsService } from "../providers/regions-service/regions.service";

/**
 * Component-owned MapLibre map with a selectable micro-region overlay (graphics/awsstats
 * region picker). Replaces the shared Leaflet `BaseMapService` for this use.
 */
@Injectable()
export class RegionMapService implements OnDestroy {
  private regionsService = inject(RegionsService);

  map?: MlMap;
  private regions?: RegionLayerHandle;
  private regionName = new RegionNameControl();
  private selectionChangeCb?: () => void;

  async initMap(el: HTMLElement): Promise<MlMap> {
    const style = composeStyle([albinaBasemapLayer({ maxzoom: 13 }), opentopoLayer({ minzoom: 13 })]);
    const map = createMap({ container: el, style, navigationControl: true });
    this.map = map;
    map.addControl(this.regionName, "top-right");
    await new Promise<void>((resolve) => (map.loaded() ? resolve() : map.once("load", () => resolve())));

    const regions = await this.regionsService.getInternalServerRegionsAsync();
    this.regions = addRegionLayer(map, regions, { interactive: true });
    this.regions.onRegionHover((name) => this.regionName.update(name ?? ""));
    this.regions.onRegionClick((id, ev) => {
      this.handleRegionClick(id, ev);
      this.selectionChangeCb?.();
    });

    const active = await this.regionsService.getActiveServerRegionsAsync();
    fitFeatureCollection(map, active);
    return map;
  }

  private handleRegionClick(id: string, ev: MouseEvent): void {
    const wasSelected = this.regions!.getSelected().includes(id);
    if (/Mac|iPod|iPhone|iPad/.test(navigator.platform) ? ev.metaKey : ev.ctrlKey) {
      this.regions!.toggle(this.regionsService.getLevel1Regions(id), !wasSelected);
    } else if (ev.altKey) {
      this.regions!.toggle(this.regionsService.getLevel2Regions(id), !wasSelected);
    } else {
      this.regions!.toggle([id]);
    }
  }

  onSelectionChange(cb: () => void): void {
    this.selectionChangeCb = cb;
  }

  getSelectedRegions(): string[] {
    return this.regions?.getSelected() ?? [];
  }

  setSelectedRegions(ids: string[]): void {
    this.regions?.setSelected(ids);
  }

  clearSelectedRegions(): void {
    this.regions?.clear();
  }

  resize(): void {
    this.map?.resize();
  }

  removeMaps(): void {
    this.regions?.remove();
    this.regions = undefined;
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  ngOnDestroy(): void {
    this.removeMaps();
  }
}
