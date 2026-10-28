import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

import { Aspect } from "../enums/enums";
import { BAND_BLUE } from "./elevation-icon.component";

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
