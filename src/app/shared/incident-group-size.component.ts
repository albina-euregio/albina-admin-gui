import { Component, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-incident-group-size",
  templateUrl: "incident-group-size.component.html",
  standalone: true,
  imports: [FormsModule, TranslateModule],
})
export class IncidentGroupSizeComponent {
  readonly groupSize = model<unknown>();
  readonly groupSizeUnknown = model<unknown>(false);
  readonly disabled = input<boolean>(false);
  readonly cssClass = input<Record<string, boolean>>();
  readonly labelI18n = input<string>("");
}
