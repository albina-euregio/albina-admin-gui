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
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ForecastSource, GenericObservation } from "app/observations/models/generic-observation.model";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { BaseMapService } from "app/providers/map-service/base-map.service";
import { augmentRegion, initAugmentRegion } from "app/providers/regions-service/augmentRegion";
import { RegionProperties, RegionsService } from "app/providers/regions-service/regions.service";
import { CircleMarker, CircleMarkerOptions, LatLngLiteral, LayerGroup } from "leaflet";
import { BsModalService } from "ngx-bootstrap/modal";
import type { Observable } from "rxjs";

import { NgxMousetrapDirective } from "../shared/mousetrap-directive";

import "bootstrap";
import { ParamService, QfaFile, QfaFilename, QfaService } from "./qfa";
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
  imports: [CommonModule, FormsModule, KeyValuePipe, KeyValuePipe, TranslateModule, NgxMousetrapDirective],
  providers: [MeteogramSourceService, MultimodelSourceService, ZamgMeteoSourceService],
  templateUrl: "./forecast.component.html",
  styleUrls: ["./qfa/qfa.component.scss", "./qfa/qfa.table.scss", "./qfa/qfa.params.scss"],
})
export class ForecastComponent implements AfterContentInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  regionsService = inject(RegionsService);
  mapService = inject(BaseMapService);
  authenticationService = inject(AuthenticationService);
  private multimodelSource = inject(MultimodelSourceService);
  private meteogramSource = inject(MeteogramSourceService);
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

  files = {};

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
    const click = () => {
      if ($source === "qfa") this.setQfa(this.files[locationName][0], 0);
      this.selectedModelPoint = $source === "qfa" ? undefined : point;
      this.selectedModelType = $source as ForecastSource;
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
      .on({ click })
      .bindTooltip(tooltip);
  }

  async loadAll() {
    await initAugmentRegion();
    this.allSources.forEach((source) => {
      if (typeof source.loader !== "function") return;
      source.loader().subscribe((points) => {
        this.dropDownOptions[source.id] = points;
        points.forEach((point) => {
          augmentRegion(point);
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
    map.on({
      click: () => {
        this.selectedRegions = Object.fromEntries(this.mapService.getSelectedRegions().map((r) => [r, true]));
        this.applyFilter();
      },
    });

    // Watch zoom changes
    this.mapService.map.on("zoomend", () => {
      this.updateBaseLayer();
    });

    this.mapLayer.addTo(map);
  }

  private updateBaseLayer(): void {}

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

  async setQfa(file: QfaFilename | string, startDay = 0) {
    this.qfaStartDay = startDay;
    const fileMap = typeof file === "string" ? { filename: file } : file;
    const city = fileMap.filename.split("_")[3];
    const first = this.files[city][0].filename === fileMap.filename;
    this.qfa = await this.qfaService.getRun(fileMap, startDay, first);
    this.selectedCity = this.qfa.metadata.location.split(" ").pop().toLowerCase();
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
      const filenames = this.files[this.selectedCity].map((file) => file.filename);
      const index = filenames.indexOf(this.qfa.file.filename);
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
