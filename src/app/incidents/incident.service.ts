import { inject, Injectable, signal } from "@angular/core";
import { rxResource, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { combineLatest, from, map, Observable } from "rxjs";

import * as albinaApi from "../providers/albina-api";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import {
  IncidentAttachment,
  IncidentAttachmentSchema,
  IncidentReport,
  PartialIncidentReportSchema,
} from "./incident-report.model";

type IncidentView = albinaApi.Incident;

@Injectable()
export class IncidentService {
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
      stream: ({ params: { region, startDate, endDate } }) =>
        from(
          albinaApi.getIncidents({
            query: {
              region,
              seasonYear: startDate.getMonth() >= 9 ? startDate.getFullYear() : startDate.getFullYear() - 1,
              startDate: this.constantsService.getISOStringWithTimezoneOffset(startDate),
              endDate: this.constantsService.getISOStringWithTimezoneOffset(
                new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999),
              ),
            },
            throwOnError: true,
          }),
        ).pipe(
          // The spec types the response as `string`, but it is deserialized to the incident list.
          map(({ data }) => data as unknown as IncidentView[]),
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
        ),
      defaultValue: [] as IncidentReport[],
    });
  }

  private safeIncidentReport(i: IncidentView) {
    return PartialIncidentReportSchema.safeParse(
      this.migrateGroupAffiliation({ ...(i.data ?? i.publicData ?? {}), ...i }),
    );
  }

  private toIncidentReport(i: IncidentView): IncidentReport {
    return PartialIncidentReportSchema.parse(
      this.migrateGroupAffiliation({ ...(i.data ?? i.publicData ?? {}), ...i }),
    ) as IncidentReport;
  }

  /**
   * Migrate legacy incidents where a victim's group affiliation was stored as the group's display
   * name in `anonymousGroupIdentifier`. Groups now carry a stable `id` referenced by the victim's
   * `groupId`, so backfill group ids and remap each victim by matching its old name to a group. Run
   * before parsing, which then drops the legacy victim field. Newer reports are left unchanged.
   */
  private migrateGroupAffiliation(raw: Record<string, unknown>): Record<string, unknown> {
    const groups = (raw.groupInformation as { id?: string; anonymousGroupIdentifier?: string }[] | undefined) ?? [];
    groups.forEach((group) => (group.id ??= crypto.randomUUID()));
    const victims = raw.victimInformation as { groupId?: string; anonymousGroupIdentifier?: string }[] | undefined;
    victims?.forEach((victim) => {
      if (victim.groupId == null && victim.anonymousGroupIdentifier != null) {
        victim.groupId = groups.find((g) => g.anonymousGroupIdentifier === victim.anonymousGroupIdentifier)?.id;
      }
    });
    return raw;
  }

  /** Get a single incident by id. */
  getIncident(id: string): Observable<IncidentReport> {
    return from(albinaApi.getIncident({ path: { id }, throwOnError: true })).pipe(
      // The spec types the response as `string`, but it is deserialized to an incident.
      map(({ data }) => this.toIncidentReport(data as unknown as IncidentView)),
    );
  }

  /**
   * Create an incident. `data` is the serialized incident-report JSON; the
   * server validates and stores it verbatim.
   */
  createIncident(region: string, data: string): Observable<IncidentReport> {
    return from(albinaApi.createIncident({ query: { region }, body: data, throwOnError: true })).pipe(
      map((res) => this.toIncidentReport(res.data)),
    );
  }

  /** Publish an existing incident's report data. */
  publishIncident(id: string, data: string): Observable<IncidentReport> {
    return from(albinaApi.publishIncident({ path: { id }, body: data, throwOnError: true })).pipe(
      map((res) => this.toIncidentReport(res.data)),
    );
  }

  /** Unpublish an existing incident's report data. */
  unpublishIncident(id: string): Observable<void> {
    return from(albinaApi.unpublishIncident({ path: { id }, throwOnError: true })).pipe(map(() => undefined));
  }

  /** Update an existing incident's report data. */
  updateIncident(id: string, data: string): Observable<IncidentReport> {
    return from(albinaApi.updateIncident({ path: { id }, body: data, throwOnError: true })).pipe(
      map((res) => this.toIncidentReport(res.data)),
    );
  }

  /** Delete an incident by id. */
  deleteIncident(id: string): Observable<void> {
    return from(albinaApi.deleteIncident({ path: { id }, throwOnError: true })).pipe(map(() => undefined));
  }

  /** Upload an attachment for an incident. */
  uploadIncidentAttachment(id: string, attachment: IncidentAttachment): Observable<IncidentAttachment> {
    return from(
      albinaApi.uploadIncidentAttachment({
        path: { id },
        body: { file: attachment.file ?? undefined },
        throwOnError: true,
      }),
    ).pipe(map((res) => IncidentAttachmentSchema.partial().parse(res.data) as IncidentAttachment));
  }

  /** Get a single attachment of an incident by id. */
  getIncidentAttachment(id: string, attachment: IncidentAttachment): Observable<Blob> {
    return from(
      albinaApi.getIncidentAttachment({
        path: { id, attachmentId: attachment.id! },
        headers: { Accept: "application/octet-stream" },
        // `responseType` is not part of the typed options, but Angular's HttpClient
        // honours it so the binary attachment is returned as a Blob instead of parsed JSON.
        responseType: "blob",
        throwOnError: true,
      } as albinaApi.Options<albinaApi.GetIncidentAttachmentData, true>),
    ).pipe(map((res) => res.data as Blob));
  }

  /** Delete a single attachment of an incident by id. */
  deleteIncidentAttachment(id: string, attachment: IncidentAttachment): Observable<void> {
    return from(
      albinaApi.deleteIncidentAttachment({ path: { id, attachmentId: attachment.id! }, throwOnError: true }),
    ).pipe(map(() => undefined));
  }
}
