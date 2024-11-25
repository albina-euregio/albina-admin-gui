import { Injectable } from "@angular/core";
import { Marker } from "leaflet";
import { GenericObservation } from "./models/generic-observation.model";
import { makeIcon } from "./make-icon";
import { ObservationMarkerService } from "./observation-marker.service";

@Injectable()
export class ObservationMarkerWebcamService<T extends Partial<GenericObservation>> {
  constructor(private observationMarkerService: ObservationMarkerService<T>) {}

  createMarker(observation: T, isHighlighted = false): Marker | undefined {
    try {
      const filterSelectionValue = isHighlighted ? this.observationMarkerService.highlighted : undefined;
      const icon = makeIcon(
        observation.aspect,
        "#898989",
        filterSelectionValue?.radius ?? 20,
        filterSelectionValue?.color ?? "black",
        filterSelectionValue?.borderColor ?? "#000",
        filterSelectionValue?.labelColor ?? "#000",
        filterSelectionValue?.labelFontSize ?? 6,
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
