import {
  Component,
  AfterContentInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
  TemplateRef,
} from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { RegionsService, RegionProperties } from "../providers/regions-service/regions.service";
import { BaseMapService } from "../providers/map-service/base-map.service";

import {
  GenericObservation,
  ObservationSource,
  ObservationTableRow,
  toGeoJSON,
  LocalFilterTypes,
  ImportantObservation,
  WeatherStationParameter,
  genericObservationSchema,
  ObservationType,
} from "./models/generic-observation.model";

import { saveAs } from "file-saver";

import { ObservationGalleryComponent } from "./observation-gallery.component";
import { ObservationTableComponent } from "./observation-table.component";
import { GenericFilterToggleData, ObservationFilterService, OutputDataset } from "./observation-filter.service";
import { ObservationMarkerService } from "./observation-marker.service";
import { CommonModule } from "@angular/common";
import { onErrorResumeNext, type Observable } from "rxjs";
import { BsModalService } from "ngx-bootstrap/modal";
import { ObservationChartComponent } from "./observation-chart.component";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";
import { FormsModule } from "@angular/forms";
import { AlbinaObservationsService } from "./observations.service";
import { LayerGroup } from "leaflet";
import { augmentRegion } from "../providers/regions-service/augmentRegion";
import "bootstrap";
import { AvalancheProblem, DangerPattern, SnowpackStability } from "../enums/enums";

export interface MultiselectDropdownData {
  id: string;
  name: string;
}

@Component({
  standalone: true,
  imports: [
    ObservationChartComponent,
    BsDatepickerModule,
    CommonModule,
    FormsModule,
    ObservationGalleryComponent,
    ObservationTableComponent,
    TranslateModule,
  ],
  templateUrl: "observations.component.html",
})
export class ObservationsComponent implements AfterContentInit, AfterViewInit, OnDestroy {
  public loading: Observable<GenericObservation<any>> | undefined = undefined;
  public layout: "map" | "table" | "chart" | "gallery" = "map";
  public layoutFilters = true;
  public observations: GenericObservation[] = [];
  public webcams: GenericObservation[] = [];
  public localWebcams: GenericObservation[] = [];
  public weatherStations: GenericObservation[] = [];
  public localWeatherStations: GenericObservation[] = [];
  public showObservations: boolean = true;
  public showWeatherStations: boolean = false;
  public showWebcams: boolean = false;
  public showObservers: boolean = false;
  public weatherStationsLayerGroup: LayerGroup<any>;
  public observersLayerGroup: LayerGroup<any>;
  public webcamsLayerGroup: LayerGroup<any>;
  public observationsAsOverlay: GenericObservation[] = [];
  public localObservations: GenericObservation[] = [];
  public observationsWithoutCoordinates: number = 0;
  public observationPopup: {
    observation: GenericObservation;
    table: ObservationTableRow[];
    iframe: SafeResourceUrl;
    imgUrls: SafeResourceUrl[];
  };

  public allRegions: RegionProperties[];
  public allSources: MultiselectDropdownData[];
  public barCharts: LocalFilterTypes[] = [
    LocalFilterTypes.Days,
    LocalFilterTypes.Elevation,
    LocalFilterTypes.Stability,
    LocalFilterTypes.ObservationType,
    LocalFilterTypes.ImportantObservation,
    LocalFilterTypes.AvalancheProblem,
    LocalFilterTypes.DangerPattern,
  ];
  public chartsData: Record<LocalFilterTypes, OutputDataset> = {
    Elevation: {} as OutputDataset,
    Aspect: {} as OutputDataset,
    AvalancheProblem: {} as OutputDataset,
    Stability: {} as OutputDataset,
    ObservationType: {} as OutputDataset,
    ImportantObservation: {} as OutputDataset,
    DangerPattern: {} as OutputDataset,
    Days: {} as OutputDataset,
  };
  @ViewChild("observationsMap") mapDiv: ElementRef<HTMLDivElement>;
  @ViewChild("observationTable")
  observationTableComponent: ObservationTableComponent;
  @ViewChild("observationPopupTemplate") observationPopupTemplate: TemplateRef<any>;

  public get LocalFilterTypes(): typeof LocalFilterTypes {
    return LocalFilterTypes;
  }

  constructor(
    public filter: ObservationFilterService,
    public markerService: ObservationMarkerService,
    public translateService: TranslateService,
    private observationsService: AlbinaObservationsService,
    private sanitizer: DomSanitizer,
    private regionsService: RegionsService,
    public mapService: BaseMapService,
    public modalService: BsModalService,
  ) {}

