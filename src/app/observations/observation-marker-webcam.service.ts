import { Injectable, inject } from "@angular/core";
import { Marker } from "leaflet";
import { Marker as MlMarker } from "maplibre-gl";

import { makeIcon } from "./make-icon";
import { GenericObservation } from "./models/generic-observation.model";
import { ObservationMarkerService } from "./observation-marker.service";

@Injectable()
export class ObservationMarkerWebcamService<T extends Partial<GenericObservation>> {
  private observationMarkerService = inject<ObservationMarkerService<T>>(ObservationMarkerService);

  private makeIcon(observation: T, isHighlighted: boolean) {
    const filterSelectionValue = isHighlighted ? this.observationMarkerService.highlighted : undefined;
    const icon = makeIcon(
      observation.aspect,
      "#898989",
      filterSelectionValue?.radius ?? 20,
      filterSelectionValue?.color ?? "black",
      filterSelectionValue?.borderColor ?? "#000",
      filterSelectionValue?.borderWidth ?? 2,
      filterSelectionValue?.borderDashArray ?? "",
      filterSelectionValue?.labelColor ?? "#000",
      filterSelectionValue?.labelFontSize ?? 6,
      undefined,
      this.observationMarkerService.getLabel(observation),
    );
    return { icon, filterSelectionValue };
  }

  createMarker(observation: T, isHighlighted = false): Marker | undefined {
    try {
      const { icon, filterSelectionValue } = this.makeIcon(observation, isHighlighted);
      return this.observationMarkerService.createMarkerForIcon(observation, icon, filterSelectionValue);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  createMaplibreMarker(observation: T, isHighlighted = false): MlMarker | undefined {
    try {
      const { icon, filterSelectionValue } = this.makeIcon(observation, isHighlighted);
      return this.observationMarkerService.createMaplibreMarkerForIcon(observation, icon, filterSelectionValue);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
