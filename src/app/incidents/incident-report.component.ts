import { KeyValuePipe } from "@angular/common";
import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ZodInputComponent } from "app/shared/zod-input.component";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";

import { zEnumValues } from "../danger-sources/models/zod-util";
import { ToggleBtnGroup } from "../danger-sources/toggle-btn-group";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { IncidentReport, IncidentReportSchema } from "./models/incident-report.model";

@Component({
  selector: "app-incident-report",
  templateUrl: "incident-report.component.html",
  standalone: true,
  imports: [
    AccordionModule,
    BsDropdownModule,
    FormsModule,
    KeyValuePipe,
    ToggleBtnGroup,
    TranslateModule,
    ZodInputComponent,
  ],
})
export class IncidentReportComponent {
  constantsService = inject(ConstantsService);
  regionsService = inject(RegionsService);
  translateService = inject(TranslateService);

  readonly JSON = JSON;
  readonly Object = Object;
  readonly IncidentReportSchema = IncidentReportSchema;
  readonly zEnumValues = zEnumValues;
  readonly incidentReport = input<IncidentReport>({ sourceOfInformation: [], damagedAssets: [] } as IncidentReport);
  readonly disabled = input<boolean>(false);
  readonly valueChanged = output<void>();
}
