import { Component, inject, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";

import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { ZodSchemaFormComponent } from "../shared/zod-schema-form.component";
import * as IncidentModels from "./models/incident-report.model";
import { IncidentReport } from "./models/incident-report.model";

@Component({
  selector: "app-incident-report",
  templateUrl: "incident-report.component.html",
  standalone: true,
  imports: [AccordionModule, BsDropdownModule, FormsModule, TranslateModule, ZodSchemaFormComponent],
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
  readonly incidentReport = model<IncidentReport>(
    IncidentModels.PartialIncidentReportSchema.parse({
      author: this.authenticationService.getCurrentAuthor()?.email,
      authorAffiliation: this.authenticationService.getCurrentAuthor()?.organization,
      publicAvalancheWarningService: this.authenticationService.getCurrentAuthor()?.organization,
      timestamp: new Date(),
      reportStatus: "Draft",
      sourceOfInformation: [],
      damagedAssets: [],
      dangerPattern: [],
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
