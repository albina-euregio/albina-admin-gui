import { Injectable } from "@angular/core";
import { formatDate } from "@angular/common";
import { Canvas, CircleMarker, Icon, LatLng, Marker, MarkerOptions } from "leaflet";
import { GenericObservation, ObservationSource, ObservationType } from "./models/generic-observation.model";
import { SnowpackStability } from "../enums/enums";
import { FilterSelectionData } from "./filter-selection-data";
import { makeIcon } from "./make-icon";
import type { AwsomeSource } from "../modelling/awsome.component";
import { get as _get } from "lodash";

const zIndex: Record<SnowpackStability, number> = {
  [SnowpackStability.good]: 1,
  [SnowpackStability.fair]: 5,
  [SnowpackStability.poor]: 10,
  [SnowpackStability.very_poor]: 20,
};

@Injectable()
export class ObservationMarkerService<T extends Partial<GenericObservation>> {
  public markerLabel: FilterSelectionData<T> | undefined = undefined;
  public markerClassify: FilterSelectionData<T> | undefined;

  // This is very important! Use a canvas otherwise the chart is too heavy for the browser when
  // the number of points is too high
  public myRenderer = new Canvas({
    padding: 0.5,
  });

  createMarker(observation: T, isHighlighted: boolean = false): Marker | undefined {
    try {
      const labelFont =
        this.markerLabel?.key === "importantObservations"
          ? "snowsymbolsiacs"
          : getComputedStyle(document.body).getPropertyValue("font-family").replace(/"/g, "'");
      const icon = makeIcon(
        observation.aspect,
        "#898989",
        this.toMarkerRadius(observation),
        isHighlighted ? "#ff0000" : this.toMarkerColor(observation),
        this.getBorderColor(observation),
        isHighlighted ? "#fff" : "#000",
        "12",
        labelFont,
        this.getLabel(observation),
      );
      return this.createMarkerForIcon(observation, icon, isHighlighted);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  createMarkerForIcon(observation: T, icon: Icon, isHighlighted: boolean): Marker | undefined {
    if (!isFinite(observation.latitude) || !isFinite(observation.longitude)) {
      return;
    }
    const ll = new LatLng(observation.latitude, observation.longitude);
    const marker = new Marker(ll, {
      bubblingMouseEvents: false,
      icon: icon,
      opacity: 1,
      pane: "markerPane",
      radius: this.toMarkerRadius(observation),
      renderer: this.myRenderer,
      weight: isHighlighted ? 1 : 0,
      zIndexOffset: this.toZIndex(observation),
    } as MarkerOptions);
    this.bindTooltip(marker, observation);
    return marker;
  }

  bindTooltip(marker: Marker | CircleMarker, observation: T & { $sourceObject?: AwsomeSource }) {
    marker.bindTooltip(
      () => {
        if (observation.$sourceObject?.tooltipTemplate) {
          return this.formatTemplate(observation.$sourceObject?.tooltipTemplate, observation);
        }
        return [
          `<i class="ph ph-calendar"></i> ${
            observation.eventDate instanceof Date
              ? formatDate(observation.eventDate, "yyyy-MM-dd HH:mm", "en-US")
              : undefined
          }`,
          `<i class="ph ph-globe"></i> ${observation.locationName || undefined}`,
          `<i class="ph ph-user"></i> ${observation.authorName || undefined}`,
          `[${observation.$source}, ${observation.$type}]`,
        ]
          .filter((s) => !s.includes("undefined"))
          .join("<br>");
      },
      {
        opacity: 1,
        className: "obs-tooltip",
      },
    );
  }

  toMarkerRadius(observation: T): number {
    if (this.isObserver(observation)) {
      return 20;
    } else {
      return 40;
    }
  }

  getBorderColor(observation: T) {
    if (observation?.$source === ObservationSource.SnowLine) {
      return "#777777";
    } else {
      return "#000";
    }
  }

  toMarkerColor(observation: T): string {
    if (this.isObserver(observation)) {
      return "#ca0020";
    } else {
      return this.markerClassify?.findForObservation(observation)?.color ?? "white";
    }
  }

  private isObserver(observation: T) {
    return observation?.$type === ObservationType.TimeSeries && observation?.$source === ObservationSource.Observer;
  }

  getLabel(observation: T) {
    if (this.markerLabel?.key === "elevation") {
      return isFinite(observation.elevation) ? Math.round(observation.elevation / 100) : "";
    } else {
      return this.markerLabel?.findForObservation(observation)?.label ?? "";
    }
  }

  toZIndex(observation: T) {
    return zIndex[observation.stability ?? "unknown"] ?? 0;
  }

  formatTemplate(t: string, data: unknown): string {
    return t.replace(/{([^{}]+)}/g, (_match, key) => _get(data, key, ""));
  }
}
