import "@albina-euregio/linea";
import { Feature } from "@albina-euregio/linea/listing";
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
  ChangeDetectionStrategy,
} from "@angular/core";
import { TranslatePipe } from "@ngx-translate/core";

import { StationPoint } from "../map/station-layer";
import { BlogService } from "../providers/blog-service/blog.service";
import { GraphicsService } from "./graphics.service";
import { StationMapService } from "./station-map.service";

@Component({
  selector: "app-linea-export",
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  providers: [GraphicsService, BlogService, StationMapService],
  templateUrl: "./lineaexport.component.html",
  styleUrls: ["./lineaexport.component.css"],
  changeDetection: ChangeDetectionStrategy.Eager,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LineaExportComponent implements AfterViewInit {
  // Initially selected station
  selectedIds: string[] = [];

  private mapService = inject(StationMapService);
  private graphicsService = inject(GraphicsService);

  private searchTimeout: ReturnType<typeof setTimeout> | undefined;
  readonly stationsMap = viewChild<ElementRef<HTMLDivElement>>("stationsMap");
  readonly stations: Feature[] = [];

  filteredStations: Feature[] = [];
  searchTerm = "";
  showDropdown = false;
  activeIndex = -1;

  async ngAfterViewInit() {
    await this.mapService.initMap(this.stationsMap().nativeElement);
    this.mapService.onStationClick((id) => this.toggleStation(id));
    await this.load();
  }

  async load() {
    const stations = await this.graphicsService.loadLineaStations();
    this.stations.push(...stations);
    this.renderStations();
  }

  private renderStations() {
    const style = getComputedStyle(document.documentElement);
    const success = style.getPropertyValue("--bs-success");
    const subtle = style.getPropertyValue("--bs-primary-bg-subtle");
    this.mapService.setStations(
      this.stations.map(
        (s): StationPoint => ({
          id: s.id,
          lng: s.geometry.coordinates[0],
          lat: s.geometry.coordinates[1],
          radius: 8,
          fillColor: this.selectedIds.includes(s.id) ? success : subtle,
          strokeColor: "black",
          tooltip: s.properties.name || s.id,
        }),
      ),
    );
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
            s.id?.toLowerCase().includes(value) ||
            s.properties.shortName?.toLowerCase().includes(value) ||
            s.properties.name?.toLowerCase().includes(value),
        );
        const exact = this.stations.find(
          (s) => s.id?.toLowerCase() === this.searchTerm || s.properties.shortName?.toLowerCase() === this.searchTerm,
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
      this.renderStations();
    }
  }

  getShortNameById(id: string): string {
    const station = this.stations.find((station) => station.id === id);
    return station?.properties?.shortName ?? station?.properties?.name ?? id;
  }

  // Remove a station
  removeStation(id: string): void {
    this.selectedIds = this.selectedIds.filter((s) => s !== id);
    this.renderStations();
  }

  get selectedStations() {
    return this.stations.filter((s) => this.selectedIds.includes(s.id));
  }

  // linea-plot features
  get features(): string {
    return JSON.stringify(this.selectedStations);
  }

  get forecastLatLon(): string {
    return JSON.stringify(
      this.selectedStations.map((s) => `${s.geometry.coordinates[1]},${s.geometry.coordinates[0]}`),
    );
  }
}
