import { CommonModule, DatePipe, formatDate } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { BulletinStatus, PublicationChannel } from "app/enums/enums";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { BulletinsService } from "app/providers/bulletins-service/bulletins.service";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  map,
  of,
  Subject,
  Subscription,
  switchMap,
  tap,
} from "rxjs";

import {
  ChecklistItemModel,
  PublicationChecklistModel,
  PublicationStatusModel,
} from "../models/publication-checklist.model";
import { BulletinStatusBadgeComponent } from "../shared/bulletin-status-badge.component";
import { PublicationInProgressComponent } from "../shared/publication-in-progress.component";
import { ModalConfirmComponent } from "./modal-confirm.component";
import { PublicationTriggerNotificationsComponent } from "./publication-trigger-notifications.component";

const PUBLICATION_LANGUAGES: string[] = ["de", "it", "en"];
const CHECKLIST_CHANNELS: PublicationChannel[] = [
  PublicationChannel.Website,
  PublicationChannel.WhatsApp,
  PublicationChannel.Telegram,
  PublicationChannel.Email,
];

@Component({
  templateUrl: "publication-checklist.component.html",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    PublicationTriggerNotificationsComponent,
    BulletinStatusBadgeComponent,
    PublicationInProgressComponent,
  ],
})
export class PublicationChecklistComponent implements OnInit, OnDestroy {
  private authenticationService = inject(AuthenticationService);
  private modalService = inject(BsModalService);
  bulletinsService = inject(BulletinsService);
  translateService = inject(TranslateService);
  regionsService = inject(RegionsService);

  private activeRoute = inject(ActivatedRoute);
  private subscriptions = new Subscription();
  private checklistServerSaveSubscription = new Subscription();
  private autosaveChecklist = new Subject<void>();

  date = "";
  activeChecklist: PublicationChecklistModel;
  previousChecklists: PublicationChecklistModel[] = [];
  expandedIds = new Set<string>();
  regionId = "";
  publicationStatus: PublicationStatusModel | undefined;
  showPrintVersion = false;
  fallbackAdminUrl = "";
  fallbackWebUrls: Record<string, string> = { de: "", en: "", it: "" };

  publishBulletinsModalRef: BsModalRef;
  publishAllModalRef: BsModalRef;

  get isWebsiteChecked(): boolean {
    return this.activeChecklist.checklistItems[0].ok !== undefined;
  }

  get hasContent(): boolean {
    return this.activeChecklist.checklistItems.some(
      (item) => item.ok !== undefined || item.problemDescription.trim().length > 0,
    );
  }

  get isPublicationDisabled(): boolean {
    return (
      this.publicationStatus?.isBeingPublished ||
      (this.bulletinsService.getActiveRegionStatus() !== BulletinStatus.published &&
        this.bulletinsService.getActiveRegionStatus() !== BulletinStatus.republished &&
        this.bulletinsService.getActiveRegionStatus() !== BulletinStatus.submitted &&
        this.bulletinsService.getActiveRegionStatus() !== BulletinStatus.resubmitted)
    );
  }

  get publicationDisabledReason(): string {
    if (this.publicationStatus?.isBeingPublished) {
      return this.translateService.instant("bulletins.publicationChecklist.publishDisabled.inProgress");
    }
    return this.translateService.instant("bulletins.publicationChecklist.publishDisabled.wrongStatus");
  }

  constructor() {
    this.subscriptions.add(
      this.autosaveChecklist
        .pipe(
          debounceTime(500),
          switchMap(() => this.saveOnServer$()),
        )
        .subscribe(),
    );
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

    this.subscriptions.add(
      this.bulletinsService.publicationStatus$.subscribe((status) => {
        this.publicationStatus = status;
      }),
    );

    // update checklist when date or region changes and start publication status polling
    this.subscriptions.add(
      combineLatest([date$, regionId$])
        .pipe(
          tap(([date, regionId]) => {
            this.date = date;
            this.regionId = regionId;
            this.previousChecklists = [];
            this.expandedIds = new Set();
            this.bulletinsService.sourceDates.setActiveDate(date);
            this.activeChecklist = { checklistItems: this.createChecklistItems() };
            this.bulletinsService.loadStatus();
            this.bulletinsService.startPublicationStatusPolling();
          }),
          switchMap(([date, regionId]) =>
            regionId
              ? this.bulletinsService.getPublicationChecklists(date, regionId).pipe(
                  catchError((error) => {
                    console.error("Publication checklist could not be loaded from server!", error);
                    return of(null);
                  }),
                )
              : of(null),
          ),
        )
        .subscribe({
          next: (serverChecklists) => {
            if (!serverChecklists) {
              this.previousChecklists = [];
              this.activeChecklist = { checklistItems: this.createChecklistItems() };
              return;
            }
            this.activeChecklist = serverChecklists[0]
              ? this.normalizeChecklistOrder(serverChecklists[0])
              : { checklistItems: this.createChecklistItems() };
            this.previousChecklists = serverChecklists.slice(1).map((c) => this.normalizeChecklistOrder(c));
          },
          error: (error) => {
            console.error("Publication checklist context could not be initialized!", error);
          },
        }),
    );
  }

  ngOnDestroy() {
    this.bulletinsService.stopPublicationStatusPolling();
    this.subscriptions.unsubscribe();
    this.checklistServerSaveSubscription.unsubscribe();
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
    const item = this.activeChecklist.checklistItems[index];
    const isOk = (event.target as HTMLInputElement).checked;
    if (isOk) {
      item.ok = true;
    } else if (item.ok === true) {
      item.ok = undefined;
    }
    this.autosaveChecklist.next();
  }

