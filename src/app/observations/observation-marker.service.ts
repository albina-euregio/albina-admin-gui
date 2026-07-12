import { formatDate } from "@angular/common";
import { Injectable } from "@angular/core";
import { castArray, get as _get } from "es-toolkit/compat";
import maplibregl, { Marker as MlMarker } from "maplibre-gl";

import { SnowpackStability } from "../enums/enums";
import type { AwsomeSource } from "../modelling/awsome.config";
import { FilterSelectionData, FilterSelectionValue } from "./filter-selection-data";
import { makeIcon, MarkerIcon } from "./make-icon";
import { GenericObservation } from "./models/generic-observation.model";

const zIndex: Record<SnowpackStability, number> = {
  [SnowpackStability.good]: 1,
  [SnowpackStability.fair]: 5,
  [SnowpackStability.poor]: 10,
  [SnowpackStability.very_poor]: 20,
};

/** Marker element carrying its tooltip HTML, read by the observations view on hover. */
export interface ObsMarkerElement extends HTMLImageElement {
  tooltipHtml?: string;
}

/** Builds a MapLibre marker `<img>` element from a rendered SVG icon. */
function iconElement(icon: MarkerIcon): ObsMarkerElement {
  const img = document.createElement("img") as ObsMarkerElement;
  img.src = icon.url;
  img.style.width = `${icon.size}px`;
  img.style.height = `${icon.size}px`;
  return img;
}

@Injectable()
export class ObservationMarkerService<T extends Partial<GenericObservation>> {
  public markerLabel: FilterSelectionData<T> | undefined = undefined;
  public markerClassify: FilterSelectionData<T> | undefined;
  readonly highlighted = {
    color: "#ff0000",
    weight: 1,
    labelColor: "#fff",
  } as FilterSelectionValue;

  createMaplibreMarker(observation: T, isHighlighted = false): MlMarker | undefined {
    try {
      const filterSelectionValue = isHighlighted
        ? this.highlighted
        : this.markerClassify?.findForObservation(observation);
      // NB: per-zoom radius resizing (radiusByZoom) is not yet ported to MapLibre
      const icon = makeIcon(
        castArray(observation.aspect)[0],
        "#898989",
        filterSelectionValue?.radius ?? 40,
        filterSelectionValue?.color ?? "white",
        filterSelectionValue?.borderColor ?? "#000",
        filterSelectionValue?.borderWidth ?? 2,
        filterSelectionValue?.borderDashArray ?? "",
        filterSelectionValue?.labelColor ?? "#000",
        filterSelectionValue?.labelFontSize ?? 12,
        this.markerLabel?.key === "importantObservations" ? "snowsymbolsiacs" : undefined,
        this.getLabel(observation),
      );
      return this.createMaplibreMarkerForIcon(observation, icon, filterSelectionValue);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  createMaplibreMarkerForIcon(
    observation: T,
    icon: MarkerIcon,
    filterSelectionValue: FilterSelectionValue | undefined,
  ): MlMarker | undefined {
    if (!isFinite(observation.latitude) || !isFinite(observation.longitude)) {
      return;
    }
    const el = iconElement(icon);
    el.style.opacity = String(filterSelectionValue?.opacity ?? 1);
    el.style.zIndex = String(filterSelectionValue?.zIndexOffset ?? zIndex[observation.stability ?? "unknown"] ?? 0);
    el.tooltipHtml = this.createTooltipText(observation);
    return new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([
      observation.longitude,
      observation.latitude,
    ]);
  }

  /** Public tooltip HTML, for callers rendering their own MapLibre popups (e.g. polygon layers). */
  tooltipHtml(observation: T): string {
    return this.createTooltipText(observation);
  }

  /** Fill/stroke paint for a MapLibre polygon layer, mirroring the Leaflet `createPolygonMarker` style. */
  maplibrePolygonPaint(
    observation: T,
    isHighlighted = false,
  ): { fillColor: string; fillOpacity: number; color: string; opacity: number; weight: number } {
    const fsv = isHighlighted ? this.highlighted : this.markerClassify?.findForObservation(observation);
    return {
      fillColor: fsv?.color ?? "rgba(0, 0, 0, 0)",
      fillOpacity: fsv?.fillOpacity ?? 0,
      color: fsv?.borderColor ?? "#000",
      opacity: fsv?.opacity ?? 1,
      weight: fsv?.weight ?? 0,
    };
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
