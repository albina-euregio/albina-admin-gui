import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";

import { ConstantsService } from "../providers/constants-service/constants.service";
import type { components } from "../providers/openapi";
import { IncidentAttachment, IncidentAttachmentSchema } from "./models/incident-report.model";

export type IncidentView = components["schemas"]["IncidentService.IncidentView"];

@Injectable()
export class IncidentService {
  private http = inject(HttpClient);
  private constantsService = inject(ConstantsService);

  /** List all incidents stored for a region. */
  getIncidents(region: string): Observable<IncidentView[]> {
    const url = this.constantsService.getServerUrlGET("/incidents", { region });
    return this.http.get<IncidentView[]>(url);
  }

  /** Get a single incident by id. */
  getIncident(id: string): Observable<IncidentView> {
    const url = this.constantsService.getServerUrlGET("/incidents/{id}", null as never, { id });
    return this.http.get<IncidentView>(url);
  }

  /**
   * Create an incident. `data` is the serialized incident-report JSON; the
   * server validates and stores it verbatim.
   */
  createIncident(region: string, data: string): Observable<IncidentView> {
    const url = this.constantsService.getServerUrlPOST("/incidents", { region });
    return this.http.post<IncidentView>(url, data);
  }

  /** Update an existing incident's report data. */
  updateIncident(id: string, data: string): Observable<IncidentView> {
    const url = this.constantsService.getServerUrlPUT("/incidents/{id}", null as never, { id });
    return this.http.put<IncidentView>(url, data);
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
  getIncidentAttachment(id: string, attachment: IncidentAttachment): Observable<IncidentAttachment> {
    const url = this.constantsService.getServerUrlGET("/incidents/{id}/attachment/{attachmentId}", null as never, {
      id,
      attachmentId: attachment.uuid,
    });
    return this.http.get(url).pipe(map((json) => IncidentAttachmentSchema.partial().parse(json) as IncidentAttachment));
  }

  /** Delete a single attachment of an incident by id. */
  deleteIncidentAttachment(id: string, attachment: IncidentAttachment): Observable<void> {
    const url = this.constantsService.getServerUrlDELETE("/incidents/{id}/attachment/{attachmentId}", null as never, {
      id,
      attachmentId: attachment.uuid,
    });
    return this.http.delete<void>(url);
  }
}
