import { MapService } from "./map.service";
import { RegionNameControl } from "./region-name-control";
import { Injectable } from "@angular/core";
import { Control, LatLng, Map as LeafletMap } from "leaflet";

@Injectable()
export class BaseMapService extends MapService {
  async initMaps(el: HTMLElement, options?: Parameters<typeof this.initOverlayMaps>[0]) {
    this.baseMaps = {
      AlbinaBaseMap: this.getAlbinaBaseMap({ minZoom: 5, maxZoom: 12 }),
      OpenTopoBaseMap: this.getOpenTopoBaseMap({ minZoom: 13, maxZoom: 15 }),
    };

    this.overlayMaps = await this.initOverlayMaps(options);

    this.map = new LeafletMap(el, {
      attributionControl: false,
      zoomAnimation: false,
      zoomControl: false,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      // pinchZoom: Browser.touch,
      center: new LatLng(this.authenticationService.getUserLat(), this.authenticationService.getUserLng()),
      zoom: 8,
      minZoom: 4,
      maxZoom: 15,
      layers: [this.baseMaps.AlbinaBaseMap, this.overlayMaps.regions, this.overlayMaps.editSelection],
    });

    this.map.on("dragend zoomend", () => this.localStorageService.setMapCenter(this.map));
    this.localStorageService
      .observeMapCenter()
      .subscribe((mapCenter) => this.map.setView(mapCenter, mapCenter.zoom, { reset: true } as unknown));

    this.map.on("zoomend", () => {
      const zoom = this.map.getZoom();

      if (zoom >= 13) {
        if (this.map.hasLayer(this.baseMaps.AlbinaBaseMap)) {
          this.map.removeLayer(this.baseMaps.AlbinaBaseMap);
        }
        if (!this.map.hasLayer(this.baseMaps.OpenTopoBaseMap)) {
          this.map.addLayer(this.baseMaps.OpenTopoBaseMap);
        }
      } else {
        if (this.map.hasLayer(this.baseMaps.OpenTopoBaseMap)) {
          this.map.removeLayer(this.baseMaps.OpenTopoBaseMap);
        }
        if (!this.map.hasLayer(this.baseMaps.AlbinaBaseMap)) {
          this.map.addLayer(this.baseMaps.AlbinaBaseMap);
        }
      }
    });

    this.resetAll();
    new Control.Attribution({ prefix: false }).addTo(this.map);
    new Control.Zoom({ position: "topleft" }).addTo(this.map);
    this.regionNameControl = new RegionNameControl().addTo(this.map);
    return this.map;
  }

  clickRegion(regionIds: Record<string, boolean>) {
    //console.log("clickRegion", this.overlayMaps.regions);
    for (const entry of this.overlayMaps.regions.getLayers()) {
      entry.feature.properties.selected = regionIds[entry.feature.properties.id];
    }
    this.updateEditSelection();
  }
}
