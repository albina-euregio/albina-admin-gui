import { CommonModule } from "@angular/common";
import { Component, input, output, inject, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@ngx-translate/core";

import { AvalancheProblemIconsComponent } from "../shared/avalanche-problem-icons.component";
import { grainShapes } from "./grain.shapes";
import {
  GenericObservation,
  ImportantObservation,
  ObservationSource,
  ObservationType,
  sortByEventDateDesc,
} from "./models/generic-observation.model";
import { ObservationMarkerService } from "./observation-marker.service";

@Component({
  standalone: true,
  imports: [AvalancheProblemIconsComponent, CommonModule, FormsModule, TranslatePipe],
  selector: "app-observation-table",
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: "observation-table.component.html",
})
export class ObservationTableComponent {
  private markerService = inject<ObservationMarkerService<GenericObservation>>(ObservationMarkerService);

  readonly observations = input<GenericObservation[]>([]);
  readonly observationClick = output<GenericObservation>();
  readonly editObservationEvent = output<GenericObservation>();
  ObservationSource = ObservationSource;
  showObservationsWithoutCoordinates = false;
  importantObservationTexts = {
    [ObservationType.DrySnowfallLevel]: grainShapes.IFrc.key,
    [ImportantObservation.SurfaceHoar]: grainShapes.SH.key,
    [ImportantObservation.Graupel]: grainShapes.PPgp.key,
    [ImportantObservation.StabilityTest]: grainShapes.PPnd.key,
    [ImportantObservation.IceFormation]: grainShapes.IF.key,
    [ImportantObservation.VeryLightNewSnow]: grainShapes.PPsd.key,
    [ImportantObservation.ForBlog]: grainShapes.PPpl.key,
  };

  get sortedObservations(): GenericObservation[] {
    return sortByEventDateDesc(this.observations() || []);
  }

  isShowObservation(observation: GenericObservation): boolean {
    return !this.showObservationsWithoutCoordinates || !(observation.latitude && observation.longitude);
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
