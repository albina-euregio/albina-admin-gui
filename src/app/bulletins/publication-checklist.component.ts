import { DatePipe } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { BulletinsService, PublicationChannel } from "app/providers/bulletins-service/bulletins.service";
import { LocalStorageService } from "app/providers/local-storage-service/local-storage.service";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { combineLatest, debounceTime, distinctUntilChanged, map, Subject, Subscription, switchMap, tap } from "rxjs";

import { ChecklistItemModel, PublicationStatusModel } from "../models/publication-checklist.model";
import { BulletinStatusBadgeComponent } from "../shared/bulletin-status-badge.component";
import { ModalPublishComponent } from "./modal-publish.component";
import { PublicationTriggerNotificationsComponent } from "./publication-trigger-notifications.component";

type ManualSendLanguage = "de" | "en" | "it";

interface ManualSendEntry {
  language: ManualSendLanguage;
  link: string;
}

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
  private activeRoute = inject(ActivatedRoute);
  private authenticationService = inject(AuthenticationService);
  private modalService = inject(BsModalService);
  bulletinsService = inject(BulletinsService);
  translateService = inject(TranslateService);
  localStorageService = inject(LocalStorageService);
  regionsService = inject(RegionsService);

  private routeParamsSubscription: Subscription;
  private checklistSaveSubscription: Subscription;
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
  readonly PublicationChannel = PublicationChannel;
  private readonly manualSendEntriesByChannel: Record<"WhatsApp" | "Telegram", ManualSendEntry[]> = {
    WhatsApp: [
      { language: "de", link: "https://www.whatsapp.com/channel/0029Vb9EFivJUM2ShOiocj3h" },
      { language: "en", link: "https://www.whatsapp.com/channel/0029Vb5ry3RDOQIZDZuS3p26" },
      { language: "it", link: "https://www.whatsapp.com/channel/0029VbAybBt8vd1XOKzGPN2S" },
    ],
    Telegram: [
      { language: "de", link: "https://t.me/lawinenwarndienst_tirol" },
      { language: "en", link: "https://t.me/avalanche_warning_service_tirol" },
      { language: "it", link: "https://t.me/servizio_valanghe_tirolo" },
    ],
  };

  get isWebsiteChecked(): boolean {
    return !!(this.checklistItems[0]?.ok || this.checklistItems[0]?.problem);
  }

  constructor() {
    this.routeParamsSubscription = new Subscription();
    this.checklistSaveSubscription = this.saveChecklist
      .pipe(debounceTime(500))
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
      {
        title: "E-Mail",
        description: "bulletins.publicationChecklist.descEmail",
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

  copyToClipboard(text: string | null) {
    if (!text?.trim()) {
      return;
    }
    void navigator.clipboard.writeText(text.trim());
  }

  getSocialPublicationChannel(itemTitle: string): PublicationChannel.Telegram | PublicationChannel.WhatsApp {
    return itemTitle === "Telegram" ? PublicationChannel.Telegram : PublicationChannel.WhatsApp;
  }

  getSocialIconClass(itemTitle: string): "ph ph-telegram-logo" | "ph ph-whatsapp-logo" {
    return itemTitle === "Telegram" ? "ph ph-telegram-logo" : "ph ph-whatsapp-logo";
  }

  getManualSendDescription(itemTitle: string): string {
    if (itemTitle === "Telegram") {
      return this.translateService.instant("bulletins.publicationChecklist.manualSend.description.telegram");
    }
    return this.translateService.instant("bulletins.publicationChecklist.manualSend.description.whatsapp");
  }

  getManualSendEntries(itemTitle: string): ManualSendEntry[] {
    if (itemTitle === "Telegram") {
      return this.manualSendEntriesByChannel.Telegram;
    }
    return this.manualSendEntriesByChannel.WhatsApp;
  }

  getManualSendMessage(language: ManualSendLanguage): string {
    const bulletinDate = this.parseRouteDate(this.date);
    const bulletinDateLabel = this.formatDateForLanguage(language, bulletinDate);
    const bulletinLink = this.getBulletinLink(language);

    switch (language) {
      case "de":
        return "Lawinenvorhersage für " + bulletinDateLabel + ": " + bulletinLink;
      case "en":
        return "Avalanche forecast for " + bulletinDateLabel + ": " + bulletinLink;
      case "it":
        return "Previsione valanghe per " + bulletinDateLabel + ": " + bulletinLink;
    }
  }

  getManualSendCopyAriaLabel(itemTitle: string, language: ManualSendLanguage): string {
    const channel = itemTitle === "Telegram" ? "telegram" : "whatsapp";
    return this.translateService.instant(`bulletins.publicationChecklist.manualSend.copyAria.${channel}.${language}`);
  }

  private getBulletinLink(language: ManualSendLanguage): string {
    const domain = language === "de" ? "lawinen.report" : language === "en" ? "avalanche.report" : "valanghe.report";
    return `https://${domain}/${this.date}`;
  }

  private parseRouteDate(routeDate: string): Date {
    const [year, month, day] = routeDate.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  private formatDateForLanguage(language: ManualSendLanguage, date: Date): string {
    const locale = language === "de" ? "de-AT" : language === "en" ? "en-GB" : "it-IT";

    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
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
        onError: (error, isChange) => {
          console.error(
            isChange ? "Bulletins could not be published (no messages)!" : "Bulletins could not be published!",
            error,
          );
        },
      },
    };
    this.publishBulletinsModalRef = this.modalService.show(ModalPublishComponent, { initialState });
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
    const date$ = this.activeRoute.params.pipe(
      map(({ date }) => date as string),
      distinctUntilChanged(),
    );
    const regionId$ = this.authenticationService.activeRegion$.pipe(
      map((region) => region?.id),
      distinctUntilChanged(),
    );

    // update checklist when date or region changes and load publication status for the region
    this.routeParamsSubscription = combineLatest([date$, regionId$])
      .pipe(
        tap(([date, regionId]) => {
          this.date = date;
          this.regionId = regionId;
          this.bulletinsService.sourceDates.setActiveDate(date);
          this.checklistItems = this.getInitialChecklistItems(date, regionId);
        }),
        switchMap(([, regionId]) => {
          return this.bulletinsService.getPublicationStatus(regionId);
        }),
      )
      .subscribe({
        next: (data) => {
          this.publicationStatus = data;
        },
        error: (error) => {
          console.error("Publication status could not be loaded!", error);
        },
      });
  }

  ngOnDestroy() {
    this.routeParamsSubscription.unsubscribe();
    this.checklistSaveSubscription.unsubscribe();
  }
}
