import { makeIcon } from "./make-icon";
import { GenericObservation } from "./models/generic-observation.model";
import { ObservationMarkerService } from "./observation-marker.service";
import { Injectable, inject } from "@angular/core";
import { Marker } from "leaflet";

@Injectable()
export class ObservationMarkerObserverService<T extends Partial<GenericObservation>> {
  private observationMarkerService = inject<ObservationMarkerService<T>>(ObservationMarkerService);

  createMarker(observation: T, isHighlighted = false): Marker | undefined {
    try {
      const filterSelectionValue = isHighlighted ? this.observationMarkerService.highlighted : undefined;
      const icon = makeIcon(
        observation.aspect,
        "#898989",
        filterSelectionValue?.radius ?? 20,
        filterSelectionValue?.color ?? "#ca0020",
        filterSelectionValue?.borderColor ?? "#000",
        filterSelectionValue?.labelColor ?? "#000",
        filterSelectionValue?.labelFontSize ?? 12,
        undefined,
        this.observationMarkerService.getLabel(observation),
      );
      return this.observationMarkerService.createMarkerForIcon(observation, icon, filterSelectionValue);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
