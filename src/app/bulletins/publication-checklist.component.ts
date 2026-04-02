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

  websiteLink() {
    return `https://avalanche.report/bulletin/${this.date}`;
  }

  ngOnInit() {
    this.activeRoute.params.subscribe((routeParams) => {
      this.date = routeParams.date;
      this.bulletinsService.sourceDates.setActiveDate(routeParams.date);
    });
  }
}
