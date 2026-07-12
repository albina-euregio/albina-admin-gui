import { inject, Injectable, OnDestroy } from "@angular/core";
import { Map as MlMap } from "maplibre-gl";

import { albinaBasemapLayer, composeStyle, opentopoLayer } from "../map/base-map";
import { fitFeatureCollection } from "../map/bounds";
import { createMap } from "../map/create-map";
import { addStationLayer, StationLayerHandle, StationPoint } from "../map/station-layer";
import { RegionsService } from "../providers/regions-service/regions.service";

/**
 * Component-owned MapLibre map showing weather-station circle markers (graphics view).
 * Replaces the Leaflet `LineaMapService`; composes the shared `src/app/map` helpers.
 */
@Injectable()
export class StationMapService implements OnDestroy {
  private regionsService = inject(RegionsService);

  map?: MlMap;
  private stations?: StationLayerHandle;

  async initMap(el: HTMLElement): Promise<MlMap> {
    const style = composeStyle([albinaBasemapLayer({ maxzoom: 13 }), opentopoLayer({ minzoom: 13 })]);
    const map = createMap({ container: el, style, navigationControl: true });
    this.map = map;
    await new Promise<void>((resolve) => (map.loaded() ? resolve() : map.once("load", () => resolve())));

    this.stations = addStationLayer(map);
    const active = await this.regionsService.getActiveServerRegionsAsync();
    fitFeatureCollection(map, active);
    return map;
  }

  setStations(stations: StationPoint[]): void {
    this.stations?.setStations(stations);
  }

  onStationClick(cb: (id: string) => void): void {
    this.stations?.onStationClick(cb);
  }

  resize(): void {
    this.map?.resize();
  }

  removeMaps(): void {
    this.stations?.remove();
    this.stations = undefined;
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  ngOnDestroy(): void {
    this.removeMaps();
  }
}
