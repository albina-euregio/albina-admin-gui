import { DatePipe } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { BulletinsService } from "app/providers/bulletins-service/bulletins.service";
import { LocalStorageService } from "app/providers/local-storage-service/local-storage.service";
import { debounceTime, Subject, Subscription } from "rxjs";
import { groupBy, mergeMap } from "rxjs/operators";

import { ChecklistItemModel } from "../models/checklist.model";

@Component({
  templateUrl: "publication-checklist.component.html",
  standalone: true,
  imports: [DatePipe, TranslateModule],
})
export class PublicationChecklistComponent implements OnInit, OnDestroy {
  private activeRoute = inject(ActivatedRoute);
  private authenticationService = inject(AuthenticationService);
  bulletinsService = inject(BulletinsService);
  translateService = inject(TranslateService);
  localStorageService = inject(LocalStorageService);

  private routeParamsSubscription: Subscription;
  private checklistSaveSubscription: Subscription;
  private saveChecklist = new Subject<{ date: string; regionId: string; checklist: ChecklistItemModel[] }>();

  date = "";
  checklistItems: ChecklistItemModel[] = [];
  regionId: string;

  constructor() {
    this.routeParamsSubscription = new Subscription();
    this.checklistSaveSubscription = this.saveChecklist
      .pipe(debounceTime(1000))
      .subscribe(({ date, regionId, checklist }) => {
        this.localStorageService.setPublicationChecklist(date, regionId, checklist);
      });
  }

  private createChecklistItems(date: string): ChecklistItemModel[] {
    return [
      {
        title: "Website",
        description: "bulletins.publicationChecklist.descWebsite",
        link: `https://lawinen.report/bulletin/${date}`,
        ok: false,
        problem: false,
        problemDescription: "",
      },
      {
        title: "Email",
        description: "bulletins.publicationChecklist.descEmail",
        ok: false,
        problem: false,
        problemDescription: "",
      },
      {
        title: "WhatsApp",
        description: "bulletins.publicationChecklist.descMessage",
        link: "https://www.whatsapp.com/channel/0029Vb9EFivJUM2ShOiocj3h",
        ok: false,
        problem: false,
        problemDescription: "",
      },
      {
        title: "Telegram",
        description: "bulletins.publicationChecklist.descMessage",
        link: "https://t.me/s/lawinenwarndienst_tirol",
        ok: false,
        problem: false,
        problemDescription: "",
      },
    ];
  }

  onOkChange(index: number, event: Event) {
    const item = this.checklistItems[index];
    const isOk = (event.target as HTMLInputElement).checked;
    item.ok = isOk;
    if (isOk) {
      item.problem = false;
    }
    this.queueChecklistSave();
  }

  onProblemChange(index: number, event: Event) {
    const item = this.checklistItems[index];
    const hasProblem = (event.target as HTMLInputElement).checked;
    item.problem = hasProblem;
    if (hasProblem) {
      item.ok = false;
      this.queueChecklistSave();
      return;
    }

    item.problemDescription = "";
    this.queueChecklistSave();
  }

  onProblemDescriptionChange(index: number, event: Event) {
    this.checklistItems[index].problemDescription = (event.target as HTMLInputElement).value;
    this.queueChecklistSave();
  }

  private queueChecklistSave() {
    this.saveChecklist.next({
      date: this.date,
      regionId: this.regionId,
      checklist: this.checklistItems,
    });
  }

  private getInitialChecklistItems(date: string, regionId: string): ChecklistItemModel[] {
    const savedChecklist = this.localStorageService.getPublicationChecklist(date, regionId);
    if (savedChecklist.length > 0) {
      return savedChecklist;
    }
    return this.createChecklistItems(date);
  }

  ngOnInit() {
    this.routeParamsSubscription = this.activeRoute.params.subscribe(({ date }) => {
      this.date = date;
      this.bulletinsService.sourceDates.setActiveDate(date);
      this.regionId = this.authenticationService.getActiveRegionId();
      this.checklistItems = this.getInitialChecklistItems(this.date, this.regionId);
    });
  }

  ngOnDestroy() {
    this.routeParamsSubscription.unsubscribe();
    this.checklistSaveSubscription.unsubscribe();
  }
}
