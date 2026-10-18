import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

export const BAND_BLUE = "#19abff";
const MOUNTAIN = "m63 47.5-27-47-6 11-4-7-25 43z";
const MOUNTAIN_HEIGHT = 48;
const MOUNTAIN_WIDTH = 65;

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
