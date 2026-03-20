import "@albina-euregio/linea/dist/linea";
import { listingLegacy, listing } from "@albina-euregio/linea";
import type { FeatureCollectionSchema as FeatureCollectionSchema0 } from "@albina-euregio/linea/src/schema/listing";
import type { FeatureCollectionSchema as LegacyFeatureCollectionSchema0 } from "@albina-euregio/linea/src/schema/listing-legacy";
import { CommonModule } from "@angular/common";
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  viewChild,
  ElementRef,
  inject,
  AfterViewInit,
  ViewChildren,
  QueryList,
} from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { LineaMapService } from "app/providers/map-service/linea-map.service";
import { CircleMarker, CircleMarkerOptions } from "leaflet";

import sources from "../../assets/config/stations.json";
const FeatureCollectionSchema = listing.FeatureCollectionSchema as typeof FeatureCollectionSchema0;
const LegacyFeatureCollectionSchema = listingLegacy.FeatureCollectionSchema as typeof LegacyFeatureCollectionSchema0;

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

  private searchTimeout: ReturnType<typeof setTimeout> | undefined;
  readonly stationsMap = viewChild<ElementRef<HTMLDivElement>>("stationsMap");
  readonly stations: StationFeature[] = [];

  filteredStations: StationFeature[] = [];
  searchTerm = "";
  showDropdown = false;
  activeIndex = -1;

  readonly markers = {};

  async ngAfterViewInit() {
    await this.mapService.initMaps(this.stationsMap().nativeElement);
    await this.load();
  }

  async load() {
    for (const source of sources) {
      const url = source.stations;
      const response = await fetch(url);
      const json = await response.json();
      const searchParams = new URL(url, location.href).searchParams;
      const isLegacy = searchParams.get("v") === "legacy";
      const schema = isLegacy ? LegacyFeatureCollectionSchema : FeatureCollectionSchema;
      const collection = schema.parse(json, { reportInput: true });
      for (const feature of collection.features) {
        if (!new RegExp(source.smetOperators).test(feature.properties.operator)) {
          continue;
        }
        const id = feature.id;
        const marker = new CircleMarker(
          {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
          },
          this.getModelPointOptions(false),
        ).addTo(this.mapService.stationLayer);
        this.mapService.showStationName(marker);

        marker.on("click", () => void this.toggleStation(id));
        this.markers[id] = marker;

        this.stations.push({
          id,
          name: feature.properties?.name,
          shortName: feature.properties?.shortName ?? "",
          smetId: feature.properties?.shortName ?? id,
          smet: source.smet,
        });
      }
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
    if (station.shortName && station.name) {
      return station.shortName.split("-").length == 5 ? station.name : station.shortName;
    }
    return station.shortName ?? id;
  }

  // Remove a station
  removeStation(id: string): void {
    this.selectedIds = this.selectedIds.filter((s) => s !== id);
    this.markers[id].setStyle(this.getModelPointOptions(false)); // unselected style
  }

  // linea-plot srcs
  get srcs(): string {
    return JSON.stringify(
      this.selectedIds
        .map((id) => {
          const station = this.stations.find((item) => item.id === id);
          const template = station?.smet?.[0];
          const smetId = station?.smetId;
          return template && smetId ? template.replace(/\{id\}/g, smetId) : undefined;
        })
        .filter((url): url is string => !!url),
    );
  }

  // linea-plot lazysrcs
  get lazysrcs(): string {
    return JSON.stringify(
      this.selectedIds
        .map((id) => {
          const station = this.stations.find((item) => item.id === id);
          const template = station?.smet?.[1];
          const smetId = station?.smetId;
          return template && smetId ? template.replace(/\{id\}/g, smetId) : undefined;
        })
        .filter((url): url is string => !!url),
    );
  }

  // linea-plot winter srcs
  get wintersrcs(): string {
    return JSON.stringify(
      this.selectedIds
        .map((id) => {
          const station = this.stations.find((item) => item.id === id);
          const template = station?.smet?.[2];
          const smetId = station?.smetId;
          return template && smetId ? template.replace(/\{id\}/g, smetId) : undefined;
        })
        .filter((url): url is string => !!url),
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
  shortName: string;
  smetId: string;
  smet: string[];
}
