import { Injectable } from "@angular/core";
import { formatDate } from "@angular/common";
import { Canvas, DivIcon, Icon, LatLng, Marker, MarkerOptions } from "leaflet";
import {
  Aspect,
  AvalancheProblem,
  GenericObservation,
  LocalFilterTypes,
  Stability,
} from "./models/generic-observation.model";

// https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=9
const colors = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"];

const stabilityColors: Record<Stability | "unknown", string> = {
  // https://colorbrewer2.org/#type=diverging&scheme=RdYlGn&n=5
  unknown: "white",
  good: "#a6d96a",
  fair: "#ffffbf",
  poor: "#fdae61",
  very_poor: "#d7191c",
};

const zIndex: Record<Stability, number> = {
  good: 1,
  fair: 5,
  poor: 10,
  very_poor: 20,
};

const elevationThresholds = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100,
  2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500,
];
const elevationColors = {
  "1": "#c060ff",
  "2": "#9b00e0",
  "3": "#8000ff",
  "4": "#6600c0",
  "5": "#330080",
  "6": "#0000c0",
  "7": "#0000ff",
  "8": "#3399ff",
  "9": "#80ccff",
  "10": "#80ffff",
  "11": "#00ffc0",
  "12": "#00ff80",
  "13": "#00e400",
  "14": "#00c000",
  "15": "#009b00",
  "16": "#008000",
  "17": "#609b00",
  "18": "#9b9b00",
  "19": "#c09b00",
  "20": "#c0c000",
  "21": "#c0e000",
  "22": "#c0ff00",
  "23": "#ffff00",
  "24": "#ffc000",
  "25": "#ff9b00",
  "26": "#ff8000",
  "27": "#ff0000",
  "28": "#e00000",
  "29": "#c00000",
  "30": "#b00000",
  "31": "#800000",
  "32": "#990066",
  "33": "#c00066",
  "34": "#cc0066",
  "35": "#cc005c",
};

@Injectable()
export class ObservationMarkerService {
  public USE_CANVAS_LAYER = true;

  readonly markerRadius = 40;

  public markerLabel: LocalFilterTypes | undefined = undefined;
  public markerClassify: LocalFilterTypes = LocalFilterTypes.Stability;

  constructor() {}

  // This is very important! Use a canvas otherwise the chart is too heavy for the browser when
  // the number of points is too high
  public myRenderer = !this.USE_CANVAS_LAYER
    ? undefined
    : new Canvas({
        padding: 0.5,
      });

