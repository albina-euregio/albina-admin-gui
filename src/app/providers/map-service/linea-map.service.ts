import { Injectable } from "@angular/core";
import { AttributionControl, ZoomControl, LeafletMap, GeoJSON, LayerGroup, Layer, CircleMarker } from "leaflet";

import { MapService } from "./map.service";
import { RegionNameControl } from "./region-name-control";

@Injectable()
export class LineaMapService extends MapService {
  stationLayer: LayerGroup = new LayerGroup();

  async initMaps(el: HTMLElement, options?: Parameters<typeof this.initOverlayMaps>[0]) {
    this.baseMaps = {
      AlbinaBaseMap: this.getAlbinaBaseMap({ minZoom: 5, maxZoom: 12 }),
      OpenTopoBaseMap: this.getOpenTopoBaseMap({ minZoom: 13, maxZoom: 15 }),
    };

    this.overlayMaps = await this.initOverlayMaps(options);

    this.map = new LeafletMap(el, {
      trackResize: true,
      attributionControl: false,
      zoomAnimation: false,
      zoomControl: false,
      boxZoom: false,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      // pinchZoom: Browser.touch,
      minZoom: 4,
      maxZoom: 15,
      layers: [this.baseMaps.AlbinaBaseMap, this.stationLayer],
    });

    const regions = await this.regionsService.getActiveServerRegionsAsync();
    const bounds = new GeoJSON(regions).getBounds();
    this.map.fitBounds(bounds);

    this.map.on("dragend zoomend", () => this.localStorageService.setMapCenter(this.map));
    this.observeMapCenterSubscription = this.localStorageService
      .observeMapCenter()
      .subscribe((mapCenter) => this.map.setView(mapCenter, mapCenter.zoom, { reset: true } as unknown));

    this.map.on("zoomend", () => {
      this.updateMapLayers();
    });

    this.resetAll();
    new AttributionControl({ prefix: false }).addTo(this.map);
    new ZoomControl({ position: "topleft" }).addTo(this.map);
    this.regionNameControl = new RegionNameControl().addTo(this.map);
    return this.map;
  }

  showStationName(layer: Layer) {
    layer.on("pointerover", (e: any) => {
      this.regionNameControl.update(e.target.feature?.properties?.name || "");
      const l = e.target as CircleMarker;
      l.setStyle({
        weight: 3,
      });
      l.bringToFront();
    });
    layer.on("pointerout", (e: any) => {
      this.regionNameControl.update("");
      const l = e.target as CircleMarker;
      l.setStyle({
        weight: 1,
      });
      l.bringToFront();
    });
  }
}
