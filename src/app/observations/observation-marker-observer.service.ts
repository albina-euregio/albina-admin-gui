import { Injectable } from "@angular/core";
import { Marker } from "leaflet";
import { GenericObservation } from "./models/generic-observation.model";
import { makeIcon } from "./make-icon";
import { ObservationMarkerService } from "./observation-marker.service";

@Injectable()
export class ObservationMarkerObserverService<T extends Partial<GenericObservation>> {
  constructor(private observationMarkerService: ObservationMarkerService<T>) {}

  createMarker(observation: T, isHighlighted: boolean = false): Marker | undefined {
    try {
      const icon = makeIcon(
        observation.aspect,
        "#898989",
        20,
        isHighlighted ? "#ff0000" : "#ca0020",
        "#000",
        isHighlighted ? "#fff" : "#000",
        "12",
        undefined,
        this.observationMarkerService.getLabel(observation),
      );
      return this.observationMarkerService.createMarkerForIcon(observation, icon, isHighlighted);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
