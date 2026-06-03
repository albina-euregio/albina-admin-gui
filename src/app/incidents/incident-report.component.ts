import { Component, inject, input, model, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import {
  Map as LeafletMap,
  TileLayer,
  Marker,
  CircleMarker,
  Polyline,
  Polygon,
  LayerGroup,
  LeafletMouseEvent,
  Layer,
} from "leaflet";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { z } from "zod/v4";

import { ToggleBtnGroup } from "../danger-sources/toggle-btn-group";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { ZodSchemaFormComponent } from "../shared/zod-schema-form.component";
import * as IncidentModels from "./models/incident-report.model";
import { IncidentReport } from "./models/incident-report.model";

@Component({
  selector: "app-incident-report",
  templateUrl: "incident-report.component.html",
  standalone: true,
  imports: [AccordionModule, BsDropdownModule, FormsModule, TranslateModule, ZodSchemaFormComponent, ToggleBtnGroup],
})
export class IncidentReportComponent implements OnInit, OnDestroy {
  constantsService = inject(ConstantsService);
  authenticationService = inject(AuthenticationService);
  regionsService = inject(RegionsService);
  translateService = inject(TranslateService);

  readonly IncidentModels = IncidentModels;
  readonly JSON = JSON;
  readonly Object = Object;

  readonly disabled = input<boolean>(false);
  readonly labelI18n = "incidentReport.#";
  readonly helpI18n = "incidentReportHelp.#";

  personInvolvementOptions: ("Yes" | "No" | "Unknown")[] = ["Yes", "No", "Unknown"];

  showMandatoryOnly = false;
  readonly allTabs = [
    { id: "meta", label: "incidentReport.metaInformation", schema: IncidentModels.MetaInformationSchema },
    { id: "general", label: "incidentReport.generalInformation", schema: IncidentModels.GeneralInformationSchema },
    { id: "location", label: "incidentReport.locationInformation", schema: IncidentModels.LocationInformationSchema },
    {
      id: "avalanche",
      label: "incidentReport.avalancheInformation",
      schema: IncidentModels.AvalancheInformationSchema,
    },
    { id: "group", label: "incidentReport.personInvolvement" },
    { id: "other-damages", label: "incidentReport.otherDamages" },
    { id: "analysis", label: "incidentReport.incidentAnalysis", schema: IncidentModels.IncidentAnalysisSchema },
    { id: "attachments", label: "incidentReport.incidentAttachments" },
  ] as const;

  private _activeTab: (typeof this.allTabs)[number]["id"] = "general";
  get activeTab(): (typeof this.allTabs)[number]["id"] {
    return this._activeTab;
  }
  set activeTab(tab: (typeof this.allTabs)[number]["id"]) {
    this._activeTab = tab;
    if (tab === "location") {
      setTimeout(() => this.initLocationMap(), 50);
    }
  }

  get prevTab(): (typeof this.allTabs)[number]["id"] {
    const index = this.allTabs.findIndex((tab) => tab.id === this.activeTab);
    return this.allTabs[Math.max(index - 1, 0)].id;
  }

  get nextTab(): (typeof this.allTabs)[number]["id"] {
    const index = this.allTabs.findIndex((tab) => tab.id === this.activeTab);
    return this.allTabs[Math.min(index + 1, this.allTabs.length - 1)].id;
  }

  getValidationStatus(schema: z.ZodType): "valid" | "invalid" {
    const res = schema.safeParse(this.incidentReport());
    return res.success ? "valid" : "invalid";
  }

  getTabValidationStatus(tab: (typeof this.allTabs)[number]): "valid" | "invalid" {
    if (tab.id === "group") return this.getGroupValidationStatus();
    if (tab.id === "other-damages") return this.getOtherDamagesValidationStatus();
    return "schema" in tab ? this.getValidationStatus(tab.schema) : "valid";
  }

  getOtherDamagesValidationStatus(): "valid" | "invalid" {
    const res = IncidentModels.OtherDamagesSchema.safeParse(this.incidentReport());
    if (!res.success) return "invalid";
    const report = this.incidentReport();
    if (report.otherDamages === "Yes") {
      if (!report.damagedAssets || report.damagedAssets.length === 0) {
        return "invalid";
      }
    }
    return "valid";
  }

  getGroupValidationStatus(): "valid" | "invalid" {
    const pi = this.incidentReport().personInvolvement;
    if (pi !== "Yes" && pi !== "No" && pi !== "Unknown") return "invalid";
    if (pi === "Yes") {
      for (const group of this.incidentReport().groupInformation ?? []) {
        const res = IncidentModels.GroupInformationSchema.safeParse(group);
        if (!res.success) return "invalid";
      }
    }
    return "valid";
  }
  readonly incidentReport = model<IncidentReport>(
    IncidentModels.PartialIncidentReportSchema.parse({
      author: this.authenticationService.getCurrentAuthor()?.email,
      authorAffiliation: this.authenticationService.getCurrentAuthor()?.organization,
      publicAvalancheWarningService: this.authenticationService.getCurrentAuthor()?.organization,
      timestamp: new Date(),
      reportStatus: "Draft",
      groupInformation: [
        {
          anonymousGroupIdentifier: "Group unknown",
        } as IncidentModels.GroupInformation,
      ],
      victimInformation: [],
      attachments: [],
    } satisfies Partial<IncidentReport>) as IncidentReport,
  );

  newGroupInformation() {
    const groupInformation = {
      anonymousGroupIdentifier: "Group " + Math.random(),
    } as IncidentModels.GroupInformation;
    this.incidentReport().groupInformation.push(groupInformation);
  }

  removeGroupInformation(index: number) {
    if (index === 0) return;
    if (!confirm(`Kill group ${index + 1}?`)) return;
    this.incidentReport().groupInformation.splice(index, 1);
  }

  collapsedGroups: Record<string, boolean> = {};

  toggleGroupCollapse(groupIdentifier: string) {
    this.collapsedGroups[groupIdentifier] = !this.collapsedGroups[groupIdentifier];
  }

  isGroupCollapsed(groupIdentifier: string): boolean {
    return !!this.collapsedGroups[groupIdentifier];
  }

  isGroupValid(group: IncidentModels.GroupInformation): boolean {
    return IncidentModels.GroupInformationSchema.safeParse(group).success;
  }

  newVictimInformation() {
    const VictimInformation = {
      anonymousVictimIdentifier: "Victim " + Math.random(),
    } as IncidentModels.VictimInformation;
    this.incidentReport().victimInformation.push(VictimInformation);
  }

  removeVictimInformation(index: number) {
    if (!confirm(`Drop victim ${index + 1}?`)) return;
    this.incidentReport().victimInformation.splice(index, 1);
  }

  collapsedVictims: Record<string, boolean> = {};

  toggleVictimCollapse(id: string) {
    this.collapsedVictims[id] = !this.collapsedVictims[id];
  }

  isVictimCollapsed(id: string): boolean {
    return !!this.collapsedVictims[id];
  }

  isVictimValid(group: IncidentModels.VictimInformation): boolean {
    return IncidentModels.VictimInformationSchema.safeParse(group).success;
  }

  get groupIdentifiers(): string[] {
    return this.incidentReport().groupInformation?.map((g) => g.anonymousGroupIdentifier) ?? [];
  }

  get hasPointData(): boolean {
    const report = this.incidentReport();
    return report.latitude != null || report.longitude != null;
  }

  get hasLineData(): boolean {
    return !!this.incidentReport().lineCoordinatesText?.trim();
  }

  get hasPolygonData(): boolean {
    return !!this.incidentReport().polygonCoordinatesText?.trim();
  }

  locationMapInstance?: LeafletMap;
  mapLayer?: Layer;
  activeDrawingMode: "Point" | "Line" | "Polygon" = "Point";

  ngOnInit() {
    if (this.activeTab === "location") {
      setTimeout(() => this.initLocationMap(), 50);
    }
  }

  ngOnDestroy() {
    if (this.locationMapInstance) {
      this.locationMapInstance.remove();
    }
  }

  initLocationMap() {
    if (this.activeTab !== "location") return;

    const mapDiv = document.getElementById("locationMap");
    if (!mapDiv || mapDiv.offsetWidth === 0) {
      setTimeout(() => this.initLocationMap(), 50);
      return;
    }

    if (this.locationMapInstance) {
      this.locationMapInstance.remove();
      this.locationMapInstance = undefined;
      this.mapLayer = undefined;
    }

    // Default center on Tyrol/Innsbruck region
    const map = new LeafletMap("locationMap").setView([47.268, 11.404], 9);
    this.locationMapInstance = map;

    new TileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", (e: LeafletMouseEvent) => {
      if (this.disabled()) return;
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
    const report = this.incidentReport();
    const mode = this.activeDrawingMode;

    if (mode === "Point") {
      report.latitude = Number(lat.toFixed(6));
      report.longitude = Number(lng.toFixed(6));
    } else if (mode === "Line") {
      const points = this.parseCoordinatesText(report.lineCoordinatesText || "");
      points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
      report.lineCoordinatesText = points.map((p) => `${p[0].toFixed(6)}, ${p[1].toFixed(6)}`).join("\n");
    } else if (mode === "Polygon") {
      const points = this.parseCoordinatesText(report.polygonCoordinatesText || "");
      points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
      report.polygonCoordinatesText = points.map((p) => `${p[0].toFixed(6)}, ${p[1].toFixed(6)}`).join("\n");
    }

    this.incidentReport.set({ ...report });
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
    const map = this.locationMapInstance;
    if (!map) return;

    map.invalidateSize();

    if (this.mapLayer) {
      map.removeLayer(this.mapLayer);
      this.mapLayer = undefined;
    }

    const report = this.incidentReport();
    const allPoints: [number, number][] = [];
    const layers: Layer[] = [];

    // 1. Point
    if (report.latitude != null && report.longitude != null) {
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = new Marker([lat, lng]);
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

  onLocationTypeChange(type: "Point" | "Line" | "Polygon") {
    this.activeDrawingMode = type;
  }

  onLocationFormChange(updatedReport: IncidentReport) {
    this.incidentReport.set({ ...updatedReport });
    this.drawOnMap();
  }

  onLatLngInputChange() {
    const report = this.incidentReport();
    if (report.latitude != null) report.latitude = Number(report.latitude);
    if (report.longitude != null) report.longitude = Number(report.longitude);
    this.incidentReport.set({ ...report });
    this.drawOnMap();
  }

  onLineCoordinatesTextChange(text: string) {
    const report = this.incidentReport();
    report.lineCoordinatesText = text;
    this.incidentReport.set({ ...report });
    this.drawOnMap();
  }

  onPolygonCoordinatesTextChange(text: string) {
    const report = this.incidentReport();
    report.polygonCoordinatesText = text;
    this.incidentReport.set({ ...report });
    this.drawOnMap();
  }

  clearPoint() {
    const report = this.incidentReport();
    report.latitude = null;
    report.longitude = null;
    report.locationAccuracy = null;
    this.incidentReport.set({ ...report });
    this.drawOnMap();
  }

  clearLine() {
    const report = this.incidentReport();
    report.lineCoordinatesText = "";
    this.incidentReport.set({ ...report });
    this.drawOnMap();
  }

  clearPolygon() {
    const report = this.incidentReport();
    report.polygonCoordinatesText = "";
    this.incidentReport.set({ ...report });
    this.drawOnMap();
  }

  clearAllDrawing() {
    const report = this.incidentReport();
    report.latitude = null;
    report.longitude = null;
    report.locationAccuracy = null;
    report.lineCoordinatesText = "";
    report.polygonCoordinatesText = "";
    this.incidentReport.set({ ...report });
    this.drawOnMap();
  }

  uploadIncidentAttachment($event: Event) {
    const input = $event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    console.log();
    if (!file) {
      return;
    }
    this.incidentReport().attachments.push({
      dateAdded: new Date(),
      file,
      fileName: file.name,
      mediaType: file.type,
    });
  }

  removeAttachment(index: number) {
    const attachments = this.incidentReport().attachments;
    if (!confirm(`Drop attachment ${attachments[index].fileName}?`)) return;
    attachments.splice(index, 1);
  }
}
