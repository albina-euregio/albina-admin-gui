import { Injectable } from "@angular/core";
import { CircleMarker, Control, LatLng, LayerGroup, Map, Marker } from "leaflet";
import { GenericObservation, ObservationType } from "app/observations/models/generic-observation.model";

import { MapService } from "./map.service";
import { RegionNameControl } from "./region-name-control";

@Injectable()
export class BaseMapService extends MapService {
  public observationTypeLayers: Record<ObservationType, LayerGroup>;
  public layers = {
    forecast: new LayerGroup(),
    observations: new LayerGroup(),
    observers: new LayerGroup(),
    weatherStations: new LayerGroup(),
    webcams: new LayerGroup(),
  };

  constructor() {
    super();
    this.observationTypeLayers = {} as any;
    Object.keys(ObservationType).forEach((type) => (this.observationTypeLayers[type] = new LayerGroup()));
  }

  async initMaps(el: HTMLElement, onObservationClick: (o: GenericObservation) => void) {
    Object.values(this.observationTypeLayers).forEach((layer) => layer.clearLayers());
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
      layers: [
        ...Object.values(this.baseMaps),
        this.overlayMaps.regions,
        this.overlayMaps.editSelection,
        ...Object.values(this.observationTypeLayers),
      ],
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

  removeObservationLayers() {
    Object.values(this.observationTypeLayers).forEach((layer) => this.map.removeLayer(layer));
  }

  addMarkerLayer(name: keyof typeof this.layers) {
    this.map.addLayer(this.layers[name]);
  }

  clearMarkerLayer(name: keyof typeof this.layers) {
    this.layers[name].clearLayers();
  }

  addMarker(
    marker: CircleMarker | Marker,
    layerName: keyof typeof this.layers,
    attribution: string | undefined = undefined,
  ) {
    if (!marker) {
      return;
    }
    marker.options.pane = "markerPane";

    if (this.layers[layerName] === undefined) {
      this.layers[layerName] = new LayerGroup([], { attribution });
      this.layers[layerName].addTo(this.map);
    }

    marker.addTo(this.layers[layerName]);
  }

  invalidateSize() {
    this.map.invalidateSize();
  }
}
