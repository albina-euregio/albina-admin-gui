import { Component, inject, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
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
export class IncidentReportComponent {
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
  readonly allTabs = ["meta", "general", "location", "avalanche", "group", "other-damages", "analysis"] as const;
  activeTab: (typeof this.allTabs)[number] = "general";

  get prevTab(): (typeof this.allTabs)[number] {
    const index = this.allTabs.indexOf(this.activeTab);
    return this.allTabs[Math.max(index - 1, 0)];
  }

  get nextTab(): (typeof this.allTabs)[number] {
    const index = this.allTabs.indexOf(this.activeTab);
    return this.allTabs[Math.min(index + 1, this.allTabs.length - 1)];
  }

  getValidationStatus(schema: z.ZodType): "valid" | "invalid" {
    const res = schema.safeParse(this.incidentReport());
    return res.success ? "valid" : "invalid";
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
}