  createMarker(observation: GenericObservation): Marker | undefined {
    const ll =
      observation.latitude && observation.longitude
        ? new LatLng(observation.latitude, observation.longitude)
        : undefined;
    if (!ll) {
      return;
    }

    try {
      const marker = new Marker(ll, {
        bubblingMouseEvents: false,
        icon: this.getIcon(observation),
        opacity: 1,
        pane: "markerPane",
        radius: this.markerRadius,
        renderer: this.myRenderer,
        weight: observation.isHighlighted ? 1 : 0,
        zIndexOffset: this.toZIndex(observation),
      } as MarkerOptions);

      marker.bindTooltip(this.createTooltip(observation), {
        opacity: 1,
        className: "obs-tooltip",
      });
      return marker;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  private createTooltip(observation: GenericObservation): string {
    return [
      `<i class="fa fa-calendar"></i> ${
        observation.eventDate instanceof Date
          ? formatDate(observation.eventDate, "yyyy-MM-dd HH:mm", "en-US")
          : undefined
      }`,
      `<i class="fa fa-globe"></i> ${observation.locationName || undefined}`,
      `<i class="fa fa-user"></i> ${observation.authorName || undefined}`,
      `[${observation.$source}, ${observation.$type}]`,
    ]
      .filter((s) => !/undefined/.test(s))
      .join("<br>");
  }

  toMarkerColor(observation: GenericObservation) {
    switch (this.markerClassify) {
      case LocalFilterTypes.Elevation:
        return this.elevationColor(observation);
      case LocalFilterTypes.Stability:
        return this.stabilityColor(observation);
      case LocalFilterTypes.Aspect:
        return observation.aspect ? colors[Object.keys(Aspect).indexOf(observation.aspect) % colors.length] : "white";
      case LocalFilterTypes.AvalancheProblem:
        return !Array.isArray(observation.avalancheProblems) || observation.avalancheProblems.length === 0
          ? "white"
          : observation.avalancheProblems.length > 1
            ? "#999999"
            : colors[Object.keys(AvalancheProblem).indexOf(observation.avalancheProblems[0]) % colors.length];
    }
    return "white";
  }

  private stabilityColor(observation: GenericObservation) {
    return stabilityColors[observation?.stability ?? "unknown"] ?? stabilityColors.unknown;
  }

  private elevationColor({ elevation }: GenericObservation) {
    const index = isFinite(elevation) ? elevationThresholds.findIndex((e) => e >= elevation) : -1;
    return index >= 0 ? elevationColors[index] : "white";
  }

  private getLabel(observation: GenericObservation<any>) {
    if (!this.markerLabel) {
      return "";
    }
    switch (this.markerLabel) {
      case LocalFilterTypes.Elevation:
        return isFinite(observation.elevation) ? Math.round(observation.elevation / 100) : "";
      case LocalFilterTypes.ObservationType:
        return String(observation.$type).slice(0, 1);
      case LocalFilterTypes.Aspect:
        return observation.aspect ?? "";
      case LocalFilterTypes.Days:
        return observation?.eventDate?.getDate() ?? "";
      case LocalFilterTypes.DangerPattern:
        return (observation.dangerPatterns ?? []).map((p) => String(p).slice(2)).join("+");
      case LocalFilterTypes.AvalancheProblem:
        return (observation.avalancheProblems ?? []).map((p) => avalancheProblem(p)).join("");
    }
    return "";

    function avalancheProblem(p: AvalancheProblem): string {
      const texts = {
        [AvalancheProblem.new_snow]: "🌨",
        [AvalancheProblem.wind_slab]: "🚩",
        [AvalancheProblem.wet_snow]: "☀️",
        [AvalancheProblem.persistent_weak_layers]: "❗",
        [AvalancheProblem.gliding_snow]: "🐟",
      };
      return p ? texts[p] ?? "" : "";
    }
  }

  toZIndex(observation: GenericObservation) {
    return zIndex[observation.stability ?? "unknown"] ?? 0;
  }

  private getIcon(observation: GenericObservation<any>): Icon | DivIcon {
    const iconSize = this.markerRadius;

    if (!this.USE_CANVAS_LAYER) {
      const html = this.getSvg(observation);
      return new DivIcon({
        html,
        className: `leaflet-div-icon-${iconSize}`,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2],
      });
    }

    const svg = this.getSvg(observation);
    const iconUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

    const icon = new Icon({
      iconUrl: iconUrl,
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2],
    });

    return icon;
  }

