import { Injectable } from "@angular/core";
import { formatDate } from "@angular/common";
import { Canvas, Icon, LatLng, Marker, MarkerOptions } from "leaflet";
import { GenericObservation, ObservationSource } from "./models/generic-observation.model";
import { SnowpackStability } from "../enums/enums";
import { FilterSelectionData, FilterSelectionValue } from "./filter-selection-data";
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
  readonly highlighted = {
    color: "#ff0000",
    weight: 1,
    labelColor: "#fff",
  } as FilterSelectionValue;

  // This is very important! Use a canvas otherwise the chart is too heavy for the browser when
  // the number of points is too high
  public myRenderer = new Canvas({
    padding: 0.5,
  });

  createMarker(observation: T, isHighlighted: boolean = false): Marker | undefined {
    try {
      const filterSelectionValue = isHighlighted
        ? this.highlighted
        : this.markerClassify?.findForObservation(observation);
      const icon = makeIcon(
        observation.aspect,
        "#898989",
        filterSelectionValue?.radius ?? 40,
        filterSelectionValue?.color ?? "white",
        filterSelectionValue?.borderColor ?? observation?.$source === ObservationSource.SnowLine ? "#777777" : "#000",
        filterSelectionValue?.labelColor ?? "#000",
        filterSelectionValue?.labelFontSize ?? 12,
        this.markerLabel?.key === "importantObservations" ? "snowsymbolsiacs" : undefined,
        this.getLabel(observation),
      );
      return this.createMarkerForIcon(observation, icon, filterSelectionValue);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  createMarkerForIcon(
    observation: T,
    icon: Icon,
    filterSelectionValue: FilterSelectionValue | undefined,
  ): Marker | undefined {
    if (!isFinite(observation.latitude) || !isFinite(observation.longitude)) {
      return;
    }
    const ll = new LatLng(observation.latitude, observation.longitude);
    const marker = new Marker(ll, {
      bubblingMouseEvents: false,
      icon: icon,
      opacity: filterSelectionValue?.opacity ?? 1,
      pane: "markerPane",
      zIndexOffset: filterSelectionValue?.zIndexOffset ?? zIndex[observation.stability ?? "unknown"] ?? 0,
    } satisfies MarkerOptions);
    marker.bindTooltip(() => this.createTooltipText(observation), {
      opacity: 1,
      className: "obs-tooltip",
    });
    return marker;
  }

  private createTooltipText(observation: T & { $sourceObject?: AwsomeSource }): string {
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
  }

  toMarkerColor(observation: T): string {
    return this.markerClassify?.findForObservation(observation)?.color ?? "white";
  }

  getLabel(observation: T) {
    if (this.markerLabel?.key === "elevation") {
      return isFinite(observation.elevation) ? Math.round(observation.elevation / 100) : "";
    } else {
      return this.markerLabel?.findForObservation(observation)?.label ?? "";
    }
  }

  formatTemplate(t: string, data: unknown): string {
    return t.replace(/{([^{}]+)}/g, (_match, key) => _get(data, key, ""));
  }
}
