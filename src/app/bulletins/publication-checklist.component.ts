import { DatePipe, formatDate } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { BulletinStatus, PublicationChannel } from "app/enums/enums";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { BulletinsService } from "app/providers/bulletins-service/bulletins.service";
import { LocalStorageService } from "app/providers/local-storage-service/local-storage.service";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { combineLatest, debounceTime, distinctUntilChanged, map, Subject, Subscription, tap } from "rxjs";

import { ChecklistItemModel, PublicationStatusModel } from "../models/publication-checklist.model";
import { BulletinStatusBadgeComponent } from "../shared/bulletin-status-badge.component";
import { ModalPublishComponent } from "./modal-publish.component";
import { PublicationTriggerNotificationsComponent } from "./publication-trigger-notifications.component";

const PUBLICATION_LANGUAGES: string[] = ["de", "it", "en"];
const PUBLICATION_STATUS_FAST_POLL_MS = 1000; // when publication is in progress, poll every second to update status as fast as possible
const PUBLICATION_STATUS_SLOW_POLL_MS = 10000; // otherwise, poll every 10 seconds (to detect new publication attempts)

@Component({
  templateUrl: "publication-checklist.component.html",
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslateModule,
    PublicationTriggerNotificationsComponent,
    BulletinStatusBadgeComponent,
  ],
})
export class PublicationChecklistComponent implements OnInit, OnDestroy {
  private authenticationService = inject(AuthenticationService);
  private modalService = inject(BsModalService);
  private localStorageService = inject(LocalStorageService);
  bulletinsService = inject(BulletinsService);
  translateService = inject(TranslateService);
  regionsService = inject(RegionsService);

  private activeRoute = inject(ActivatedRoute);
  private routeParamsSubscription: Subscription;
  private checklistSaveSubscription: Subscription;
  private publicationStatusSubscription: Subscription;
  private publicationStatusPollTimeout: ReturnType<typeof setTimeout> | null = null;
  private saveChecklist = new Subject<{
    date: string;
    regionId: string;
    checklist: ChecklistItemModel[];
  }>();

  date = "";
  checklistItems: ChecklistItemModel[] = [];
  regionId = "";
  publicationStatus: PublicationStatusModel;

  publishBulletinsModalRef: BsModalRef;

  get isWebsiteChecked(): boolean {
    return this.checklistItems[0]?.ok !== undefined;
  }

  get isPublicationDisabled(): boolean {
    return (
      this.publicationStatus?.isBeingPublished ||
      (this.publicationStatus?.status !== BulletinStatus.published &&
        this.publicationStatus?.status !== BulletinStatus.republished &&
        this.publicationStatus?.status !== BulletinStatus.submitted &&
        this.publicationStatus?.status !== BulletinStatus.resubmitted)
    );
  }

  constructor() {
    this.routeParamsSubscription = new Subscription();
    this.publicationStatusSubscription = new Subscription();
    this.checklistSaveSubscription = this.saveChecklist
      .pipe(debounceTime(500))
      .subscribe(({ date, regionId, checklist }) => {
        this.localStorageService.setPublicationChecklist(date, regionId, checklist);
      });
  }

  ngOnInit() {
    const date$ = this.activeRoute.params.pipe(
      map(({ date }) => date as string),
      distinctUntilChanged(),
    );
    const regionId$ = this.authenticationService.activeRegion$.pipe(
      map((region) => region?.id),
      distinctUntilChanged(),
    );

    // update checklist when date or region changes and start publication status polling
    this.routeParamsSubscription = combineLatest([date$, regionId$])
      .pipe(
        tap(([date, regionId]) => {
          this.date = date;
          this.regionId = regionId;
          this.bulletinsService.sourceDates.setActiveDate(date);
          this.checklistItems = this.getInitialChecklistItems(date, regionId);
          this.startPublicationStatusPolling();
        }),
      )
      .subscribe({
        error: (error) => {
          console.error("Publication checklist context could not be initialized!", error);
        },
      });
  }

  ngOnDestroy() {
    this.stopPublicationStatusPolling();
    this.publicationStatusSubscription.unsubscribe();
    this.routeParamsSubscription.unsubscribe();
    this.checklistSaveSubscription.unsubscribe();
  }

  getSocialMediaUrl(publicationChannel: PublicationChannel, language?: string) {
    const lang = language ?? this.translateService.getCurrentLang();
    const urls = this.regionsService.eawsRegion(this.regionId)?.aws[0].url;
    if (!urls) return;
    return urls[`${publicationChannel}:${lang}`];
  }

  getWebsiteUrl(publicationLanguage?: string): string {
    const lang = publicationLanguage ?? this.translateService.getCurrentLang();
    const urls = this.regionsService.eawsRegion(this.regionId)?.aws[0].url;
    if (!urls) return;
    return urls[lang];
  }

  getPublicationLink(publicationChannel: PublicationChannel, publicationLanguage?: string): string | undefined {
    const lang = publicationLanguage ?? this.translateService.getCurrentLang();
    if (publicationChannel === PublicationChannel.Website) {
      return `${this.getWebsiteUrl(lang)}/${this.date}`;
    }
    return this.getSocialMediaUrl(publicationChannel, lang);
  }

  private createChecklistItems(): ChecklistItemModel[] {
    return [
      {
        publicationChannel: PublicationChannel.Website,
        title: "Website",
        ok: undefined,
        problemDescription: "",
      },
      {
        publicationChannel: PublicationChannel.WhatsApp,
        title: "WhatsApp",
        ok: undefined,
        problemDescription: "",
      },
      {
        publicationChannel: PublicationChannel.Telegram,
        title: "Telegram",
        ok: undefined,
        problemDescription: "",
      },
      {
        publicationChannel: PublicationChannel.Email,
        title: "E-Mail",
        ok: undefined,
        problemDescription: "",
      },
    ];
  }