  async ngAfterContentInit() {
    this.allRegions = (await this.regionsService.getRegionsEuregio()).features
      .map((f) => f.properties)
      .sort((r1, r2) => r1.id.localeCompare(r2.id));
    this.allSources = Object.keys(ObservationSource)
      .filter(
        (key) =>
          key !== ObservationSource.FotoWebcamsEU &&
          key !== ObservationSource.Panomax &&
          key !== ObservationSource.RasBzIt &&
          key !== ObservationSource.PanoCloud &&
          key !== ObservationSource.Observer,
      )
      .map((key) => ({ id: key, name: key }));
  }

  ngAfterViewInit() {
    this.initMap();
  }

  private async initMap() {
    const map = await this.mapService.initMaps(this.mapDiv.nativeElement, (o) => this.onObservationClick(o));
    if (this.filter.startDate && this.filter.endDate) {
      this.loadObservations({});
    } else {
      this.loadObservations({ days: 7 });
    }
    this.observationsAsOverlay = [];

    this.observersLayerGroup = this.loadObservers();
    this.weatherStationsLayerGroup = this.loadWeatherStations();
    this.webcamsLayerGroup = this.loadWebcams();

    map.on("click", () => {
      this.filter.regions = Object.fromEntries(this.mapService.getSelectedRegions().map((r) => [r, true]));
      this.applyLocalFilter(this.markerService.markerClassify);
    });

    const resizeObserver = new ResizeObserver(() => {
      this.mapService.map?.invalidateSize();
    });
    resizeObserver.observe(this.mapDiv.nativeElement);
  }

  toggleObservations() {
    if (this.showObservations) {
      this.showObservations = false;
      Object.keys(ObservationType).forEach((type) =>
        this.mapService.map.removeLayer(this.mapService.observationTypeLayers[type]),
      );
    } else {
      this.showObservations = true;
      Object.keys(ObservationType).forEach((type) =>
        this.mapService.map.addLayer(this.mapService.observationTypeLayers[type]),
      );
    }
  }

  toggleWeatherStations() {
    if (this.showWeatherStations) {
      this.showWeatherStations = false;
      this.mapService.map.removeLayer(this.weatherStationsLayerGroup);
    } else {
      this.showWeatherStations = true;
      this.mapService.map.addLayer(this.weatherStationsLayerGroup);
    }
  }

  toggleObservers() {
    if (this.showObservers) {
      this.showObservers = false;
      this.mapService.map.removeLayer(this.observersLayerGroup);
    } else {
      this.showObservers = true;
      this.mapService.map.addLayer(this.observersLayerGroup);
    }
  }

  toggleWebcams() {
    if (this.showWebcams) {
      this.showWebcams = false;
      this.mapService.map.removeLayer(this.webcamsLayerGroup);
    } else {
      this.showWebcams = true;
      this.mapService.map.addLayer(this.webcamsLayerGroup);
    }
  }

  ngOnDestroy() {
    this.mapService.resetAll();
    this.mapService.removeMaps();
  }

  onRegionsDropdownSelect() {
    this.mapService.clickRegion(this.filter.regions);
    this.applyLocalFilter(this.markerService.markerClassify);
  }

  onSourcesDropdownSelect() {
    this.applyLocalFilter(this.markerService.markerClassify);
  }

  newObservation() {
    this.layout = "table";
    this.observationTableComponent.newObservation();
  }

  selectParameter(parameter: WeatherStationParameter) {
    this.markerService.weatherStationLabel === parameter
      ? (this.markerService.weatherStationLabel = undefined)
      : (this.markerService.weatherStationLabel = parameter);
    this.applyLocalFilter(this.markerService.markerClassify);
  }

