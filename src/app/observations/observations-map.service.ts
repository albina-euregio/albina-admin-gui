import { inject, Injectable, OnDestroy } from "@angular/core";
import maplibregl, { Map as MlMap, Popup } from "maplibre-gl";

import { albinaBasemapLayer, composeStyle, opentopoLayer } from "../map/base-map";
import { fitFeatureCollection } from "../map/bounds";
import { RegionNameControl } from "../map/controls/region-name-control";
import { createMap } from "../map/create-map";
import { addRegionLayer, RegionLayerHandle } from "../map/region-layer";
import { RegionsService } from "../providers/regions-service/regions.service";

/**
 * Component-owned MapLibre map for the observations view: Albina/OpenTopo base map
 * plus the selectable micro-region overlay. Replaces the shared Leaflet `BaseMapService`
 * for this component; composes the shared `src/app/map` helpers.
 */
@Injectable()
export class ObservationsMapService implements OnDestroy {
  private regionsService = inject(RegionsService);

  map?: MlMap;
  /** Shared tooltip popup, reused by all observation markers on hover. */
  readonly tooltipPopup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: "obs-tooltip",
    offset: 12,
  }) as Popup;

  private regions?: RegionLayerHandle;
  private regionName = new RegionNameControl();
  private selectionChangeCb?: () => void;

  async initMap(el: HTMLElement): Promise<MlMap> {
    const style = composeStyle([albinaBasemapLayer({ maxzoom: 13 }), opentopoLayer({ minzoom: 13 })]);
    const map = createMap({ container: el, style, navigationControl: true });
    this.map = map;
    map.addControl(this.regionName, "bottom-left");
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

  /** Region-click selection with ctrl/meta -> level-1 and alt -> level-2 grouping. */
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

  clickRegion(regions: Set<string> | Record<string, boolean>): void {
    const ids = regions instanceof Set ? [...regions] : Object.keys(regions).filter((k) => regions[k]);
    this.regions?.setSelected(ids);
  }

  removeMaps(): void {
    this.tooltipPopup.remove();
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
