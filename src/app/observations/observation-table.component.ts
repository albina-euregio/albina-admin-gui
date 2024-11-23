import { Component, TemplateRef, ViewChild, input, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { isAvalancheWarningServiceObservation } from "./models/observation.model";
import { GenericObservation, ImportantObservation } from "./models/generic-observation.model";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ObservationMarkerService } from "./observation-marker.service";
import { grainShapes } from "./grain.shapes";
import { AvalancheProblemIconsComponent } from "../shared/avalanche-problem-icons.component";

@Component({
  standalone: true,
  imports: [AvalancheProblemIconsComponent, CommonModule, FormsModule, TranslateModule],
  selector: "app-observation-table",
  templateUrl: "observation-table.component.html",
})
export class ObservationTableComponent {
  readonly observations = input<GenericObservation[]>([]);
  readonly observationClick = output<GenericObservation>();
  readonly editObservationEvent = output<GenericObservation>();
  showObservationsWithoutCoordinates: boolean = false;
  observationSearch: string;
  importantObservationTexts = {
    [ImportantObservation.SnowLine]: grainShapes.IFrc.key,
    [ImportantObservation.SurfaceHoar]: grainShapes.SH.key,
    [ImportantObservation.Graupel]: grainShapes.PPgp.key,
    [ImportantObservation.StabilityTest]: grainShapes.PPnd.key,
    [ImportantObservation.IceFormation]: grainShapes.IF.key,
    [ImportantObservation.VeryLightNewSnow]: grainShapes.PPsd.key,
  };

  constructor(private markerService: ObservationMarkerService<GenericObservation>) {}

  get sortedObservations(): GenericObservation[] {
    return (this.observations() || []).sort((o1, o2) => +o2.eventDate - +o1.eventDate);
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
      // FIXME? this.observationsService.getObservation(observation.id).toPromise()
      this.editObservationEvent.emit(observation);
    } else {
      this.observationClick.emit(observation);
    }
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
