import { DatePipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { BulletinsService } from "app/providers/bulletins-service/bulletins.service";

@Component({
  templateUrl: "publication-checklist.component.html",
  standalone: true,
  imports: [DatePipe, TranslateModule],
})
export class PublicationChecklistComponent implements OnInit {
  private activeRoute = inject(ActivatedRoute);
  bulletinsService = inject(BulletinsService);
  translateService = inject(TranslateService);
  date = "";
  checklistState = {
    website: { ok: false, problem: false, problemDescription: "" },
    email: { ok: false, problem: false, problemDescription: "" },
    whatsApp: { ok: false, problem: false, problemDescription: "" },
    telegram: { ok: false, problem: false, problemDescription: "" },
  };

  websiteLink() {
    return `https://avalanche.report/bulletin/${this.date}`;
  }

  onOkChange(item: keyof PublicationChecklistComponent["checklistState"], event: Event) {
    const isOk = (event.target as HTMLInputElement).checked;
    this.checklistState[item].ok = isOk;
    if (isOk) {
      this.checklistState[item].problem = false;
    }
  }

  onProblemChange(item: keyof PublicationChecklistComponent["checklistState"], event: Event) {
    const hasProblem = (event.target as HTMLInputElement).checked;
    this.checklistState[item].problem = hasProblem;
    if (hasProblem) {
      this.checklistState[item].ok = false;
      return;
    }

    this.checklistState[item].problemDescription = "";
  }

  ngOnInit() {
    this.activeRoute.params.subscribe((routeParams) => {
      this.date = routeParams.date;
      this.bulletinsService.sourceDates.setActiveDate(routeParams.date);
    });
  }
}
