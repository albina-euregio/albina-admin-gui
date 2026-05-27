import { Component, inject, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";

import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { ZodSchemaFormComponent } from "../shared/zod-schema-form.component";
import { GeneralInformationSchema, IncidentReport, IncidentReportSchema } from "./models/incident-report.model";

@Component({
  selector: "app-incident-report",
  templateUrl: "incident-report.component.html",
  standalone: true,
  imports: [AccordionModule, BsDropdownModule, FormsModule, TranslateModule, ZodSchemaFormComponent],
})
export class IncidentReportComponent {
  constantsService = inject(ConstantsService);
  regionsService = inject(RegionsService);
  translateService = inject(TranslateService);

  readonly GeneralInformationSchema = GeneralInformationSchema;
  readonly IncidentReportSchema = IncidentReportSchema;
  readonly JSON = JSON;
  readonly Object = Object;

  readonly disabled = input<boolean>(false);
  readonly incidentReport = model<IncidentReport>({ sourceOfInformation: [], damagedAssets: [] } as IncidentReport);
}
