import "@albina-euregio/linea";
import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  QueryList,
  viewChild,
  ViewChildren,
} from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { CircleMarker, CircleMarkerOptions } from "leaflet";

import { LineaMapService } from "../providers/map-service/linea-map.service";
import { GraphicsService, type LineaStationFeature } from "./graphics.service";

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

  private mapService = inject(LineaMapService);
  private graphicsService = inject(GraphicsService);

  private searchTimeout: ReturnType<typeof setTimeout> | undefined;
  readonly stationsMap = viewChild<ElementRef<HTMLDivElement>>("stationsMap");
  readonly stations: LineaStationFeature[] = [];

  filteredStations: LineaStationFeature[] = [];
  searchTerm = "";
  showDropdown = false;
  activeIndex = -1;

  readonly markers: Record<string, CircleMarker> = {};

  async ngAfterViewInit() {
    await this.mapService.initMaps(this.stationsMap().nativeElement);
    await this.load();
  }

  async load() {
    const stations = await this.graphicsService.loadLineaStations();
    for (const station of stations) {
      const id = station.id;
      const marker = new CircleMarker(
        {
          lat: station.latitude,
          lng: station.longitude,
        },
        this.getModelPointOptions(false),
      ).addTo(this.mapService.stationLayer);
      marker.bindTooltip(`${station.shortName ?? ""} ${station.name}`);
      this.mapService.showStationName(marker);

      marker.bindTooltip(`${station.name || station.id}`);
      marker.on("click", () => void this.toggleStation(id));
      this.markers[id] = marker;

      this.stations.push(station);
    }
  }

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

  onKeyDown(event: KeyboardEvent) {
    if (!this.showDropdown || this.filteredStations.length === 0) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.activeIndex = (this.activeIndex + 1) % this.filteredStations.length;
        this.scrollToActive();
        break;

      case "ArrowUp":
        event.preventDefault();
        this.activeIndex = (this.activeIndex - 1 + this.filteredStations.length) % this.filteredStations.length;
        this.scrollToActive();
        break;

      case "Enter":
        event.preventDefault();
        if (this.activeIndex >= 0) {
          const station = this.filteredStations[this.activeIndex];
          this.toggleStation(station.id);
        }
        break;

      case "Escape":
        this.showDropdown = false;
        this.activeIndex = -1;
        break;
    }
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
          (s) =>
            s.id.toLowerCase().includes(value) ||
            s.shortName.toLowerCase().includes(value) ||
            s.name.toLowerCase().includes(value),
        );
        const exact = this.stations.find(
          (s) => s.id.toLowerCase() === this.searchTerm || s.shortName.toLowerCase() === this.searchTerm,
        );

        if (exact) {
          this.toggleStation(exact.id);
          return;
        }
      }
      this.showDropdown = true;
      this.activeIndex = -1;
    }, 200);
  }

  @ViewChildren("dropdownItem") items!: QueryList<ElementRef>;

  scrollToActive() {
    const el = this.items.get(this.activeIndex);
    el?.nativeElement.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
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

  // Add a station
  addStation(id: string): void {
    if (!this.selectedIds.includes(id)) {
      this.selectedIds.push(id);
      this.markers[id].setStyle(this.getModelPointOptions(true)); // selected style
    }
  }

  getShortNameById(id: string): string {
    const station = this.stations.find((station) => station.id === id);
    if (station?.shortName && station.name) {
      return station.shortName.split("-").length == 5 ? station.name : station.shortName;
    }
    return station?.shortName ?? id;
  }

  // Remove a station
  removeStation(id: string): void {
    this.selectedIds = this.selectedIds.filter((s) => s !== id);
    this.markers[id].setStyle(this.getModelPointOptions(false)); // unselected style
  }

  // linea-plot srcs
  get srcs(): string {
    return JSON.stringify(this.graphicsService.getSmetUrlsByIds(this.selectedIds, this.stations, 0));
  }

  // linea-plot lazysrcs
  get lazysrcs(): string {
    return JSON.stringify(this.graphicsService.getSmetUrlsByIds(this.selectedIds, this.stations, 1));
  }

  // linea-plot winter srcs
  get wintersrcs(): string {
    return JSON.stringify(this.graphicsService.getSmetUrlsByIds(this.selectedIds, this.stations, 2));
  }

  // Marker style
  getModelPointOptions(selected: boolean): CircleMarkerOptions {
    return {
      pane: "markerPane",
      radius: 8,
      fillColor: selected
        ? getComputedStyle(document.documentElement).getPropertyValue("--bs-success")
        : getComputedStyle(document.documentElement).getPropertyValue("--bs-primary-bg-subtle"),
      color: "black",
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
    };
  }
}
