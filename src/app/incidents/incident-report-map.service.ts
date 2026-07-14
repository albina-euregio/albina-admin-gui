import { Injectable, OnDestroy } from "@angular/core";
import type { WritableSignal } from "@angular/core";
import type { Feature, FeatureCollection } from "geojson";
import maplibregl, { IControl, LngLatBounds, Map as MlMap, MapMouseEvent, Marker } from "maplibre-gl";

import { basemapAtTerrainLayer, composeStyle, MapBaseLayer, opentopoLayer } from "../map/base-map";
import { createMap } from "../map/create-map";
import { IncidentReport } from "./incident-report.model";

const SOURCE_ID = "incident-geometry";

/** Minimal radio-style base-layer switcher (MapLibre has no built-in LayersControl). */
class BaseLayerControl implements IControl {
  private container?: HTMLElement;

  constructor(private readonly layers: MapBaseLayer[]) {}

  onAdd(map: MlMap): HTMLElement {
    const container = document.createElement("div");
    container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    container.style.padding = "4px 6px";
    this.layers.forEach((layer, i) => {
      const label = document.createElement("label");
      label.style.display = "block";
      label.style.cursor = "pointer";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "incident-base-layer";
      input.checked = i === 0;
      input.addEventListener("change", () => {
        for (const other of this.layers) {
          map.setLayoutProperty(other.id, "visibility", other.id === layer.id ? "visible" : "none");
        }
      });
      label.append(input, ` ${layer.name}`);
      container.append(label);
    });
    this.container = container;
    return container;
  }

  onRemove(): void {
    this.container?.remove();
    this.container = undefined;
  }
}

const EMPTY_COLLECTION: FeatureCollection = { type: "FeatureCollection", features: [] };

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
 * Owns the MapLibre map instance used on the incident report location tab,
 * including point/line/polygon drawing and rendering of the report geometry.
 */
@Injectable()
export class IncidentReportMapService implements OnDestroy {
  private map?: MlMap;
  private marker?: Marker;
  private config?: IncidentReportMapConfig;

  activeDrawingMode: "Point" | "Line" | "Polygon" = "Point";

  init(config: IncidentReportMapConfig) {
    this.config = config;
  }

  ngOnDestroy() {
    this.destroy();
  }

  destroy() {
    this.marker?.remove();
    this.marker = undefined;
    if (this.map) {
      this.map.remove();
      this.map = undefined;
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

    this.destroy();

    // OpenTopoMap by default, basemap.at terrain as an alternative for cleaner tracing
    const baseLayers = [opentopoLayer(), basemapAtTerrainLayer({ layout: { visibility: "none" } })];

    // Default center on Tyrol/Innsbruck region
    const map = createMap({
      container: elementId,
      style: composeStyle(baseLayers),
      navigationControl: true,
      maxZoom: 17,
    });
    map.jumpTo({ center: [11.404, 47.268], zoom: 9 });
    this.map = map;

    map.addControl(new BaseLayerControl(baseLayers), "bottom-right");

    map.on("click", (e: MapMouseEvent) => {
      if (config.disabled()) return;
      this.handleMapClick(e.lngLat.lat, e.lngLat.lng);
    });

    this.activeDrawingMode = this.activeDrawingMode || "Point";

    map.on("load", () => {
      map.addSource(SOURCE_ID, { type: "geojson", data: EMPTY_COLLECTION });
      map.addLayer({
        id: "incident-polygon-fill",
        type: "fill",
        source: SOURCE_ID,
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": "green", "fill-opacity": 0.3 },
      });
      map.addLayer({
        id: "incident-polygon-outline",
        type: "line",
        source: SOURCE_ID,
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "line-color": "green", "line-width": 2 },
      });
      map.addLayer({
        id: "incident-line",
        type: "line",
        source: SOURCE_ID,
        filter: ["==", ["geometry-type"], "LineString"],
        paint: { "line-color": "blue", "line-width": 4 },
      });
      map.addLayer({
        id: "incident-vertices",
        type: "circle",
        source: SOURCE_ID,
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#fff",
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-width": 2,
        },
      });
      map.resize();
      this.drawOnMap(true);
    });

