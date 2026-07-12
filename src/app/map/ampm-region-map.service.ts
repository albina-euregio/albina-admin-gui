import { inject, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Map as MlMap } from "maplibre-gl";

import { PolygonObject } from "../danger-sources/models/polygon-object.model";
import * as Enums from "../enums/enums";
import { BulletinModel } from "../models/bulletin.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { addAggregatedRegionLayer, AggregatedRegionHandle, AggregatedRegionStyle } from "./aggregated-region-layer";
import { albinaBasemapLayer, composeStyle, opentopoLayer } from "./base-map";
import { fitFeatureCollection } from "./bounds";
import { AmPmControl } from "./controls/am-pm-control";
import { RegionNameControl } from "./controls/region-name-control";
import { createMap } from "./create-map";
import { addRegionLayer, RegionLayerHandle } from "./region-layer";
import { syncMaps } from "./sync-maps";

interface Fill {
  fillColor: string;
  fillOpacity: number;
}

interface MapSide {
  map: MlMap;
  isAm: boolean;
  aggregated: AggregatedRegionHandle;
  regions: RegionLayerHandle;
  editSelection?: RegionLayerHandle;
}

type Mode = "active" | "compared";

/**
 * MapLibre reimplementation of the Leaflet `MapService`: the AM/PM dual map with the
 * aggregated micro-region danger-rating layer used by bulletins and danger-sources.
 * Provided per component. Preserves the `MapService` public method names.
 */
@Injectable()
export class AmPmRegionMapService {
  private regionsService = inject(RegionsService);
  private translateService = inject(TranslateService);
  private authenticationService = inject(AuthenticationService);
  private constantsService = inject(ConstantsService);

  private am?: MapSide;
  private pm?: MapSide;
  private regionName = new RegionNameControl();
  private amControl?: AmPmControl;
  private pmControl?: AmPmControl;
  private unsync?: () => void;
  private editing = false;
  private clickedRegion?: string;
  private activeMapObject?: PolygonObject;
  private comparedMapObject?: PolygonObject;
  private clickCbs: ((e: MouseEvent) => void)[] = [];

  get map(): MlMap | undefined {
    return this.am?.map;
  }
  get afternoonMap(): MlMap | undefined {
    return this.pm?.map;
  }

  /** Register a click handler on both maps (replaces `map.on({click})` on the Leaflet maps). */
  onClick(cb: (e: MouseEvent) => void): void {
    this.clickCbs.push(cb);
  }

  async initAmPmMap(): Promise<void> {
    this.removeMaps();

    const [regions, internalRegions, activeRegions] = await Promise.all([
      this.regionsService.getRegionsAsync(),
      this.regionsService.getInternalServerRegionsAsync(),
      this.regionsService.getActiveServerRegionsAsync(),
    ]);

    const amMap = createMap({ container: "map", style: this.baseStyle(), navigationControl: true, minZoom: 6 });
    const pmMap = createMap({
      container: "afternoonMap",
      style: this.baseStyle(),
      navigationControl: false,
      minZoom: 6,
    });
    await Promise.all([this.whenLoaded(amMap), this.whenLoaded(pmMap)]);

    this.am = this.setupSide(amMap, true, regions, internalRegions);
    this.pm = this.setupSide(pmMap, false, regions, internalRegions);

    amMap.addControl(this.regionName, "top-right");
    this.pmControl = new AmPmControl(this.translateService.instant("daytime.later"));
    pmMap.addControl(this.pmControl, "bottom-left");

    for (const m of [amMap, pmMap]) {
      m.on("click", (e) => this.clickCbs.forEach((cb) => cb(e.originalEvent)));
    }

    this.unsync = syncMaps(amMap, pmMap);
    fitFeatureCollection(amMap, activeRegions);
  }

  private baseStyle() {
    return composeStyle([albinaBasemapLayer({ maxzoom: 13 }), opentopoLayer({ minzoom: 13 })]);
  }

  private whenLoaded(map: MlMap): Promise<void> {
    return new Promise((resolve) => (map.loaded() ? resolve() : map.once("load", () => resolve())));
  }

