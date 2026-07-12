import { inject, Injectable, OnDestroy } from "@angular/core";
import { Map as MlMap } from "maplibre-gl";

import { RegionsService } from "../providers/regions-service/regions.service";
import { albinaBasemapLayer, composeStyle, opentopoLayer } from "./base-map";
import { fitFeatureCollection } from "./bounds";
import { RegionNameControl } from "./controls/region-name-control";
import { createMap } from "./create-map";
import { addRegionLayer, RegionLayerHandle } from "./region-layer";

export type RegionClickMode = "normal" | "awsome";

/**
 * Reusable component-owned MapLibre map with a selectable micro-region overlay.
 * Provided per component (not root); composes the shared `src/app/map` helpers.
 * Replaces the shared Leaflet `BaseMapService` for region-picker views.
 */
@Injectable()
export class RegionMapService implements OnDestroy {
  private regionsService = inject(RegionsService);

  map?: MlMap;
  private regions?: RegionLayerHandle;
  private regionName = new RegionNameControl();
  private selectionChangeCb?: () => void;
  private clickMode: RegionClickMode = "normal";

  async initMap(el: HTMLElement, opts: { clickMode?: RegionClickMode } = {}): Promise<MlMap> {
    this.clickMode = opts.clickMode ?? "normal";
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
    if (this.clickMode === "awsome") {
      if (ev.shiftKey) {
        this.regions!.toggle([id]);
      } else if (this.regions!.getSelected().includes(id)) {
        this.regions!.clear();
      } else {
        this.regions!.setSelected([id]);
      }
      return;
    }
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

  toggleSelectedRegions(ids: string[], force?: boolean): void {
    this.regions?.toggle(ids, force);
  }

  isRegionSelected(id: string): boolean {
    return this.regions?.getSelected().includes(id) ?? false;
  }

  clearSelectedRegions(): void {
    this.regions?.clear();
  }

  clickRegion(regions: Set<string> | Record<string, boolean>): void {
    const ids = regions instanceof Set ? [...regions] : Object.keys(regions).filter((k) => regions[k]);
    this.regions?.setSelected(ids);
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
