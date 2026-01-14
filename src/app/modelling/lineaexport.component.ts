import "@albina-euregio/linea/dist/linea";
import { CommonModule } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, viewChild, ElementRef, inject, AfterViewInit } from "@angular/core";
import { BaseMapService } from "app/providers/map-service/base-map.service";
import { CircleMarker, CircleMarkerOptions, LayerGroup } from "leaflet";

@Component({
  selector: "app-linea-export",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./lineaexport.component.html",
  styleUrls: ["./lineaexport.component.css"],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LineaExportComponent implements AfterViewInit {
  // All station IDs
  stationIds: string[] = [];
  // Initially selected station
  selectedIds: string[] = [];

  private mapService;
  readonly mapLayer = new LayerGroup();

  readonly stationsMap = viewChild<ElementRef<HTMLDivElement>>("stationsMap");

  readonly markers = {};

  constructor() {
    this.mapService = inject(BaseMapService);
  }

  async ngAfterViewInit() {
    await this.initMaps();
    await this.load();
  }

  async load() {
    fetch("https://static.avalanche.report/weather_stations/stations.geojson")
      .then((response) => response.json())
      .then((data) => {
        data.features.forEach((feature: any) => {
          const id = feature.properties?.["LWD-Nummer"];
          if (id) {
            const marker = new CircleMarker(
              { lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] },
              this.getModelPointOptions(false), // default style
            ).addTo(this.mapLayer);

            marker.on("click", () => {
              if (this.selectedIds.includes(id)) {
                this.removeStation(id);
                marker.setStyle(this.getModelPointOptions(false)); // unselected style
              } else {
                this.addStation(id);
                marker.setStyle(this.getModelPointOptions(true)); // selected style
              }
            });
            this.markers[id] = marker;
          }
        });
      });
  }

  async initMaps() {
    const map = await this.mapService.initMaps(this.stationsMap().nativeElement);
    map.on({
      click: () => {
        console.log("Map clicked");
      },
    });

    // Watch zoom changes
    this.mapService.map.on("zoomend", () => {
      this.updateBaseLayer();
    });

    this.mapLayer.addTo(map);
  }

  private updateBaseLayer(): void {}

  getModelPointOptions(selected: boolean): CircleMarkerOptions {
    return {
      pane: "markerPane",
      radius: 8,
      fillColor: selected ? "red" : "blue",
      color: "black",
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
    };
  }
  // Add a station
  addStation(id: string): void {
    if (!this.selectedIds.includes(id)) {
      this.selectedIds.push(id);
    }
  }

  // Remove a station
  removeStation(id: string): void {
    this.selectedIds = this.selectedIds.filter((s) => s !== id);
    this.markers[id].setStyle(this.getModelPointOptions(false)); // unselected style
  }

  // linea-plot srcs
  get srcs(): string {
    return JSON.stringify(
      this.selectedIds.map((id) => `https://api.avalanche.report/lawine/grafiken/smet/woche/${id}.smet.gz`),
    );
  }

  // linea-plot lazysrcs
  get lazysrcs(): string {
    return JSON.stringify(
      this.selectedIds.map((id) => `https://api.avalanche.report/lawine/grafiken/smet/winter/${id}.smet.gz`),
    );
  }
}
