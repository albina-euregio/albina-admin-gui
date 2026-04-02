import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { map } from "rxjs";

@Component({
  templateUrl: "publication-checklist.component.html",
  standalone: true,
  imports: [TranslateModule],
})
export class PublicationChecklistComponent {
  private route = inject(ActivatedRoute);

  readonly date = toSignal(this.route.paramMap.pipe(map((params) => params.get("date") ?? "")), { initialValue: "" });

  readonly websiteLink = computed(() => `https://avalanche.report/bulletin/${this.date()}`);
}
