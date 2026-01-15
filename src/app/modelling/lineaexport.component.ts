import "@albina-euregio/linea/dist/linea";
import { CommonModule } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, viewChild, ElementRef, inject, AfterViewInit } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { BaseMapService } from "app/providers/map-service/base-map.service";
import { CircleMarker, CircleMarkerOptions, LayerGroup } from "leaflet";

@Component({
  selector: "app-linea-export",
  standalone: true,
  imports: [CommonModule, TranslateModule],
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
  readonly stations: StationFeature[] = [];
  filteredStations: StationFeature[] = [];
  private searchTimeout: any;
  searchTerm = "";
  showDropdown = false;

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
              } else {
                this.addStation(id);
              }
            });
            this.markers[id] = marker;

            this.stations.push({
              id: String(id),
              name: String(feature.properties.name),
              lat: feature.geometry.coordinates[1] as number,
              lng: feature.geometry.coordinates[0] as number,
            } as StationFeature);
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

  onSearchFieldEnter(): void {
    if (!this.searchTerm) return;

    if (this.filteredStations.length === 1) {
      this.toggleStation(this.filteredStations[0].id);
    }
  }

  onBlur() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 150);
  }

  toggleStation(id: string): void {
    if (this.selectedIds.includes(id)) {
      this.removeStation(id);
    } else {
      this.addStation(id);
    }
    this.searchTerm = "";
    this.filteredStations = [...this.stations];
  }

  onSearch(event: Event): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      const value = (event.target as HTMLInputElement).value.toLowerCase().trim();
      this.searchTerm = value;
      if (!value) {
        this.filteredStations = [...this.stations];
      } else {
        this.filteredStations = this.stations.filter(
          (s) => s.id.toLowerCase().includes(value) || s.name.toLowerCase().includes(value),
        );
        const exact = this.stations.find((s) => s.id.toLowerCase() === this.searchTerm);

        if (exact) {
          this.toggleStation(exact.id);
          return;
        }
      }
    }, 200);
  }

  // Add a station
  addStation(id: string): void {
    if (!this.selectedIds.includes(id)) {
      this.selectedIds.push(id);
      this.markers[id].setStyle(this.getModelPointOptions(true)); // selected style
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

  // Marker style
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
}

interface StationFeature {
  id: string;
  name: string;
  lat: number;
  lng: number;
}
