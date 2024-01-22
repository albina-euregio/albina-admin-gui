import { Injectable } from "@angular/core";
import { ConstantsService } from "../constants-service/constants.service";
import { CircleMarker, Control, LatLng, LayerGroup, Map, Marker, TileLayer } from "leaflet";
import { GenericObservation, ObservationType } from "app/observations/models/generic-observation.model";

import { AuthenticationService } from "../authentication-service/authentication.service";
import { RegionsService } from "../regions-service/regions.service";
import { MapService } from "./map.service";
import { RegionNameControl } from "./region-name-control";

@Injectable()
export class BaseMapService extends MapService {
  public observationTypeLayers: Record<ObservationType, LayerGroup>;
  public layers = {
    forecast: new LayerGroup()
  };

  constructor(
    authenticationService: AuthenticationService,
    regionsService: RegionsService,
    constantsService: ConstantsService
  ) {
    super(regionsService, authenticationService, constantsService);
    this.observationTypeLayers = {} as any;
    Object.keys(ObservationType).forEach((type) => (this.observationTypeLayers[type] = new LayerGroup()));
  }

  async initMaps(el: HTMLElement, onObservationClick: (o: GenericObservation) => void) {
    Object.values(this.observationTypeLayers).forEach((layer) => layer.clearLayers());
    this.baseMaps = {
      OpenTopoMap: new TileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        className: "leaflet-layer-grayscale",
        minZoom: 12.5,
        maxZoom: 17,
        attribution:
          'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
      }),
      AlbinaBaseMap: new TileLayer("https://static.avalanche.report/tms/{z}/{x}/{y}.png", {
        minZoom: 5,
        maxZoom: 12,
        tms: false,
        attribution: ""
      })
    };

    this.overlayMaps = await this.initOverlayMaps();

    this.map = new Map(el, {
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
        this.overlayMaps.activeSelection,
        this.overlayMaps.editSelection,
        ...Object.values(this.observationTypeLayers)
      ]
    });

    this.resetAll();
    new Control.Zoom({ position: "topleft" }).addTo(this.map);
    new Control.Scale().addTo(this.map);
    new RegionNameControl().addTo(this.map);
    return this.map;
  }

  clickRegion(regionIds: Array<String>) {
    //console.log("clickRegion", this.overlayMaps.regions);
    for (const entry of this.overlayMaps.regions.getLayers()) {
      entry.feature.properties.selected = regionIds.includes(entry.feature.properties.id);
    }
    this.updateEditSelection();
  }

  removeObservationLayers() {
    Object.values(this.observationTypeLayers).forEach((layer) => this.map.removeLayer(layer));
  }

  addMarkerLayer(name: keyof typeof this.layers) {
    this.map.addLayer(this.layers[name]);
  }

  addMarker(marker: CircleMarker | Marker, layerName: keyof typeof this.layers, attribution: string | undefined = undefined) {
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
