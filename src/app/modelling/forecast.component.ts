import {
  Component,
  AfterViewInit,
  ElementRef,
  OnDestroy,
  AfterContentInit,
  TemplateRef,
  viewChild,
  inject,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { BaseMapService } from "app/providers/map-service/base-map.service";
import { ParamService, QfaResult, QfaService } from "./qfa";
import { CircleMarker, CircleMarkerOptions, LatLngLiteral, LayerGroup } from "leaflet";
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
  ZamgMeteoSourceService,
} from "./sources";
import type { ModellingRouteData } from "./routes";
import "bootstrap";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";

export interface MultiselectDropdownData {
  id: ForecastSource;
  loader?: () => Observable<GenericObservation[]>;
  name: string;
  fillColor: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, KeyValuePipe, KeyValuePipe, TranslateModule, NgxMousetrapDirective],
  providers: [
    AlpsolutProfileService,
    MeteogramSourceService,
    MultimodelSourceService,
    ObservedProfileSourceService,
    ZamgMeteoSourceService,
  ],
  templateUrl: "./forecast.component.html",
  styleUrls: ["./qfa/qfa.component.scss", "./qfa/qfa.table.scss", "./qfa/qfa.params.scss"],
})
export class ForecastComponent implements AfterContentInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private regionsService = inject(RegionsService);
  mapService = inject(BaseMapService);
  private multimodelSource = inject(MultimodelSourceService);
  private meteogramSource = inject(MeteogramSourceService);
  private observedProfileSource = inject(ObservedProfileSourceService);
  private alpsolutProfileSource = inject(AlpsolutProfileService);
  zamgMeteoSourceService = inject(ZamgMeteoSourceService);
  private qfaService = inject(QfaService);
  paramService = inject(ParamService);
  translateService = inject(TranslateService);
  modalService = inject(BsModalService);

  readonly mapLayer = new LayerGroup();
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

  public allRegions: RegionProperties[] = [];
  private regionalMarkers = {};

  private swipeCoord?: [number, number];
  private swipeTime?: number;

  public selectedRegions = {} as Record<string, boolean>;
  public selectedSources = {} as Record<string, boolean>;
  private modelPoints: GenericObservation[] = [];

  readonly observationsMap = viewChild<ElementRef<HTMLDivElement>>("observationsMap");
  readonly qfaSelect = viewChild<ElementRef<HTMLSelectElement>>("qfaSelect");
  readonly observationPopupTemplate = viewChild<TemplateRef<any>>("observationPopupTemplate");

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
    await this.initMaps();
    await this.load();
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
    this.selectedSources = Object.fromEntries(this.allSources.map((s) => [s.id, true]));

    this.modelPoints = [];
    this.loading = true;
    this.loadAll();
    if (modelling === "geosphere") {
      await this.loadQfa();
    }
    this.loading = false;
  }

  applyFilter() {
    this.mapLayer.clearLayers();

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

    new CircleMarker({ lat: latitude, lng: longitude }, this.getModelPointOptions($source as ForecastSource))
      .addTo(this.mapLayer)
      .on("click", callback)
      .bindTooltip(tooltip);
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
    const map = await this.mapService.initMaps(this.observationsMap().nativeElement);
    map.on("click", () => {
      this.selectedRegions = Object.fromEntries(this.mapService.getSelectedRegions().map((r) => [r, true]));
      this.applyFilter();
    });
    this.mapLayer.addTo(map);
  }

  ngOnDestroy() {
    this.mapLayer.clearLayers();
    this.mapService.removeMaps();
  }

  getModelPointOptions(type: ForecastSource): CircleMarkerOptions {
    return {
      pane: "markerPane",
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

  getSubregions(region: string) {
    return this.allRegions.filter((r) => r.id.startsWith(region) && r.id !== region);
  }

  onRegionsDropdownSelect() {
    this.mapService.clickRegion(this.selectedRegions);
    this.applyFilter();
  }

  selectRegion(region: string) {
    this.selectedRegions = {};
    if (region) {
      this.allRegions.forEach((r) => {
        if (r.id.startsWith(region)) {
          this.selectedRegions[r.id] = true;
        }
      });
    }
    this.mapService.clickRegion(this.selectedRegions);
    this.applyFilter();
  }

  toggleRegion(event, region: string) {
    if (region) {
      this.allRegions.forEach((r) => {
        if (r.id.startsWith(region)) {
          this.selectedRegions[r.id] = event.target.checked;
        }
      });
    }
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
        const swipe = direction[0] < 0 ? +1 : -1;
        // Do whatever you want with swipe
        this.changeRun(swipe);
      }
    }
  }

  changeRun(type: -1 | 1, changeType: "" | "observationConfiguration" = "") {
    if (changeType === "observationConfiguration") {
      const configurations = [...this.observationConfigurations];
      const index = configurations.indexOf(this.observationConfiguration);
      this.observationConfiguration = configurations.at((index + type) % configurations.length);
    } else if (this.selectedModelType === "qfa") {
      const filenames = this.files[this.selectedCity].map((file) => file.filename);
      const index = filenames.indexOf(this.qfa.file.filename);
      this.setQfa(filenames.at((index + type) % filenames.length), 0);
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
      this.selectedModelPoint = points.at((index + type) % points.length);
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
