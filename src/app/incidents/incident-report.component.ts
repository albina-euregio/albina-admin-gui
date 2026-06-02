import { Component, inject, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";

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
  activeTab: "meta" | "general" | "location" | "avalanche" | "group" = "general";

  getMetaValidationStatus(): "valid" | "invalid" {
    const res = IncidentModels.MetaInformationSchema.safeParse(this.incidentReport());
    return res.success ? "valid" : "invalid";
  }

  getGeneralValidationStatus(): "valid" | "invalid" {
    const res = IncidentModels.GeneralInformationSchema.safeParse(this.incidentReport());
    return res.success ? "valid" : "invalid";
  }

  getAvalancheValidationStatus(): "valid" | "invalid" {
    const res = IncidentModels.AvalancheInformationSchema.safeParse(this.incidentReport());
    return res.success ? "valid" : "invalid";
  }

  getLocationValidationStatus(): "valid" | "invalid" {
    const res = IncidentModels.LocationInformationSchema.safeParse(this.incidentReport());
    return res.success ? "valid" : "invalid";
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
    }) as IncidentReport,
  );

  newGroupInformation() {
    const groupInformation = {
      anonymousGroupIdentifier: "Group " + Math.random(),
    } as IncidentModels.GroupInformation;
    this.incidentReport().groupInformation.push(groupInformation);
  }

  removeGroupInformation(index: number) {
    if (!confirm(`Kill group ${index + 1}?`)) return;
    this.incidentReport().groupInformation.splice(index, 1);
  }
}
