import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

import { Aspect } from "../enums/enums";

const BAND_BLUE = "#19abff";
const MOUNTAIN = "m63 47.5-27-47-6 11-4-7-25 43z";
const MOUNTAIN_HEIGHT = 48;
const MOUNTAIN_WIDTH = 65;
const ROSE_SECTORS: Readonly<Record<string, string>> = {
  E: "m49 25-7.071-7.071L24.959 25l16.97 7.071z",
  N: "m25 .958 7.071 7.071L25 25 17.929 8.03z",
  NE: "M42 8H32l-7 17 17-7z",
  NW: "M8 8h10l7 17-17-7z",
  S: "m25 49 7.071-7.071L25 24.959l-7.071 16.97z",
  SE: "M42 42H32l-7-17 17 7z",
  SW: "M8 42h10l7-17-17 7z",
  W: "m.958 25 7.071-7.071L25 25 8.03 32.071z",
};
const MAIN_ASPECT_SECTORS: Readonly<Record<string, readonly string[]>> = {
  N: ["NW", "N", "NE"],
  E: ["NE", "E", "SE"],
  S: ["SE", "S", "SW"],
  W: ["SW", "W", "NW"],
};

let clipCount = 0;

@Component({
  selector: "app-elevation-icon",
  standalone: true,
  template: `
    <svg
      [attr.viewBox]="viewBox"
      [attr.width]="width()"
      [attr.height]="height()"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
      [attr.aria-hidden]="label() ? null : 'true'"
    >
      <clipPath [attr.id]="clipId">
        <path [attr.d]="mountain" />
      </clipPath>
      <g [attr.clip-path]="clipUrl">
        <rect x="0" [attr.y]="fill().y" [attr.width]="viewWidth" [attr.height]="fill().height" [attr.fill]="blue" />
        @for (y of cutLines(); track y) {
          <rect x="0" [attr.y]="y" [attr.width]="viewWidth" height="1" fill="currentColor" />
        }
      </g>
      <path [attr.d]="mountain" fill="none" stroke="currentColor" />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "elevation-icon" },
})
export class ElevationIconComponent {
  readonly bands = input(1);
  readonly band = input<number | undefined>(undefined);
  readonly width = input(34);
  readonly label = input("");

  readonly blue = BAND_BLUE;
  readonly mountain = MOUNTAIN;
  readonly viewWidth = MOUNTAIN_WIDTH;
  readonly viewBox = `0 0 ${MOUNTAIN_WIDTH} ${MOUNTAIN_HEIGHT}`;
  readonly clipId = `elevation-icon-${++clipCount}`;
  readonly clipUrl = `url(#${this.clipId})`;
  readonly height = computed(() => (this.width() * MOUNTAIN_HEIGHT) / MOUNTAIN_WIDTH);
  readonly cutLines = computed(() =>
    Array.from({ length: Math.max(0, this.bands() - 1) }, (_, k) => (MOUNTAIN_HEIGHT * (k + 1)) / this.bands()),
  );
  readonly fill = computed(() => {
    const band = this.band();
    if (band === undefined) return { y: 0, height: MOUNTAIN_HEIGHT };
    const step = MOUNTAIN_HEIGHT / Math.max(1, this.bands());
    return { y: MOUNTAIN_HEIGHT - step * (band + 1), height: step };
  });
}

@Component({
  selector: "app-aspect-rose",
  standalone: true,
  template: `
    <svg
      viewBox="0 0 50 50"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
      [attr.aria-hidden]="label() ? null : 'true'"
    >
      @for (sector of filled(); track sector.aspect) {
        <path class="aspect-rose-filled" [attr.data-aspect]="sector.aspect" [attr.d]="sector.path" [attr.fill]="blue" />
      }
      <g fill="currentColor" font-size="8" font-weight="bold" letter-spacing=".5">
        <text x="21.928" y="13">N</text>
        <text x="22.299" y="42">S</text>
      </g>
      <g fill="none" stroke="currentColor" stroke-width="0.87" stroke-linecap="round" stroke-linejoin="round">
        @for (path of outlines; track $index) {
          <path [attr.d]="path" />
        }
      </g>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "aspect-rose" },
})
export class AspectRoseComponent {
  readonly aspects = input<readonly string[]>([]);
  readonly size = input(48);
  readonly label = input("");

  readonly blue = BAND_BLUE;
  readonly outlines = Object.values(ROSE_SECTORS);
  readonly filled = computed(() => {
    const selected = this.aspects();
    const filled = new Set(selected.flatMap((aspect) => MAIN_ASPECT_SECTORS[aspect] ?? [aspect]));
    return Object.values(Aspect)
      .filter((aspect) => !selected.length || filled.has(aspect))
      .map((aspect) => ({ aspect, path: ROSE_SECTORS[aspect] }));
  });
}
