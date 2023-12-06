import { Injectable } from "@angular/core";
import { formatDate } from "@angular/common";
import { Browser, Canvas, DivIcon, Icon, LatLng, Marker, MarkerOptions } from "leaflet";
import type { GenericObservation, Stability } from "./models/generic-observation.model";

const colors: Record<Stability | "unknown", string> = {
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

@Injectable()
export class ObservationMarkerService {
  public USE_CANVAS_LAYER = true;

  readonly markerRadius = 40;

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
    return colors[observation?.stability ?? "unknown"] ?? colors.unknown;
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

    // 700533 - drawImage() fails silently when drawing an SVG image without @width or @height
    // https://bugzilla.mozilla.org/show_bug.cgi?id=700533
    const iconUrl = Browser.gecko
      ? "data:image/svg+xml;base64," + btoa(this.getSvg(observation).replace(/<svg/, '<svg width="20" height="20"'))
      : "data:image/svg+xml;base64," + btoa(this.getSvg(observation));

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

    // Set text of Marker (max. 2 characters)
    const label = String(observation.$source).slice(0, 1) + String(observation.$type).slice(0, 1);

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

    return `
    <svg width="42px" height="42px" viewBox="0 0 42 42" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="Symbols" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="map-marker">

            <g id="map-marker-sectors" transform="translate(-4.0842, -4.0842)" fill="#19abff">
              ${aspects[observation.aspect]}
            </g>

            <g id="map-marker-bg" transform="translate(10, 10)" fill="${iconColor}">
                <circle id="Oval" cx="11" cy="11" r="11"></circle>
            </g>

            <g id="map-marker-circle-inner" transform="translate(10, 10)" stroke="#000000">
                <text x="11" y="15" text-anchor="middle" fill="${textColor}" font-size="12" font-weight="lighter" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'">${label}</text>

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
