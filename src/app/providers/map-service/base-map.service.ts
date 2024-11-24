import { Injectable } from "@angular/core";
import { Control, LatLng, Map } from "leaflet";

import { MapService } from "./map.service";
import { RegionNameControl } from "./region-name-control";

@Injectable()
export class BaseMapService extends MapService {
  async initMaps(el: HTMLElement) {
    this.baseMaps = {
      AlbinaBaseMap: this.getAlbinaBaseMap({ minZoom: 5, maxZoom: 12 }),
    };

    this.overlayMaps = await this.initOverlayMaps();

    this.map = new Map(el, {
      attributionControl: false,
      zoomAnimation: false,
      zoomControl: false,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      touchZoom: true,
      center: new LatLng(this.authenticationService.getUserLat(), this.authenticationService.getUserLng()),
      zoom: 8,
      minZoom: 4,
      maxZoom: 17,
      layers: [...Object.values(this.baseMaps), this.overlayMaps.regions, this.overlayMaps.editSelection],
    });

    this.resetAll();
    new Control.Attribution({ prefix: false }).addTo(this.map);
    new Control.Zoom({ position: "topleft" }).addTo(this.map);
    new RegionNameControl().addTo(this.map);
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