  onOkChange(index: number, event: Event) {
    const item = this.checklistItems[index];
    const isOk = (event.target as HTMLInputElement).checked;
    if (isOk) {
      item.ok = true;
    } else if (item.ok === true) {
      item.ok = undefined;
    }
    this.queueChecklistSave();
  }

  onProblemChange(index: number, event: Event) {
    const item = this.checklistItems[index];
    const hasProblem = (event.target as HTMLInputElement).checked;
    if (hasProblem) {
      item.ok = false;
      this.queueChecklistSave();
      return;
    }

    if (item.ok === false) {
      item.ok = undefined;
      item.problemDescription = "";
    }
    this.queueChecklistSave();
  }

  onProblemDescriptionChange(index: number, event: Event) {
    this.checklistItems[index].problemDescription = (event.target as HTMLInputElement).value;
    this.queueChecklistSave();
  }

  copyToClipboard(text: string | null) {
    if (!text?.trim()) {
      return;
    }
    void navigator.clipboard.writeText(text.trim());
  }

  getSocialIconClass(publicationChannel: PublicationChannel): "ph ph-telegram-logo" | "ph ph-whatsapp-logo" {
    return publicationChannel === PublicationChannel.Telegram ? "ph ph-telegram-logo" : "ph ph-whatsapp-logo";
  }

  getManualSendDescription(publicationChannel: PublicationChannel): string {
    if (publicationChannel === PublicationChannel.Telegram) {
      return this.translateService.instant("bulletins.publicationChecklist.manualSend.description.telegram");
    }
    return this.translateService.instant("bulletins.publicationChecklist.manualSend.description.whatsapp");
  }

  getManualSendMessage(language: string): string {
    const bulletinDateLabel = formatDate(this.getActiveDate()[1], "fullDate", language, "UTC");
    const bulletinLink = `${this.getWebsiteUrl(language)}/${this.date}`;

    switch (language) {
      case "de":
        return "Lawinenvorhersage für " + bulletinDateLabel + ": " + bulletinLink;
      case "en":
        return "Avalanche forecast for " + bulletinDateLabel + ": " + bulletinLink;
      case "it":
        return "Previsione valanghe per " + bulletinDateLabel + ": " + bulletinLink;
    }
  }

  getManualSendEntries(publicationChannel: PublicationChannel): { language: string; url: string; message: string }[] {
    const entries: { language: string; url: string; message: string }[] = [];
    for (const language of PUBLICATION_LANGUAGES) {
      const url = this.getSocialMediaUrl(publicationChannel, language);
      if (!url) {
        continue;
      }
      entries.push({
        language,
        url,
        message: this.getManualSendMessage(language),
      });
    }
    return entries;
  }

  getActiveDate(): [Date, Date] {
    return this.bulletinsService.sourceDates.activeDate;
  }

  publish(event: Event, date: [Date, Date], change = false) {
    event.stopPropagation();
    const message =
      "<b>" + this.translateService.instant("bulletins.table.publishBulletinsDialog.message") + "</b><br><br>";
    this.openPublishBulletinsModal(message, date, change);
  }

  openPublishBulletinsModal(message: string, date: [Date, Date], change: boolean) {
    const initialState: Partial<ModalPublishComponent> = {
      text: message,
      date: date,
      change: change,
      callbacks: {
        onSuccess: () => {
          this.refreshPublicationStatusNow();
        },
        onError: (error, isChange) => {
          console.error(
            isChange ? "Bulletins could not be published (no messages)!" : "Bulletins could not be published!",
            error,
          );
          this.refreshPublicationStatusNow();
        },
      },
    };
    this.publishBulletinsModalRef = this.modalService.show(ModalPublishComponent, { initialState });
  }

  private startPublicationStatusPolling() {
    this.clearPublicationStatusPollTimeout();
    this.publicationStatusSubscription.unsubscribe();
    this.refreshPublicationStatusNow();
  }

  private stopPublicationStatusPolling() {
    this.clearPublicationStatusPollTimeout();
  }

  private clearPublicationStatusPollTimeout() {
    if (this.publicationStatusPollTimeout) {
      clearTimeout(this.publicationStatusPollTimeout);
      this.publicationStatusPollTimeout = null;
    }
  }

  private refreshPublicationStatusNow() {
    if (!this.regionId) {
      return;
    }

    this.clearPublicationStatusPollTimeout();
    this.publicationStatusSubscription.unsubscribe();

    this.publicationStatusSubscription = this.bulletinsService.getPublicationStatus(this.regionId).subscribe({
      next: (data) => {
        this.publicationStatus = data;
        const pollingIntervalMs = data?.isBeingPublished
          ? PUBLICATION_STATUS_FAST_POLL_MS
          : PUBLICATION_STATUS_SLOW_POLL_MS;
        this.publicationStatusPollTimeout = setTimeout(() => {
          this.refreshPublicationStatusNow();
        }, pollingIntervalMs);
      },
      error: (error) => {
        console.error("Publication status could not be loaded!", error);
        this.publicationStatusPollTimeout = setTimeout(() => {
          this.refreshPublicationStatusNow();
        }, PUBLICATION_STATUS_SLOW_POLL_MS);
      },
    });
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
    return this.createChecklistItems();
  }
}
