import { formatDate } from "@angular/common";
import { Injectable } from "@angular/core";
import { escape } from "es-toolkit";
import { castArray, get as _get } from "es-toolkit/compat";
import { Marker as MlMarker } from "maplibre-gl";

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

type BorderFields = Pick<FilterSelectionValue, "borderColor" | "borderWidth" | "borderDashArray">;

/** Marker element carrying its tooltip HTML, read by the observations view on hover. */
export interface ObsMarkerElement extends HTMLImageElement {
  tooltipHtml?: string;
}

/** Builds a MapLibre marker `<img>` element from a rendered SVG icon. */
function iconElement(icon: MarkerIcon): ObsMarkerElement {
  const img = document.createElement("img") as ObsMarkerElement;
  img.className = "observation-marker";
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
  public paintOverride?: (observation: T) => FilterSelectionValue | undefined;
  public tooltipNote?: (observation: T) => string | undefined;

  /** The value an observation is painted with: the override's, else the highlight's or its classifying value's. */
  paintOf(observation: T, isHighlighted = false): FilterSelectionValue | undefined {
    return (
      this.paintOverride?.(observation) ??
      (isHighlighted ? this.highlighted : this.markerClassify?.findForObservation(observation))
    );
  }

  createMaplibreMarker(observation: T & { $sourceObject?: AwsomeSource }, isHighlighted = false): MlMarker | undefined {
    try {
      const filterSelectionValue = this.paintOf(observation, isHighlighted);
      const border = this.paintOverride
        ? this.borderStyle(filterSelectionValue, observation.$sourceObject)
        : this.borderStyle(observation.$sourceObject, filterSelectionValue);
      // NB: per-zoom radius resizing (radiusByZoom) is not yet ported to MapLibre
      const icon = makeIcon(
        castArray(observation.aspect)[0],
        "#898989",
        filterSelectionValue?.radius ?? 40,
        filterSelectionValue?.color ?? "white",
        border.color,
        border.width,
        border.dashArray,
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

  /** The border of a marker, the first style's fields winning: a source's over its class, an override's over its source. */
  private borderStyle(first: BorderFields | undefined, second: BorderFields | undefined) {
    return {
      color: first?.borderColor ?? second?.borderColor ?? "#000",
      width: first?.borderWidth ?? second?.borderWidth ?? 2,
      dashArray: first?.borderDashArray ?? second?.borderDashArray ?? "",
    };
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
    el.style.zIndex = String(filterSelectionValue?.zIndexOffset ?? zIndex[observation.stability ?? "unknown"] ?? 0);
    el.tooltipHtml = this.createTooltipText(observation);
    const opacity = filterSelectionValue?.opacity ?? 1;
    return new MlMarker({ element: el, anchor: "center", opacity, opacityWhenCovered: 0 }).setLngLat([
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
    const fsv = this.paintOf(observation, isHighlighted);
    return {
      fillColor: fsv?.color ?? "rgba(0, 0, 0, 0)",
      fillOpacity: fsv?.fillOpacity ?? 0,
      color: fsv?.borderColor ?? "#000",
      opacity: fsv?.opacity ?? 1,
      weight: fsv?.weight ?? 0,
    };
  }

  private createTooltipText(observation: T & { $sourceObject?: AwsomeSource }): string {
    const note = this.tooltipNote?.(observation);
    const text = this.createSourceTooltipText(observation);
    return note ? `${text}<div class="obs-tooltip-note">${escape(note)}</div>` : text;
  }

  /** The source's tooltip text, from its template or the default table. */
  private createSourceTooltipText(observation: T & { $sourceObject?: AwsomeSource }): string {
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
    return this.paintOf(observation)?.color ?? "white";
  }

  getLabel(observation: T) {
    if (this.markerLabel?.key === "elevation") {
      return isFinite(observation.elevation) ? Math.round(observation.elevation / 100) : "";
    } else {
      return this.markerLabel?.findForObservation(observation)?.label ?? "";
    }
  }

  /** Substitutes {a.b} from the data; $stabilityIndex in a key is replaced by the data's $stabilityIndex. */
  formatTemplate(t: string, data: unknown): string {
    const stabilityIndex = (data as { $stabilityIndex?: string } | undefined)?.$stabilityIndex;
    return t.replace(/{([^{}]+)}/g, (_match, key: string) =>
      _get(data, stabilityIndex ? key.replace("$stabilityIndex", stabilityIndex) : key, ""),
    );
  }
}
