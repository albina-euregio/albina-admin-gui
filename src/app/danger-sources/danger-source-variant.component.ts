import { Component, Input, Output, EventEmitter, ViewChild, TemplateRef, HostListener } from "@angular/core";

import { debounceTime, Subject } from "rxjs";

import { environment } from "../../environments/environment";

// services
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";

// For iframe
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

import * as Enums from "../enums/enums";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { TranslateService } from "@ngx-translate/core";
import { DangerSourceVariantModel } from "./models/danger-source-variant.model";
import { DangerSourcesService } from "./danger-sources.service";

@Component({
  selector: "app-danger-source-variant",
  templateUrl: "danger-source-variant.component.html",
})
export class DangerSourceVariantComponent {
  @Input() variant: DangerSourceVariantModel;
  @Input() disabled: boolean;
  @Input() isCompactMapLayout: boolean;
  @Input() isVariantsSidebarVisible: boolean;
  @Input() isComparedVariant: boolean;

  private readonly updateVariantOnServerEventDebounce = new Subject<DangerSourceVariantModel>();
  @Output() updateVariantOnServerEvent = new EventEmitter<DangerSourceVariantModel>();
  @Output() changeAvalancheProblemEvent = new EventEmitter<string>();
  @Output() deleteVariantEvent = new EventEmitter<DangerSourceVariantModel>();
  @Output() editMicroRegionsEvent = new EventEmitter<DangerSourceVariantModel>();
  @Output() copyVariantEvent = new EventEmitter<DangerSourceVariantModel>();
  @Output() deselectVariantEvent = new EventEmitter<DangerSourceVariantModel>();
  @Output() toggleVariantsSidebarEvent = new EventEmitter<void>();

  dangerPattern: Enums.DangerPattern[] = Object.values(Enums.DangerPattern);
  tendency: Enums.Tendency[] = Object.values(Enums.Tendency);

  public editRegions: boolean;

  public isAccordionDangerRatingOpen: boolean;
  public isAccordionAvalancheProblemOpen: boolean;
  public isAccordionDangerDescriptionOpen: boolean;
  public isAccordionSnowpackStructureOpen: boolean;
  public isAccordionTendencyOpen: boolean;

  public removeDaytimeDependencyModalRef: BsModalRef;
  @ViewChild("removeDaytimeDependencyTemplate") removeDaytimeDependencyTemplate: TemplateRef<any>;

  stopListening: Function;

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-md",
  };

  constructor(
    public dangerSourcesService: DangerSourcesService,
    private sanitizer: DomSanitizer,
    public authenticationService: AuthenticationService,
    private modalService: BsModalService,
    public constantsService: ConstantsService,
    public regionsService: RegionsService,
    public translateService: TranslateService,
  ) {
    this.updateVariantOnServerEventDebounce
      .pipe(debounceTime(1000))
      .subscribe((variant) => this.updateVariantOnServerEvent.emit(variant));
  }

  updateVariantOnServer() {
    this.updateVariantOnServerEventDebounce.next(this.variant);
  }

  copyVariant(event) {
    this.copyVariantEvent.emit(this.variant);
  }

  deselectVariant() {
    this.deselectVariantEvent.emit(this.variant);
  }

  deleteVariant() {
    this.deleteVariantEvent.emit(this.variant);
  }

  editMicroRegions() {
    this.editMicroRegionsEvent.emit(this.variant);
  }

  isInternal(): boolean {
    const ownerRegion = this.variant.ownerRegion;
    return ownerRegion && this.authenticationService.isInternalRegion(ownerRegion);
  }

  showEditMicroRegionsButton(): boolean {
    return (
      !this.isComparedVariant && !this.editRegions && this.isInternal() && this.dangerSourcesService.getIsEditable()
    );
  }

  accordionChanged(event: boolean, groupName: string) {
    switch (groupName) {
      case "dangerRating":
        this.isAccordionDangerRatingOpen = event;
        break;
      case "avalancheProblem":
        this.isAccordionAvalancheProblemOpen = event;
        break;
      case "dangerDescription":
        this.isAccordionDangerDescriptionOpen = event;
        break;
      case "snowpackStructure":
        this.isAccordionSnowpackStructureOpen = event;
        break;
      case "tendency":
        this.isAccordionTendencyOpen = event;
        break;
      default:
        break;
    }
  }

  isCreator(variant: DangerSourceVariantModel): boolean {
    const ownerRegion = variant.ownerRegion;
    return ownerRegion !== undefined && ownerRegion?.startsWith(this.authenticationService.getActiveRegionId());
  }

  daytimeDependencyChanged(event, value) {
    event.stopPropagation();
    if (this.dangerSourcesService.getIsEditable() && this.isCreator(this.variant)) {
      if (value) {
        this.variant.hasDaytimeDependency = value;
        this.updateVariantOnServer();
      } else {
        this.openRemoveDaytimeDependencyModal(this.removeDaytimeDependencyTemplate);
      }
    }
  }

  getRegionNames(bulletin): string {
    const regionNames = bulletin.savedRegions.map((regionCode) => this.regionsService.getRegionName(regionCode));
    return regionNames.join(", ");
  }

  openRemoveDaytimeDependencyModal(template: TemplateRef<any>) {
    this.removeDaytimeDependencyModalRef = this.modalService.show(template, this.config);
  }

  removeDaytimeDependencyModalConfirm(event): void {
    event.stopPropagation();
    this.removeDaytimeDependencyModalRef.hide();
    this.variant.hasDaytimeDependency = false;
    this.updateVariantOnServer();
  }

  removeDaytimeDependencyModalDecline(): void {
    this.removeDaytimeDependencyModalRef.hide();
  }

  toggleVariantsSidebar() {
    this.toggleVariantsSidebarEvent.emit();
  }
}
