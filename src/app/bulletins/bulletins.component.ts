import { Component, HostListener, ViewChild, TemplateRef, OnInit, OnDestroy } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { BulletinUpdateModel } from "../models/bulletin-update.model";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { WsUpdateService } from "../providers/ws-update-service/ws-update.service";
import { SettingsService } from "../providers/settings-service/settings.service";
import { Subject } from "rxjs";
import { map } from "rxjs/operators";
import { Router, ActivatedRoute } from "@angular/router";
import * as Enums from "../enums/enums";
import { ConfirmationService } from "primeng/api";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal";
import { ModalCheckComponent } from "./modal-check.component";
import { ModalPublicationStatusComponent } from "./modal-publication-status.component";
import { ModalPublishAllComponent } from "./modal-publish-all.component";
import { ModalMediaFileComponent } from "./modal-media-file.component";

@Component({
  templateUrl: "bulletins.component.html"
})
export class BulletinsComponent implements OnInit, OnDestroy {

  public bulletinStatus = Enums.BulletinStatus;

  public updates: Subject<BulletinUpdateModel>;

  public publishing: Date;
  public copying: boolean;

  public publicationStatusModalRef: BsModalRef;
  @ViewChild("publicationStatusTemplate") publicationStatusTemplate: TemplateRef<any>;

  public mediaFileModalRef: BsModalRef;
  @ViewChild("mediaFileTemplate") mediaFileTemplate: TemplateRef<any>;

  public checkBulletinsModalRef: BsModalRef;
  @ViewChild("checkBulletinsTemplate") checkBulletinsTemplate: TemplateRef<any>;

  public checkBulletinsErrorModalRef: BsModalRef;
  @ViewChild("checkBulletinsErrorTemplate") checkBulletinsErrorTemplate: TemplateRef<any>;

  public publishAllModalRef: BsModalRef;
  @ViewChild("publishAllTemplate") publishAllTemplate: TemplateRef<any>;

  public publishBulletinsErrorModalRef: BsModalRef;
  @ViewChild("publishBulletinsErrorTemplate") publishBulletinsErrorTemplate: TemplateRef<any>;

  public publishBulletinsModalRef: BsModalRef;
  @ViewChild("publishBulletinsTemplate") publishBulletinsTemplate: TemplateRef<any>;

  public config = {
    keyboard: true,
    class: "modal-sm"
  };

  constructor(
    public translate: TranslateService,
    public bulletinsService: BulletinsService,
    public route: ActivatedRoute,
    public translateService: TranslateService,
    public authenticationService: AuthenticationService,
    public constantsService: ConstantsService,
    public settingsService: SettingsService,
    public router: Router,
    public confirmationService: ConfirmationService,
    public modalService: BsModalService,
    public wsUpdateService: WsUpdateService) {
    this.copying = false;
    this.publishing = undefined;

    this.bulletinsService.init();
  }

  ngOnInit() {
    this.wsUpdateConnect();
  }

  ngOnDestroy() {
    this.copying = false;
    this.wsUpdateDisconnect();
  }

  private wsUpdateConnect() {
    this.updates = <Subject<BulletinUpdateModel>>this.wsUpdateService
      .connect(this.constantsService.getWsUpdateUrl() + this.authenticationService.getUsername())
      .pipe(map((response: any): BulletinUpdateModel => {
        const data = JSON.parse(response.data);
        const bulletinUpdate = BulletinUpdateModel.createFromJson(data);
        console.debug("Bulletin update received: " + bulletinUpdate.getDate().toLocaleDateString() + " - " + bulletinUpdate.getRegion() + " [" + bulletinUpdate.getStatus() + "]");
        this.bulletinsService.statusMap.get(bulletinUpdate.region).set(new Date(bulletinUpdate.getDate()).getTime(), bulletinUpdate.getStatus());
        return bulletinUpdate;
      }));

    this.updates.subscribe(msg => {
    });
  }

  private wsUpdateDisconnect() {
    this.wsUpdateService.disconnect();
  }

  getActiveRegionStatus(date) {
    const regionStatusMap = this.bulletinsService.statusMap.get(this.authenticationService.getActiveRegionId());
    if (regionStatusMap)
      return regionStatusMap.get(date.getTime());
    else
      return Enums.BulletinStatus.missing;
  }

  getRegionStatus(region, date) {
    const regionStatusMap = this.bulletinsService.statusMap.get(region);
    if (regionStatusMap)
      return regionStatusMap.get(date.getTime());
    else
      return Enums.BulletinStatus.missing;
  }

