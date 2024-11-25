import {
  Component,
  AfterViewInit,
  ElementRef,
  OnDestroy,
  HostListener,
  AfterContentInit,
  TemplateRef,
  viewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { BaseMapService } from "app/providers/map-service/base-map.service";
import { ParamService, QfaResult, QfaService } from "./qfa";
import { CircleMarker, LatLngLiteral } from "leaflet";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { RegionsService, RegionProperties } from "app/providers/regions-service/regions.service";
import { augmentRegion } from "app/providers/regions-service/augmentRegion";
import { ForecastSource, GenericObservation } from "app/observations/models/generic-observation.model";
import { formatDate, KeyValuePipe, CommonModule } from "@angular/common";
import { BsModalService } from "ngx-bootstrap/modal";
import { FormsModule } from "@angular/forms";
import type { Observable } from "rxjs";
import {
  type AlpsolutObservation,
  AlpsolutProfileService,
  MeteogramSourceService,
  MultimodelSourceService,
  ObservedProfileSourceService,
} from "./sources";
import type { ModellingRouteData } from "./routes";
import "bootstrap";

export interface MultiselectDropdownData {
  id: ForecastSource;
  loader?: () => Observable<GenericObservation[]>;
  name: string;
  fillColor: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, KeyValuePipe, KeyValuePipe, TranslateModule],
  templateUrl: "./forecast.component.html",
  styleUrls: ["./qfa/qfa.component.scss", "./qfa/qfa.table.scss", "./qfa/qfa.params.scss"],
})
export class ForecastComponent implements AfterContentInit, AfterViewInit, OnDestroy {
  layout = "map" as const;
  selectedModelPoint: GenericObservation;
  selectedModelType: ForecastSource;
  selectedCity: string;
  qfa: QfaResult;
  qfaStartDay: number;
  loading = true;
  dropDownOptions: Record<ForecastSource, GenericObservation<unknown>[]> = {
    multimodel: [],
    meteogram: [],
    qfa: [],
    observed_profile: [],
    alpsolut_profile: [],
  };
  observationConfigurations = new Set<string>();
  observationConfiguration: string | undefined;

  public allSources: MultiselectDropdownData[] = [];

  public allRegions: RegionProperties[];
  private regionalMarkers = {};

  private swipeCoord?: [number, number];
  private swipeTime?: number;

  public selectedRegions = {} as Record<string, boolean>;
  public selectedSources = {} as Record<string, boolean>;
  private modelPoints: GenericObservation[] = [];

  readonly observationsMap = viewChild<ElementRef<HTMLDivElement>>("observationsMap");
  readonly qfaSelect = viewChild<ElementRef<HTMLSelectElement>>("qfaSelect");
  readonly observationPopupTemplate = viewChild<TemplateRef<any>>("observationPopupTemplate");

  constructor(
    private route: ActivatedRoute,
    private regionsService: RegionsService,
    public mapService: BaseMapService,
    private multimodelSource: MultimodelSourceService,
    private meteogramSource: MeteogramSourceService,
    private observedProfileSource: ObservedProfileSourceService,
    private alpsolutProfileSource: AlpsolutProfileService,
    private qfaService: QfaService,
    public paramService: ParamService,
    private translateService: TranslateService,
    public modalService: BsModalService,
  ) {}

  files = {};

  async ngAfterContentInit() {
    this.allRegions = (await this.regionsService.getRegionsEuregio()).features
      .map((f) => f.properties)
      .sort((r1, r2) => r1.id.localeCompare(r2.id));
    this.allRegions.forEach((region) => {
      this.regionalMarkers[region.id] = [];
    });
  }

  async ngAfterViewInit() {
    this.initMaps().then(() => this.load());
  }

  async load() {
    const { modelling } = this.route.snapshot.data as ModellingRouteData;
    this.allSources =
      modelling === "geosphere"
        ? [
            {
              id: ForecastSource.multimodel,
              loader: () => this.multimodelSource.getZamgMultiModelPoints(),
              fillColor: "green",
              name: this.translateService.instant("sidebar.modellingZamg"),
            },
            {
              id: ForecastSource.meteogram,
              loader: () => this.meteogramSource.getZamgMeteograms(),
              fillColor: "MediumVioletRed",
              name: this.translateService.instant("sidebar.modellingZamgMeteogram"),
            },
            {
              id: ForecastSource.qfa,
              fillColor: "red",
              name: this.translateService.instant("sidebar.qfa"),
            },
          ]
        : modelling === "snowpack"
          ? [
              {
                id: ForecastSource.observed_profile,
                loader: () => this.observedProfileSource.getObservedProfiles(),
                fillColor: "#f8d229",
                name: this.translateService.instant("sidebar.modellingSnowpack"),
              },
              {
                id: ForecastSource.alpsolut_profile,
                loader: () => this.alpsolutProfileSource.getAlpsolutDashboardPoints(),
                fillColor: "#d95f0e",
                name: this.translateService.instant("sidebar.modellingSnowpackMeteo"),
              },
            ]
          : [];

    this.modelPoints = [];
    this.loading = true;
    this.loadAll();
    if (modelling === "geosphere") {
      await this.loadQfa();
    }
    this.loading = false;
  }

