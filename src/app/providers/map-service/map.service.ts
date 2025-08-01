import { Injectable, inject } from "@angular/core";
import {
  Browser,
  Control,
  GeoJSON,
  LatLng,
  Layer,
  Map,
  MapOptions,
  Path,
  PathOptions,
  TileLayer,
  TileLayerOptions,
} from "leaflet";
import "leaflet.sync";
import { BulletinModel } from "../../models/bulletin.model";
import { RegionProperties, RegionsService, RegionWithElevationProperties } from "../regions-service/regions.service";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";
import * as Enums from "../../enums/enums";
import * as geojson from "geojson";
import { RegionNameControl } from "./region-name-control";
import { AmPmControl } from "./am-pm-control";
import { BlendModePolygonSymbolizer, PmLeafletLayer } from "./pmtiles-layer";
import { filterFeature } from "../regions-service/filterFeature";
import { TranslateService } from "@ngx-translate/core";
import { PolygonObject } from "../../danger-sources/models/polygon-object.model";
import { FeatureCollection, MultiPolygon } from "geojson";

declare module "leaflet" {
  interface Map {
    sync(other: Map): void;
  }

  interface GeoJSON<P = any> {
    feature?: geojson.Feature<geojson.MultiPoint, P>;

    getLayers(): GeoJSON<P>[];
  }
}

interface SelectableRegionProperties extends RegionWithElevationProperties {
  selected: boolean;
}

const dataSource = "eaws-regions";

@Injectable()
export class MapService {
  protected regionsService = inject(RegionsService);
  translateService = inject(TranslateService);
  protected authenticationService = inject(AuthenticationService);
  protected constantsService = inject(ConstantsService);

  public map: Map;
  public afternoonMap: Map;
  protected regionNameControl: RegionNameControl;
  private amControl: Control;
  private pmControl: Control;

