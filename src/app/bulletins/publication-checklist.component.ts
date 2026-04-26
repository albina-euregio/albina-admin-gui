import { DatePipe, formatDate } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { BulletinStatus, PublicationChannel } from "app/enums/enums";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { BulletinsService } from "app/providers/bulletins-service/bulletins.service";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { combineLatest, debounceTime, distinctUntilChanged, map, Subject, Subscription, tap } from "rxjs";

import { ChecklistItemModel, PublicationStatusModel } from "../models/publication-checklist.model";
import { BulletinStatusBadgeComponent } from "../shared/bulletin-status-badge.component";
import { ModalConfirmComponent } from "./modal-confirm.component";
import { PublicationTriggerNotificationsComponent } from "./publication-trigger-notifications.component";

const PUBLICATION_LANGUAGES: string[] = ["de", "it", "en"];
const CHECKLIST_CHANNELS: PublicationChannel[] = [
  PublicationChannel.Website,
  PublicationChannel.WhatsApp,
  PublicationChannel.Telegram,
  PublicationChannel.Email,
];
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
  bulletinsService = inject(BulletinsService);
  translateService = inject(TranslateService);
  regionsService = inject(RegionsService);

  private activeRoute = inject(ActivatedRoute);
  private routeParamsSubscription: Subscription;
  private checklistLoadSubscription: Subscription;
  private checklistDraftSubscription: Subscription;
  private checklistServerSaveSubscription: Subscription;
  private publicationStatusSubscription: Subscription;
  private publicationStatusPollTimeout: ReturnType<typeof setTimeout> | null = null;
  private draftSave = new Subject<void>();

  date = "";
  isReadOnly = false;
  checklistItems: ChecklistItemModel[] = [];
  activeChecklistId: string | undefined;
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

  get publicationDisabledReason(): string {
    if (this.publicationStatus?.isBeingPublished) {
      return this.translateService.instant("bulletins.publicationChecklist.publishDisabled.inProgress");
    }
    return this.translateService.instant("bulletins.publicationChecklist.publishDisabled.wrongStatus");
  }

  constructor() {
    this.routeParamsSubscription = new Subscription();
    this.publicationStatusSubscription = new Subscription();
    this.checklistLoadSubscription = new Subscription();
    this.checklistServerSaveSubscription = new Subscription();
    this.checklistDraftSubscription = this.draftSave
      .pipe(
        debounceTime(500),
        tap(() => localStorage.setItem(this.draftKey, JSON.stringify(this.checklistItems))),
      )
      .subscribe();
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
          this.activeChecklistId = undefined;
          this.bulletinsService.sourceDates.setActiveDate(date);
          this.checklistItems = this.createChecklistItems();
          this.loadChecklistItems(date, regionId);
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
    this.checklistLoadSubscription.unsubscribe();
    this.checklistDraftSubscription.unsubscribe();
    this.checklistServerSaveSubscription.unsubscribe();
    this.publicationStatusSubscription.unsubscribe();
    this.routeParamsSubscription.unsubscribe();
  }

  getSocialMediaUrl(publicationChannel: PublicationChannel, language?: string) {
    const lang = language ?? this.translateService.getCurrentLang();
    const urls = this.regionsService.eawsRegion(this.regionId)?.aws[0].url;
    if (!urls) return;
    return urls[`${publicationChannel}:${lang}`];
  }

  getEnabledLanguages(publicationChannel: PublicationChannel): string[] {
    let enabledLanguages: string[];
    if (publicationChannel === PublicationChannel.Email) {
      enabledLanguages = [...PUBLICATION_LANGUAGES]; // email per default available for all publication languages
    } else {
      const urls = this.regionsService.eawsRegion(this.regionId)?.aws[0].url;
      if (!urls) return [];
      enabledLanguages = PUBLICATION_LANGUAGES.filter((lang) => !!urls[`${publicationChannel}:${lang}`]);
    }
    if (enabledLanguages.length > 0) {
      enabledLanguages.push("all"); // add "all" option if there is at least one enabled language
    }
    return enabledLanguages;
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

  private mergeChecklistItems(saved: ChecklistItemModel[]): ChecklistItemModel[] {
    const savedByChannel = new Map(saved.map((item) => [item.publicationChannel, item]));
    return this.createChecklistItems().map((item) => savedByChannel.get(item.publicationChannel) ?? item);
  }

  private createChecklistItems(): ChecklistItemModel[] {
    const defaultItems = CHECKLIST_CHANNELS.map((publicationChannel) => ({
      publicationChannel,
      ok: undefined,
      problemDescription: "",
    }));

    return defaultItems.filter((item) => {
      if (item.publicationChannel === PublicationChannel.Website) {
        return true; // website should always be in the checklist
      } else if (item.publicationChannel === PublicationChannel.Email) {
        return true; // no reliable way to filter out email at the moment
      } else {
        return !!this.getSocialMediaUrl(item.publicationChannel);
      }
    });
  }

  onOkChange(index: number, event: Event) {
    const item = this.checklistItems[index];
    const isOk = (event.target as HTMLInputElement).checked;
    if (isOk) {
      item.ok = true;
    } else if (item.ok === true) {
      item.ok = undefined;
    }
    this.queueDraftSave();
  }

  onProblemChange(index: number, event: Event) {
    const item = this.checklistItems[index];
    const hasProblem = (event.target as HTMLInputElement).checked;
    if (hasProblem) {
      item.ok = false;
      this.queueDraftSave();
      return;
    }

    if (item.ok === false) {
      item.ok = undefined;
      item.problemDescription = "";
    }
    this.queueDraftSave();
  }

  onProblemDescriptionChange(index: number, event: Event) {
    this.checklistItems[index].problemDescription = (event.target as HTMLInputElement).value;
    this.queueDraftSave();
  }

  private get draftKey(): string {
    return `publication_checklist_draft_${this.date}_${this.regionId}`;
  }

  private queueDraftSave(): void {
    this.draftSave.next();
  }

  private loadDraftFromLocalStorage(): ChecklistItemModel[] | null {
    try {
      const raw = localStorage.getItem(this.draftKey);
      return raw ? (JSON.parse(raw) as ChecklistItemModel[]) : null;
    } catch {
      return null;
    }
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

  getChannelName(publicationChannel: PublicationChannel): string {
    return this.translateService.instant(`bulletins.publicationChecklist.channel.${publicationChannel}`);
  }

  getLanguageName(language: string): string {
    return this.translateService.instant(`menu.${language}`);
  }

  getManualSendDescription(publicationChannel: PublicationChannel): string {
    if (publicationChannel === PublicationChannel.Telegram) {
      return this.translateService.instant("bulletins.publicationChecklist.manualSend.description.telegram");
    }
    return this.translateService.instant("bulletins.publicationChecklist.manualSend.description.whatsapp");
  }

  getManualSendMessage(language: string): string {
    const bulletinDateLabel = this.getFormattedDate(language);
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

  getFormattedDate(language = this.translateService.getCurrentLang()): string {
    return formatDate(this.getActiveDate()[1], "fullDate", language, "UTC");
  }

  publish(event: Event, date: [Date, Date], change = false) {
    event.stopPropagation();
    const regionName = this.translateService.instant(this.regionsService.getRegionName(this.regionId));
    const message = [
      `<b>${this.translateService.instant("bulletins.table.publishBulletinsDialog.message")}</b>`,
      `<span class="text-body-secondary">${regionName} (${this.regionId})<br>${this.getFormattedDate()}</span>`,
    ].join("<br>");
    this.openPublishBulletinsModal(message, date, change);
  }

  openPublishBulletinsModal(message: string, date: [Date, Date], change: boolean) {
    const initialState: Partial<ModalConfirmComponent> = {
      text: message,
      acceptKey: "button.yes",
      onConfirm: () => {
        this.bulletinsService
          .publishOrChangeBulletins(date, this.authenticationService.getActiveRegionId(), change)
          .subscribe({
            next: () => {
              this.activeChecklistId = undefined;
              this.checklistItems = this.createChecklistItems();
              this.isReadOnly = false;
              localStorage.removeItem(this.draftKey);
              this.refreshPublicationStatusNow();
            },
            error: (error) => {
              console.error(
                change ? "Bulletins could not be published (no messages)!" : "Bulletins could not be published!",
                error,
              );
              this.refreshPublicationStatusNow();
            },
          });
      },
    };
    this.publishBulletinsModalRef = this.modalService.show(ModalConfirmComponent, { initialState });
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

  saveAndLock(): void {
    this.checklistServerSaveSubscription.unsubscribe();
    this.checklistServerSaveSubscription = this.bulletinsService
      .savePublicationChecklist(this.date, this.regionId, this.checklistItems, this.activeChecklistId)
      .subscribe({
        next: (saved) => {
          this.activeChecklistId = saved.checklistId;
          this.isReadOnly = true;
          localStorage.removeItem(this.draftKey);
        },
        error: (error) => {
          console.error("Publication checklist could not be saved to server!", error);
        },
      });
  }

  enterEditMode(): void {
    this.isReadOnly = false;
  }

  private loadChecklistItems(date: string, regionId: string): void {
    if (!date || !regionId) {
      this.checklistItems = this.createChecklistItems();
      return;
    }

    this.checklistLoadSubscription.unsubscribe();
    this.checklistLoadSubscription = this.bulletinsService.getPublicationChecklists(date, regionId).subscribe({
      next: (savedChecklists) => {
        const latestChecklist = savedChecklists[0];
        this.activeChecklistId = latestChecklist?.checklistId;
        const hasSaved = !!latestChecklist?.checklist?.length;
        if (hasSaved) {
          this.checklistItems = this.mergeChecklistItems(latestChecklist.checklist);
          this.isReadOnly = true;
        } else {
          this.checklistItems = this.loadDraftFromLocalStorage() ?? this.createChecklistItems();
          this.isReadOnly = false;
        }
      },
      error: (error) => {
        console.error("Publication checklist could not be loaded from server!", error);
        this.activeChecklistId = undefined;
        this.checklistItems = this.loadDraftFromLocalStorage() ?? this.createChecklistItems();
        this.isReadOnly = false;
      },
    });
  }
}
