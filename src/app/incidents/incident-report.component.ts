import { DatePipe } from "@angular/common";
import { Component, DestroyRef, inject, Injector, input, model, OnDestroy, OnInit } from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { environment } from "environments/environment";
import { uniq } from "es-toolkit";
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
  Icon,
} from "leaflet";

const defaultMarkerIcon = new Icon({
  iconUrl: "assets/markers/marker-icon-2x-blue.png",
  shadowUrl: "assets/markers/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
  shadowAnchor: [13, 41],
});
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import {
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import { z } from "zod/v4";

import { GeocodingService } from "../observations/geocoding.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { IncidentService } from "../providers/incident-service/incident.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { ZodSchemaFormComponent } from "../shared/zod-schema-form.component";
import { isFieldValid, isVisibleFieldsValid } from "../shared/zod-util";
import * as IncidentModels from "./models/incident-report.model";
import { IncidentReport } from "./models/incident-report.model";

@Component({
  selector: "app-incident-report",
  templateUrl: "incident-report.component.html",
  standalone: true,
  imports: [DatePipe, AccordionModule, BsDropdownModule, FormsModule, TranslateModule, ZodSchemaFormComponent],
})
export class IncidentReportComponent implements OnInit, OnDestroy {
  constantsService = inject(ConstantsService);
  authenticationService = inject(AuthenticationService);
  regionsService = inject(RegionsService);
  translateService = inject(TranslateService);
  private incidentService = inject(IncidentService);
  private geocodingService = inject(GeocodingService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  // Server id of the persisted incident, once it has been created.
  private incidentId: string | null = null;
  // used to prevent redundant saves
  private lastSavedData: string | null = null;
  // Status of the automatic server synchronization, exposed for the template.
  saveState: "idle" | "saving" | "saved" | "error" = "idle";
  updatedAt: Date | null = null;

  readonly IncidentModels = IncidentModels;
  readonly JSON = JSON;
  readonly Object = Object;

  readonly disabled = input<boolean>(false);
  readonly labelI18n = "incidentReport.#";
  readonly helpI18n = "incidentReportHelp.#";

  showMandatoryOnly = false;
  readonly allTabs = [
    { id: "general", label: "incidentReport.generalInformation", schema: IncidentModels.GeneralInformationSchema },
    { id: "location", label: "incidentReport.locationInformation", schema: IncidentModels.LocationInformationSchema },
    {
      id: "avalanche",
      label: "incidentReport.avalancheInformation",
      schema: IncidentModels.AvalancheInformationSchema,
    },
    { id: "group", label: "incidentReport.personInvolvement" },
    { id: "other-damages", label: "incidentReport.otherDamages", schema: IncidentModels.OtherDamagesSchema },
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

  getValidationStatus(schema: z.ZodObject): "valid" | "invalid" {
    return isVisibleFieldsValid(schema, this.incidentReport() as Record<string, unknown>) ? "valid" : "invalid";
  }

  getTabValidationStatus(tab: (typeof this.allTabs)[number]): "valid" | "invalid" {
    if (tab.id === "group") return this.getGroupValidationStatus();
    return "schema" in tab ? this.getValidationStatus(tab.schema) : "valid";
  }

  getGroupValidationStatus(): "valid" | "invalid" {
    const report = this.incidentReport();
    if (!isFieldValid(IncidentModels.IncidentReportSchema.shape.personInvolvement, report.personInvolvement))
      return "invalid";
    if (
      report.personInvolvement === "Yes" &&
      !(report.groupInformation ?? []).every((g) =>
        isVisibleFieldsValid(IncidentModels.GroupInformationSchema, g as Record<string, unknown>),
      )
    )
      return "invalid";
    return "valid";
  }

  readonly incidentReport = model<IncidentReport>(
    IncidentModels.PartialIncidentReportSchema.parse({
      author: this.authenticationService.getCurrentAuthor()?.email,
      authorAffiliation: this.authenticationService.getCurrentAuthor()?.organization,
      publicAvalancheWarningService: this.authenticationService.getCurrentAuthor()?.organization,
      reportStatus: "Draft",
      groupInformation: [
        {
          anonymousGroupIdentifier: this.translateService.instant("incidentReportUI.groupUnknown"),
        } as IncidentModels.GroupInformation,
      ],
      victimInformation: [],
      attachments: [],
    } satisfies Partial<IncidentReport>) as IncidentReport,
  );

  get involvementsFatalitiesBurials() {
    const groups = this.incidentReport().groupInformation ?? [];
    const victims = this.incidentReport().victimInformation ?? [];
    const caughtOnly = victims.filter(
      (v) => v.caught === "Involved" && (!v.burialDegree || v.burialDegree === "NotBuried"),
    ).length;
    const fullyBuried = victims.filter((v) => v.burialDegree === "FullyBuried").length;
    const partlyBuriedHeadCovered = victims.filter((v) => v.burialDegree === "PartlyBuriedHeadCovered").length;
    const partlyBuriedHeadUncovered = victims.filter((v) => v.burialDegree === "PartlyBuriedHeadUncovered").length;
    const partlyBuried = victims.filter((v) => v.burialDegree === "PartlyBuried").length;
    return IncidentModels.InvolvementsFatalitiesBurialsSchema.parse({
      numberOfGroups: groups.length,
      numberInvolved: caughtOnly + fullyBuried + partlyBuriedHeadCovered + partlyBuriedHeadUncovered + partlyBuried,
      incidentActivity: uniq(groups.map((g) => g.incidentActivity).filter(Boolean)),
      incidentTerrainType: uniq(groups.map((g) => g.incidentTerrainType).filter(Boolean)),
      fatalities: victims.filter((v) => v.fatalInjured === "Fatal").length,
      injuredSurvivors: victims.filter((v) => v.fatalInjured === "Injured").length,
      uninjuredSurvivors: victims.filter((v) => v.fatalInjured === "Uninjured").length,
      caughtOnly,
      fullyBuried,
      partlyBuriedHeadCovered,
      partlyBuriedHeadUncovered,
      partlyBuried,
    } satisfies z.infer<typeof IncidentModels.InvolvementsFatalitiesBurialsSchema>);
  }

  newGroupInformation() {
    const anonymousGroupIdentifier = this.translateService.instant("incidentReportUI.groupName", {
      name: Math.random(),
    });
    const groupInformation = { anonymousGroupIdentifier: anonymousGroupIdentifier } as IncidentModels.GroupInformation;
    const report = this.incidentReport();
    const groups = [...(report.groupInformation ?? []), groupInformation];
    this.incidentReport.set({ ...report, groupInformation: groups });
    this.activeGroupIndex = groups.length - 1;
  }

  removeGroupInformation(index: number) {
    if (index === 0) return;
    const message = this.translateService.instant("incidentReportUI.dropGroup", { number: index + 1 });
    if (!confirm(message)) return;
    const report = this.incidentReport();
    const groups = (report.groupInformation ?? []).filter((_, i) => i !== index);
    this.incidentReport.set({ ...report, groupInformation: groups });
    if (this.activeGroupIndex >= groups.length) {
      this.activeGroupIndex = groups.length - 1;
    }
  }

  updateGroupInformation(index: number, updatedGroup: IncidentModels.GroupInformation) {
    const report = this.incidentReport();
    const groups = (report.groupInformation ?? []).map((g, i) => (i === index ? updatedGroup : g));
    this.incidentReport.set({ ...report, groupInformation: groups });
  }

  activeGroupSubTab: "overview" | "groups" | "victims" = "overview";
  activeGroupIndex = 0;
  activeVictimIndex = 0;

  isGroupValid(group: IncidentModels.GroupInformation): boolean {
    return isVisibleFieldsValid(IncidentModels.GroupInformationSchema, group as Record<string, unknown>);
  }

  collapsedAttachments: Record<string, boolean> = {};

  toggleAttachmentCollapse(fileName: string) {
    this.collapsedAttachments[fileName] = !this.collapsedAttachments[fileName];
  }

  isAttachmentCollapsed(fileName: string): boolean {
    return !!this.collapsedAttachments[fileName];
  }

  isAttachmentValid(attachment: any): boolean {
    return IncidentModels.IncidentAttachmentSchema.safeParse(attachment).success;
  }

  newVictimInformation() {
    const anonymousVictimIdentifier = this.translateService.instant("incidentReportUI.victimName", {
      name: Math.random(),
    });
    const victimInformation = { anonymousVictimIdentifier } as IncidentModels.VictimInformation;
    const report = this.incidentReport();
    const victims = [...(report.victimInformation ?? []), victimInformation];
    this.incidentReport.set({ ...report, victimInformation: victims });
    this.activeVictimIndex = victims.length - 1;
  }

  removeVictimInformation(index: number) {
    const message = this.translateService.instant("incidentReportUI.dropVictim", { number: index + 1 });
    if (!confirm(message)) return;
    const report = this.incidentReport();
    const victims = (report.victimInformation ?? []).filter((_, i) => i !== index);
    this.incidentReport.set({ ...report, victimInformation: victims });
    if (this.activeVictimIndex >= victims.length) {
      this.activeVictimIndex = Math.max(0, victims.length - 1);
    }
  }

  updateVictimInformation(index: number, updatedVictim: IncidentModels.VictimInformation) {
    const report = this.incidentReport();
    const victims = (report.victimInformation ?? []).map((v, i) => (i === index ? updatedVictim : v));
    this.incidentReport.set({ ...report, victimInformation: victims });
  }

  isVictimValid(victim: IncidentModels.VictimInformation): boolean {
    return isVisibleFieldsValid(IncidentModels.VictimInformationSchema, victim as Record<string, unknown>);
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

  private _lastLat: number | null | undefined;
  private _lastLng: number | null | undefined;
  private readonly reverseGeocodeTrigger$ = new Subject<[number, number]>();

  ngOnInit() {
    if (this.activeTab === "location") {
      setTimeout(() => this.initLocationMap(), 50);
    }
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.loadIncident(id);
    }
    this.startAutoSave();
    this.reverseGeocodeTrigger$
      .pipe(
        debounceTime(800),
        switchMap(([lat, lng]) =>
          forkJoin({
            addr: this.geocodingService.reverseGeocode(lat, lng).pipe(catchError(() => of(null))),
            regionId: this.regionsService.findRegionForCoordinates(lat, lng).pipe(catchError(() => of(null))),
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ addr, regionId }) => {
        this.incidentReport.update((r) => ({
          ...r,
          ...(addr && {
            country: addr.country ?? r.country,
            region: addr.state ?? r.region,
            municipality: addr.municipality ?? addr.city ?? addr.town ?? addr.village ?? r.municipality,
          }),
          ...(regionId && { avalancheRegion: regionId }),
        }));
      });
  }

  private loadIncident(id: string) {
    this.incidentService.getIncident(id).subscribe({
      next: (view) => {
        this.incidentId = view.id;
        this.updatedAt = new Date(view.updatedAt);
        const report = IncidentModels.PartialIncidentReportSchema.parse(view.data) as IncidentReport;
        this.incidentReport.set(report);
        this._lastLat = report.latitude;
        this._lastLng = report.longitude;
      },
      error: (error) => console.error("Failed to load incident", error),
    });
  }

  private startAutoSave() {
    this.lastSavedData = this.serializeReport(this.incidentReport());
    toObservable(this.incidentReport, { injector: this.injector })
      .pipe(
        map((report) => this.serializeReport(report)),
        distinctUntilChanged(),
        debounceTime(1000),
        concatMap((data) => this.saveIncident(data)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /** Serialize the report to JSON, dropping in-memory-only attachment fields. */
  private serializeReport(report: IncidentReport): string {
    return JSON.stringify(report, (key, value) => (key === "file" || key === "_previewUrl" ? undefined : value));
  }

  private saveIncident(data: string): Observable<unknown> {
    if (data === this.lastSavedData) return EMPTY;
    const region = this.authenticationService.getActiveRegionId();
    if (!region) return EMPTY;
    this.saveState = "saving";
    const request = this.incidentId
      ? this.incidentService.updateIncident(this.incidentId, data)
      : this.incidentService.createIncident(region, data);
    return request.pipe(
      tap((view) => {
        this.incidentId = view.id;
        this.updatedAt = new Date(view.updatedAt);
        this.lastSavedData = data;
        this.saveState = "saved";
      }),
      catchError((error) => {
        console.error("Failed to save incident", error);
        this.saveState = "error";
        return EMPTY;
      }),
    );
  }

  ngOnDestroy() {
    if (this.locationMapInstance) {
      this.locationMapInstance.remove();
    }
    if (this.incidentReport()?.attachments) {
      for (const attachment of this.incidentReport().attachments as any[]) {
        if (attachment._previewUrl) {
          URL.revokeObjectURL(attachment._previewUrl);
        }
      }
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
      this._lastLat = report.latitude;
      this._lastLng = report.longitude;
      this.reverseGeocodeTrigger$.next([report.latitude, report.longitude]);
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

  onReportStatusChange() {
    const currentAuthor = this.authenticationService.getCurrentAuthor();
    this.incidentReport.set({
      ...this.incidentReport(),
      author: currentAuthor?.email ?? this.incidentReport().author,
      authorAffiliation: currentAuthor?.organization ?? this.incidentReport().authorAffiliation,
    });
  }

  onLocationTypeChange(type: "Point" | "Line" | "Polygon") {
    this.activeDrawingMode = type;
  }

  onLocationFormChange(updatedReport: IncidentReport) {
    this.incidentReport.set({ ...updatedReport });
    this.drawOnMap();
    if (
      (updatedReport.latitude !== this._lastLat || updatedReport.longitude !== this._lastLng) &&
      updatedReport.latitude != null &&
      updatedReport.longitude != null
    ) {
      this.reverseGeocodeTrigger$.next([updatedReport.latitude, updatedReport.longitude]);
    }
    this._lastLat = updatedReport.latitude;
    this._lastLng = updatedReport.longitude;
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
    const attachment: any = {
      dateAdded: new Date(),
      dateCreated: undefined as unknown as Date,
      file,
      fileName: file.name,
      mediaType: file.type,
    };
    if (file.type.startsWith("image/")) {
      attachment._previewUrl = URL.createObjectURL(file);
    }
    this.incidentReport().attachments.push(attachment);
  }

  updateAttachment(index: number, updatedAttachment: z.infer<typeof IncidentModels.IncidentAttachmentSchema>) {
    const report = this.incidentReport();
    const attachments = (report.attachments ?? []).map((a, i) => (i === index ? updatedAttachment : a));
    this.incidentReport.set({ ...report, attachments });
  }

  removeAttachment(index: number) {
    const attachments = this.incidentReport().attachments;
    const message = this.translateService.instant("incidentReportUI.dropAttachment", {
      fileName: attachments[index].fileName,
    });
    if (!confirm(message)) return;
    const attachment = attachments[index] as any;
    if (attachment._previewUrl) {
      URL.revokeObjectURL(attachment._previewUrl);
    }
    attachments.splice(index, 1);
  }

  getAttachmentPreviewUrl(attachment: any): string | null {
    if (attachment.file && attachment.file.type.startsWith("image/")) {
      if (!attachment._previewUrl) {
        attachment._previewUrl = URL.createObjectURL(attachment.file);
      }
      return attachment._previewUrl;
    }
    if (attachment.uuid && attachment.mediaType?.startsWith("image/")) {
      return `${environment.apiBaseUrl}media/${attachment.uuid}`;
    }
    return null;
  }
}
