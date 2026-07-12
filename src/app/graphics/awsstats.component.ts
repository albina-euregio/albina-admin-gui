import "@albina-euregio/linea/aws-stats";
import {
  CONFIGURED_PLOTS,
  type AwsstatsDatatype,
  type AwsstatsPlotConfig,
} from "@albina-euregio/linea/aws-stats-plot-config";
import { Feature } from "@albina-euregio/linea/listing";
import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { TooltipModule } from "ngx-bootstrap/tooltip";
import { lastValueFrom } from "rxjs";

import { StationPoint } from "../map/station-layer";
import { AlbinaObservationsService } from "../observations/observations.service";
import { BlogService } from "../providers/blog-service/blog.service";
import { GraphicsService } from "./graphics.service";
import { RegionMapService } from "./region-map.service";
import { StationMapService } from "./station-map.service";

const AVAILABLE_AWSSTATS_CHART_TYPES = CONFIGURED_PLOTS.awsstats.map((c) => c.id);

@Component({
  selector: "app-awsstats",
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, TooltipModule],
  providers: [GraphicsService, BlogService, RegionMapService, StationMapService, AlbinaObservationsService],
  templateUrl: "./awsstats.component.html",
  styleUrls: ["./awsstats.component.scss"],
  changeDetection: ChangeDetectionStrategy.Eager,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AwsstatsComponent implements AfterViewInit, OnDestroy {
  private observationsService = inject(AlbinaObservationsService);
  private graphicsService = inject(GraphicsService);
  protected mapService = inject(RegionMapService);
  protected stationsMapService = inject(StationMapService);
  protected authentificationService = inject(AuthenticationService);
  private translateService = inject(TranslateService);

  @ViewChild("regionMapHost", { static: false })
  private regionMapHost?: ElementRef<HTMLElement>;
  @ViewChild("stationMapHost", { static: false })
  private stationMapHost?: ElementRef<HTMLElement>;
  @ViewChild("wrapperHost", { static: false })
  private wrapperHost?: ElementRef<HTMLElement>;

  protected startDate = this.toDateInputValue(this.shiftDays(new Date(), -7));
  protected endDate = this.toDateInputValue(new Date());
  protected observationsUrl = "";
  protected bulletins = "[]";
  protected dangerSourceVariants = "[]";
  protected observations = "[]";
  protected showWrapper = false;
  protected loading = false;
  protected pendingLoad = true;
  protected showDateChangeHint = false;
  protected activeQuickRange: "last7" | "last30" | "last90" | "season" | null = null;
  protected errorMessage = "";
  protected selectedMicroRegions: string[] = [];
  protected selectedStationId = "";
  protected showPrecipitationOnly = false;
  protected openTooltipId: string | null = null;
  protected readonly chartConfigs = CONFIGURED_PLOTS.awsstats;
  protected chartTypeSelection: Record<string, boolean> = Object.fromEntries(
    this.chartConfigs.map((c) => [c.id, c.id === "aws-observations"]),
  );

  readonly stationById = new Map<string, Feature>();
  private readonly defaultStationSrc = "https://wiski.tirol.gv.at/lawine/grafiken/smet/winter/AXLIZ1.smet.gz";
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
    this.activeQuickRange = days === 7 ? "last7" : days === 30 ? "last30" : days === 90 ? "last90" : null;
    this.showDateChangeHint = false;
    this.pendingLoad = false;
    this.startDate = this.toDateInputValue(this.shiftDays(new Date(), -days));
    this.endDate = this.toDateInputValue(new Date());
    this.update();
  }

  protected setCurrentSeason() {
    this.activeQuickRange = "season";
    this.showDateChangeHint = false;
    this.pendingLoad = false;
    const { start, end } = this.graphicsService.getCurrentSeason();
    this.startDate = start;
    this.endDate = end;
    this.update();
  }

  protected onDateChanged() {
    this.pendingLoad = true;
    this.showDateChangeHint = true;
    this.activeQuickRange = null;
  }

  protected clearSelectedRegions() {
    this.selectedMicroRegions = [];
    this.mapService.clearSelectedRegions();
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected clearSelectedStation() {
    if (!this.selectedStationId) return;
    this.selectedStationId = "";
    this.renderStations();
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected toggleChartTooltip(event: MouseEvent, chartId: string) {
    event.stopPropagation();
    this.openTooltipId = this.openTooltipId === chartId ? null : chartId;
  }

  protected closeChartTooltips() {
    this.openTooltipId = null;
  }

  protected togglePrecipitationFilter() {
    this.showPrecipitationOnly = !this.showPrecipitationOnly;
    this.renderStations();
  }

  protected get selectedStationLabel(): string {
    if (!this.selectedStationId) return "none";
    const station = this.stationById.get(this.selectedStationId);
    if (!station) return this.selectedStationId;
    return station.properties.shortName || station.properties.name || station.id;
  }

  protected async update() {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = this.translateService.instant("awsstats.error.startDateEndDateRequired");
      return;
    }

    if (this.startDate > this.endDate) {
      this.errorMessage = this.translateService.instant("awsstats.error.startDateBeforeEndDate");
      return;
    }

    this.loading = true;
    this.errorMessage = "";
    try {
      this.showWrapper = false;
      const requiredParams = this.getRequiredParameters();

      // Load observations if needed
      if (requiredParams.has("observations")) {
        const blob = await this.loadObservationsDataBlob();
        this.revokeObservationsUrl();
        this.observationsUrl = URL.createObjectURL(blob);
      }

      // Load bulletins if needed
      if (requiredParams.has("bulletins")) {
        const regionCodes = this.graphicsService.getBulletinRegionCodes();
        const bulletins = await this.graphicsService.loadBulletins(
          this.startDate,
          this.endDate,
          regionCodes,
          this.graphicsService.getBulletinLanguage(),
        );
        this.bulletins = JSON.stringify(bulletins);
      }

      // Load danger source variants if needed
      if (requiredParams.has("danger-source-variants")) {
        const dangerSourceVariants = await this.graphicsService.loadDangerSourceVariants(
          this.startDate,
          this.endDate,
          "AT-07",
        );
        this.dangerSourceVariants = JSON.stringify(dangerSourceVariants);
      }

      this.showWrapper = true;
      this.mountWrapper();
      this.pendingLoad = false;
      this.showDateChangeHint = false;
    } catch (error) {
      this.revokeObservationsUrl();
      this.bulletins = "[]";
      this.dangerSourceVariants = "[]";
      this.observations = "[]";
      this.showWrapper = false;
      this.errorMessage = this.translateService.instant("awsstats.error.failedLoadData");
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  private async loadObservationsDataBlob(): Promise<Blob> {
    const chunks = this.chunkDateRange(this.startDate, this.endDate, 14);
    const allFeatures: GeoJSON.Feature[] = [];

    for (const chunk of chunks) {
      const params = this.getObservationDateRangeParams(chunk.start, chunk.end);
      const collection = await lastValueFrom(this.observationsService.getGenericObservationsGeoJSON(params));

      if (collection?.features && Array.isArray(collection.features)) {
        allFeatures.push(...collection.features);
      }
    }

    const mergedCollection = {
      type: "FeatureCollection",
      features: allFeatures,
    };

    return new Blob([JSON.stringify(mergedCollection)], { type: "application/geo+json" });
  }

  private chunkDateRange(startDate: string, endDate: string, chunkDays = 14): { start: string; end: string }[] {
    const chunks: { start: string; end: string }[] = [];
    const endDateObj = new Date(endDate);
    const currentStart = new Date(startDate);

    while (this.toDateInputValue(currentStart) <= endDate) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + chunkDays - 1);

      if (currentEnd >= endDateObj) {
        chunks.push({
          start: this.toDateInputValue(currentStart),
          end: endDate,
        });
        break;
      }

      chunks.push({
        start: this.toDateInputValue(currentStart),
        end: this.toDateInputValue(currentEnd),
      });

      currentStart.setDate(currentStart.getDate() + chunkDays);
    }

    return chunks;
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
    if (!this.wrapperHost?.nativeElement) return;

    const host = this.wrapperHost.nativeElement;
    host.replaceChildren();

    const wrapper = document.createElement("aws-stats-wrapper");
    wrapper.setAttribute("chart-type", this.getSelectedChartTypesValue());
    wrapper.setAttribute("start-date", this.startDate);
    wrapper.setAttribute("end-date", this.endDate);
    wrapper.setAttribute("filter-micro-region", this.getBulletinFilterMicroRegionValue());

    const requiredParams = this.getRequiredParameters();

    if (requiredParams.has("observations")) {
      wrapper.setAttribute("observations", this.observationsUrl);
    }

    if (requiredParams.has("bulletins")) {
      wrapper.setAttribute("bulletins", this.bulletins);
    }

    if (requiredParams.has("danger-source-variants")) {
      wrapper.setAttribute("danger-source-variants", this.dangerSourceVariants);
    }

    wrapper.setAttribute("stationsrc", this.getSelectedStationSrc());

    host.appendChild(wrapper);
  }

  protected setChartType(chartType: string, checked: boolean) {
    const config = this.getChartConfigById(chartType);
    if (!config) {
      this.chartTypeSelection[chartType] = checked;
      return;
    }

    // Validate microRegion count constraints
    if (checked) {
      if (
        config.microRegionCountRange[0] > this.selectedMicroRegions.length ||
        this.selectedMicroRegions.length > config.microRegionCountRange[1]
      ) {
        return;
      }
    }

    this.chartTypeSelection[chartType] = checked;

    if (this.getSelectedChartTypes().length && this.showWrapper) {
      this.mountWrapper();
    }
  }

  private getSelectedChartConfigs(): AwsstatsPlotConfig[] {
    return this.getSelectedChartTypes()
      .map((id) => this.getChartConfigById(id))
      .filter((config): config is AwsstatsPlotConfig => !!config);
  }

  private getChartConfigById(id: string): AwsstatsPlotConfig | undefined {
    return CONFIGURED_PLOTS.awsstats.find((config: AwsstatsPlotConfig) => config.id === id);
  }

  protected isChartDisabled(config: AwsstatsPlotConfig): boolean {
    if (config.supportsFilteringBy === "none") {
      return false;
    }

    const selectedCount = this.selectedMicroRegions.length;
    const [min, max] = config.microRegionCountRange;
    return selectedCount < min || selectedCount > max;
  }

  private getRequiredParameters(): Set<AwsstatsDatatype> {
    const configs = this.getSelectedChartConfigs();
    const params = new Set<AwsstatsDatatype>();
    configs.forEach((config: AwsstatsPlotConfig) => {
      config.parameters.forEach((param: AwsstatsDatatype) => params.add(param));
    });
    return params;
  }

  private getSelectedChartTypesValue(): string {
    const selected = this.getSelectedChartTypes();
    return selected.length ? selected.join(",") : "aws-observations";
  }

  private getSelectedChartTypes(): string[] {
    return (Object.keys(this.chartTypeSelection) as string[]).filter(
      (key) => this.chartTypeSelection[key] && AVAILABLE_AWSSTATS_CHART_TYPES.includes(key),
    );
  }

  private getBulletinFilterMicroRegionValue(): string {
    return this.selectedMicroRegions.length
      ? JSON.stringify(this.normalizeSelectedMicroRegions(this.selectedMicroRegions))
      : "[]";
  }

  private normalizeSelectedMicroRegions(regions: string[]): string[] {
    return [...new Set((regions ?? []).filter(Boolean))];
  }

  private async initRegionMap() {
    if (!this.regionMapHost?.nativeElement) return;
    try {
      const host = this.regionMapHost.nativeElement;
      this.mapService.removeMaps();
      const map = await this.mapService.initMap(host);
      this.mapService.setSelectedRegions(this.selectedMicroRegions);
      this.scheduleResize(this.mapService, () => this.mapService.map === map);
      this.mapService.onSelectionChange(() => {
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
      const map = await this.stationsMapService.initMap(host);
      this.stationsMapService.onStationClick((id) => this.selectStation(id));
      await this.loadStations();
      this.scheduleResize(this.stationsMapService, () => this.stationsMapService.map === map);
    } catch (error) {
      console.error("Failed to initialize station map:", error);
    }
  }

  private scheduleResize(service: { resize: () => void }, isActive: () => boolean) {
    requestAnimationFrame(() => {
      if (this.isDestroyed || !isActive()) return;
      try {
        service.resize();
      } catch {
        console.debug("Map already removed");
      }
    });
  }

  private async loadStations() {
    this.stationById.clear();
    const stations = await this.graphicsService.loadLineaStations();
    for (const station of stations) {
      this.stationById.set(station.id, station);
    }
    this.renderStations();
  }

  private renderStations() {
    const points: StationPoint[] = [];
    for (const [id, station] of this.stationById) {
      if (this.showPrecipitationOnly && !this.hasPsum(station)) continue;
      points.push({
        id,
        lng: station.geometry.coordinates[0],
        lat: station.geometry.coordinates[1],
        radius: 7,
        fillColor: this.selectedStationId === id ? "#d62828" : "#1d4ed8",
        strokeColor: this.hasPsum(station) ? "#f59e0b" : "black",
        tooltip: station.properties.name || station.id,
      });
    }
    this.stationsMapService.setStations(points);
  }

  private selectStation(id: string) {
    if (this.selectedStationId === id) return;
    this.selectedStationId = id;
    this.renderStations();
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  hasPsum(feature: Feature): boolean {
    return isFinite(feature?.properties?.PSUM_6?.value) ?? false;
  }

  protected getSelectedStationSrc(): string {
    if (!this.selectedStationId) return this.defaultStationSrc;
    return this.stationById.get(this.selectedStationId).properties.dataURLs[1];
  }
}
