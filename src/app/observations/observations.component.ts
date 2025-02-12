import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  TemplateRef,
  viewChild,
  inject,
} from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { RegionProperties, RegionsService } from "../providers/regions-service/regions.service";
import { BaseMapService } from "../providers/map-service/base-map.service";
import {
  GenericObservation,
  genericObservationSchema,
  ImportantObservation,
  ObservationSource,
  ObservationTableRow,
  ObservationType,
  PersonInvolvement,
  toGeoJSON,
} from "./models/generic-observation.model";
import { saveAs } from "file-saver";
import { ObservationGalleryComponent } from "./observation-gallery.component";
import { ObservationTableComponent } from "./observation-table.component";
import { ObservationEditorComponent } from "./observation-editor.component";
import { ObservationFilterService } from "./observation-filter.service";
import { ObservationMarkerService } from "./observation-marker.service";
import { CommonModule } from "@angular/common";
import { type Observable, type Subscription } from "rxjs";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { ObservationChartComponent } from "./observation-chart.component";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";
import { FormsModule } from "@angular/forms";
import { AlbinaObservationsService } from "./observations.service";
import { LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import { augmentRegion } from "../providers/regions-service/augmentRegion";
import "bootstrap";
import { AvalancheProblem, DangerPattern, SnowpackStability } from "../enums/enums";
import { observationFilters } from "./filter-selection-data-data";
import {
  ObservationMarkerWeatherStationService,
  WeatherStationParameter,
} from "./observation-marker-weather-station.service";
import { ObservationMarkerWebcamService } from "./observation-marker-webcam.service";
import { ObservationMarkerObserverService } from "./observation-marker-observer.service";
import Split from "split.js";
import { HttpErrorResponse } from "@angular/common/http";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";

export interface MultiselectDropdownData {
  id: string;
  name: string;
}

class ObservationData {
  loading: Subscription | undefined = undefined;
  show = false;
  all = [] as GenericObservation[];
  filtered = [] as GenericObservation[];
  layer = new LayerGroup();

  constructor(
    private onObservationClick: (observation: GenericObservation, doShow?: boolean) => void,
    private filter: ObservationFilterService<any> | undefined,
    private markerService: {
      createMarker(observation: GenericObservation, isHighlighted?: boolean): Marker | undefined;
    },
    private forEachObservation0: (observation: GenericObservation) => void = () => {},
    private applyLocalFilter0: () => void = () => {},
  ) {}

  toggle(map: LeafletMap) {
    if (this.show) {
      this.show = false;
      map.removeLayer(this.layer);
    } else {
      this.show = true;
      map.addLayer(this.layer);
    }
  }

  async loadFrom(observable: Observable<GenericObservation>, observationSearch: string) {
    this.layer.clearLayers();
    this.all = [];
    this.loading?.unsubscribe();
    await new Promise<undefined>((resolve) => {
      this.loading = observable.subscribe({
        next: (observation) => this.forEachObservation(observation),
        complete: () => resolve(undefined),
        error: (e) => console.error(e),
      });
    });
    this.applyLocalFilter(observationSearch);
    this.all.sort((o1, o2) => (+o1.eventDate === +o2.eventDate ? 0 : +o1.eventDate < +o2.eventDate ? 1 : -1));
    this.loading = undefined;
  }

  forEachObservation(observation: GenericObservation) {
    try {
      genericObservationSchema.partial().parse(observation);
    } catch (err) {
      console.warn("Observation does not match schema", observation, err);
    }
    augmentRegion(observation);
    this.forEachObservation0(observation);
    this.all.push(observation);
  }

  applyLocalFilter(observationSearch: string) {
    this.layer.clearLayers();
    this.filtered = this.all
      .filter((o) => this.filter.isHighlighted(o) || this.filter.isSelected(o))
      .filter(
        (o) =>
          !observationSearch ||
          [o.authorName, o.locationName, o.content].some((text) =>
            (text || "").toLocaleLowerCase().includes(observationSearch.toLocaleLowerCase()),
          ),
      );
    this.filtered.forEach((observation) => {
      this.markerService
        .createMarker(observation, this.filter.isHighlighted(observation))
        ?.on("click", () => this.onObservationClick(observation))
        ?.addTo(this.layer);
    });
    this.applyLocalFilter0();
  }
}

@Component({
  standalone: true,
  imports: [
    ObservationChartComponent,
    BsDatepickerModule,
    CommonModule,
    FormsModule,
    ObservationEditorComponent,
    ObservationGalleryComponent,
    ObservationTableComponent,
    TranslateModule,
    NgxMousetrapDirective,
  ],
  templateUrl: "observations.component.html",
})
export class ObservationsComponent implements AfterContentInit, AfterViewInit, OnDestroy {
  filter = inject<ObservationFilterService<GenericObservation>>(ObservationFilterService);
  markerService = inject<ObservationMarkerService<GenericObservation>>(ObservationMarkerService);
  markerWeatherStationService = inject<ObservationMarkerWeatherStationService<GenericObservation>>(
    ObservationMarkerWeatherStationService,
  );
  private markerWebcamService =
    inject<ObservationMarkerWebcamService<GenericObservation>>(ObservationMarkerWebcamService);
  private markerObserverService = inject<ObservationMarkerObserverService<GenericObservation>>(
    ObservationMarkerObserverService,
  );
  translateService = inject(TranslateService);
  protected observationsService = inject(AlbinaObservationsService);
  private sanitizer = inject(DomSanitizer);
  private regionsService = inject(RegionsService);
  mapService = inject(BaseMapService);
  modalService = inject(BsModalService);

  public layout: "map" | "table" | "chart" | "gallery" = "map";
  public layoutFilters = true;
  public observationSearch = "";

  public readonly data = {
    observations: new ObservationData(
      this.onObservationClick.bind(this),
      this.filter,
      this.markerService,
      (observation) => {
        if (!this.filter.inDateRange(observation.eventDate)) {
          return;
        }
        if (observation.$source === ObservationSource.AvalancheWarningService) {
          observation = this.parseObservation(observation);
          augmentRegion(observation);
        }
        if (observation.region) {
          observation.regionLabel = observation.region + " " + this.regionsService.getRegionName(observation.region);
        }
      },
      () => {
        this.filter.filterSelectionData.forEach((filter) =>
          filter.buildChartsData(this.markerService.markerClassify, this.data.observations.all, (o) =>
            this.filter.isSelected(o),
          ),
        );
      },
    ),
    observers: new ObservationData(this.onObservationClick.bind(this), this.filter, this.markerObserverService),
    weatherStations: new ObservationData(
      this.onObservationClick.bind(this),
      this.filter,
      this.markerWeatherStationService,
    ),
    webcams: new ObservationData(this.onObservationClick.bind(this), this.filter, this.markerWebcamService),
  };

  public observationPopup: {
    observation: GenericObservation;
    table: ObservationTableRow[];
    iframe: SafeResourceUrl;
    imgUrls: SafeResourceUrl[];
    imgIndex: number;
  };
  public allRegions: RegionProperties[];
  public allSources: MultiselectDropdownData[];
  public observationEditor: {
    observation: GenericObservation;
    saving: boolean;
    modalRef: BsModalRef;
    messages: any[];
  } = { observation: undefined, saving: false, modalRef: undefined, messages: [] };
  readonly mapDiv = viewChild<ElementRef<HTMLDivElement>>("observationsMap");
  readonly observationTableComponent = viewChild<ObservationTableComponent>("observationTable");
  readonly observationPopupTemplate = viewChild<TemplateRef<any>>("observationPopupTemplate");
  readonly observationEditorTemplate = viewChild<TemplateRef<any>>("observationEditorTemplate");

  constructor() {
    this.filter.filterSelectionData = observationFilters((message) => this.translateService.instant(message));
    this.filter.parseActivatedRoute();
    this.markerService.markerClassify = this.filter.filterSelectionData.find((filter) => filter.key === "stability");
  }

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

  async ngAfterViewInit() {
    await this.initMap();
    if (window.matchMedia("(min-width: 769px)").matches) {
      Split([".layout-left", ".layout-right"], { onDragEnd: () => this.mapService.map.invalidateSize() });
    }
  }

  async loadObservationsAndWeatherStations() {
    this.filter.updateDateInURL();
    this.data.observations.loadFrom(this.observationsService.getGenericObservations(), this.observationSearch);
    this.data.weatherStations.loadFrom(this.observationsService.getWeatherStations(), this.observationSearch);
  }

  private async initMap() {
    const map = await this.mapService.initMaps(this.mapDiv().nativeElement);

    this.data.observations.toggle(this.map);
    if (!this.filter.startDate || !this.filter.endDate) {
      this.filter.days = 7;
    }
    this.loadObservationsAndWeatherStations();
    this.data.observers.loadFrom(this.observationsService.getObservers(), this.observationSearch);
    this.data.weatherStations.loadFrom(this.observationsService.getWeatherStations(), this.observationSearch);
    this.data.webcams.loadFrom(this.observationsService.getGenericWebcams(), this.observationSearch);

    map.on("click", () => {
      this.filter.regions = Object.fromEntries(this.mapService.getSelectedRegions().map((r) => [r, true]));
      this.applyLocalFilter();
    });

    const resizeObserver = new ResizeObserver(() => {
      this.mapService.map?.invalidateSize();
    });
    resizeObserver.observe(this.mapDiv().nativeElement);
  }

  get map() {
    return this.mapService.map;
  }

  ngOnDestroy() {
    Object.values(this.data).forEach(({ layer }) => layer.clearLayers());
    this.mapService.resetAll();
    this.mapService.removeMaps();
  }

  onRegionsDropdownSelect() {
    this.mapService.clickRegion(this.filter.regions);
    this.applyLocalFilter();
  }

  onSourcesDropdownSelect() {
    this.applyLocalFilter();
  }

  newObservation() {
    const observation = {
      $source: ObservationSource.AvalancheWarningService,
      $type: ObservationType.SimpleObservation,
      $allowEdit: true,
    } satisfies GenericObservation;
    this.observationEditor.observation = observation;
    this.showObservationEditor();
  }

  editObservation(observation: GenericObservation) {
    if (observation.$source === ObservationSource.AvalancheWarningService) {
      observation.$allowEdit = true; // observations created by AWS are always editable
    }
    this.observationEditor.observation = observation;
    this.showObservationEditor();
  }

  showObservationEditor() {
    this.observationEditor.modalRef = this.modalService.show(this.observationEditorTemplate(), {
      class: "modal-fullscreen",
    });
  }

  hideObservationEditor() {
    this.observationEditor.modalRef.hide();
    this.observationEditor.modalRef = undefined;
  }

  async saveObservation() {
    const { observation } = this.observationEditor;
    try {
      this.observationEditor.saving = true;
      await this.observationsService.postObservation(observation).toPromise();
      this.loadObservationsAndWeatherStations();
      this.hideObservationEditor();
    } catch (error) {
      this.reportError(error);
    } finally {
      this.observationEditor.saving = false;
    }
  }

  async deleteObservation() {
    const { observation } = this.observationEditor;
    if (!window.confirm(this.translateService.instant("observations.button.deleteConfirm"))) {
      return;
    }
    try {
      this.observationEditor.saving = true;
      await this.observationsService.deleteObservation(observation);
      this.loadObservationsAndWeatherStations();
      this.hideObservationEditor();
    } catch (error) {
      this.reportError(error);
    } finally {
      this.observationEditor.saving = false;
    }
  }

  discardObservation() {
    this.observationEditor.observation = undefined;
    this.hideObservationEditor();
  }

  private reportError(error: HttpErrorResponse) {
    this.observationEditor.messages.push(error.message);
  }

  selectParameter(parameter: WeatherStationParameter) {
    if (this.markerWeatherStationService.weatherStationLabel === parameter) {
      this.markerWeatherStationService.weatherStationLabel = undefined;
    } else {
      this.markerWeatherStationService.weatherStationLabel = parameter;
    }
    this.applyLocalFilter();
  }

  parseObservation(observation: GenericObservation): GenericObservation {
    const avalancheProblems = Object.values(AvalancheProblem);
    const dangerPatterns = Object.values(DangerPattern);
    const stabilities = Object.values(SnowpackStability);
    const importantObservations = Object.values(ImportantObservation);

    const matches = [...(observation.content ?? "").matchAll(/#\S*(?=\s|$)/g)].map((el) => el[0].replace("#", ""));
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

  exportObservations() {
    const collection: GeoJSON.FeatureCollection = toGeoJSON(this.data.observations.filtered);
    const json = JSON.stringify(collection, undefined, 2);
    const blob = new Blob([json], { type: "application/geo+json" });
    saveAs(blob, "observations.geojson");
  }

  applyLocalFilter() {
    Object.values(this.data).forEach((data) => data.applyLocalFilter(this.observationSearch));
  }

  onObservationClick(observation: GenericObservation, doShow = true, imgIndex = 0): void {
    if (observation.$externalURL) {
      const iframe = this.sanitizer.bypassSecurityTrustResourceUrl(observation.$externalURL);
      this.observationPopup = { observation, table: [], iframe, imgUrls: undefined, imgIndex };
    } else if (observation.$externalImgs) {
      const imgUrls = observation.$externalImgs.map((img) => this.sanitizer.bypassSecurityTrustResourceUrl(img));
      this.observationPopup = { observation, table: [], iframe: undefined, imgUrls: imgUrls, imgIndex };
    } else {
      const table: ObservationTableRow[] = [
        { label: this.translateService.instant("observations.eventDate"), date: observation.eventDate },
        { label: this.translateService.instant("observations.reportDate"), date: observation.reportDate },
        { label: this.translateService.instant("observations.authorName"), value: observation.authorName },
        { label: this.translateService.instant("observations.locationName"), value: observation.locationName },
        { label: this.translateService.instant("observations.elevation"), number: observation.elevation },
        { label: this.translateService.instant("observations.aspect"), value: observation.aspect },
        { label: this.translateService.instant("observations.comment"), value: observation.content },
        ...(Array.isArray(observation.$extraDialogRows) ? observation.$extraDialogRows : []),
      ] satisfies ObservationTableRow[];
      this.observationPopup = { observation, table, iframe: undefined, imgUrls: undefined, imgIndex };
    }
    if (doShow) {
      this.modalService.show(this.observationPopupTemplate(), { class: "modal-fullscreen" });
    }
  }

  changeObservation(change: -1 | 1) {
    if (!this.observationPopup?.observation) {
      return;
    }
    let observation = this.observationPopup?.observation;
    const observations = Object.values(this.data)
      .flatMap((d) => d.all)
      .filter((o) => o.$source === observation.$source && o.$type === observation.$type);
    let index = observations.indexOf(observation);
    if (index < 0) {
      return;
    }
    if (change === 1) {
      index += 1;
      while (observation?.$externalImgs && observation.$externalImgs?.[0] === observations[index].$externalImgs?.[0]) {
        index += 1;
      }
      observation = observations[index];
      if (observation) {
        this.onObservationClick(observation, false, 0);
      }
    } else if (change === -1) {
      index -= 1;
      while (observation?.$externalImgs && observation.$externalImgs?.[0] === observations[index].$externalImgs?.[0]) {
        index -= 1;
      }
      observation = observations[index];
      if (observation) {
        this.onObservationClick(observation, false, 0);
      }
    }
  }
}