  onProblemChange(index: number, event: Event) {
    const item = this.activeChecklist.checklistItems[index];
    const hasProblem = (event.target as HTMLInputElement).checked;
    if (hasProblem) {
      item.ok = false;
      this.autosaveChecklist.next();
      return;
    }

    if (item.ok === false) {
      item.ok = undefined;
      item.problemDescription = "";
    }
    this.autosaveChecklist.next();
  }

  onProblemDescriptionChange(index: number, event: Event) {
    this.activeChecklist.checklistItems[index].problemDescription = (event.target as HTMLInputElement).value;
    this.autosaveChecklist.next();
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

  getSavedInfo(checklist: PublicationChecklistModel): string {
    const time = new DatePipe(this.translateService.getCurrentLang()).transform(
      checklist.timestamp,
      "short",
      undefined,
      this.translateService.getCurrentLang(),
    );
    return this.translateService.instant("bulletins.publicationChecklist.savedInfo", { user: checklist.user, time });
  }

  showPublishAllButton(): boolean {
    return this.authenticationService.isCurrentUserInRole("ADMIN");
  }

  publishAll(change: boolean) {
    const initialState: Partial<ModalConfirmComponent> = {
      text: this.translateService.instant(
        change ? "bulletins.table.publishAllDialog.changeMessage" : "bulletins.table.publishAllDialog.message",
      ),
      acceptKey: "button.yes",
      onConfirm: () => {
        this.bulletinsService.publishAllBulletins(this.getActiveDate(), change).subscribe({
          next: () => console.log("All bulletins published."),
          error: (error) => console.error("All bulletins could not be published!", error),
        });
      },
    };
    this.publishAllModalRef = this.modalService.show(ModalConfirmComponent, { initialState });
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
              this.bulletinsService.refreshPublicationStatus();
            },
            error: (error) => {
              console.error(
                change ? "Bulletins could not be published (no messages)!" : "Bulletins could not be published!",
                error,
              );
              this.bulletinsService.refreshPublicationStatus();
            },
          });
      },
    };
    this.publishBulletinsModalRef = this.modalService.show(ModalConfirmComponent, { initialState });
  }

  private normalizeChecklistOrder(checklist: PublicationChecklistModel): PublicationChecklistModel {
    const sorted = checklist.checklistItems.sort(
      (a, b) => CHECKLIST_CHANNELS.indexOf(a.publicationChannel) - CHECKLIST_CHANNELS.indexOf(b.publicationChannel),
    );
    return { ...checklist, checklistItems: sorted };
  }

  private saveOnServer$(checklist: PublicationChecklistModel = this.activeChecklist) {
    const date = this.date;
    const regionId = this.regionId;

    if (!date || !regionId || !checklist) {
      return EMPTY;
    }

    return this.bulletinsService.savePublicationChecklist(date, regionId, checklist).pipe(
      tap((saved) => {
        if (this.date === date && this.regionId === regionId && this.activeChecklist === checklist) {
          this.activeChecklist = this.normalizeChecklistOrder(saved);
        }
      }),
      catchError((error) => {
        console.error("Publication checklist could not be saved to server!", error);
        return EMPTY;
      }),
    );
  }

  createNewChecklist(): void {
    this.checklistServerSaveSubscription.unsubscribe();
    this.checklistServerSaveSubscription = this.saveOnServer$(this.activeChecklist).subscribe({
      next: (saved) => {
        this.previousChecklists.unshift(this.normalizeChecklistOrder(saved));
        this.activeChecklist = { checklistItems: this.createChecklistItems() };
      },
    });
  }

  get fallbackStep3Text(): string {
    return ["de", "en", "it"].map((lang) => this.getFallbackPublicMessage(lang)).join("\n\n");
  }

  private getFallbackPublicMessage(language: string): string {
    const url = this.fallbackWebUrls[language] || "…";
    switch (language) {
      case "de":
        return `Aufgrund von technischen Schwierigkeiten findet ihr die aktuelle Lawinenvorhersage unter folgendem Link: ${url}`;
      case "en":
        return `Due to technical difficulties, today's avalanche forecast is available at the following link: ${url}`;
      case "it":
        return `A causa di difficoltà tecniche, le previsioni valanghe di oggi sono disponibili al seguente link: ${url}`;
      default:
        return url;
    }
  }

  getFallbackMessage(language: string): string {
    const date = this.getFormattedDate(language);
    const url = this.fallbackWebUrls[language] || "…";
    switch (language) {
      case "de":
        return `Lawinenvorhersage für ${date}: ${url}/${this.date}`;
      case "en":
        return `Avalanche forecast for ${date}: ${url}/${this.date}`;
      case "it":
        return `Previsione valanghe per ${date}: ${url}/${this.date}`;
      default:
        return `${date}: ${url}`;
    }
  }

  togglePrintVersion(): void {
    this.showPrintVersion = !this.showPrintVersion;
  }

  printChecklist(): void {
    window.print();
  }

  toggleExpanded(checklistId: string): void {
    if (this.expandedIds.has(checklistId)) {
      this.expandedIds.delete(checklistId);
    } else {
      this.expandedIds.add(checklistId);
    }
  }

  isExpanded(checklistId: string): boolean {
    return this.expandedIds.has(checklistId);
  }
}
