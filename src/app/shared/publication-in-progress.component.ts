import { DatePipe } from "@angular/common";
import { Component, inject, OnDestroy, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";

import { PublicationStatusModel } from "../models/publication-checklist.model";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";

@Component({
  selector: "app-publication-in-progress",
  templateUrl: `publication-in-progress.component.html`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [DatePipe, TranslatePipe],
})
export class PublicationInProgressComponent implements OnInit, OnDestroy {
  private bulletinsService = inject(BulletinsService);
  translateService = inject(TranslateService);

  publicationStatus: PublicationStatusModel | undefined;

  private subscription = new Subscription();

  ngOnInit() {
    this.subscription = this.bulletinsService.publicationStatus$.subscribe((status) => {
      this.publicationStatus = status;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