  private setupSide(
    map: MlMap,
    isAm: boolean,
    regions: Parameters<typeof addRegionLayer>[1],
    internalRegions: Parameters<typeof addRegionLayer>[1],
  ): MapSide {
    const key = isAm ? "am" : "pm";
    const aggregated = addAggregatedRegionLayer(map, { id: `aggregated-${key}` });

    const outlineStyle = {
      lineColor: this.constantsService.microRegionLineColor,
      lineOpacity: this.constantsService.microRegionLineOpacity,
      lineOpacityStrong: this.constantsService.microRegionLineOpacityStrong,
      lineWeight: this.constantsService.microRegionLineWeight,
      lineWeightStrong: this.constantsService.microRegionLineWeightStrong,
    };
    const regionsLayer = addRegionLayer(map, regions, { id: `regions-${key}`, interactive: true, style: outlineStyle });
    regionsLayer.onRegionHover((name) => this.regionName.update(name ?? ""));
    regionsLayer.onRegionClick((id) => {
      if (!this.editing) this.clickedRegion = id;
    });

    let editSelection: RegionLayerHandle | undefined;
    if (isAm) {
      editSelection = addRegionLayer(map, internalRegions, {
        id: "edit-selection",
        interactive: true,
        style: {
          ...outlineStyle,
          selectedFillColor: this.constantsService.colorActiveSelection,
          selectedFillOpacity: this.constantsService.fillOpacityEditSelection,
        },
      });
      map.setLayoutProperty("edit-selection-fill", "visibility", "none");
      map.setLayoutProperty("edit-selection-line", "visibility", "none");
      editSelection.onRegionHover((name) => this.regionName.update(name ?? ""));
      editSelection.onRegionClick((id, ev) => {
        if (this.editing) this.handleEditClick(editSelection!, id, ev);
      });
    }

    return { map, isAm, aggregated, regions: regionsLayer, editSelection };
  }

  /** Region multi-select while editing (ctrl/meta -> level-1, alt -> level-2), mirrors MapService.handleClick. */
  private handleEditClick(editSelection: RegionLayerHandle, id: string, ev: MouseEvent): void {
    const selected = editSelection.getSelected().includes(id);
    if (/Mac|iPod|iPhone|iPad/.test(navigator.platform) ? ev.metaKey : ev.ctrlKey) {
      editSelection.toggle(this.regionsService.getLevel1Regions(id), !selected);
    } else if (ev.altKey) {
      editSelection.toggle(this.regionsService.getLevel2Regions(id), !selected);
    } else {
      editSelection.toggle([id]);
    }
  }

  // --- aggregated-region painting ---

  updateAggregatedRegion(mapObject: PolygonObject): void {
    this.paint(mapObject, this.am, "active");
    this.paint(mapObject, this.pm, "active");
  }

  updateAggregatedRegionAM(mapObject: PolygonObject): void {
    this.paint(mapObject, this.am, "active");
  }

  updateAggregatedRegionPM(mapObject: PolygonObject): void {
    this.paint(mapObject, this.pm, "active");
  }

  selectAggregatedRegion(activeObject?: PolygonObject, comparedObject?: PolygonObject): void {
    this.activeMapObject = activeObject;
    this.comparedMapObject = comparedObject;
    if (activeObject) {
      this.paint(activeObject, this.am, "active");
      this.paint(activeObject, this.pm, "active");
    }
    if (comparedObject) {
      this.paint(comparedObject, this.am, "compared");
      this.paint(comparedObject, this.pm, "compared");
    }
  }

  deselectAggregatedRegion(): void {
    this.selectAggregatedRegion(undefined, undefined);
  }

  resetActiveSelection(): void {
    this.selectAggregatedRegion(undefined, this.comparedMapObject);
  }

  private paint(mapObject: PolygonObject | undefined, side: MapSide | undefined, mode: Mode): void {
    if (!mapObject || !side) return;
    for (const status of [Enums.RegionStatus.suggested, Enums.RegionStatus.saved, Enums.RegionStatus.published]) {
      for (const region of mapObject.getRegionsByStatus(status)) {
        side.aggregated.setRegionStyle(region, this.computeStyle(mapObject, region, status, side.isAm, mode));
      }
    }
  }

  private computeStyle(
    mapObject: PolygonObject,
    region: string,
    status: Enums.RegionStatus,
    isAm: boolean,
    mode: Mode,
  ): AggregatedRegionStyle {
    const aboveRating = isAm ? mapObject.getForenoonDangerRatingAbove() : mapObject.getAfternoonDangerRatingAbove();
    const belowRating = isAm ? mapObject.getForenoonDangerRatingBelow() : mapObject.getAfternoonDangerRatingBelow();

    let bulletinElevation = -Infinity;
    if (mapObject instanceof BulletinModel) {
      const elevation = isAm ? mapObject.getForenoonElevation() : mapObject.getAfternoonElevation();
      if (isFinite(elevation)) bulletinElevation = elevation;
    }

    const styleFn =
      mode === "active" && mapObject === this.activeMapObject
        ? (r: string, d: Enums.DangerRating) => this.activeSelectionStyle(r, d, status)
        : mode === "compared" && mapObject === this.comparedMapObject
          ? (r: string, d: Enums.DangerRating) => this.comparedSelectionStyle(r, d, status)
          : (r: string, d: Enums.DangerRating) => this.dangerRatingStyle(r, d, status);

    const above = styleFn(region, aboveRating);
    const below = styleFn(region, belowRating);
    return {
      colorAbove: above.fillColor,
      opacityAbove: above.fillOpacity,
      colorBelow: below.fillColor,
      opacityBelow: below.fillOpacity,
      bulletinElevation,
    };
  }