  applyFilter() {
    Object.values(this.mapService.layers).forEach((layer) => layer.clearLayers());

    const filtered = this.modelPoints.filter((el) => {
      const correctRegion = !Object.values(this.selectedRegions).some((v) => v) || this.selectedRegions[el.region];
      const correctSource = !Object.values(this.selectedSources).some((v) => v) || this.selectedSources[el.$source];
      return correctRegion && correctSource;
    });

    filtered.forEach((point) => {
      this.drawMarker(point);
    });
  }

  drawMarker(point: GenericObservation) {
    const { $source, region, locationName, latitude, longitude, eventDate } = point;
    const callback = () => {
      if ($source === "qfa") this.setQfa(this.files[locationName][0], 0);
      this.selectedModelPoint = $source === "qfa" ? undefined : point;
      this.selectedModelType = $source as ForecastSource;
      this.observationConfiguration = (point as AlpsolutObservation).$data?.configuration;
      this.modalService.show(this.observationPopupTemplate(), { class: "modal-fullscreen" });
    };

    const tooltip = [
      `<i class="ph ph-calendar"></i> ${
        eventDate instanceof Date ? formatDate(eventDate, "yyyy-MM-dd HH:mm", "en-US") : undefined
      }`,
      `<i class="ph ph-asterisk"></i> ${region || undefined}`,
      `<i class="ph ph-globe"></i> ${locationName || undefined}`,
      this.allSources.find((s) => s.id === $source)?.name,
      `<div hidden>${region}</div>`,
    ]
      .filter((s) => !/undefined/.test(s))
      .join("<br>");

    const marker = new CircleMarker(
      { lat: latitude, lng: longitude },
      this.getModelPointOptions($source as ForecastSource),
    )
      .on("click", callback)
      .bindTooltip(tooltip);

    const fullSource = this.allSources.find((el) => el.id === $source);
    const attribution = `<span style="color: ${fullSource.fillColor}">●</span> ${fullSource.name}`;
    this.mapService.addMarker(marker, "forecast", attribution);
  }

  loadAll() {
    this.observationConfigurations.clear();
    this.allSources.forEach((source) => {
      if (typeof source.loader !== "function") return;
      source.loader().subscribe((points) => {
        this.dropDownOptions[source.id] = points;
        points.forEach((point) => {
          augmentRegion(point);
          const configuration = (point as AlpsolutObservation)?.$data?.configuration;
          if (configuration) {
            this.observationConfigurations.add(configuration);
          }
          try {
            this.drawMarker(point);
            this.modelPoints.push(point);
          } catch (e) {
            console.error(e);
          }
        });
      });
    });
  }

  async loadQfa() {
    await this.qfaService.loadDustParams();
    for (const [cityName, coords] of Object.entries(this.qfaService.coords)) {
      const ll = coords as LatLngLiteral;
      const point = {
        $source: "qfa",
        latitude: ll.lat,
        longitude: ll.lng,
        locationName: cityName,
      } as GenericObservation;
      augmentRegion(point);
      this.drawMarker(point);
      this.modelPoints.push(point);
    }
    this.files = await this.qfaService.getFiles();
  }

  async initMaps() {
    const map = await this.mapService.initMaps(this.observationsMap().nativeElement, () => {});
    map.on("click", () => {
      this.selectedRegions = Object.fromEntries(this.mapService.getSelectedRegions().map((r) => [r, true]));
      this.applyFilter();
    });
    this.mapService.removeObservationLayers();
    this.mapService.addMarkerLayer("forecast");
  }

  ngOnDestroy() {
    this.mapService.removeMaps();
  }

  getModelPointOptions(type: ForecastSource): L.CircleMarkerOptions {
    return {
      radius: 8,
      fillColor: this.allSources.find((s) => s.id === type)?.fillColor,
      color: "black",
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
    };
  }

  get observationPopupIframe() {
    if (/widget.alpsolut.eu/.test(this.selectedModelPoint?.$externalURL)) {
      return this.selectedModelPoint?.$externalURL;
    }
  }

  onRegionsDropdownSelect() {
    this.mapService.clickRegion(this.selectedRegions);
    this.applyFilter();
  }

