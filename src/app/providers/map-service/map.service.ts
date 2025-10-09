import { PolygonObject } from "../../danger-sources/models/polygon-object.model";
import * as Enums from "../../enums/enums";
import { BulletinModel } from "../../models/bulletin.model";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";
import { LocalStorageService } from "../local-storage-service/local-storage.service";
import { filterFeature } from "../regions-service/filterFeature";
import { RegionProperties, RegionsService, RegionWithElevationProperties } from "../regions-service/regions.service";
import { AmPmControl } from "./am-pm-control";
import { BlendModePolygonSymbolizer, PmLeafletLayer } from "./pmtiles-layer";
import { RegionNameControl } from "./region-name-control";
import { Injectable, inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import * as geojson from "geojson";
import { FeatureCollection, MultiPolygon } from "geojson";
import {
  Browser,
  Control,
  GeoJSON,
  LatLng,
  Layer,
  Map as LeafletMap,
  MapOptions,
  Path,
  PathOptions,
  TileLayer,
  TileLayerOptions,
} from "leaflet";
import "leaflet.sync";

declare module "leaflet" {
  interface Map {
    sync(other: Map): void;
  }
}

interface SelectableRegionProperties extends RegionWithElevationProperties {
  selected: boolean;
}

class RegionLayer<P = SelectableRegionProperties> extends GeoJSON<P> {
  getLayers(): (GeoJSON<P> & {
    feature: geojson.Feature<geojson.MultiPoint, P>;
  })[] {
    // @ts-expect-error Layer -> GeoJSON
    return super.getLayers();
  }
}

const dataSource = "eaws-regions";

type ClickMode = "normal" | "awsome";

@Injectable()
export class MapService {
  protected regionsService = inject(RegionsService);
  translateService = inject(TranslateService);
  protected authenticationService = inject(AuthenticationService);
  protected constantsService = inject(ConstantsService);
  protected localStorageService = inject(LocalStorageService);

  public map: LeafletMap;
  public afternoonMap: LeafletMap;
  protected regionNameControl: RegionNameControl;
  private amControl: Control;
  private pmControl: Control;

  protected baseMaps: Record<string, TileLayer>;
  protected afternoonBaseMaps: Record<string, TileLayer>;
  protected overlayMaps: {
    // Micro  regions without elevation
    regions: RegionLayer;
    editSelection: RegionLayer;
    aggregatedRegions: PmLeafletLayer;
  };
  protected afternoonOverlayMaps: {
    // Micro  regions without elevation
    regions: RegionLayer;
    editSelection: RegionLayer;
    aggregatedRegions: PmLeafletLayer;
  };

  constructor() {
    this.amControl = new AmPmControl({ position: "bottomleft" }).setText(
      this.translateService.instant("daytime.earlier"),
    );
    this.pmControl = new AmPmControl({ position: "bottomleft" }).setText(
      this.translateService.instant("daytime.later"),
    );
  }

  protected async initOverlayMaps({
    regions,
    internalRegions,
    clickMode,
  }: {
    regions?: FeatureCollection<MultiPolygon, RegionProperties>;
    internalRegions?: FeatureCollection<MultiPolygon, RegionProperties>;
    clickMode?: ClickMode;
  } = {}): Promise<typeof this.overlayMaps> {
    if (!regions || !internalRegions) {
      regions ??= await this.regionsService.getRegionsAsync();
      internalRegions ??= await this.regionsService.getInternalServerRegionsAsync();
    }

    const overlayMaps: typeof this.overlayMaps = {
      // overlay to show micro regions without elevation (only outlines)
      regions: new RegionLayer(regions, {
        onEachFeature: (feature, layer) => {
          layer.on("click", () => (feature.properties.selected = true));
          this.highlightAndShowName(layer);
        },
        style: this.getRegionStyle(),
      }),

      // overlay to select regions (when editing an aggregated region)
      editSelection: new RegionLayer(regions, {
        style: this.getEditSelectionBaseStyle(),
      }),

      // overlay to show aggregated regions
      aggregatedRegions: new PmLeafletLayer({
        sources: { [dataSource]: { maxDataZoom: 10, url: "https://static.avalanche.report/eaws-regions.pmtiles" } },
      }),
    };
    overlayMaps.regions.on("add", (e) => {
      const layer = e.target as GeoJSON;
      const map = e.target._map as L.Map;
      let oldStrong = false;
      map.on("zoomend", () => {
        const isStrong = map.getZoom() >= 13;
        if (isStrong === oldStrong) return;
        oldStrong = isStrong;
        layer.setStyle(isStrong ? this.getStrongRegionStyle() : this.getRegionStyle());
      });
    });
    overlayMaps.editSelection.options.onEachFeature = (feature, layer) => {
      layer.on("click", (e) => this.handleClick(clickMode, e.originalEvent, feature, overlayMaps.editSelection));
      this.highlightAndShowName(layer);
    };
    overlayMaps.editSelection.addData(internalRegions);
    return overlayMaps;
  }

  removeMaps() {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.regionNameControl = undefined;
    }
    if (this.afternoonMap) {
      this.afternoonMap.remove();
      this.afternoonMap = undefined;
    }
  }

  async initAmPmMap() {
    this.removeMaps();

    this.baseMaps = {
      AlbinaBaseMap: this.getAlbinaBaseMap(),
      OpenTopoBaseMap: this.getOpenTopoBaseMap(),
    };
    this.afternoonBaseMaps = {
      AlbinaBaseMap: this.getAlbinaBaseMap(),
      OpenTopoBaseMap: this.getOpenTopoBaseMap(),
    };

    this.overlayMaps = await this.initOverlayMaps();
    this.afternoonOverlayMaps = await this.initOverlayMaps();

    this.resetAll();
    this.initAmMap();
    this.initPmMap();
    this.map.sync(this.afternoonMap);
    this.afternoonMap.sync(this.map);
  }

  private initAmMap() {
    this.map = new LeafletMap("map", {
      ...this.getMapInitOptions(),
      layers: [this.baseMaps.AlbinaBaseMap, this.overlayMaps.aggregatedRegions, this.overlayMaps.regions],
    });

    this.map.on("dragend zoomend", () => this.localStorageService.setMapCenter(this.map));
    this.localStorageService
      .observeMapCenter()
      .subscribe((mapCenter) => this.map.setView(mapCenter, mapCenter.zoom, { reset: true } as unknown));

    this.regionNameControl = new RegionNameControl().addTo(this.map);

    // Disable dragging on mobile devices
    this.map.whenReady(() => {
      if (Browser.mobile) {
        this.map.dragging.disable();
      }
    });

    // Watch zoom changes
    this.map.on("zoomend", () => {
      this.updateMapLayers();
    });

    return this.map;
  }

  private initPmMap() {
    const afternoonMap = new LeafletMap("afternoonMap", {
      ...this.getMapInitOptions(),
      zoomControl: false,
      layers: [
        this.afternoonBaseMaps.AlbinaBaseMap,
        this.afternoonOverlayMaps.aggregatedRegions,
        this.afternoonOverlayMaps.regions,
      ],
    });

    this.pmControl.addTo(afternoonMap);

    this.afternoonMap = afternoonMap;

    // Disable dragging on mobile devices
    this.afternoonMap.whenReady(() => {
      if (Browser.mobile) {
        this.afternoonMap.dragging.disable();
      }
    });

    // Watch zoom changes
    this.afternoonMap.on("zoomend", () => {
      this.updateAfternoonMapLayers();
    });

    return afternoonMap;
  }

  private updateMapLayers(): void {
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
  }

  private updateAfternoonMapLayers(): void {
    const zoom = this.afternoonMap.getZoom();

    if (zoom >= 13) {
      if (this.afternoonMap.hasLayer(this.afternoonBaseMaps.AlbinaBaseMap)) {
        this.afternoonMap.removeLayer(this.afternoonBaseMaps.AlbinaBaseMap);
      }
      if (!this.afternoonMap.hasLayer(this.afternoonBaseMaps.OpenTopoBaseMap)) {
        this.afternoonMap.addLayer(this.afternoonBaseMaps.OpenTopoBaseMap);
      }
    } else {
      if (this.afternoonMap.hasLayer(this.afternoonBaseMaps.OpenTopoBaseMap)) {
        this.afternoonMap.removeLayer(this.afternoonBaseMaps.OpenTopoBaseMap);
      }
      if (!this.afternoonMap.hasLayer(this.afternoonBaseMaps.AlbinaBaseMap)) {
        this.afternoonMap.addLayer(this.afternoonBaseMaps.AlbinaBaseMap);
      }
    }
  }

  addAMControl() {
    this.amControl.addTo(this.map);
  }

  removeAMControl() {
    this.amControl.remove();
  }

  getMapInitOptions(): MapOptions {
    const options: MapOptions = {
      doubleClickZoom: true,
      scrollWheelZoom: true,
      // pinchZoom: Browser.touch,
      center: new LatLng(this.authenticationService.getUserLat(), this.authenticationService.getUserLng()),
      zoom: 8,
      minZoom: 6,
      maxZoom: 15,
    };

    if (this.authenticationService.getActiveRegionId() === this.constantsService.codeAran) {
      Object.assign(options, {
        zoom: 10,
        minZoom: 8,
        maxZoom: 12,
      });
    }
    return options;
  }

  getAlbinaBaseMap(options: TileLayerOptions = {}): TileLayer {
    return new TileLayer("https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
      tms: false,
      attribution:
        "© <a href='https://sonny.4lima.de/'>Sonny</a>, CC BY 4.0 | © <a href='https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b'>EU-DEM</a>, CC BY 4.0 | © avalanche.report, CC BY 4.0",
      ...options,
      zIndex: 0,
    });
  }

  getOpenTopoBaseMap(options: TileLayerOptions = {}): TileLayer {
    return new TileLayer("https://tile.opentopomap.org/{z}/{x}/{y}.png", {
      tms: false,
      attribution: "map data: © OpenStreetMap contributors, SRTM | map style: © OpenTopoMap (CC-BY-SA)",
      ...options,
      zIndex: 0,
    });
  }

  getClickedRegion(): string {
    for (const entry of this.overlayMaps.regions.getLayers()) {
      if (entry.feature.properties.selected) {
        entry.feature.properties.selected = false;
        return entry.feature.properties.id;
      }
    }
    return null;
  }

  resetInternalAggregatedRegions() {
    for (const layer of [this.overlayMaps.aggregatedRegions, this.afternoonOverlayMaps.aggregatedRegions]) {
      const regions = Object.keys(layer.paintRules).filter((region) =>
        this.authenticationService.isInternalRegion(region),
      );
      layer.resetStyle(regions);
    }
  }

  resetAggregatedRegions() {
    this.overlayMaps?.aggregatedRegions?.resetStyle();
    this.afternoonOverlayMaps?.aggregatedRegions?.resetStyle();
  }

  resetRegions() {
    this.overlayMaps?.regions?.resetStyle();
    this.afternoonOverlayMaps?.regions?.resetStyle();
  }

  resetActiveSelection() {
    this.selectAggregatedRegion(undefined, this.comparedMapObject);
  }

  resetEditSelection() {
    this.overlayMaps?.editSelection?.resetStyle();
  }

  resetAll() {
    this.resetRegions();
    this.resetActiveSelection();
    this.resetAggregatedRegions();
    this.resetEditSelection();
  }

  // colors all micro-regions of bulletin
  // does not touch any other micro-region
  updateAggregatedRegion(mapObject: PolygonObject) {
    this.updateAggregatedRegionLayer(mapObject, this.map, this.overlayMaps.aggregatedRegions, "active");
    this.updateAggregatedRegionLayer(
      mapObject,
      this.afternoonMap,
      this.afternoonOverlayMaps.aggregatedRegions,
      "active",
    );
  }

  updateAggregatedRegionAM(mapObject: PolygonObject) {
    this.updateAggregatedRegionLayer(mapObject, this.map, this.overlayMaps.aggregatedRegions, "active");
  }

  updateAggregatedRegionPM(mapObject: PolygonObject) {
    this.updateAggregatedRegionLayer(
      mapObject,
      this.afternoonMap,
      this.afternoonOverlayMaps.aggregatedRegions,
      "active",
    );
  }

  activeMapObject: PolygonObject;
  comparedMapObject: PolygonObject;

  selectAggregatedRegion(activeObject?: PolygonObject, comparedObject?: PolygonObject) {
    this.activeMapObject = activeObject;
    this.comparedMapObject = comparedObject;
    if (this.activeMapObject) {
      this.updateAggregatedRegionLayer(activeObject, this.map, this.overlayMaps.aggregatedRegions, "active");
      this.updateAggregatedRegionLayer(
        activeObject,
        this.afternoonMap,
        this.afternoonOverlayMaps.aggregatedRegions,
        "active",
      );
    }
    if (this.comparedMapObject) {
      this.updateAggregatedRegionLayer(comparedObject, this.map, this.overlayMaps.aggregatedRegions, "compared");
      this.updateAggregatedRegionLayer(
        comparedObject,
        this.afternoonMap,
        this.afternoonOverlayMaps.aggregatedRegions,
        "compared",
      );
    }
    this.overlayMaps?.aggregatedRegions?.rerenderTiles();
    this.afternoonOverlayMaps?.aggregatedRegions?.rerenderTiles();
  }

  private updateAggregatedRegionLayer(
    mapObject: PolygonObject,
    map: LeafletMap,
    layer: PmLeafletLayer,
    mode: "active" | "compared",
  ) {
    for (const status of [Enums.RegionStatus.suggested, Enums.RegionStatus.saved, Enums.RegionStatus.published]) {
      for (const region of mapObject.getRegionsByStatus(status)) {
        layer.paintRules[region] = {
          dataSource,
          dataLayer: "micro-regions_elevation",
          symbolizer: new BlendModePolygonSymbolizer("multiply", (f) => {
            const properties = f.props as unknown as RegionWithElevationProperties;
            if (!filterFeature({ properties } as unknown as GeoJSON.Feature)) return undefined;
            if (properties.id !== region) return undefined;
            let isAbove = properties.elevation === "high" || properties.elevation === "low_high";
            if (properties.elevation === "high" && mapObject instanceof BulletinModel) {
              const elevation =
                map !== this.afternoonMap ? mapObject.getForenoonElevation() : mapObject.getAfternoonElevation();
              if (isFinite(elevation) && elevation > properties.threshold) {
                // take "low" when lowerBound exceeds region threshold
                isAbove = false;
              }
            }
            const dangerRating = isAbove
              ? map !== this.afternoonMap
                ? mapObject.getForenoonDangerRatingAbove()
                : mapObject.getAfternoonDangerRatingAbove()
              : map !== this.afternoonMap
                ? mapObject.getForenoonDangerRatingBelow()
                : mapObject.getAfternoonDangerRatingBelow();

            if (mode === "active" && mapObject === this.activeMapObject) {
              return this.getActiveSelectionStyle(properties.id, dangerRating, status);
            } else if (mode === "compared" && mapObject === this.comparedMapObject) {
              return this.getComparedSelectionStyle(properties.id, dangerRating, status);
            } else {
              return this.getDangerRatingStyle(properties.id, dangerRating, status);
            }
          }),
        };
      }
    }
    layer.rerenderTiles();
  }

  deselectAggregatedRegion() {
    this.selectAggregatedRegion(undefined, undefined);
  }

  editAggregatedRegion(mapObject: PolygonObject) {
    this.map.addLayer(this.overlayMaps.editSelection);

    for (const entry of this.overlayMaps.editSelection.getLayers()) {
      for (const region of mapObject.getAllRegions()) {
        if (entry.feature.properties.id === region) {
          entry.feature.properties.selected = true;
          entry.setStyle(this.getEditSelectionStyle());
        }
      }
    }
  }

  showEditSelection() {
    this.map.addLayer(this.overlayMaps.editSelection);
  }

  // editSelection overlay is only used in map (not in afternoonMap)
  discardEditSelection() {
    for (const entry of this.overlayMaps.editSelection.getLayers()) {
      entry.feature.properties.selected = false;
      entry.setStyle(this.getEditSelectionBaseStyle());
    }
    this.map.removeLayer(this.overlayMaps.editSelection);
  }

  updateEditSelection() {
    for (const entry of this.overlayMaps.editSelection.getLayers()) {
      if (entry.feature.properties.selected) {
        entry.setStyle({ fillColor: "#3852A4", fillOpacity: 0.2 });
      } else {
        entry.setStyle({ fillColor: "#000000", fillOpacity: 0.0 });
      }
    }
  }

  getSelectedRegions(): string[] {
    const result = new Array<string>();
    for (const entry of this.overlayMaps.editSelection.getLayers()) {
      if (entry.feature.properties.selected) {
        if (!result.includes(entry.feature.properties.id)) {
          result.push(entry.feature.properties.id);
        }
      }
    }
    return result;
  }

  clickRegion(regionIds: Record<string, boolean>) {
    //console.log("clickRegion", this.overlayMaps.regions);
    for (const entry of this.overlayMaps.regions.getLayers()) {
      entry.feature.properties.selected = regionIds[entry.feature.properties.id];
    }
    this.updateEditSelection();
  }

  private handleClick(
    clickMode: ClickMode,
    e: MouseEvent,
    feature: geojson.Feature<GeoJSON.Geometry, SelectableRegionProperties>,
    editSelection: RegionLayer,
  ) {
    if (clickMode === "awsome") {
      if (e.shiftKey) {
        this.toggleRegion(feature);
      } else if (feature.properties.selected) {
        this.selectNone(editSelection);
      } else {
        this.selectOnly(feature, editSelection);
      }
    } else if (/Mac|iPod|iPhone|iPad/.test(navigator.platform) ? e.metaKey : e.ctrlKey) {
      this.toggleLevel1Regions(feature, editSelection);
    } else if (e.altKey) {
      this.toggleLevel2Regions(feature, editSelection);
    } else {
      this.toggleRegion(feature);
    }
    this.updateEditSelection();
  }

  private toggleRegion(feature: geojson.Feature<GeoJSON.Geometry, SelectableRegionProperties>) {
    const selected = !feature.properties.selected;
    feature.properties.selected = selected;
  }

  private selectNone(editSelection: RegionLayer) {
    for (const entry of editSelection.getLayers()) {
      entry.feature.properties.selected = false;
    }
  }
  private selectOnly(
    feature: GeoJSON.Feature<GeoJSON.Geometry, SelectableRegionProperties>,
    editSelection: RegionLayer,
  ) {
    this.selectNone(editSelection);
    feature.properties.selected = true;
  }

  private toggleLevel1Regions(
    feature: GeoJSON.Feature<GeoJSON.Geometry, SelectableRegionProperties>,
    editSelection: RegionLayer,
  ) {
    const selected = !feature.properties.selected;
    const regions = this.regionsService.getLevel1Regions(feature.properties.id);
    for (const entry of editSelection.getLayers()) {
      if (regions.includes(entry.feature.properties.id)) {
        entry.feature.properties.selected = selected;
      }
    }
  }

  private toggleLevel2Regions(
    feature: GeoJSON.Feature<GeoJSON.Geometry, SelectableRegionProperties>,
    editSelection: RegionLayer,
  ) {
    const selected = !feature.properties.selected;
    const regions = this.regionsService.getLevel2Regions(feature.properties.id);
    for (const entry of editSelection.getLayers()) {
      if (regions.includes(entry.feature.properties.id)) {
        entry.feature.properties.selected = selected;
      }
    }
  }

  protected highlightAndShowName(layer: Layer) {
    layer.on("pointerover", (e) => {
      this.regionNameControl.update(e.target.feature.properties.name);
      const l = e.target as Path;
      l.setStyle({
        weight: 3,
      });
      l.bringToFront();
    });
    layer.on("pointerout", (e) => {
      this.regionNameControl.update("");
      const l = e.target as Path;
      l.setStyle({
        weight: 1,
      });
      l.bringToFront();
    });
  }

  private getRegionStyle(): PathOptions {
    return {
      weight: this.constantsService.microRegionLineWeight,
      opacity: this.constantsService.microRegionLineOpacity,
      color: this.constantsService.microRegionLineColor,
      fillOpacity: 0.0,
    };
  }

  private getStrongRegionStyle(): PathOptions {
    return {
      weight: this.constantsService.microRegionLineWeightStrong,
      opacity: this.constantsService.microRegionLineOpacityStrong,
      color: this.constantsService.microRegionLineColor,
      fillOpacity: 0.0,
    };
  }

  private getEditSelectionBaseStyle(): PathOptions {
    return {
      opacity: 0.0,
      fillOpacity: 0.0,
    };
  }

  private getEditSelectionStyle(): PathOptions {
    return {
      fillColor: this.constantsService.colorActiveSelection,
      weight: this.constantsService.microRegionLineWeight,
      opacity: 1,
      color: this.constantsService.colorActiveSelection,
      fillOpacity: this.constantsService.fillOpacityEditSelection,
    };
  }

  private getActiveSelectionStyle(
    region: string,
    dangerRating: Enums.DangerRating,
    status: Enums.RegionStatus,
  ): PathOptions {
    let fillOpacity = this.constantsService.fillOpacityOwnSelected;
    const fillColor = this.constantsService.getDangerRatingColor(dangerRating);

    // own area
    if (region.startsWith(this.authenticationService.getActiveRegionId())) {
      if (status === Enums.RegionStatus.published) {
        fillOpacity = this.constantsService.fillOpacityOwnSelected;
      } else if (status === Enums.RegionStatus.suggested) {
        fillOpacity = this.constantsService.fillOpacityOwnSelectedSuggested;
      } else if (status === Enums.RegionStatus.saved) {
        fillOpacity = this.constantsService.fillOpacityOwnSelected;
      }

      // foreign area
    } else {
      if (status === Enums.RegionStatus.published) {
        fillOpacity = this.constantsService.fillOpacityForeignSelected;
      } else if (status === Enums.RegionStatus.suggested) {
        fillOpacity = this.constantsService.fillOpacityForeignSelectedSuggested;
      } else if (status === Enums.RegionStatus.saved) {
        fillOpacity = this.constantsService.fillOpacityForeignSelected;
      }
    }

    return {
      opacity: 0.0,
      fillColor: fillColor,
      fillOpacity: fillOpacity,
    };
  }

  private getComparedSelectionStyle(
    region: string,
    dangerRating: Enums.DangerRating,
    status: Enums.RegionStatus,
  ): PathOptions {
    let fillOpacity = this.constantsService.fillOpacityOwnSelected;
    const fillColor = this.constantsService.getDangerRatingColorMuted(dangerRating);

    // own area
    if (region.startsWith(this.authenticationService.getActiveRegionId())) {
      if (status === Enums.RegionStatus.published) {
        fillOpacity = this.constantsService.fillOpacityOwnSelected;
      } else if (status === Enums.RegionStatus.suggested) {
        fillOpacity = this.constantsService.fillOpacityOwnSelectedSuggested;
      } else if (status === Enums.RegionStatus.saved) {
        fillOpacity = this.constantsService.fillOpacityOwnSelected;
      }

      // foreign area
    } else {
      if (status === Enums.RegionStatus.published) {
        fillOpacity = this.constantsService.fillOpacityForeignSelected;
      } else if (status === Enums.RegionStatus.suggested) {
        fillOpacity = this.constantsService.fillOpacityForeignSelectedSuggested;
      } else if (status === Enums.RegionStatus.saved) {
        fillOpacity = this.constantsService.fillOpacityForeignSelected;
      }
    }

    return {
      opacity: 0.0,
      fillColor: fillColor,
      fillOpacity: fillOpacity,
    };
  }

  private getDangerRatingStyle(
    region: string,
    dangerRating: Enums.DangerRating,
    status: Enums.RegionStatus,
  ): PathOptions {
    let fillOpacity = this.constantsService.fillOpacityOwnDeselected;

    // own area
    if (region.startsWith(this.authenticationService.getActiveRegionId())) {
      if (status === Enums.RegionStatus.published) {
        fillOpacity = this.constantsService.fillOpacityOwnDeselected;
      } else if (status === Enums.RegionStatus.suggested) {
        fillOpacity = this.constantsService.fillOpacityOwnDeselectedSuggested;
      } else if (status === Enums.RegionStatus.saved) {
        fillOpacity = this.constantsService.fillOpacityOwnDeselected;
      }

      // foreign area
    } else {
      if (status === Enums.RegionStatus.published) {
        fillOpacity = this.constantsService.fillOpacityForeignDeselected;
      } else if (status === Enums.RegionStatus.suggested) {
        fillOpacity = this.constantsService.fillOpacityForeignDeselectedSuggested;
      } else if (status === Enums.RegionStatus.saved) {
        fillOpacity = this.constantsService.fillOpacityForeignDeselected;
      }
    }

    const color = this.constantsService.getDangerRatingColor(dangerRating);
    return {
      opacity: 0.0,
      fillColor: color,
      fillOpacity: fillOpacity,
    };
  }
}
