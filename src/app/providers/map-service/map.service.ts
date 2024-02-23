import { Injectable } from "@angular/core";
import * as L from "leaflet";
import { Browser, GeoJSON, Map, TileLayer } from "leaflet";
import "leaflet.sync";
import { BulletinModel } from "../../models/bulletin.model";
import { RegionsService, RegionWithElevationProperties } from "../regions-service/regions.service";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";
import * as Enums from "../../enums/enums";
import * as geojson from "geojson";
import { RegionNameControl } from "./region-name-control";
import { AmPmControl } from "./am-pm-control";

declare module "leaflet" {
  interface Map {
    sync(other: L.Map): void;
  }

  interface GeoJSON<P = any> {
    feature?: geojson.Feature<geojson.MultiPoint, P>;

    getLayers(): GeoJSON<P>[];
  }
}

interface SelectableRegionProperties extends RegionWithElevationProperties {
  selected: boolean;
}

@Injectable()
export class MapService {
  public map: Map;
  public afternoonMap: Map;
  private amControl: L.Control;
  private pmControl: L.Control;

  protected baseMaps: Record<string, TileLayer>;
  protected afternoonBaseMaps: Record<string, TileLayer>;
  protected overlayMaps: {
    // Micro  regions without elevation
    regions: GeoJSON<SelectableRegionProperties>;
    activeSelection: GeoJSON<SelectableRegionProperties>;
    editSelection: GeoJSON<SelectableRegionProperties>;
    aggregatedRegions: GeoJSON<SelectableRegionProperties>;
  };
  protected afternoonOverlayMaps: {
    // Micro  regions without elevation
    regions: GeoJSON<SelectableRegionProperties>;
    activeSelection: GeoJSON<SelectableRegionProperties>;
    editSelection: GeoJSON<SelectableRegionProperties>;
    aggregatedRegions: GeoJSON<SelectableRegionProperties>;
  };

  constructor(
    protected regionsService: RegionsService,
    protected authenticationService: AuthenticationService,
    protected constantsService: ConstantsService
  ) {
    this.amControl =new AmPmControl({ position: "bottomleft" }).setText("AM");
    this.pmControl =new AmPmControl({ position: "bottomleft" }).setText("PM");
  }

  protected async initOverlayMaps(isPM = false): Promise<typeof this.overlayMaps> {
    const [regions, regionsWithElevation, activeRegion] = await Promise.all([
      this.regionsService.getRegionsAsync(),
      this.regionsService.getRegionsWithElevationAsync(),
      this.regionsService.getActiveRegion(this.authenticationService.getActiveRegionId())
    ]);

    let overlayMaps: typeof this.overlayMaps = {
      // overlay to show micro regions without elevation (only outlines)
      regions: new GeoJSON(regions, {
        onEachFeature: isPM
          ? this.onEachAggregatedRegionsFeaturePM.bind(this)
          : this.onEachAggregatedRegionsFeatureAM.bind(this),
        style: this.getRegionStyle()
      }),

      // overlay to show selected regions
      activeSelection: new GeoJSON(regionsWithElevation, {
        style: this.getActiveSelectionBaseStyle()
      }),

      // overlay to select regions (when editing an aggregated region)
      editSelection: new GeoJSON(regions, {
        style: this.getEditSelectionBaseStyle()
      }),

      // overlay to show aggregated regions
      aggregatedRegions: new GeoJSON(regionsWithElevation, {
        style: this.getAggregatedRegionBaseStyle()
      })
    };
    overlayMaps.editSelection.options.onEachFeature = this.onEachFeature.bind(this, overlayMaps.editSelection);
    overlayMaps.editSelection.addData(activeRegion);
    return overlayMaps;
  }

  removeMaps() {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
    if (this.afternoonMap) {
      this.afternoonMap.remove();
      this.afternoonMap = undefined;
    }
  }

  async initAmPmMap() {
    this.removeMaps();

    this.baseMaps = {
      AlbinaBaseMap: this.getAlbinaBaseMap()
    };
    this.afternoonBaseMaps = {
      AlbinaBaseMap: this.getAlbinaBaseMap()
    };

    this.overlayMaps = await this.initOverlayMaps(false);
    this.afternoonOverlayMaps = await this.initOverlayMaps(true);

    this.resetAll();
    this.initAmMap();
    this.initPmMap();
    this.map.sync(this.afternoonMap);
    this.afternoonMap.sync(this.map);
    return [this.map, this.afternoonMap];
  }