  resetAggregatedRegions(): void {
    this.am?.aggregated.resetAll();
    this.pm?.aggregated.resetAll();
  }

  resetInternalAggregatedRegions(): void {
    for (const side of [this.am, this.pm]) {
      if (!side) continue;
      const internal = side.aggregated.styledRegions().filter((r) => this.authenticationService.isInternalRegion(r));
      side.aggregated.resetRegions(internal);
    }
  }

  resetAll(): void {
    this.resetActiveSelection();
    this.resetAggregatedRegions();
    this.am?.editSelection?.clear();
  }

  // --- edit selection ---

  editAggregatedRegion(mapObject: PolygonObject): void {
    this.editing = true;
    this.setEditSelectionVisible(true);
    this.am?.editSelection?.setSelected(mapObject.getAllRegions());
  }

  showEditSelection(): void {
    this.editing = true;
    this.setEditSelectionVisible(true);
  }

  discardEditSelection(): void {
    this.am?.editSelection?.clear();
    this.editing = false;
    this.setEditSelectionVisible(false);
  }

  getSelectedRegions(): string[] {
    return this.am?.editSelection?.getSelected() ?? [];
  }

  private setEditSelectionVisible(visible: boolean): void {
    const map = this.am?.map;
    if (!map) return;
    const v = visible ? "visible" : "none";
    for (const layer of ["edit-selection-fill", "edit-selection-line"]) {
      if (map.getLayer(layer)) map.setLayoutProperty(layer, "visibility", v);
    }
  }

  // --- region click / controls ---

  getClickedRegion(): string {
    const region = this.clickedRegion ?? null;
    this.clickedRegion = undefined;
    return region;
  }

  addAMControl(): void {
    if (!this.am?.map) return;
    this.amControl = new AmPmControl(this.translateService.instant("daytime.earlier"));
    this.am.map.addControl(this.amControl, "bottom-left");
  }

  removeAMControl(): void {
    if (this.amControl && this.am?.map) {
      this.am.map.removeControl(this.amControl);
    }
    this.amControl = undefined;
  }

  removeMaps(): void {
    this.unsync?.();
    this.unsync = undefined;
    this.am?.aggregated.remove();
    this.am?.regions.remove();
    this.am?.editSelection?.remove();
    this.pm?.aggregated.remove();
    this.pm?.regions.remove();
    this.am?.map.remove();
    this.pm?.map.remove();
    this.am = undefined;
    this.pm = undefined;
    this.amControl = undefined;
    this.pmControl = undefined;
    this.editing = false;
    this.clickedRegion = undefined;
    this.activeMapObject = undefined;
    this.comparedMapObject = undefined;
    this.clickCbs = [];
  }

  // --- ported danger-rating style functions (from Leaflet MapService) ---

  private activeSelectionStyle(region: string, dangerRating: Enums.DangerRating, status: Enums.RegionStatus): Fill {
    const c = this.constantsService;
    const fillColor = c.getDangerRatingColor(dangerRating);
    return { fillColor, fillOpacity: this.selectedFillOpacity(region, status) };
  }

  private comparedSelectionStyle(region: string, dangerRating: Enums.DangerRating, status: Enums.RegionStatus): Fill {
    const c = this.constantsService;
    const fillColor = c.getDangerRatingColorMuted(dangerRating);
    return { fillColor, fillOpacity: this.selectedFillOpacity(region, status) };
  }

  private dangerRatingStyle(region: string, dangerRating: Enums.DangerRating, status: Enums.RegionStatus): Fill {
    const c = this.constantsService;
    const own = region.startsWith(this.authenticationService.getActiveRegionId());
    let fillOpacity: number;
    if (own) {
      fillOpacity =
        status === Enums.RegionStatus.suggested ? c.fillOpacityOwnDeselectedSuggested : c.fillOpacityOwnDeselected;
    } else {
      fillOpacity =
        status === Enums.RegionStatus.suggested
          ? c.fillOpacityForeignDeselectedSuggested
          : c.fillOpacityForeignDeselected;
    }
    return { fillColor: c.getDangerRatingColor(dangerRating), fillOpacity };
  }

  private selectedFillOpacity(region: string, status: Enums.RegionStatus): number {
    const c = this.constantsService;
    const own = region.startsWith(this.authenticationService.getActiveRegionId());
    if (own) {
      return status === Enums.RegionStatus.suggested ? c.fillOpacityOwnSelectedSuggested : c.fillOpacityOwnSelected;
    }
    return status === Enums.RegionStatus.suggested
      ? c.fillOpacityForeignSelectedSuggested
      : c.fillOpacityForeignSelected;
  }
}