  showCreateButton(date) {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
      (!this.bulletinsService.hasBeenPublished5PM(date)) &&
      (!this.publishing || this.publishing.getTime() !== date.getTime()) &&
      (
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.missing
      ) &&
      !this.copying &&
      (
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman)
      )) {
      return true;
    } else {
      return false;
    }
  }

  showCopyButton(date) {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
      (!this.publishing || this.publishing.getTime() !== date.getTime()) &&
      this.bulletinsService.getUserRegionStatus(date) &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.missing &&
      !this.copying &&
      (
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman)
      )) {
      return true;
    } else {
      return false;
    }
  }

  showPasteButton(date) {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
      (!this.publishing || this.publishing.getTime() !== date.getTime()) &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.published &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.republished &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.submitted &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.resubmitted &&
      this.copying &&
      this.bulletinsService.getCopyDate() !== date &&
      !this.bulletinsService.hasBeenPublished5PM(date)) {
      return true;
    } else {
      return false;
    }
  }

  showPublishAllButton(date) {
    if (this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin)) {
      return true;
    }
  }

  showCheckButton(date) {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
      (!this.publishing || this.publishing.getTime() !== date.getTime()) &&
      (
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.draft ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.updated
      ) &&
      !this.copying &&
      this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman)) {
      return true;
    } else {
      return false;
    }
  }

  showMediaFileButton(date) {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
        this.authenticationService.getActiveRegion().enableMediaFile &&
      (!this.publishing || this.publishing.getTime() !== date.getTime()) &&
      (
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.draft ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.updated ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.submitted ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.published ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.resubmitted ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.republished
      ) &&
      !this.copying &&
      (
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster)
      )
    ) {
      return true;
    } else {
      return false;
    }
  }

  showInfoButton(date) {
    if (this.authenticationService.getActiveRegionId() !== undefined &&
      (!this.publishing || this.publishing.getTime() !== date.getTime()) &&
      (
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.published ||
        this.bulletinsService.getUserRegionStatus(date) === this.bulletinStatus.republished
      ) &&
      !this.copying &&
      (
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin)
      )
    ) {
      return true;
    } else {
      return false;
    }
  }

  showCaamlButton(date) {
    if (this.settingsService.showCaaml &&
      (!this.publishing || this.publishing.getTime() !== date.getTime()) &&
      !this.copying) {
      return true;
    } else {
      return false;
    }
  }

  showJsonButton(date) {
    if (this.settingsService.showJson &&
      (!this.publishing || this.publishing.getTime() !== date.getTime()) &&
      !this.copying) {
      return true;
    } else {
      return false;
    }
  }

  isOwnRegion(region) {
    const userRegion = this.authenticationService.getActiveRegionId();
    if (userRegion && userRegion !== undefined) {
      return this.authenticationService.getActiveRegionId().startsWith(region);
    } else {
      return false;
    }
  }

  editBulletin(date: Date) {
    this.bulletinsService.setActiveDate(date);
    this.router.navigate(["/bulletins/new"]);
  }

  showCaaml(event, date: Date) {
    event.stopPropagation();
    this.bulletinsService.setActiveDate(date);
    this.router.navigate(["/bulletins/caaml"]);
  }

  showJson(event, date: Date) {
    event.stopPropagation();
    this.bulletinsService.setActiveDate(date);
    this.router.navigate(["/bulletins/json"]);
  }

  showPublicationInfo(event, date: Date) {
    event.stopPropagation();
    this.bulletinsService.getPublicationStatus(this.authenticationService.getActiveRegionId(), date).subscribe(
      data => {
        this.openPublicationStatusModal(this.publicationStatusTemplate, (data as any), date);
      },
      error => {
        console.error("Publication status could not be loaded!");
      }
    );
  }

  openMediaFileDialog(event, date: Date) {
    event.stopPropagation();
    this.openMediaFileModal(this.mediaFileTemplate, date);
  }

  copy(event, date: Date) {
    event.stopPropagation();
    this.copying = true;
    this.bulletinsService.setCopyDate(date);
  }

  paste(event, date: Date) {
    event.stopPropagation();
    this.copying = false;
    this.editBulletin(date);
  }

  publishAll(event, date: Date) {
    event.stopPropagation();
    this.publishing = date;
    this.openPublishAllModal(this.publishAllTemplate, date);
  }

  check(event, date: Date) {
    event.stopPropagation();

    this.bulletinsService.checkBulletins(date, this.authenticationService.getActiveRegionId()).subscribe(
      data => {
        let message = "<b>" + this.translateService.instant("bulletins.table.checkBulletinsDialog.message") + "</b><br><br>";

        if ((data as any).length === 0) {
          message += this.translateService.instant("bulletins.table.checkBulletinsDialog.ok");
        } else {
          for (const entry of (data as any)) {
            if (entry === "missingDangerRating") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingDangerRating") + "<br>";
            }
            if (entry === "missingRegion") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingRegion") + "<br>";
            }
            if (entry === "missingAvActivityHighlights") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingAvActivityHighlights") + "<br>";
            }
            if (entry === "missingAvActivityComment") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingAvActivityComment") + "<br>";
            }
            if (entry === "missingSnowpackStructureHighlights") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingSnowpackStructureHighlights") + "<br>";
            }
            if (entry === "missingSnowpackStructureComment") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.missingSnowpackStructureComment") + "<br>";
            }
            if (entry === "pendingSuggestions") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.pendingSuggestions") + "<br>";
            }
            if (entry === "incompleteTranslation") {
              message += this.translateService.instant("bulletins.table.checkBulletinsDialog.incompleteTranslation");
            }
          }
        }

        this.openCheckBulletinsModal(this.checkBulletinsTemplate, message, date);
      },
      error => {
        console.error("Bulletins could not be checked!");
        this.openCheckBulletinsErrorModal(this.checkBulletinsErrorTemplate);
      }
    );
  }

  @HostListener("document:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.keyCode === 27 && this.copying) {
      this.cancelCopy(event);
    }
  }

  cancelCopy(event) {
    event.stopPropagation();
    this.copying = false;
    this.bulletinsService.setCopyDate(undefined);
  }
  
  openPublicationStatusModal(template: TemplateRef<any>, json, date: Date) {
    const initialState = {
      json: json,
      date: date,
      component: this
    };
    this.publicationStatusModalRef = this.modalService.show(ModalPublicationStatusComponent, { initialState });
  }
  
  openMediaFileModal(template: TemplateRef<any>, date: Date) {
    const initialState = {
      date: date,
      component: this
    };
    this.mediaFileModalRef = this.modalService.show(ModalMediaFileComponent, { initialState });
  }

  mediaFileModalConfirm(date: Date): void {
    this.mediaFileModalRef.hide();
  }

  publicationStatusModalConfirm(date: Date): void {
    this.publicationStatusModalRef.hide();
  }  

  openCheckBulletinsModal(template: TemplateRef<any>, message: string, date: Date) {
    const initialState = {
      text: message,
      date: date,
      component: this
    };
    this.checkBulletinsModalRef = this.modalService.show(ModalCheckComponent, { initialState });

    this.modalService.onHide.subscribe((reason: string) => {
      this.publishing = undefined;
    });
  }

  checkBulletinsModalConfirm(): void {
    this.checkBulletinsModalRef.hide();
  }





  openCheckBulletinsErrorModal(template: TemplateRef<any>) {
    this.checkBulletinsErrorModalRef = this.modalService.show(template, this.config);
  }

  checkBulletinsErrorModalConfirm(): void {
    this.checkBulletinsErrorModalRef.hide();
    this.publishing = undefined;
  }

  openPublishAllModal(template: TemplateRef<any>, date: Date) {
    const initialState = {
      date: date,
      component: this
    };
    this.publishAllModalRef = this.modalService.show(ModalPublishAllComponent, { initialState });

    this.modalService.onHide.subscribe((reason: string) => {
      this.publishing = undefined;
    });
  }

  publishAllModalConfirm(date: Date): void {
    this.publishAllModalRef.hide();
    this.bulletinsService.publishAllBulletins(date).subscribe(
      data => {
        console.log("All bulletins published.");
        if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.resubmitted) {
          this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.republished);
        } else if (this.bulletinsService.getUserRegionStatus(date) === Enums.BulletinStatus.submitted) {
          this.bulletinsService.setUserRegionStatus(date, Enums.BulletinStatus.published);
        }
        this.publishing = undefined;
      },
      error => {
        console.error("All bulletins could not be published!");
        this.openPublishBulletinsErrorModal(this.publishBulletinsErrorTemplate);
      }
    );
  }

  publishAllModalDecline(): void {
    this.publishAllModalRef.hide();
    this.publishing = undefined;
  }

  publishBulletinsModalDecline(): void {
    this.publishBulletinsModalRef.hide();
    this.publishing = undefined;
  }

  openPublishBulletinsErrorModal(template: TemplateRef<any>) {
    this.publishBulletinsErrorModalRef = this.modalService.show(template, this.config);
  }  
  
  publishBulletinsErrorModalConfirm(): void {
    this.publishBulletinsErrorModalRef.hide();
    this.publishing = undefined;
  }
}