  private initAmMap() {
    const map = L.map("map", {
      ...this.getMapInitOptions(),
      layers: [
        this.baseMaps.AlbinaBaseMap,
        this.overlayMaps.aggregatedRegions,
        this.overlayMaps.regions,
      ],
    });

    L.control.zoom({ position: "topleft" }).addTo(map);
    new RegionNameControl().addTo(map);

    this.map = map;
    return map;
  }

  private initPmMap() {
    const afternoonMap = L.map("afternoonMap", {
      ...this.getMapInitOptions(),
      layers: [
        this.afternoonBaseMaps.AlbinaBaseMap,
        this.afternoonOverlayMaps.aggregatedRegions,
        this.afternoonOverlayMaps.regions,
      ],
    });

    this.pmControl.addTo(afternoonMap);

    this.afternoonMap = afternoonMap;
    return afternoonMap;
  }

  addAMControl() {
    this.amControl.addTo(this.map);
  }

  removeAMControl() {
    this.amControl.remove();
  }

  getMapInitOptions() {
    const options = {
      zoomControl: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      touchZoom: true,
      center: L.latLng(this.authenticationService.getUserLat(), this.authenticationService.getUserLng()),
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

  getAlbinaBaseMap(): TileLayer {
    return new TileLayer("https://static.avalanche.report/tms/{z}/{x}/{y}.png", {
      tms: false,
      attribution: ""
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
    for (const entry of this.overlayMaps?.aggregatedRegions?.getLayers?.() ?? []) {
      this.authenticationService.isEuregio()
      if (this.authenticationService.isInternalRegion(entry.feature.properties.id)) {
        entry.setStyle(this.getAggregatedRegionBaseStyle());
      }
    }
    for (const entry of this.afternoonOverlayMaps?.aggregatedRegions?.getLayers?.() ?? []) {
      if (this.authenticationService.isInternalRegion(entry.feature.properties.id)) {
        entry.setStyle(this.getAggregatedRegionBaseStyle());
      }
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
    this.overlayMaps?.activeSelection?.resetStyle();
    this.afternoonOverlayMaps?.activeSelection?.resetStyle();
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
  updateAggregatedRegion(bulletin: BulletinModel) {
    const dangerRatingAbove = bulletin.getForenoonDangerRatingAbove();
    const dangerRatingBelow = bulletin.getForenoonDangerRatingBelow();
    for (const entry of this.overlayMaps?.aggregatedRegions?.getLayers()) {
      for (let j = bulletin.savedRegions.length - 1; j >= 0; j--) {
        if (entry.feature.properties.id === bulletin.savedRegions[j]) {
          if (entry.feature.properties.elevation === this.constantsService.microRegionsElevationHigh || entry.feature.properties.elevation === this.constantsService.microRegionsElevationLowHigh) {
            entry.setStyle(this.getDangerRatingStyle(entry.feature.properties.id, dangerRatingAbove, Enums.RegionStatus.saved));
          } else {
            entry.setStyle(this.getDangerRatingStyle(entry.feature.properties.id, dangerRatingBelow, Enums.RegionStatus.saved));
          }
        }
      }
      for (let j = bulletin.suggestedRegions.length - 1; j >= 0; j--) {
        if (entry.feature.properties.id === bulletin.suggestedRegions[j]) {
          if (entry.feature.properties.elevation === this.constantsService.microRegionsElevationHigh || entry.feature.properties.elevation === this.constantsService.microRegionsElevationLowHigh) {
            entry.setStyle(this.getDangerRatingStyle(entry.feature.properties.id, dangerRatingAbove, Enums.RegionStatus.suggested));
          } else {
            entry.setStyle(this.getDangerRatingStyle(entry.feature.properties.id, dangerRatingBelow, Enums.RegionStatus.suggested));
          }
        }
      }
      for (let j = bulletin.publishedRegions.length - 1; j >= 0; j--) {
        if (entry.feature.properties.id === bulletin.publishedRegions[j]) {
          if (entry.feature.properties.elevation === this.constantsService.microRegionsElevationHigh || entry.feature.properties.elevation === this.constantsService.microRegionsElevationLowHigh) {
            entry.setStyle(this.getDangerRatingStyle(entry.feature.properties.id, dangerRatingAbove, Enums.RegionStatus.published));
          } else {
            entry.setStyle(this.getDangerRatingStyle(entry.feature.properties.id, dangerRatingBelow, Enums.RegionStatus.published));
          }
        }
      }
    }

    const afternoonDangerRatingAbove = bulletin.getAfternoonDangerRatingAbove();
    const afternoonDangerRatingBelow = bulletin.getAfternoonDangerRatingBelow();
    for (const entry of this.afternoonOverlayMaps.aggregatedRegions.getLayers()) {
      for (let j = bulletin.savedRegions.length - 1; j >= 0; j--) {
        if (entry.feature.properties.id === bulletin.savedRegions[j]) {
          if (entry.feature.properties.elevation === this.constantsService.microRegionsElevationHigh || entry.feature.properties.elevation === this.constantsService.microRegionsElevationLowHigh) {
            entry.setStyle(this.getDangerRatingStyle(entry.feature.properties.id, afternoonDangerRatingAbove, Enums.RegionStatus.saved));
          } else {
            entry.setStyle(this.getDangerRatingStyle(entry.feature.properties.id, afternoonDangerRatingBelow, Enums.RegionStatus.saved));
          }
        }
      }
      for (let j = bulletin.suggestedRegions.length - 1; j >= 0; j--) {
        if (entry.feature.properties.id === bulletin.suggestedRegions[j]) {
          if (entry.feature.properties.elevation === this.constantsService.microRegionsElevationHigh || entry.feature.properties.elevation === this.constantsService.microRegionsElevationLowHigh) {
            entry.setStyle(this.getDangerRatingStyle(entry.feature.properties.id, afternoonDangerRatingAbove, Enums.RegionStatus.suggested));
          } else {
            entry.setStyle(this.getDangerRatingStyle(entry.feature.properties.id, afternoonDangerRatingBelow, Enums.RegionStatus.suggested));
          }
        }
      }
      for (let j = bulletin.publishedRegions.length - 1; j >= 0; j--) {
        if (entry.feature.properties.id === bulletin.publishedRegions[j]) {
          if (entry.feature.properties.elevation === this.constantsService.microRegionsElevationHigh || entry.feature.properties.elevation === this.constantsService.microRegionsElevationLowHigh) {
            entry.setStyle(this.getDangerRatingStyle(entry.feature.properties.id, afternoonDangerRatingAbove, Enums.RegionStatus.published));
          } else {
            entry.setStyle(this.getDangerRatingStyle(entry.feature.properties.id, afternoonDangerRatingBelow, Enums.RegionStatus.published));
          }
        }
      }
    }
  }

  selectAggregatedRegion(bulletin: BulletinModel) {
    this.map.removeLayer(this.overlayMaps.regions);
    this.afternoonMap.removeLayer(this.afternoonOverlayMaps.regions);
    this.map.addLayer(this.overlayMaps.activeSelection);
    this.afternoonMap.addLayer(this.afternoonOverlayMaps.activeSelection);

    for (const entry of this.overlayMaps.activeSelection.getLayers()) {
      entry.feature.properties.selected = false;
      entry.setStyle(this.getActiveSelectionBaseStyle());
      for (const region of bulletin.savedRegions) {
        if (entry.feature.properties.id === region) {
          entry.feature.properties.selected = true;
          if (entry.feature.properties.elevation === this.constantsService.microRegionsElevationHigh || entry.feature.properties.elevation === this.constantsService.microRegionsElevationLowHigh) {
            entry.setStyle(this.getActiveSelectionStyle(entry.feature.properties.id, bulletin.getForenoonDangerRatingAbove(), Enums.RegionStatus.saved));
          } else {
            entry.setStyle(this.getActiveSelectionStyle(entry.feature.properties.id, bulletin.getForenoonDangerRatingBelow(), Enums.RegionStatus.saved));
          }
        }
      }
      for (const region of bulletin.suggestedRegions) {
        if (entry.feature.properties.id === region) {
          entry.feature.properties.selected = true;
          if (entry.feature.properties.elevation === this.constantsService.microRegionsElevationHigh || entry.feature.properties.elevation === this.constantsService.microRegionsElevationLowHigh) {
            entry.setStyle(this.getActiveSelectionStyle(entry.feature.properties.id, bulletin.getForenoonDangerRatingAbove(), Enums.RegionStatus.suggested));
          } else {
            entry.setStyle(this.getActiveSelectionStyle(entry.feature.properties.id, bulletin.getForenoonDangerRatingBelow(), Enums.RegionStatus.suggested));
          }
        }
      }
      for (const region of bulletin.publishedRegions) {
        if (entry.feature.properties.id === region) {
          entry.feature.properties.selected = true;
          if (entry.feature.properties.elevation === this.constantsService.microRegionsElevationHigh || entry.feature.properties.elevation === this.constantsService.microRegionsElevationLowHigh) {
            entry.setStyle(this.getActiveSelectionStyle(entry.feature.properties.id, bulletin.getForenoonDangerRatingAbove(), Enums.RegionStatus.published));
          } else {
            entry.setStyle(this.getActiveSelectionStyle(entry.feature.properties.id, bulletin.getForenoonDangerRatingBelow(), Enums.RegionStatus.published));
          }
        }
      }
    }

    for (const entry of this.afternoonOverlayMaps.activeSelection.getLayers()) {
      entry.feature.properties.selected = false;
      entry.setStyle(this.getActiveSelectionBaseStyle());
      for (const region of bulletin.savedRegions) {
        if (entry.feature.properties.id === region) {
          entry.feature.properties.selected = true;
          if (entry.feature.properties.elevation === this.constantsService.microRegionsElevationHigh || entry.feature.properties.elevation === this.constantsService.microRegionsElevationLowHigh) {
            entry.setStyle(this.getActiveSelectionStyle(entry.feature.properties.id, bulletin.getAfternoonDangerRatingAbove(), Enums.RegionStatus.saved));
          } else {
            entry.setStyle(this.getActiveSelectionStyle(entry.feature.properties.id, bulletin.getAfternoonDangerRatingBelow(), Enums.RegionStatus.saved));
          }
        }
      }
      for (const region of bulletin.suggestedRegions) {
        if (entry.feature.properties.id === region) {
          entry.feature.properties.selected = true;
          if (entry.feature.properties.elevation === this.constantsService.microRegionsElevationHigh || entry.feature.properties.elevation === this.constantsService.microRegionsElevationLowHigh) {
            entry.setStyle(this.getActiveSelectionStyle(entry.feature.properties.id, bulletin.getAfternoonDangerRatingAbove(), Enums.RegionStatus.suggested));
          } else {
            entry.setStyle(this.getActiveSelectionStyle(entry.feature.properties.id, bulletin.getAfternoonDangerRatingBelow(), Enums.RegionStatus.suggested));
          }
        }
      }
      for (const region of bulletin.publishedRegions) {
        if (entry.feature.properties.id === region) {
          entry.feature.properties.selected = true;
          if (entry.feature.properties.elevation === this.constantsService.microRegionsElevationHigh || entry.feature.properties.elevation === this.constantsService.microRegionsElevationLowHigh) {
            entry.setStyle(this.getActiveSelectionStyle(entry.feature.properties.id, bulletin.getAfternoonDangerRatingAbove(), Enums.RegionStatus.published));
          } else {
            entry.setStyle(this.getActiveSelectionStyle(entry.feature.properties.id, bulletin.getAfternoonDangerRatingBelow(), Enums.RegionStatus.published));
          }
        }
      }
    }
    this.map.addLayer(this.overlayMaps.regions);
    this.afternoonMap.addLayer(this.afternoonOverlayMaps.regions);
  }

  deselectAggregatedRegion() {
    this.map?.removeLayer?.(this.overlayMaps.activeSelection);
    this.afternoonMap?.removeLayer?.(this.afternoonOverlayMaps.activeSelection);
  }

  deselectAggregatedRegions() {
    this.overlayMaps.aggregatedRegions.getLayers().every((entry) => entry.feature.properties.selected = false);
    this.afternoonOverlayMaps.aggregatedRegions.getLayers().every((entry) => entry.feature.properties.selected = false);
  }

  editAggregatedRegion(bulletin: BulletinModel) {
    this.map.removeLayer(this.overlayMaps.activeSelection);
    this.map.addLayer(this.overlayMaps.editSelection);

    for (const entry of this.overlayMaps.editSelection.getLayers()) {
      for (const region of bulletin.getAllRegions()) {
        if (entry.feature.properties.id === region) {
          entry.feature.properties.selected = true;
          entry.setStyle(this.getEditSelectionStyle());
        }
      }
    }
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
        entry.setStyle({ fillColor: "#3852A4", fillOpacity: 0.5 });
      } else {
        entry.setStyle({ fillColor: "#000000", fillOpacity: 0.0 });
      }
    }
  }

  getSelectedRegions(): string[] {
    const result = new Array<string>();
    for (const entry of this.overlayMaps.editSelection.getLayers()) {
      if (entry.feature.properties.selected) {
        result.push(entry.feature.properties.id);
      }
    }
    return result;
  }

  private onEachFeature(editSelection: L.GeoJSON, feature: GeoJSON.Feature, layer: L.Layer) {
    const regionsService = this.regionsService;
    const updateEditSelection = () => this.updateEditSelection();
    layer.on({
      click(e) {
        if (feature.properties.selected && feature.properties.selected === true) {
          if (e.originalEvent.ctrlKey) {
            const regions = regionsService.getLevel1Regions(feature.properties.id);
            for (const entry of editSelection.getLayers()) {
              if (regions.includes(entry.feature.properties.id)) {
                entry.feature.properties.selected = false;
              }
            }
          } else if (e.originalEvent.altKey) {
            const regions = regionsService.getLevel2Regions(feature.properties.id);
            for (const entry of editSelection.getLayers()) {
              if (regions.includes(entry.feature.properties.id)) {
                entry.feature.properties.selected = false;
              }
            }
          } else {
            feature.properties.selected = false;
          }
        } else {
          if (e.originalEvent.ctrlKey) {
            const regions = regionsService.getLevel1Regions(feature.properties.id);
            for (const entry of editSelection.getLayers()) {
              if (regions.includes(entry.feature.properties.id)) {
                entry.feature.properties.selected = true;
              }
            }
          } else if (e.originalEvent.altKey) {
            const regions = regionsService.getLevel2Regions(feature.properties.id);
            for (const entry of editSelection.getLayers()) {
              if (regions.includes(entry.feature.properties.id)) {
                entry.feature.properties.selected = true;
              }
            }
          } else {
            feature.properties.selected = true;
          }
        }
        updateEditSelection();
      },
      mouseover(e) {
        // TODO get current language
        (
          (e.originalEvent.currentTarget as HTMLElement).children[1].childNodes[1] as HTMLElement
        ).children[0].innerHTML = e.target.feature.properties.name;
        const l = e.target;
        l.setStyle({
          weight: 3
        });
        if (!L.Browser.ie && !L.Browser.opera12 && !L.Browser.edge) {
          l.bringToFront();
        }
      },
      mouseout(e) {
        (
          (e.originalEvent.currentTarget as HTMLElement).children[1].childNodes[1] as HTMLElement
        ).children[0].innerHTML = " ";
        const l = e.target;
        l.setStyle({
          weight: 1
        });
        if (!L.Browser.ie && !L.Browser.opera12 && !L.Browser.edge) {
          l.bringToFront();
        }
      }
    });
  }

  protected onEachAggregatedRegionsFeatureAM(feature: GeoJSON.Feature, layer: L.Layer) {
    layer.on({
      click(e) {
        feature.properties.selected = true;
      },
      mouseover(e) {
        (
          (e.originalEvent.currentTarget as HTMLElement).children[1].childNodes[1] as HTMLElement
        ).children[0].innerHTML = e.target.feature.properties.name;
        const l = e.target;
        l.setStyle({
          weight: 3
        });
        if (!Browser.ie && !Browser.opera12 && !Browser.edge) {
          l.bringToFront();
        }
      },
      mouseout(e) {
        (
          (e.originalEvent.currentTarget as HTMLElement).children[1].childNodes[1] as HTMLElement
        ).children[0].innerHTML = " ";
        const l = e.target;
        l.setStyle({
          weight: 1
        });
        if (!Browser.ie && Browser.opera12 && !Browser.edge) {
          l.bringToFront();
        }
      }
    });
  }

  private onEachAggregatedRegionsFeaturePM(feature: GeoJSON.Feature, layer: L.Layer) {
    layer.on({
      click(e) {
        feature.properties.selected = true;
      }
    });
  }

  private getAggregatedRegionBaseStyle() {
    return {
      opacity: 0.0,
      fillOpacity: 0.0
    };
  }

  private getRegionStyle() {
    return {
      weight: this.constantsService.lineWeight,
      opacity: this.constantsService.lineOpacity,
      color: this.constantsService.lineColor,
      fillOpacity: 0.0
    };
  }

  private getActiveSelectionBaseStyle() {
    return {
      opacity: 0.0,
      fillOpacity: 0.0
    };
  }

  private getEditSelectionBaseStyle() {
    return {
      opacity: 0.0,
      fillOpacity: 0.0
    };
  }

  private getEditSelectionStyle() {
    return {
      fillColor: this.constantsService.colorActiveSelection,
      weight: this.constantsService.lineWeight,
      opacity: 1,
      color: this.constantsService.colorActiveSelection,
      fillOpacity: this.constantsService.fillOpacityEditSelection
    };
  }

  private getActiveSelectionStyle(region, dangerRating, status) {
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
      fillOpacity: fillOpacity
    };
  }

  private getDangerRatingStyle(region, dangerRating, status) {
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
      fillOpacity: fillOpacity
    };
  }
}