    // Ensure correct dimensions once the tab transition has settled
    setTimeout(() => map.resize(), 150);
  }

  handleMapClick(lat: number, lng: number) {
    const config = this.config;
    if (!config) return;
    const report = config.incidentReport();
    const mode = this.activeDrawingMode;

    if (mode === "Point") {
      // Once a point exists, a click must not relocate it (avoids accidental
      // moves); it can only be repositioned by dragging the marker.
      if (report.latitude != null && report.longitude != null) return;
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

  /** Repositions the existing point (e.g. after dragging the marker). */
  movePoint(lat: number, lng: number) {
    const config = this.config;
    if (!config) return;
    const report = config.incidentReport();
    report.latitude = Number(lat.toFixed(6));
    report.longitude = Number(lng.toFixed(6));
    config.onPointChange?.(report.latitude, report.longitude);
    config.incidentReport.set({ ...report });
    this.drawOnMap();
  }

  clearPoint() {
    const config = this.config;
    if (!config) return;
    const report = config.incidentReport();
    report.latitude = null;
    report.longitude = null;
    report.locationAccuracy = null;
    config.incidentReport.set({ ...report });
    this.drawOnMap();
  }

  clearLine() {
    const config = this.config;
    if (!config) return;
    const report = config.incidentReport();
    report.lineCoordinatesText = "";
    config.incidentReport.set({ ...report });
    this.drawOnMap();
  }

  clearPolygon() {
    const config = this.config;
    if (!config) return;
    const report = config.incidentReport();
    report.polygonCoordinatesText = "";
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

    // Geometry layers are added on the "load" event; until then, defer.
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const features: Feature[] = [];
    const allPoints: [number, number][] = []; // [lng, lat]

    // 1. Point (draggable marker, not part of the GeoJSON source)
    const lat = report.latitude != null ? Number(report.latitude) : NaN;
    const lng = report.longitude != null ? Number(report.longitude) : NaN;
    if (!isNaN(lat) && !isNaN(lng)) {
      const draggable = !this.config?.disabled();
      if (!this.marker) {
        this.marker = new maplibregl.Marker({ draggable, color: "#2a81cb" });
        this.marker.on("dragend", () => {
          const { lat: newLat, lng: newLng } = this.marker!.getLngLat();
          this.movePoint(newLat, newLng);
        });
        // lngLat must be set before addTo(), otherwise Marker._update() throws
        this.marker.setLngLat([lng, lat]).addTo(map);
      } else {
        this.marker.setLngLat([lng, lat]);
      }
      this.marker.setDraggable(draggable);
      allPoints.push([lng, lat]);
    } else if (this.marker) {
      this.marker.remove();
      this.marker = undefined;
    }

    // 2. Line
    const linePoints = this.parseCoordinatesText(report.lineCoordinatesText || "");
    if (linePoints.length > 0) {
      const coords = linePoints.map(([la, lo]) => [lo, la]);
      features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
      for (const [la, lo] of linePoints) {
        features.push({
          type: "Feature",
          properties: { color: "blue" },
          geometry: { type: "Point", coordinates: [lo, la] },
        });
        allPoints.push([lo, la]);
      }
    }

    // 3. Polygon
    const polygonPoints = this.parseCoordinatesText(report.polygonCoordinatesText || "");
    if (polygonPoints.length > 0) {
      const ring = polygonPoints.map(([la, lo]) => [lo, la]);
      // Close the linear ring as required by GeoJSON
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
      features.push({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } });
      for (const [la, lo] of polygonPoints) {
        features.push({
          type: "Feature",
          properties: { color: "green" },
          geometry: { type: "Point", coordinates: [lo, la] },
        });
        allPoints.push([lo, la]);
      }
    }

    source.setData({ type: "FeatureCollection", features });

    if (autoFit) {
      if (allPoints.length === 1) {
        map.jumpTo({ center: allPoints[0], zoom: 15 });
      } else if (allPoints.length > 1) {
        const bounds = new LngLatBounds();
        for (const p of allPoints) bounds.extend(p);
        map.fitBounds(bounds, { maxZoom: 15, animate: false });
      }
    }
  }
}
