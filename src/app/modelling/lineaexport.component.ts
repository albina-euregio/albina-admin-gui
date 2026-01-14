import "@albina-euregio/linea/dist/linea";
import { CommonModule } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

@Component({
  selector: "app-linea-export",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./lineaexport.component.html",
  styleUrls: ["./lineaexport.component.css"],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LineaExportComponent {
  // All station IDs
  stationIds: string[] = [];

  constructor() {
    fetch("https://static.avalanche.report/weather_stations/stations.geojson")
      .then((response) => response.json())
      .then((data) => {
        this.stationIds = data.features
          .map((feature: any) => feature.properties?.["LWD-Nummer"])
          .filter((id: any) => id !== undefined && id !== null)
          .sort();
      });
  }

  // Initially selected station
  selectedIds: string[] = [];

  // Add a station
  addStation(id: string): void {
    if (!this.selectedIds.includes(id)) {
      this.selectedIds.push(id);
    }
  }

  // Remove a station
  removeStation(id: string): void {
    this.selectedIds = this.selectedIds.filter((s) => s !== id);
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