  onSourcesDropdownSelect() {
    this.applyFilter();
  }

  async setQfa(file, startDay = 0) {
    this.qfaStartDay = startDay;
    const fileMap = typeof file === "string" ? { filename: file } : file;
    const city = fileMap.filename.split("_")[3];
    const first = this.files[city][0].filename === fileMap.filename;
    this.qfa = await this.qfaService.getRun(fileMap, startDay, first);
    this.selectedCity = this.qfa.data.metadata.location.split(" ").pop().toLowerCase();
    this.paramService.setParameterClasses(this.qfa.parameters);
  }

  // Source: https://stackoverflow.com/a/44511007/9947071
  swipe(e: TouchEvent, when: string): void {
    if (this.selectedModelType === "qfa") {
      // disable swipe to allow horizontal scrolling of table
      return;
    }
    const coord: [number, number] = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
    const time = new Date().getTime();

    if (when === "start") {
      this.swipeCoord = coord;
      this.swipeTime = time;
    } else if (when === "end") {
      const direction = [coord[0] - this.swipeCoord[0], coord[1] - this.swipeCoord[1]];
      const duration = time - this.swipeTime;

      if (
        duration < 1000 && //
        Math.abs(direction[0]) > 30 && // Long enough
        Math.abs(direction[0]) > Math.abs(direction[1] * 3)
      ) {
        // Horizontal enough
        const swipe = direction[0] < 0 ? "next" : "previous";
        // Do whatever you want with swipe
        this.changeRun(swipe);
      }
    }
  }

  changeRun(type: "next" | "previous", changeType = "") {
    if (changeType === "observationConfiguration") {
      const configurations = [...this.observationConfigurations];
      const index = configurations.indexOf(this.observationConfiguration);
      if (type === "next") {
        const newIndex = index + 1 < configurations.length - 1 ? index + 1 : 0;
        this.observationConfiguration = configurations[newIndex];
      } else if (type === "previous") {
        const newIndex = index === 0 ? configurations.length - 1 : index - 1;
        this.observationConfiguration = configurations[newIndex];
      }
    } else if (this.selectedModelType === "qfa") {
      const filenames = this.files[this.selectedCity].map((file) => file.filename);
      const index = filenames.indexOf(this.qfa.file.filename);
      if (type === "next") {
        const newIndex = index + 1 < filenames.length - 1 ? index + 1 : 0;
        this.setQfa(filenames[newIndex], 0);
      } else if (type === "previous") {
        const newIndex = index === 0 ? filenames.length - 1 : index - 1;
        this.setQfa(filenames[newIndex], 0);
      }
    } else if (this.selectedModelPoint) {
      let points = this.dropDownOptions[this.selectedModelType];
      if (this.showObservationConfigurations && this.observationConfiguration) {
        points = points.filter(
          (p) => (p as AlpsolutObservation).$data?.configuration === this.observationConfiguration,
        );
      }
      const index = points.findIndex(
        (p) => p.region === this.selectedModelPoint.region && p.locationName === this.selectedModelPoint.locationName,
      );
      if (type === "next") {
        const newIndex = index + 1 < points.length - 1 ? index + 1 : 0;
        this.selectedModelPoint = points[newIndex];
      } else if (type === "previous") {
        const newIndex = index === 0 ? points.length - 1 : index - 1;
        this.selectedModelPoint = points[newIndex];
      }
    }
  }

  @HostListener("document:keydown", ["$event"])
  handleKeyBoardEvent(event: KeyboardEvent) {
    if (!this.selectedModelPoint) {
      return;
    }

    if (event.key === "ArrowRight") this.changeRun("next");
    if (event.key === "ArrowLeft") this.changeRun("previous");

    if (event.key === "ArrowUp" && this.showObservationConfigurations) {
      this.changeRun("previous", "observationConfiguration");
      this.setObservationConfiguration();
    } else if (event.key === "ArrowDown" && this.showObservationConfigurations) {
      this.changeRun("next", "observationConfiguration");
      this.setObservationConfiguration();
    }
  }

  setObservationConfiguration() {
    if (!this.showObservationConfigurations) return;
    this.selectedModelPoint =
      this.dropDownOptions[this.selectedModelType].find(
        (p) =>
          p.region === this.selectedModelPoint.region &&
          p.locationName === this.selectedModelPoint.locationName &&
          (p as AlpsolutObservation).$data?.configuration === this.observationConfiguration,
      ) ?? this.selectedModelPoint;
  }

  get showObservationConfigurations(): boolean {
    return !!(this.selectedModelPoint as AlpsolutObservation)?.$data?.configuration;
  }
}
