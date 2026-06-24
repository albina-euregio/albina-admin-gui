import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { rxResource, toSignal } from "@angular/core/rxjs-interop";
import { map, Observable } from "rxjs";

import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import type { components } from "../providers/openapi";
import {
  IncidentAttachment,
  IncidentAttachmentSchema,
  IncidentReport,
  PartialIncidentReportSchema,
} from "./models/incident-report.model";

type IncidentView = components["schemas"]["IncidentService.IncidentView"];

@Injectable()
export class IncidentService {
  private http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);

  /**
   * A region-scoped resource of all incidents for the active region, reloading
   * automatically whenever the active region changes (idle when none is selected).
   *
   * Call from an injection context (e.g. a component field initializer); the
   * returned resource is tied to that context's lifecycle.
   */
  incidentsForActiveRegion() {
    const activeRegionId = toSignal(this.authenticationService.activeRegion$.pipe(map((r) => r?.id)));
    return rxResource({
      params: () => activeRegionId(),
      stream: ({ params: region }) => this.getIncidents(region),
      defaultValue: [] as IncidentReport[],
    });
  }

  private toIncidentReport(i: IncidentView): IncidentReport {
    return PartialIncidentReportSchema.parse({ ...i, ...i.data }) as IncidentReport;
  }

  /** List all incidents stored for a region. Incidents that fail to parse are skipped. */
  getIncidents(region: string): Observable<IncidentReport[]> {
    const url = this.constantsService.getServerUrlGET("/incidents", { region });
    return this.http.get<IncidentView[]>(url).pipe(
      map((is) =>
        is.flatMap((i) => {
          const result = PartialIncidentReportSchema.safeParse({ ...i, ...i.data });
          if (!result.success) {
            console.warn(`Skipping incident ${i.id} that failed to parse`, result.error);
            return [];
          }
          return [result.data as IncidentReport];
        }),
      ),
    );
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