  private getSvg(observation: GenericObservation<any>) {
    let iconColor = this.toMarkerColor(observation);
    let textColor = "#000";

    if (observation.isHighlighted) {
      iconColor = "#ff0000";
      textColor = "#fff";
    }

    const label = this.getLabel(observation);
    const labelFont = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'`;

    const aspectColor = "#898989";
    const aspects = {
      N: `<g id="sector-n" transform="translate(11.3648, 0)"><path d="M0.37786189,5.11723954 C0.37786189,10.9164064 2.72455784,16.1667004 6.52495662,19.9669805 L21.3778619,5.11723954 L0.37786189,5.11723954 Z" id="sector" transform="translate(10.8779, 12.5421) rotate(-247.5) translate(-10.8779, -12.5421)"></path></g>`,
      NE: `<g id="sector-ne" transform="translate(19.4015, 3.3285)"><path d="M2.04211,3.45299143 C2.04211,9.25215827 4.38880596,14.5024523 8.18920473,18.3027324 L23.04211,3.45299143 L2.04211,3.45299143 Z" id="sector" transform="translate(12.5421, 10.8779) rotate(-202.5) translate(-12.5421, -10.8779)"></path></g>`,
      E: `<g id="sector-e" transform="translate(25.0842, 11.3648)"><path d="M2.04211,3.45299143 C2.04211,9.25215827 4.38880596,14.5024523 8.18920473,18.3027324 L23.04211,3.45299143 L2.04211,3.45299143 Z" id="sector" transform="translate(12.5421, 10.8779) rotate(-157.5) translate(-12.5421, -10.8779)"></path></g>`,
      SE: `<g id="sector-se" transform="translate(25.0842, 19.4015)"><path d="M0.37786189,5.11723954 C0.37786189,10.9164064 2.72455784,16.1667004 6.52495662,19.9669805 L21.3778619,5.11723954 L0.37786189,5.11723954 Z" id="sector" transform="translate(10.8779, 12.5421) rotate(-112.5) translate(-10.8779, -12.5421)"></path></g>`,
      S: `<g id="sector-s" transform="translate(17.0479, 25.0842)"><path d="M0.37786189,5.11723954 C0.37786189,10.9164064 2.72455784,16.1667004 6.52495662,19.9669805 L21.3778619,5.11723954 L0.37786189,5.11723954 Z" id="sector" transform="translate(10.8779, 12.5421) rotate(-67.5) translate(-10.8779, -12.5421)"></path></g>`,
      SW: `<g id="sector-sw" transform="translate(5.6827, 25.0842)"><path d="M2.04211,3.45299143 C2.04211,9.25215827 4.38880596,14.5024523 8.18920473,18.3027324 L23.04211,3.45299143 L2.04211,3.45299143 Z" id="sector" transform="translate(12.5421, 10.8779) rotate(-22.5) translate(-12.5421, -10.8779)"></path></g>`,
      W: `<g id="sector-w" transform="translate(0, 17.0479)"><path d="M2.04211,3.45299143 C2.04211,9.25215827 4.38880596,14.5024523 8.18920473,18.3027324 L23.04211,3.45299143 L2.04211,3.45299143 Z" id="sector" transform="translate(12.5421, 10.8779) rotate(22.5) translate(-12.5421, -10.8779)"></path></g>`,
      NW: `<g id="sector-nw" transform="translate(3.3285, 5.6827)"><path d="M0.37786189,5.11723954 C0.37786189,10.9164064 2.72455784,16.1667004 6.52495662,19.9669805 L21.3778619,5.11723954 L0.37786189,5.11723954 Z" id="sector" transform="translate(10.8779, 12.5421) rotate(-292.5) translate(-10.8779, -12.5421)"></path></g>`,
    };

    // 700533 - drawImage() fails silently when drawing an SVG image without @width or @height
    // https://bugzilla.mozilla.org/show_bug.cgi?id=700533
    return `
    <svg width="42px" height="42px" viewBox="0 0 42 42" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="Symbols" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="map-marker">

            <g id="map-marker-sectors" transform="translate(-4.0842, -4.0842)" fill="${aspectColor}">
              ${aspects[observation.aspect]}
            </g>

            <g id="map-marker-bg" transform="translate(10, 10)" fill="${iconColor}">
                <circle id="Oval" cx="11" cy="11" r="11"></circle>
            </g>

            <g id="map-marker-circle-inner" transform="translate(10, 10)" stroke="#000000">
                <text x="11" y="15" text-anchor="middle" fill="${textColor}" font-size="12" font-weight="lighter" font-family="${labelFont}">${label}</text>

                <g id="line-bold" stroke-width="2">
                    <circle id="Oval" cx="11" cy="11" r="11"></circle>
                </g>
                <g id="line-thin">
                    <circle id="Oval" cx="11" cy="11" r="11"></circle>
                </g>
                <g id="dotted-bold" stroke-dasharray="0,2.99" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                    <path d="M11,22 C17.0751322,22 22,17.0751322 22,11 C22,4.92486775 17.0751322,0 11,0 C4.92486775,0 0,4.92486775 0,11 C0,17.0751322 4.92486775,22 11,22 Z" id="Oval"></path>
                </g>
                <g id="dotted-thin" stroke-dasharray="0,3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11,22 C17.0751322,22 22,17.0751322 22,11 C22,4.92486775 17.0751322,0 11,0 C4.92486775,0 0,4.92486775 0,11 C0,17.0751322 4.92486775,22 11,22 Z" id="Oval"></path>
                </g>
            </g>

  
            <!--<g id="map-marker-circle-outer" transform="translate(7, 7)" stroke="#000000">
                <g id="line-thin">
                    <circle id="Oval" cx="14" cy="14" r="14"></circle>
                </g>
                <g id="dotted-thin" stroke-dasharray="0,3.02" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14,28 C21.7319865,28 28,21.7319865 28,14 C28,6.2680135 21.7319865,0 14,0 C6.2680135,0 0,6.2680135 0,14 C0,21.7319865 6.2680135,28 14,28 Z" id="Oval"></path>
                </g>
            </g>-->

        </g>
    </g>
</svg>
    `;
  }
}
