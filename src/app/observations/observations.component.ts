import { Component, AfterContentInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { TranslateService } from "@ngx-translate/core";
import { ObservationsService } from "./observations.service";
import { RegionsService, RegionProperties } from "../providers/regions-service/regions.service";
import { BaseMapService } from "../providers/map-service/base-map.service";
import {
  GenericObservation,
  ObservationFilterType,
  ObservationSource,
  ObservationTableRow,
  toGeoJSON,
  toMarkerColor,
  toObservationTable,
  LocalFilterTypes,
  ChartsData
} from "./models/generic-observation.model";

import { MenuItem } from "primeng/api";

import { saveAs } from "file-saver";

import { LatLng, Marker } from "leaflet";

import { ObservationTableComponent } from "./observation-table.component";
import { ObservationFilterService } from "./observation-filter.service";
import { formatDate } from "@angular/common";

//import { BarChart } from "./charts/bar-chart/bar-chart.component";
declare var L: any;

export interface MultiselectDropdownData {
  id: string;
  name: string;
}

@Component({
  templateUrl: "observations.component.html",
  styleUrls: ["./observations.component.scss"]
})
export class ObservationsComponent implements AfterContentInit, AfterViewInit, OnDestroy {
  public loading = false;
  public layout: "map" | "table" | "chart" = "map";
  public layoutFilters = true;
  public observations: GenericObservation[] = [];
  public localObservations: GenericObservation[] = [];
  public showObservationsWithoutCoordinates: boolean = false;
  public observationsWithoutCoordinates: number = 0;
  public observationPopup: {
    observation: GenericObservation;
    table: ObservationTableRow[];
    iframe: SafeResourceUrl;
  };

  public readonly allRegions: RegionProperties[];
  public readonly allSources: MultiselectDropdownData[];
  public selectedRegionItems: string[];
  public selectedSourceItems: ObservationSource[];
  public toMarkerColor = toMarkerColor;
  public chartsData: ChartsData = {
    Elevation: {},
    Aspects: {},
    AvalancheProblem: {},
    Stability: {},
    ObservationType: {},
    ImportantObservation: {},
    DangerPattern: {},
    Days: {}
  };
  public moreItems: MenuItem[];
  @ViewChild("observationsMap") mapDiv: ElementRef<HTMLDivElement>;
  @ViewChild("observationTable")
  observationTableComponent: ObservationTableComponent;

  public get LocalFilterTypes(): typeof LocalFilterTypes {
    return LocalFilterTypes;
  }

  constructor(
    public filter: ObservationFilterService,
    private translateService: TranslateService,
    private observationsService: ObservationsService,
    private sanitizer: DomSanitizer,
    private regionsService: RegionsService,
    public mapService: BaseMapService
  ) {
    this.allRegions = this.regionsService
      .getRegionsEuregio()
      .features.map((f) => f.properties)
      .sort((r1, r2) => r1.id.localeCompare(r2.id));

    //    console.log("constructor", this.allRegions, this.regionsService.getRegionsEuregio(), Object.keys(ObservationSource).map((key) => {return {"id": key, "name": key} }));

    this.allSources = Object.keys(ObservationSource).map((key) => {
      return { id: key, name: key };
    });

    this.moreItems = [
      {
        label: "Mehr",
        items: [
          // {
          //   label: this.translateService.instant("observations.showTable"),
          //   icon: '',
          //   command: (event) => {
          //     //console.log("showTable", this.showTable);
          //     this.showTable = !this.showTable
          //   }
          // },
          {
            label: "Export",
            icon: "",
            command: (event) => {
              this.exportObservations();
            }
          }
        ]
      }
    ];
  }

  ngAfterContentInit() {
    this.filter.days = 1;
  }

  ngAfterViewInit() {
    this.mapService.initMaps(this.mapDiv.nativeElement, (o) => this.onObservationClick(o));
    this.mapService.addInfo();

    this.loadObservations({ days: 7 });
    this.mapService.map.on("click", () => {
      //console.log("this.mapService.observationsMap click #1", this.mapService.getSelectedRegions());

      this.filter.regions = this.mapService.getSelectedRegions().map((aRegion) => aRegion.id);

      //console.log("this.mapService.observationsMap click #2", this.filter.regions);

      this.applyLocalFilter();
    });
  }

  ngOnDestroy() {
    this.mapService.resetAll();
    if (this.mapService.map) {
      this.mapService.map.remove();
      this.mapService.map = undefined;
    }
  }

  onDropdownSelect(target: string, event: any) {
    //console.log("onDropdownSelect", event);
    switch (target) {
      case "regions":
        this.filter.regions = event.value;
        this.mapService.clickRegion(event.value);
        this.applyLocalFilter();
        break;
      case "sources":
        this.filter.observationSources = event.value;
        this.applyLocalFilter();
        break;
      default:
    }
  }

  onDropdownDeSelect(target: string, item: any) {
    switch (target) {
      case "regions":
        this.filter.regions = this.filter.regions.filter((e) => e !== item.id);
        this.applyLocalFilter();
        break;
      case "sources":
        this.filter.observationSources = this.filter.observationSources.filter((e) => e !== item.id);
        this.applyLocalFilter();
        break;
      default:
    }
  }

  onSidebarChange(e: Event) {
    if (e.type === "opening") {
      this.layout = "map";
    }
  }

  closeTable() {
    this.layout = "map";
  }

  newObservation() {
    this.layout = "table";
    this.observationTableComponent.newObservation();
  }

  observationTableFilterGlobal(value: string) {
    this.observationTableComponent.observationTable.filterGlobal(value, 'contains');
  }

  loadObservations({ days }: { days?: number } = {}) {
    //console.log("loadObservations ##x1", this.selectedSourceItems, this.filter.dateRange);
    this.observationsWithoutCoordinates = 0;
    if (typeof days === "number") {
      this.filter.days = days;
    }
    this.loading = true;
    this.observations.length = 0;
    Object.values(this.mapService.observationTypeLayers).forEach((layer) => layer.clearLayers());
    this.observationsService
      .loadAll()
      .forEach((observation) => {
        //console.log("loadObservations ##2", regionId, observation.eventDate, observation.$source);

        if (this.filter.inDateRange(observation)) {
          //console.log("loadObservations ADDDD ##4", regionId, observation.eventDate);
          this.addObservation(observation);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading = false;
        this.applyLocalFilter();
      });
  }

  exportObservations() {
    const collection: GeoJSON.FeatureCollection = toGeoJSON(this.observations);
    const json = JSON.stringify(collection, undefined, 2);
    const blob = new Blob([json], { type: "application/geo+json" });
    saveAs(blob, "observations.geojson");
  }

  get observationPopupVisible(): boolean {
    return this.observationPopup !== undefined;
  }

  set observationPopupVisible(value: boolean) {
    if (value) {
      throw Error(String(value));
    }
    this.observationPopup = undefined;
  }

  toggleFilter(data: any = {}) {
    if (data?.type) this.filter.toggleFilter(data);
    this.applyLocalFilter();
  }

  setDate() {
    this.filter.setDateRange();
    this.loadObservations({});
  }

  applyLocalFilter() {
    //console.log("applyLocalFilter ##1");

    //console.log("applyLocalFilter ##2", this.filter.filterSelection);

    Object.values(this.mapService.observationTypeLayers).forEach((layer) => layer.clearLayers());
    this.observations.forEach((observation) => {
      observation.filterType =
        this.filter.inObservationSources(observation) && this.filter.isSelected(observation)
          ? ObservationFilterType.Local
          : ObservationFilterType.Global;
      observation.isHighlighted = this.filter.isHighlighted(observation);
    });

    //    console.log("applyLocalFilter ##3.99", this.observations);
    this.localObservations = [];
    this.observations.forEach((observation) => {
      const ll = observation.latitude && observation.longitude ? new LatLng(observation.latitude, observation.longitude) : undefined;

      //if(observation.aspect || observation.elevation) console.log("applyLocalFilter ##3", observation);
      if (observation.filterType === ObservationFilterType.Local || observation.isHighlighted) {
        this.localObservations.push(observation);
        if (!ll) {
          return;
        }
        this.drawMarker(observation, ll);
      }
    });
    this.buildChartsData();
  }

  buildChartsData() {
    this.chartsData.Elevation = this.filter.getElevationDataset(this.observations);

    this.chartsData.Aspects = this.filter.getAspectDataset(this.observations);

    this.chartsData.Stability = this.filter.getStabilityDataset(this.observations);

    this.chartsData.ObservationType = this.filter.getObservationTypeDataset(this.observations);

    this.chartsData.ImportantObservation = this.filter.getImportantObservationDataset(this.observations);

    this.chartsData.AvalancheProblem = this.filter.getAvalancheProblemDataset(this.observations);

    this.chartsData.DangerPattern = this.filter.getDangerPatternDataset(this.observations);

    this.chartsData.Days = this.filter.getDaysDataset(this.observations);

    //console.log("buildChartsData", this.chartsData);
  }

  private drawMarker(observation: GenericObservation, ll: LatLng) {
    const styledObservation = observation.isHighlighted ? this.mapService.highlightStyle(observation) : this.mapService.style(observation);
    styledObservation.bubblingMouseEvents = false;
    //styledObservation.riseOnHover = true;
    const marker = new Marker(ll, styledObservation);
    // if (this.mapService.USE_CANVAS_LAYER) {
    //   // @ts-ignore
    //   marker.observation = observation;
    // } else {

    // }
    marker.on("click", () => this.onObservationClick(observation));

    const tooltip = [
      `<i class="fa fa-calendar"></i> ${
        observation.eventDate instanceof Date ? formatDate(observation.eventDate, "yyyy-MM-dd HH:mm", "en-US") : undefined
      }`,
      `<i class="fa fa-globe"></i> ${observation.locationName || undefined}`,
      `<i class="fa fa-user"></i> ${observation.authorName || undefined}`,
      `[${observation.$source}, ${observation.$type}]`
    ]
      .filter((s) => !/undefined/.test(s))
      .join("<br>");
    marker.bindTooltip(tooltip, {
      opacity: 1,
      className: "obs-tooltip"
    });
    marker.options.pane = "markerPane";
    marker.addTo(this.mapService.observationTypeLayers[observation.$type]);
  }

  private addObservation(observation: GenericObservation): void {
    const ll = observation.latitude && observation.longitude ? new LatLng(observation.latitude, observation.longitude) : undefined;
    observation.filterType = ObservationFilterType.Local;

    if (ll) {
      observation.region = this.regionsService.getRegionForLatLng(ll)?.id;
    }
    // if (
    //   !this.selectedSourceItems.length || !this.selectedSourceItems.includes(observation.$source) ||
    //   !this.filter.isSelected(observation)
    // ) {
    //   observation.filterType = ObservationFilterType.Global;
    // }

    this.observations.push(observation);
    this.observations.sort((o1, o2) => (+o1.eventDate === +o2.eventDate ? 0 : +o1.eventDate < +o2.eventDate ? 1 : -1));

    if (!ll) {
      this.observationsWithoutCoordinates++;
      return;
    }

    this.drawMarker(observation, ll);
  }

  onObservationClick(observation: GenericObservation): void {
    //console.log("onObservationClick ##002", observation.$data);
    if (observation.$externalURL) {
      const iframe = this.sanitizer.bypassSecurityTrustResourceUrl(observation.$externalURL);
      this.observationPopup = { observation, table: [], iframe };
    } else {
      const extraRows = Array.isArray(observation.$extraDialogRows)
        ? observation.$extraDialogRows
        : typeof observation.$extraDialogRows === "function"
        ? observation.$extraDialogRows((key) => this.translateService.instant(key))
        : [];
      const rows = toObservationTable(observation, (key) => this.translateService.instant(key)); // call toObservationTable after $extraDialogRows
      const table = [...rows, ...extraRows];
      this.observationPopup = { observation, table, iframe: undefined };
    }
  }

  toggleFilters() {
    this.layoutFilters = !this.layoutFilters;
    this.mapService.map.invalidateSize();
  }
}
