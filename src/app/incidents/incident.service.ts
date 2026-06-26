import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { rxResource, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { combineLatest, map, Observable } from "rxjs";

import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import type { components } from "../providers/openapi";
import {
  IncidentAttachment,
  IncidentAttachmentSchema,
  IncidentReport,
  PartialIncidentReportSchema,
} from "./incident-report.model";

type IncidentView = components["schemas"]["Incident"];

@Injectable()
export class IncidentService {
  private http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);
  private route = inject(ActivatedRoute);

  /**
   * Date range filter for the overview, as a `[start, end]` tuple bound to the
   * date picker. Defaults to the current season. Mutating it reloads
   * {@link incidentsForActiveRegion}.
   */
  readonly dateRange = signal<Date[]>([new Date(2025, 9, 1), new Date(2026, 9, 1)]); // 2025-10-01 – 2026-10-01

  /**
   * A region-scoped resource of incidents for the active region, reloading
   * automatically whenever the active region or {@link dateRange} changes
   * (idle when no region is selected).
   *
   * Call from an injection context (e.g. a component field initializer); the
   * returned resource is tied to that context's lifecycle.
   */
  incidentsForActiveRegion() {
    // Without authentication there is no active region, so fall back to a
    // `?region=AT-07` query parameter (e.g. http://localhost:4200/#/incidents?region=AT-07).
    const activeRegionId = toSignal(
      combineLatest([
        this.authenticationService.activeRegion$.pipe(map((r) => r?.id)),
        this.route.queryParamMap.pipe(map((p) => p.get("region") ?? undefined)),
      ]).pipe(map(([active, fromUrl]) => active ?? fromUrl)),
    );
    return rxResource({
      params: () => {
        const region = activeRegionId();
        if (!region) return undefined;
        const [startDate, endDate] = this.dateRange();
        return { region, startDate, endDate };
      },
      stream: ({ params: { region, startDate, endDate } }) => {
        const url = this.constantsService.getServerUrlGET("/incidents", {
          region,
          seasonYear: startDate.getMonth() >= 9 ? startDate.getFullYear() : startDate.getFullYear() - 1,
          startDate: this.constantsService.getISOStringWithTimezoneOffset(startDate),
          endDate: this.constantsService.getISOStringWithTimezoneOffset(
            new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999),
          ),
        });
        return this.http.get<IncidentView[]>(url).pipe(
          map((is) =>
            is.flatMap((i) => {
              const result = this.safeIncidentReport(i);
              if (!result.success) {
                console.warn(`Skipping incident ${i.id} that failed to parse`, result.error);
                return [];
              }
              return [result.data as IncidentReport];
            }),
          ),
        );
      },
      defaultValue: [] as IncidentReport[],
    });
  }

  private safeIncidentReport(i: IncidentView) {
    return PartialIncidentReportSchema.safeParse({ ...i, ...(i.data ?? {}) });
  }

  private toIncidentReport(i: IncidentView): IncidentReport {
    return PartialIncidentReportSchema.parse({ ...i, ...i.data }) as IncidentReport;
  }

  /** Get a single incident by id. */
  getIncident(id: string): Observable<IncidentReport> {
    const url = this.constantsService.getServerUrlGET("/incidents/{id}", null as never, { id });
    return this.http.get<IncidentView>(url).pipe(map((i) => this.toIncidentReport(i)));
  }

  /**
   * Create an incident. `data` is the serialized incident-report JSON; the
   * server validates and stores it verbatim.
   */
  createIncident(region: string, data: string): Observable<IncidentReport> {
    const url = this.constantsService.getServerUrlPOST("/incidents", { region });
    return this.http.post<IncidentView>(url, data).pipe(map((i) => this.toIncidentReport(i)));
  }

  /** Publish an existing incident's report data. */
  publishIncident(id: string, data: string): Observable<IncidentReport> {
    const url = this.constantsService.getServerUrlPOST("/incidents/{id}/publish", null as never, { id });
    return this.http.post<IncidentView>(url, data).pipe(map((i) => this.toIncidentReport(i)));
  }

  /** Unpublish an existing incident's report data. */
  unpublishIncident(id: string): Observable<void> {
    const url = this.constantsService.getServerUrlDELETE("/incidents/{id}/publish", null as never, { id });
    return this.http.delete<void>(url);
  }

  /** Update an existing incident's report data. */
  updateIncident(id: string, data: string): Observable<IncidentReport> {
    const url = this.constantsService.getServerUrlPUT("/incidents/{id}", null as never, { id });
    return this.http.put<IncidentView>(url, data).pipe(map((i) => this.toIncidentReport(i)));
  }

  /** Delete an incident by id. */
  deleteIncident(id: string): Observable<void> {
    const url = this.constantsService.getServerUrlDELETE("/incidents/{id}", null as never, { id });
    return this.http.delete<void>(url);
  }

  /** Upload an attachment for an incident. */
  uploadIncidentAttachment(id: string, attachment: IncidentAttachment): Observable<IncidentAttachment> {
    const url = this.constantsService.getServerUrlPOST("/incidents/{id}/attachment", null as never, { id });
    const formData = new FormData();
    formData.append("file", attachment.file);
    return this.http
      .post(url, formData)
      .pipe(map((json) => IncidentAttachmentSchema.partial().parse(json) as IncidentAttachment));
  }

  /** Get a single attachment of an incident by id. */
  getIncidentAttachment(id: string, attachment: IncidentAttachment): Observable<Blob> {
    const url = this.constantsService.getServerUrlGET("/incidents/{id}/attachment/{attachmentId}", null as never, {
      id,
      attachmentId: attachment.id,
    });
    return this.http.get(url, {
      headers: { Accept: "application/octet-stream" },
      responseType: "blob",
      observe: "body",
    });
  }

  /** Delete a single attachment of an incident by id. */
  deleteIncidentAttachment(id: string, attachment: IncidentAttachment): Observable<void> {
    const url = this.constantsService.getServerUrlDELETE("/incidents/{id}/attachment/{attachmentId}", null as never, {
      id,
      attachmentId: attachment.id,
    });
    return this.http.delete<void>(url);
  }
}
