import { HttpErrorResponse } from "@angular/common/http";
import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from "@angular/core";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { EventType, isAvalancheWarningServiceObservation, Observation } from "./models/observation.model";
import { AlbinaObservationsService } from "./observations.service";
import { GenericObservation, ImportantObservation } from "./models/generic-observation.model";
import { ObservationEditorComponent } from "./observation-editor.component";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ObservationMarkerService } from "./observation-marker.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { grainShapes } from "./grain.shapes";
import { AvalancheProblemIconsComponent } from "../shared/avalanche-problem-icons.component";

@Component({
  standalone: true,
  imports: [AvalancheProblemIconsComponent, CommonModule, FormsModule, ObservationEditorComponent, TranslateModule],
  selector: "app-observation-table",
  templateUrl: "observation-table.component.html",
})
export class ObservationTableComponent {
  @Input() observations: GenericObservation[] = [];
  @Output() observationClick: EventEmitter<GenericObservation> = new EventEmitter<GenericObservation>();
  showObservationsWithoutCoordinates: boolean = false;
  observation: Observation;
  observationSearch: string;
  saving = false;
  messages: any[] = [];
  importantObservationTexts = {
    [ImportantObservation.SnowLine]: grainShapes.IFrc.key,
    [ImportantObservation.SurfaceHoar]: grainShapes.SH.key,
    [ImportantObservation.Graupel]: grainShapes.PPgp.key,
    [ImportantObservation.StabilityTest]: grainShapes.PPnd.key,
    [ImportantObservation.IceFormation]: grainShapes.IF.key,
    [ImportantObservation.VeryLightNewSnow]: grainShapes.PPsd.key,
  };
  modalRef: BsModalRef;
  @ViewChild("observationEditorTemplate") observationEditorTemplate: TemplateRef<any>;

  constructor(
    public modalService: BsModalService,
    private observationsService: AlbinaObservationsService,
    private markerService: ObservationMarkerService<GenericObservation>,
    private translate: TranslateService,
  ) {}

  get sortedObservations(): GenericObservation[] {
    return (this.observations || []).sort((o1, o2) => +o2.eventDate - +o1.eventDate);
  }

  newObservation() {
    this.observation = {
      eventType: EventType.Normal,
    } as Observation;
    this.showDialog();
  }

  isShowObservation(observation: GenericObservation): boolean {
    return (
      (!this.showObservationsWithoutCoordinates || !(observation.latitude && observation.longitude)) &&
      (!this.observationSearch ||
        [observation.authorName, observation.locationName, observation.content].some((text) =>
          (text || "").toLocaleLowerCase().includes(this.observationSearch.toLocaleLowerCase()),
        ))
    );
  }

  onClick(observation: GenericObservation) {
    if (isAvalancheWarningServiceObservation(observation)) {
      this.editObservation(observation.$data);
    } else {
      this.observationClick.emit(observation);
    }
  }

  async editObservation(observation: Observation) {
    this.observation = (await this.observationsService.getObservation(observation.id).toPromise()).$data;
    if (typeof this.observation?.eventDate === "object") {
      this.observation.eventDate = this.observation.eventDate.toISOString();
    }
    if (typeof this.observation?.eventDate === "string") {
      this.observation.eventDate = this.observation.eventDate.slice(0, "2006-01-02T15:04".length);
    }
    if (typeof this.observation?.reportDate === "object") {
      this.observation.reportDate = this.observation.reportDate.toISOString();
    }
    if (typeof this.observation?.reportDate === "string") {
      this.observation.reportDate = this.observation.reportDate.slice(0, "2006-01-02T15:04".length);
    }
    this.showDialog();
  }

  showDialog() {
    this.modalRef = this.modalService.show(this.observationEditorTemplate, {
      class: "modal-fullscreen",
    });
  }

  hideDialog() {
    this.modalRef.hide();
    this.modalRef = undefined;
  }

  async saveObservation() {
    const { observation } = this;
    try {
      this.saving = true;
      if (observation.id) {
        const newObservation = await this.observationsService.putObservation(observation).toPromise();
        Object.assign(
          this.observations.find((o) => isAvalancheWarningServiceObservation(o) && o.$data.id === observation.id),
          newObservation,
        );
      } else {
        const newObservation = await this.observationsService.postObservation(observation).toPromise();
        this.observations.splice(0, 0, newObservation);
      }
      this.hideDialog();
    } catch (error) {
      this.reportError(error);
    } finally {
      this.saving = false;
    }
  }

  async deleteObservation() {
    const { observation } = this;
    if (!window.confirm(this.translate.instant("observations.button.deleteConfirm"))) {
      return;
    }
    try {
      this.saving = true;
      await this.observationsService.deleteObservation(observation);
      const index = this.observations.findIndex(
        (o) => isAvalancheWarningServiceObservation(o) && o.$data.id === observation.id,
      );
      this.observations.splice(index, 1);
      this.hideDialog();
    } catch (error) {
      this.reportError(error);
    } finally {
      this.saving = false;
    }
  }

  discardObservation() {
    this.observation = undefined;
    this.hideDialog();
  }

  private reportError(error: HttpErrorResponse) {
    this.messages.push({
      severity: "error",
      summary: error.statusText,
      detail: error.message,
    });
  }

  getTableRowStyle(observation: GenericObservation): Partial<CSSStyleDeclaration> {
    return {
      background: "linear-gradient(90deg, " + this.markerService.toMarkerColor(observation) + " 0%, white 50%)",
    };
  }

  formatImportantObservation(importantObservation: ImportantObservation): string {
    return String(importantObservation).replace(/[a-z]/g, "");
  }
}
