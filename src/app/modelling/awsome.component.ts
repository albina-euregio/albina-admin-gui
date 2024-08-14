import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ObservationChartComponent } from "../observations/observation-chart.component";
import { ObservationGalleryComponent } from "../observations/observation-gallery.component";
import { ObservationTableComponent } from "../observations/observation-table.component";
import { TranslateModule } from "@ngx-translate/core";
import { ObservationFilterService } from "../observations/observation-filter.service";
import { FilterSelectionData } from "../observations/filter-selection-data";
import { BaseMapService } from "../providers/map-service/base-map.service";
import { ObservationMarkerService } from "../observations/observation-marker.service";

type FeatureProperties = GeoJSON.Feature["properties"];

@Component({
  selector: "app-awsome",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormsModule,
    ObservationChartComponent,
    ObservationGalleryComponent,
    ObservationTableComponent,
    TranslateModule,
  ],
  templateUrl: "awsome.component.html",
})
export class AwsomeComponent implements AfterViewInit, OnInit {
  // https://gitlab.com/avalanche-warning
  layout = "map" as const;
  @ViewChild("observationsMap") mapDiv: ElementRef<HTMLDivElement>;
  observations: FeatureProperties[] = [];
  localObservations: FeatureProperties[] = [];

  constructor(
    public filterService: ObservationFilterService<FeatureProperties>,
    public mapService: BaseMapService,
    public markerService: ObservationMarkerService<FeatureProperties>,
  ) {
    this.filterService.filterSelectionData = getFilterSelectionData();
    this.markerService.markerClassify = this.filterService.filterSelectionData[0];
  }

  async ngOnInit() {
    const json: GeoJSON.FeatureCollection = await this.fetchJSON(
      "https://models.avalanche.report/snp-gridded/geojson-tirol23/2023-11-12_06-00-00.json",
    );
    this.observations = json.features.map((feature) => {
      feature.properties.longitude ??= (feature.geometry as GeoJSON.Point).coordinates[0];
      feature.properties.latitude ??= (feature.geometry as GeoJSON.Point).coordinates[1];
      return feature.properties;
    });
    this.filterService.filterSelectionData.forEach((filter) =>
      filter.buildChartsData(this.markerService.markerClassify, this.observations, (o) =>
        this.filterService.isSelected(o),
      ),
    );
    this.applyLocalFilter();
  }

  async ngAfterViewInit() {
    await this.mapService.initMaps(this.mapDiv.nativeElement, (o) => console.log(o));
  }

  applyLocalFilter() {
    Object.values(this.mapService.observationTypeLayers).forEach((layer) => layer.clearLayers());
    this.localObservations = this.observations.filter(
      (observation) => this.filterService.isHighlighted(observation) || this.filterService.isSelected(observation),
    );
    this.localObservations.forEach((observation) => {
      this.markerService
        .createMarker(observation, this.filterService.isHighlighted(observation))
        ?.on("click", () => this.onObservationClick(observation))
        ?.addTo(this.mapService.observationTypeLayers.Profile);
    });

    this.filterService.filterSelectionData.forEach((filter) =>
      filter.buildChartsData(this.markerService.markerClassify, this.observations, (o) =>
        this.filterService.isSelected(o),
      ),
    );
  }

  private onObservationClick(observation: FeatureProperties) {
    console.log(observation);
  }

  private async fetchJSON(input: RequestInfo | URL) {
    const res = await fetch(input);
    const text = (await res.text()).replace(/\bNaN\b/g, "null");
    return JSON.parse(text);
  }
}

function getFilterSelectionData() {
  return [
    new FilterSelectionData<FeatureProperties>({
      chartRichLabel: "label",
      chartType: "bar",
      label: "flat sk38",
      key: "snp_characteristics.flat.sk38.value",
      type: "snp_characteristics.flat.sk38.value",
      values: [
        {
          numericRange: [0.0, 0.25],
          color: "#d7191c",
          label: "<0.25",
          legend: "<0.25",
          value: "<0.25",
        },
        {
          numericRange: [0.25, 0.5],
          color: "#fdae61",
          label: "<0.50",
          legend: "<0.50",
          value: "<0.50",
        },
        {
          numericRange: [0.5, 0.75],
          color: "#ffffbf",
          label: "<0.75",
          legend: "<0.75",
          value: "<0.75",
        },
        {
          numericRange: [0.75, 1.0],
          color: "#a6d96a",
          label: "<1.00",
          legend: "<1.00",
          value: "<1.00",
        },
      ],
    }),
  ];
}