  protected baseMaps: Record<string, TileLayer>;
  protected afternoonBaseMaps: Record<string, TileLayer>;
  protected overlayMaps: {
    // Micro  regions without elevation
    regions: GeoJSON<SelectableRegionProperties>;
    editSelection: GeoJSON<SelectableRegionProperties>;
    aggregatedRegions: PmLeafletLayer;
  };
  protected afternoonOverlayMaps: {
    // Micro  regions without elevation
    regions: GeoJSON<SelectableRegionProperties>;
    editSelection: GeoJSON<SelectableRegionProperties>;
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
    activeRegion,
  }: {
    regions?: FeatureCollection<MultiPolygon, RegionProperties>;
    activeRegion?: FeatureCollection<MultiPolygon, RegionProperties>;
  } = {}): Promise<typeof this.overlayMaps> {
    if (!regions || !activeRegion) {
      const [regions0, activeRegion0] = await Promise.all([
        this.regionsService.getRegionsAsync(),
        this.regionsService.getActiveRegion(this.authenticationService.getActiveRegionId()),
      ]);
      regions ??= regions0;
      activeRegion ??= activeRegion0;
    }

    const overlayMaps: typeof this.overlayMaps = {
      // overlay to show micro regions without elevation (only outlines)
      regions: new GeoJSON(regions, {
        onEachFeature: (feature, layer) => {
          layer.on("click", () => (feature.properties.selected = true));
          this.highlightAndShowName(layer);
        },
        style: this.getRegionStyle(),
      }),

      // overlay to select regions (when editing an aggregated region)
      editSelection: new GeoJSON(regions, {
        style: this.getEditSelectionBaseStyle(),
      }),

      // overlay to show aggregated regions
      aggregatedRegions: new PmLeafletLayer({
        sources: { [dataSource]: { maxDataZoom: 10, url: "https://static.avalanche.report/eaws-regions.pmtiles" } },
      }),
    };
    overlayMaps.editSelection.options.onEachFeature = (feature, layer) => {
      this.handleClick(overlayMaps.editSelection, feature, layer);
      this.highlightAndShowName(layer);
    };
    overlayMaps.editSelection.addData(activeRegion);
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
    };
    this.afternoonBaseMaps = {
      AlbinaBaseMap: this.getAlbinaBaseMap(),
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
    this.map = new Map("map", {
      ...this.getMapInitOptions(),
      layers: [this.baseMaps.AlbinaBaseMap, this.overlayMaps.aggregatedRegions, this.overlayMaps.regions],
    });

    this.regionNameControl = new RegionNameControl().addTo(this.map);

    // Disable dragging on mobile devices
    this.map.whenReady(() => {
      if (Browser.mobile) {
        this.map.dragging.disable();
      }
    });

    return this.map;
  }

  private initPmMap() {
    const afternoonMap = new Map("afternoonMap", {
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

    return afternoonMap;
  }

  addAMControl() {
    this.amControl.addTo(this.map);
  }

  removeAMControl() {
    this.amControl.remove();
  }

  getMapInitOptions(): MapOptions {
    const options: MapOptions = {
      doubleClickZoom: false,
      scrollWheelZoom: false,
      touchZoom: true,
      center: new LatLng(this.authenticationService.getUserLat(), this.authenticationService.getUserLng()),
      zoom: 8,
      minZoom: 6,
      maxZoom: 10,
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
    this.selectAggregatedRegion(undefined);
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
    this.selectAggregatedRegion0(mapObject, this.map, this.overlayMaps.aggregatedRegions);
    this.selectAggregatedRegion0(mapObject, this.afternoonMap, this.afternoonOverlayMaps.aggregatedRegions);
  }

  updateAggregatedRegionAM(mapObject: PolygonObject) {
    this.selectAggregatedRegion0(mapObject, this.map, this.overlayMaps.aggregatedRegions);
  }

  updateAggregatedRegionPM(mapObject: PolygonObject) {
    this.selectAggregatedRegion0(mapObject, this.afternoonMap, this.afternoonOverlayMaps.aggregatedRegions);
  }

  activeMapObject: PolygonObject;

  selectAggregatedRegion(mapObject: PolygonObject) {
    this.activeMapObject = mapObject;
    if (this.activeMapObject) {
      this.selectAggregatedRegion0(mapObject, this.map, this.overlayMaps.aggregatedRegions);
      this.selectAggregatedRegion0(mapObject, this.afternoonMap, this.afternoonOverlayMaps.aggregatedRegions);
    }
    this.overlayMaps?.aggregatedRegions?.rerenderTiles();
    this.afternoonOverlayMaps?.aggregatedRegions?.rerenderTiles();
  }

  private selectAggregatedRegion0(mapObject: PolygonObject, map: Map, layer: PmLeafletLayer) {
    for (const status of [Enums.RegionStatus.suggested, Enums.RegionStatus.saved, Enums.RegionStatus.published]) {
      for (const region of mapObject.getRegionsByStatus(status)) {
        layer.paintRules[region] = {
          dataSource,
          dataLayer: "micro-regions_elevation",
          symbolizer: new BlendModePolygonSymbolizer("multiply", (f) => {
            const properties = f.props as unknown as SelectableRegionProperties;
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
            if (!dangerRating) return undefined;
            return mapObject === this.activeMapObject
              ? this.getActiveSelectionStyle(properties.id, dangerRating, status)
              : this.getDangerRatingStyle(properties.id, dangerRating, status);
          }),
        };
      }
    }
    layer.rerenderTiles();
  }

  deselectAggregatedRegion() {
    this.selectAggregatedRegion(undefined);
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
        if (result.indexOf(entry.feature.properties.id) < 0) {
          result.push(entry.feature.properties.id);
        }
      }
    }
    return result;
  }

  private handleClick(editSelection: GeoJSON, feature: GeoJSON.Feature, layer: Layer) {
    layer.on("click", (e) => {
      const selected = !feature.properties.selected;
      if (e.originalEvent.ctrlKey) {
        const regions = this.regionsService.getLevel1Regions(feature.properties.id);
        for (const entry of editSelection.getLayers()) {
          if (regions.includes(entry.feature.properties.id)) {
            entry.feature.properties.selected = selected;
          }
        }
      } else if (e.originalEvent.altKey) {
        const regions = this.regionsService.getLevel2Regions(feature.properties.id);
        for (const entry of editSelection.getLayers()) {
          if (regions.includes(entry.feature.properties.id)) {
            entry.feature.properties.selected = selected;
          }
        }
      } else {
        feature.properties.selected = selected;
      }
      this.updateEditSelection();
    });
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

  private getAggregatedRegionBaseStyle(): PathOptions {
    return {
      opacity: 0.0,
      fillOpacity: 0.0,
    };
  }

  private getRegionStyle(): PathOptions {
    return {
      weight: this.constantsService.lineWeight,
      opacity: this.constantsService.lineOpacity,
      color: this.constantsService.lineColor,
      fillOpacity: 0.0,
    };
  }

  private getActiveSelectionBaseStyle(): PathOptions {
    return {
      opacity: 0.0,
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
      weight: this.constantsService.lineWeight,
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
