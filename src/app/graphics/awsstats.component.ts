import "@albina-euregio/linea/aws-stats";
import { FeatureCollectionSchema as FeatureCollectionSchema } from "@albina-euregio/linea/listing";
import { FeatureCollectionSchema as LegacyFeatureCollectionSchema } from "@albina-euregio/linea/listing-legacy";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { CircleMarker, CircleMarkerOptions } from "leaflet";
import { firstValueFrom } from "rxjs";

import sources from "../../assets/config/stations.json";
import { environment } from "../../environments/environment";
import { type GenericObservation, toGeoJSON } from "../observations/models/generic-observation.model";
import { BaseMapService } from "../providers/map-service/base-map.service";
import { LineaMapService } from "../providers/map-service/linea-map.service";

type ChartType =
  | "aws-observations"
  | "aws-danger-rating"
  | "aws-danger-rating-altitude"
  | "aws-avalanche-activity-index";

@Component({
  selector: "app-awsstats",
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: "./awsstats.component.html",
  styleUrls: ["./awsstats.component.scss"],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AwsstatsComponent implements AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  protected mapService = inject(BaseMapService);
  protected stationsMapService = inject(LineaMapService);

  @ViewChild("regionMapHost", { static: false })
  private regionMapHost?: ElementRef<HTMLElement>;
  @ViewChild("stationMapHost", { static: false })
  private stationMapHost?: ElementRef<HTMLElement>;
  @ViewChild("wrapperHost", { static: false })
  private wrapperHost?: ElementRef<HTMLElement>;

  protected startDate = this.toDateInputValue(this.shiftDays(new Date(), -7));
  protected endDate = this.toDateInputValue(new Date());
  protected wrapperStartDate = "2026-03-10";
  protected wrapperEndDate = "2026-03-17";
  protected observationsUrl = "";
  protected showWrapper = false;
  protected loading = false;
  protected errorMessage = "";
  protected selectedMicroRegions: string[] = [];
  protected selectedStationId = "";
  protected showPrecipitationOnly = false;
  protected chartTypeSelection: Record<ChartType, boolean> = {
    "aws-observations": true,
    "aws-danger-rating": false,
    "aws-danger-rating-altitude": false,
    "aws-avalanche-activity-index": false,
  };

  private readonly stationMarkers: Record<string, CircleMarker> = {};
  readonly stationById = new Map<string, StationFeature>();
  private readonly defaultStationSrc = "https://api.avalanche.report/lawine/grafiken/smet/winter/AXLIZ1.smet.gz";
  private isDestroyed = false;

  async ngAfterViewInit() {
    this.isDestroyed = false;
    await Promise.allSettled([this.initRegionMap(), this.initStationMap()]);
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.revokeObservationsUrl();
    this.mapService.removeMaps();
    this.stationsMapService.removeMaps();
  }

  protected setLastDays(days: number) {
    this.startDate = this.toDateInputValue(this.shiftDays(new Date(), -days));
    this.endDate = this.toDateInputValue(new Date());
  }

  protected clearSelectedRegions() {
    this.selectedMicroRegions = [];
    this.mapService.overlayMaps?.editSelection?.clearSelectedRegions();
    this.mapService.overlayMaps?.editSelection?.updateEditSelection();
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected clearSelectedStation() {
    if (!this.selectedStationId) return;
    const prev = this.stationMarkers[this.selectedStationId];
    const station = this.stationById.get(this.selectedStationId);
    prev?.setStyle(this.getStationMarkerOptions(false, station?.hasPsum ?? false));
    this.selectedStationId = "";
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected togglePrecipitationFilter() {
    this.showPrecipitationOnly = !this.showPrecipitationOnly;
    this.applyStationVisibilityFilter();
  }

  private applyStationVisibilityFilter() {
    for (const [id, marker] of Object.entries(this.stationMarkers)) {
      const station = this.stationById.get(id);
      const shouldShow = !this.showPrecipitationOnly || station?.hasPsum;
      if (shouldShow && !this.stationsMapService.stationLayer.hasLayer(marker)) {
        marker.addTo(this.stationsMapService.stationLayer);
      } else if (!shouldShow && this.stationsMapService.stationLayer.hasLayer(marker)) {
        this.stationsMapService.stationLayer.removeLayer(marker);
      }
    }
  }

  protected get selectedStationLabel(): string {
    if (!this.selectedStationId) return "none";
    const station = this.stationById.get(this.selectedStationId);
    if (!station) return this.selectedStationId;
    return station.shortName || station.name || station.id;
  }

  protected async updateObservations() {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = "Start date and end date are required.";
      return;
    }

    if (this.startDate > this.endDate) {
      this.errorMessage = "Start date must be before or equal to end date.";
      return;
    }

    this.loading = true;
    this.errorMessage = "";
    try {
      this.showWrapper = false;
      const url = environment.apiBaseUrl + "../api_ext/observations";
      const params = this.getObservationDateRangeParams(this.startDate, this.endDate);
      const observations = await firstValueFrom(this.http.get<GenericObservation[]>(url, { params }));
      const collection: GeoJSON.FeatureCollection = toGeoJSON(observations ?? []);
      const blob = new Blob([JSON.stringify(collection, undefined, 2)], { type: "application/geo+json" });
      this.revokeObservationsUrl();
      this.wrapperStartDate = this.startDate;
      this.wrapperEndDate = this.endDate;
      this.observationsUrl = URL.createObjectURL(blob);
      this.showWrapper = true;
      this.mountWrapper();
    } catch (error) {
      this.revokeObservationsUrl();
      this.showWrapper = false;
      this.errorMessage = "Failed to load observations for selected date range.";
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  private revokeObservationsUrl() {
    if (!this.observationsUrl) return;
    URL.revokeObjectURL(this.observationsUrl);
    this.observationsUrl = "";
    this.showWrapper = false;
    this.wrapperHost?.nativeElement.replaceChildren();
  }

  private toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private shiftDays(date: Date, days: number): Date {
    const shifted = new Date(date);
    shifted.setDate(shifted.getDate() + days);
    return shifted;
  }

  private getObservationDateRangeParams(startDate: string, endDate: string) {
    const start = new Date(`${startDate}T01:00:00`);
    const end = new Date(`${endDate}T23:59:59`);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }

  private mountWrapper() {
    if (!this.wrapperHost || !this.observationsUrl || !this.wrapperStartDate || !this.wrapperEndDate) return;

    const host = this.wrapperHost.nativeElement;
    host.replaceChildren();
    const wrapper = document.createElement("aws-stats-wrapper");
    wrapper.setAttribute("chart-type", this.getSelectedChartTypesValue());
    wrapper.setAttribute("observations", this.observationsUrl);
    wrapper.setAttribute("stationsrc", this.getSelectedStationSrc());
    wrapper.setAttribute("start-date", this.wrapperStartDate);
    wrapper.setAttribute("end-date", this.wrapperEndDate);
    wrapper.setAttribute("bulletin-filter-micro-region", this.getBulletinFilterMicroRegionValue());

    host.appendChild(wrapper);
  }

  protected setChartType(chartType: ChartType, checked: boolean) {
    if (checked && chartType === "aws-danger-rating" && this.selectedMicroRegions.length === 0) return;
    if (checked && chartType === "aws-danger-rating-altitude" && this.selectedMicroRegions.length !== 1) return;

    this.chartTypeSelection[chartType] = checked;

    if (this.getSelectedChartTypes().length && this.showWrapper) {
      this.mountWrapper();
    }
  }

  private getSelectedChartTypesValue(): string {
    const selected = this.getSelectedChartTypes();
    return selected.length ? selected.join(",") : "aws-observations";
  }

  private getSelectedChartTypes(): ChartType[] {
    return (Object.keys(this.chartTypeSelection) as ChartType[]).filter((key) => this.chartTypeSelection[key]);
  }

  private getBulletinFilterMicroRegionValue(): string {
    return this.selectedMicroRegions.length
      ? JSON.stringify(this.normalizeSelectedMicroRegions(this.selectedMicroRegions))
      : "";
  }

  private normalizeSelectedMicroRegions(regions: string[]): string[] {
    return [...new Set((regions ?? []).filter(Boolean))];
  }

  private async initRegionMap() {
    if (!this.regionMapHost?.nativeElement) return;
    try {
      const host = this.regionMapHost.nativeElement;
      this.mapService.removeMaps();
      const map = await this.mapService.initMaps(host);
      this.mapService.overlayMaps?.editSelection?.setSelectedRegions(this.selectedMicroRegions);
      this.mapService.overlayMaps?.editSelection?.updateEditSelection();
      this.scheduleMapInvalidate(map, () => this.mapService.map === map);
      map.on("click", () => {
        this.selectedMicroRegions = this.normalizeSelectedMicroRegions(this.mapService.getSelectedRegions());
        if (this.showWrapper) {
          this.mountWrapper();
        }
      });
    } catch (error) {
      console.error("Failed to initialize region map:", error);
    }
  }

  private async initStationMap() {
    if (!this.stationMapHost?.nativeElement) return;
    try {
      const host = this.stationMapHost.nativeElement;
      this.stationsMapService.removeMaps();
      const map = await this.stationsMapService.initMaps(host);
      await this.loadStationMarkers();
      this.scheduleMapInvalidate(map, () => this.stationsMapService.map === map);
    } catch (error) {
      console.error("Failed to initialize station map:", error);
    }
  }

  private scheduleMapInvalidate(map: { invalidateSize: (animate?: boolean) => void }, isActive: () => boolean) {
    const safeInvalidate = () => {
      if (this.isDestroyed || !isActive()) return;
      try {
        map.invalidateSize(true);
      } catch {
        console.debug("Map already removed");
      }
    };
    requestAnimationFrame(safeInvalidate);
  }

  private async loadStationMarkers() {
    this.stationsMapService.stationLayer.clearLayers();
    this.stationById.clear();
    for (const k of Object.keys(this.stationMarkers)) {
      delete this.stationMarkers[k];
    }

    for (const source of sources) {
      const url = source.stations;
      const response = await fetch(url);
      const json = await response.json();
      const searchParams = new URL(url, location.href).searchParams;
      const isLegacy = searchParams.get("v") === "legacy";
      const schema = isLegacy ? LegacyFeatureCollectionSchema : FeatureCollectionSchema;
      const collection = schema.parse(json, { reportInput: true });

      for (const feature of collection.features) {
        if (!new RegExp(source.smetOperators).test(feature.properties.operator)) {
          continue;
        }

        // cheap check... could maybe improved
        const hasPsum = feature.properties.PSUM_6.value != undefined;
        const station: StationFeature = {
          id: feature.id,
          name: feature.properties?.name,
          shortName: feature.properties?.shortName ?? "",
          smetId: feature.properties?.shortName ?? feature.id,
          smet: source.smet,
          hasPsum,
        };
        this.stationById.set(station.id, station);

        const marker = new CircleMarker(
          { lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] },
          this.getStationMarkerOptions(false, hasPsum),
        ).addTo(this.stationsMapService.stationLayer);

        marker.bindTooltip(`${station.name || station.id}`);
        marker.on("click", () => this.selectStation(station.id));
        this.stationMarkers[station.id] = marker;
      }
    }
  }

  private selectStation(id: string) {
    if (this.selectedStationId === id) return;
    const prev = this.stationMarkers[this.selectedStationId];
    const prevStation = this.stationById.get(this.selectedStationId);
    prev?.setStyle(this.getStationMarkerOptions(false, prevStation?.hasPsum ?? false));
    this.selectedStationId = id;
    const newStation = this.stationById.get(id);
    this.stationMarkers[id]?.setStyle(this.getStationMarkerOptions(true, newStation?.hasPsum ?? false));
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  private getStationMarkerOptions(selected: boolean, psum: boolean): CircleMarkerOptions {
    return {
      pane: "markerPane",
      radius: 7,
      fillColor: selected ? "#d62828" : "#1d4ed8",
      color: psum ? "#f59e0b" : "black",
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
    };
  }

  protected getSelectedStationSrc(): string {
    if (!this.selectedStationId) return this.defaultStationSrc;
    const station = this.stationById.get(this.selectedStationId);
    if (!station) return this.defaultStationSrc;
    const template = station.smet[1] || station.smet[0] || "";
    const url = template ? template.replace(/\{id\}/g, station.smetId) : "";
    return url || this.defaultStationSrc;
  }
}

interface StationFeature {
  id: string;
  name: string;
  shortName: string;
  smetId: string;
  smet: string[];
  hasPsum: boolean;
}
