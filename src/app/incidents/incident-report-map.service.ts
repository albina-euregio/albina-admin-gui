import { Injectable, OnDestroy } from "@angular/core";
import type { WritableSignal } from "@angular/core";
import {
  CircleMarker,
  Icon,
  Layer,
  LayerGroup,
  LeafletMouseEvent,
  Map as LeafletMap,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
} from "leaflet";

import { IncidentReport } from "./incident-report.model";

const defaultMarkerIcon = new Icon({
  iconUrl: "assets/markers/marker-icon-2x-blue.png",
  shadowUrl: "assets/markers/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
  shadowAnchor: [13, 41],
});

export interface IncidentReportMapConfig {
  /** Writable report signal the map reads from and writes drawing changes to. */
  incidentReport: WritableSignal<IncidentReport>;
  /** Whether editing is disabled (suppresses map click handling). */
  disabled: () => boolean;
  /** Whether the location map is currently shown; used to abort deferred init. */
  isActive: () => boolean;
  /** Notified when a point is placed/moved via the map, so the caller can reverse geocode. */
  onPointChange?: (lat: number, lng: number) => void;
}

/**
 * Owns the Leaflet map instance used on the incident report location tab,
 * including point/line/polygon drawing and rendering of the report geometry.
 */
@Injectable()
export class IncidentReportMapService implements OnDestroy {
  private map?: LeafletMap;
  private mapLayer?: Layer;
  private config?: IncidentReportMapConfig;

  activeDrawingMode: "Point" | "Line" | "Polygon" = "Point";

  init(config: IncidentReportMapConfig) {
    this.config = config;
  }

  ngOnDestroy() {
    this.destroy();
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.mapLayer = undefined;
    }
  }

  initLocationMap(elementId = "locationMap") {
    const config = this.config;
    if (!config || !config.isActive()) return;

    const mapDiv = document.getElementById(elementId);
    if (!mapDiv || mapDiv.offsetWidth === 0) {
      setTimeout(() => this.initLocationMap(elementId), 50);
      return;
    }

    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.mapLayer = undefined;
    }

    // Default center on Tyrol/Innsbruck region
    const map = new LeafletMap(elementId).setView([47.268, 11.404], 9);
    this.map = map;

    new TileLayer("https://tile.opentopomap.org/{z}/{x}/{y}.png", {
      attribution: "map data: © OpenStreetMap contributors, SRTM | map style: © OpenTopoMap (CC-BY-SA)",
    }).addTo(map);

    map.on("click", (e: LeafletMouseEvent) => {
      if (config.disabled()) return;
      this.handleMapClick(e.latlng.lat, e.latlng.lng);
    });

    this.activeDrawingMode = this.activeDrawingMode || "Point";

    // Invalidate size immediately and again after transition delay to ensure map dimensions are correct
    map.invalidateSize();
    setTimeout(() => {
      map.invalidateSize();
      this.drawOnMap(true);
    }, 150);

    this.drawOnMap(true);
  }

  handleMapClick(lat: number, lng: number) {
    const config = this.config;
    if (!config) return;
    const report = config.incidentReport();
    const mode = this.activeDrawingMode;

    if (mode === "Point") {
      report.latitude = Number(lat.toFixed(6));
      report.longitude = Number(lng.toFixed(6));
      config.onPointChange?.(report.latitude, report.longitude);
    } else if (mode === "Line") {
      const points = this.parseCoordinatesText(report.lineCoordinatesText || "");
      points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
      report.lineCoordinatesText = points.map((p) => `${p[0].toFixed(6)}, ${p[1].toFixed(6)}`).join("\n");
    } else if (mode === "Polygon") {
      const points = this.parseCoordinatesText(report.polygonCoordinatesText || "");
      points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
      report.polygonCoordinatesText = points.map((p) => `${p[0].toFixed(6)}, ${p[1].toFixed(6)}`).join("\n");
    }

    config.incidentReport.set({ ...report });
    this.drawOnMap();
  }

  parseCoordinatesText(text: string): [number, number][] {
    if (!text) return [];
    const lines = text.split("\n");
    const points: [number, number][] = [];
    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          points.push([lat, lng]);
        }
      }
    }
    return points;
  }

  drawOnMap(autoFit = false) {
    const map = this.map;
    if (!map) return;

    const report = this.config?.incidentReport();
    if (!report) return;

    map.invalidateSize();

    if (this.mapLayer) {
      map.removeLayer(this.mapLayer);
      this.mapLayer = undefined;
    }

    const allPoints: [number, number][] = [];
    const layers: Layer[] = [];

    // 1. Point
    if (report.latitude != null && report.longitude != null) {
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = new Marker([lat, lng], { icon: defaultMarkerIcon });
        layers.push(marker);
        allPoints.push([lat, lng]);
      }
    }

    // 2. Line
    const linePoints = this.parseCoordinatesText(report.lineCoordinatesText || "");
    if (linePoints.length > 0) {
      const lineShape = new Polyline(linePoints, { color: "blue", weight: 4 });
      layers.push(lineShape);
      for (const p of linePoints) {
        const vertex = new CircleMarker(p, { radius: 5, color: "blue", fillColor: "#fff", fillOpacity: 1 });
        layers.push(vertex);
        allPoints.push(p);
      }
    }

    // 3. Polygon
    const polygonPoints = this.parseCoordinatesText(report.polygonCoordinatesText || "");
    if (polygonPoints.length > 0) {
      const polygonShape = new Polygon(polygonPoints, { color: "green", fillColor: "green", fillOpacity: 0.3 });
      layers.push(polygonShape);
      for (const p of polygonPoints) {
        const vertex = new CircleMarker(p, { radius: 5, color: "green", fillColor: "#fff", fillOpacity: 1 });
        layers.push(vertex);
        allPoints.push(p);
      }
    }

    if (layers.length > 0) {
      const group = new LayerGroup(layers);
      this.mapLayer = group.addTo(map);

      // Auto zoom/pan to show all elements
      if (autoFit) {
        if (allPoints.length === 1) {
          map.setView(allPoints[0], 15);
        } else if (allPoints.length > 1) {
          map.fitBounds(new Polyline(allPoints).getBounds(), { maxZoom: 15 });
        }
      }
    }
  }
}
