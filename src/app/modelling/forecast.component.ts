import { CommonModule, formatDate, KeyValuePipe } from "@angular/common";
import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  TemplateRef,
  viewChild,
  ChangeDetectionStrategy,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { ForecastSource, GenericObservation } from "app/observations/models/generic-observation.model";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { augmentRegion, initAugmentRegion } from "app/providers/regions-service/augmentRegion";
import { RegionProperties, RegionsService } from "app/providers/regions-service/regions.service";
import { BsModalService } from "ngx-bootstrap/modal";
import type { Observable } from "rxjs";

import { RegionMapService } from "../map/region-map.service";
import { addStationLayer, StationLayerHandle, StationPoint } from "../map/station-layer";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";

import "bootstrap";

import { City, GetDustParamService, ParamService, QfaFile, QfaItem, QfaService } from "./qfa";
import type { ModellingRouteData } from "./routes";
import { MeteogramSourceService, MultimodelSourceService, ZamgMeteoSourceService } from "./sources";

export interface MultiselectDropdownData {
  id: ForecastSource;
  loader?: () => Observable<GenericObservation[]>;
  name: string;
  fillColor: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, KeyValuePipe, KeyValuePipe, TranslatePipe, NgxMousetrapDirective],
  providers: [
    RegionMapService,
    MeteogramSourceService,
    MultimodelSourceService,
    ZamgMeteoSourceService,
    QfaService,
    ParamService,
    GetDustParamService,
  ],
  templateUrl: "./forecast.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ["./qfa/qfa.component.scss", "./qfa/qfa.table.scss", "./qfa/qfa.params.scss"],
})
export class ForecastComponent implements AfterContentInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  regionsService = inject(RegionsService);
  mapService = inject(RegionMapService);
  authenticationService = inject(AuthenticationService);
  private multimodelSource = inject(MultimodelSourceService);
  private meteogramSource = inject(MeteogramSourceService);
  zamgMeteoSourceService = inject(ZamgMeteoSourceService);
  qfaService = inject(QfaService);
  paramService = inject(ParamService);
  translateService = inject(TranslateService);
  modalService = inject(BsModalService);

  private pointsLayer?: StationLayerHandle;
  private renderedPoints: GenericObservation[] = [];
  layout = "map" as const;
  selectedModelPoint: GenericObservation;
  selectedModelType: ForecastSource;
  selectedCity: City;
  qfa: QfaFile;
  qfaStartDay: number;
  loading = true;
  dropDownOptions: Record<ForecastSource, GenericObservation<unknown>[]> = {
    multimodel: [],
    meteogram: [],
    qfa: [],
  };

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
  readonly observationPopupTemplate = viewChild<TemplateRef<unknown>>("observationPopupTemplate");

  async ngAfterContentInit() {
    this.allRegions = (await this.regionsService.getInternalServerRegionsAsync()).features
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
        : [];
    this.selectedSources = Object.fromEntries(this.allSources.map((s) => [s.id, true]));

    this.modelPoints = [];
    this.loading = true;
    await this.loadAll();
    if (modelling === "geosphere") {
      await this.loadQfa();
    }
    this.loading = false;
  }

  applyFilter() {
    const filtered = this.modelPoints.filter((el) => {
      const correctRegion = !Object.values(this.selectedRegions).some((v) => v) || this.selectedRegions[el.region];
      const correctSource = !Object.values(this.selectedSources).some((v) => v) || this.selectedSources[el.$source];
      return correctRegion && correctSource;
    });
    this.renderedPoints = filtered;
    this.pointsLayer?.setStations(filtered.map((point, i) => this.toStationPoint(point, String(i))));
  }

  private toStationPoint(point: GenericObservation, id: string): StationPoint {
    const { $source, region, locationName, latitude, longitude, eventDate } = point;
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
    return {
      id,
      lng: longitude,
      lat: latitude,
      radius: 8,
      fillColor: this.getPointColor($source as ForecastSource),
      strokeColor: "black",
      tooltip,
    };
  }

  private getPointColor(type: ForecastSource): string {
    return this.allSources.find((s) => s.id === type)?.fillColor ?? "black";
  }

  private onModelPointClick(id: string) {
    const point = this.renderedPoints[Number(id)];
    if (!point) return;
    const { $source, locationName } = point;
    if ($source === "qfa") this.setQfa(this.qfaService.files[locationName][0], 0);
    this.selectedModelPoint = $source === "qfa" ? undefined : point;
    this.selectedModelType = $source as ForecastSource;
    this.modalService.show(this.observationPopupTemplate(), { class: "modal-fullscreen" });
  }

  async loadAll() {
    await initAugmentRegion();
    this.allSources.forEach((source) => {
      if (typeof source.loader !== "function") return;
      source.loader().subscribe((points) => {
        this.dropDownOptions[source.id] = points;
        points.forEach((point) => {
          try {
            augmentRegion(point);
            this.modelPoints.push(point);
          } catch (e) {
            console.error(e);
          }
        });
        this.applyFilter();
      });
    });
  }

  async loadQfa() {
    await this.qfaService.loadDustParams();
    for (const [cityName, coords] of Object.entries(this.qfaService.coords)) {
      const ll = coords as { lat: number; lng: number };
      const point = {
        $source: "qfa",
        latitude: ll.lat,
        longitude: ll.lng,
        locationName: cityName,
      } as GenericObservation;
      augmentRegion(point);
      this.modelPoints.push(point);
    }
    this.applyFilter();
    await this.qfaService.getFiles();
  }

  async initMaps() {
    const map = await this.mapService.initMap(this.observationsMap().nativeElement);
    this.pointsLayer = addStationLayer(map, { id: "forecast-points" });
    this.pointsLayer.onStationClick((id) => this.onModelPointClick(id));
    this.mapService.onSelectionChange(() => {
      this.selectedRegions = Object.fromEntries(this.mapService.getSelectedRegions().map((r) => [r, true]));
      this.applyFilter();
    });
  }

  ngOnDestroy() {
    this.pointsLayer?.remove();
    this.mapService.removeMaps();
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

  async setQfa(file: QfaItem, startDay = 0) {
    this.qfaStartDay = startDay;
    this.selectedCity = file.city as City;
    const first = this.qfaService.files[this.selectedCity][0].filename === file.filename;
    this.qfa = await this.qfaService.getRun(file, startDay, first);
    this.paramService.setParameterClasses(this.qfa.parameterKeys);
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

  changeRun(type: -1 | 1) {
    if (this.selectedModelType === "qfa") {
      const filenames = this.qfaService.files[this.selectedCity];
      const index = filenames.indexOf(this.qfa.file);
      this.setQfa(filenames.at((index + type) % filenames.length), 0);
    } else if (this.selectedModelPoint) {
      const points = this.dropDownOptions[this.selectedModelType];
      const index = points.findIndex(
        (p) => p.region === this.selectedModelPoint.region && p.locationName === this.selectedModelPoint.locationName,
      );
      this.selectedModelPoint = points.at((index + type) % points.length);
    }
  }
}