  parseObservation(observation: GenericObservation): GenericObservation {
    const avalancheProblems = Object.values(AvalancheProblem);
    const dangerPatterns = Object.values(DangerPattern);
    const stabilities = Object.values(SnowpackStability);
    const importantObservations = Object.values(ImportantObservation);

    const matches = [...observation.content.matchAll(/#\S*(?=\s|$)/g)].map((el) => el[0].replace("#", ""));
    matches.forEach((match) => {
      if (avalancheProblems.includes(match as AvalancheProblem)) {
        if (!observation.avalancheProblems) observation.avalancheProblems = [];
        observation.avalancheProblems.push(match as AvalancheProblem);
      } else if (dangerPatterns.includes(match as DangerPattern)) {
        if (!observation.dangerPatterns) observation.dangerPatterns = [];
        observation.dangerPatterns.push(match as DangerPattern);
      } else if (importantObservations.includes(match as ImportantObservation)) {
        if (!observation.importantObservations) observation.importantObservations = [];
        observation.importantObservations.push(match as ImportantObservation);
      } else if (stabilities.includes(match as SnowpackStability)) {
        observation.stability = match as SnowpackStability;
      }
    });

    console.log(observation);
    return observation;
  }

  loadObservations({ days }: { days?: number } = {}) {
    if (typeof days === "number") {
      this.filter.days = days;
    }
    this.clear();

    this.loading = onErrorResumeNext(
      this.observationsService.getObservations(),
      this.observationsService.getGenericObservations(),
    );
    this.loading
      .forEach((observation) => {
        try {
          genericObservationSchema.parse(observation);
        } catch (err) {
          console.warn("Observation does not match schema", observation, err);
        }
        this.addObservation(observation);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading = undefined;
        this.observations.sort((o1, o2) =>
          +o1.eventDate === +o2.eventDate ? 0 : +o1.eventDate < +o2.eventDate ? 1 : -1,
        );
        this.applyLocalFilter(this.markerService.markerClassify);
      });
  }

  private clear() {
    this.observationsWithoutCoordinates = 0;
    this.observations.length = 0;
    Object.values(this.mapService.observationTypeLayers).forEach((layer) => layer.clearLayers());
  }

  exportObservations() {
    const collection: GeoJSON.FeatureCollection = toGeoJSON(this.observations);
    const json = JSON.stringify(collection, undefined, 2);
    const blob = new Blob([json], { type: "application/geo+json" });
    saveAs(blob, "observations.geojson");
  }

  toggleFilter(data: GenericFilterToggleData = {} as GenericFilterToggleData) {
    if (data?.type && data.data.markerClassify) {
      if (data?.type !== this.markerService.markerClassify) {
        this.markerService.markerClassify = data.type;
      } else {
        this.markerService.markerClassify = undefined;
      }
    } else if (data?.type && data.data.markerLabel) {
      if (data?.type !== this.markerService.markerLabel) {
        this.markerService.markerLabel = data.type;
      } else {
        this.markerService.markerLabel = undefined;
      }
    } else if (data?.type) {
      this.filter.toggleFilter(data.type, data.data);
    }
    this.applyLocalFilter(this.markerService.markerClassify);
  }

  setDate() {
    this.filter.setDateRange();
    this.loadObservations({});
  }

  applyLocalFilter(classifyType: LocalFilterTypes) {
    Object.values(this.mapService.observationTypeLayers).forEach((layer) => layer.clearLayers());
    this.localObservations = this.observations.filter(
      (observation) => this.filter.isHighlighted(observation) || this.filter.isSelected(observation),
    );
    this.localObservations.forEach((observation) => {
      this.markerService
        .createMarker(observation, this.filter.isHighlighted(observation))
        ?.on("click", () => this.onObservationClick(observation))
        ?.addTo(this.mapService.observationTypeLayers[observation.$type]);
    });

    this.localWebcams = this.webcams.filter(
      (observation) => this.filter.isHighlighted(observation) || this.filter.isSelected(observation),
    );

    this.mapService.layers["weather-stations"].clearLayers();
    this.localWeatherStations = this.weatherStations.filter((weatherStation) =>
      this.filter.isWeatherStationSelected(weatherStation),
    );
    this.localWeatherStations.forEach((weatherStation) => {
      const marker = this.markerService
        .createMarker(weatherStation, false)
        ?.on("click", () => this.onObservationClick(weatherStation))
        ?.addTo(this.mapService.layers["weather-stations"]);
    });

    this.buildChartsData(classifyType);
  }

  buildChartsData(classifyType: LocalFilterTypes) {
    for (const type of Object.values(LocalFilterTypes)) {
      this.chartsData[type] = this.filter.toDataset(this.observations, type, classifyType);
    }
  }

  private addObservation(observation: GenericObservation): void {
    if (!this.filter.inDateRange(observation)) {
      return;
    }

    if (observation.$source === ObservationSource.AvalancheWarningService) {
      observation = this.parseObservation(observation);
      augmentRegion(observation);
    }

    if (observation.region) {
      observation.regionLabel = observation.region + " " + this.regionsService.getRegionName(observation.region);
    }

    this.observations.push(observation);

    const marker = this.markerService
      .createMarker(observation)
      ?.on("click", () => this.onObservationClick(observation))
      ?.addTo(this.mapService.observationTypeLayers[observation.$type]);
    if (!marker) {
      this.observationsWithoutCoordinates++;
    }
  }

  private loadWeatherStations(): LayerGroup<any> {
    this.weatherStations = [];
    this.observationsService.getWeatherStations().forEach((w) => {
      augmentRegion(w);
      if (!w.region) return;
      this.weatherStations.push(w);
    });
    return this.mapService.layers["weather-stations"];
  }

  private loadWebcams(): LayerGroup<any> {
    this.webcams = [];
    this.observationsService.getGenericWebcams().forEach((w) => {
      augmentRegion(w);
      if (!w.region) return;
      this.webcams.push(w);
    });
    return this.mapService.layers["webcams"];
  }

  private loadObservers(): LayerGroup<any> {
    this.observationsService.getObservers().forEach((observation) => {
      this.observationsAsOverlay.push(observation);
      this.mapService.addMarker(
        this.markerService.createMarker(observation)?.on("click", () => this.onObservationClick(observation)),
        "observers",
      );
    });
    return this.mapService.layers["observers"];
  }

  onObservationClick(observation: GenericObservation, doShow = true): void {
    if (observation.$externalURL) {
      const iframe = this.sanitizer.bypassSecurityTrustResourceUrl(observation.$externalURL);
      this.observationPopup = { observation, table: [], iframe, imgUrls: undefined };
    } else if (observation.$externalImgs) {
      const imgUrls = observation.$externalImgs.map((img) => this.sanitizer.bypassSecurityTrustResourceUrl(img));
      this.observationPopup = { observation, table: [], iframe: undefined, imgUrls: imgUrls };
    } else {
      const table: ObservationTableRow[] = (
        [
          { label: "observations.eventDate", date: observation.eventDate },
          { label: "observations.reportDate", date: observation.reportDate },
          { label: "observations.authorName", value: observation.authorName },
          { label: "observations.locationName", value: observation.locationName },
          { label: "observations.elevation", number: observation.elevation },
          { label: "observations.aspect", value: observation.aspect },
          { label: "observations.comment", value: observation.content },
          ...(Array.isArray(observation.$extraDialogRows) ? observation.$extraDialogRows : []),
        ] satisfies ObservationTableRow[]
      ).map((row) => ({
        ...row,
        label: row.label.startsWith("observations.") ? this.translateService.instant(row.label) : row.label,
      }));
      this.observationPopup = { observation, table, iframe: undefined, imgUrls: undefined };
    }
    if (doShow) {
      this.modalService.show(this.observationPopupTemplate, { class: "modal-fullscreen" });
    }
  }

  toggleFilters() {
    this.layoutFilters = !this.layoutFilters;
  }

  @HostListener("document:keydown", ["$event"])
  handleKeyBoardEvent(event: KeyboardEvent | { key: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" }) {
    if (!this.observationPopup?.observation) {
      return;
    }
    if (
      event.key !== "ArrowRight" &&
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown"
    ) {
      return;
    }
    let observation = this.observationPopup?.observation;
    const observations = [...this.observations, ...this.observationsAsOverlay].filter(
      (o) => o.$source === observation.$source && o.$type === observation.$type,
    );
    var index = observations.indexOf(observation);
    if (index < 0) {
      return;
    }
    if (event.key === "ArrowRight") {
      index += 1;
      while (observation?.$externalImgs && observation.$externalImgs === observations[index].$externalImgs) {
        index += 1;
      }
      observation = observations[index];
    } else if (event.key === "ArrowLeft") {
      index -= 1;
      while (observation?.$externalImgs && observation.$externalImgs === observations[index].$externalImgs) {
        index -= 1;
      }
      observation = observations[index];
    } else if (observation?.$externalImgs && event.key === "ArrowUp") {
      const image = document.getElementById("observationImage") as HTMLImageElement;
      const index = observation?.$externalImgs.findIndex((img) => img == image.src);
      if (index > 0) {
        image.src = observation?.$externalImgs[index - 1];
      }
    } else if (observation?.$externalImgs && event.key === "ArrowDown") {
      const image = document.getElementById("observationImage") as HTMLImageElement;
      const index = observation?.$externalImgs.findIndex((img) => img == image.src);
      if (observation?.$externalImgs.length <= index - 1) {
        image.src = observation?.$externalImgs[index + 1];
      }
    }
    if (observation) {
      this.onObservationClick(observation, false);
    }
  }
}
