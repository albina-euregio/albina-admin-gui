import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { range } from "es-toolkit";

import { levelColor } from "./danger-levels";
import { dayMonth } from "./dashboard-date";

export interface SeriesRow {
  readonly band: number;
  readonly levels: readonly (number | undefined)[];
}

export interface SeriesStep {
  readonly date: string;
  readonly tip: readonly string[];
}

export interface DayLabel {
  readonly index: number;
  readonly text: string;
}

export interface ShownLabel extends DayLabel {
  readonly centre: number;
}

export const DAY_LABEL_WIDTH = 41;
export const DAY_LABEL_GAP = 9;
const SEPARATED_CELL_WIDTH = 2.5;

/** The first step of each day among dashboard dates, labelled dd.mm. */
export function dayLabels(dates: readonly string[]): DayLabel[] {
  return dates.flatMap((date, index) =>
    index > 0 && date.slice(0, 10) === dates[index - 1].slice(0, 10) ? [] : [{ index, text: dayMonth(date) }],
  );
}

/** A day label's centre on a strip in px: its step's centre, moved inwards to keep a label this wide on the strip. */
export function labelCentre(label: DayLabel, steps: number, width: number, labelWidth = DAY_LABEL_WIDTH): number {
  const centre = ((label.index + 0.5) * width) / Math.max(1, steps);
  return Math.max(labelWidth / 2, Math.min(centre, width - labelWidth / 2));
}

/** The day labels a strip this wide shows: every stride-th, the first and last yielding to a neighbour too close. */
export function shownLabels(
  labels: readonly DayLabel[],
  steps: number,
  width: number,
  labelWidth = DAY_LABEL_WIDTH,
): ShownLabel[] {
  if (width <= 0) return [];
  const placed = labels.map((label) => ({ ...label, centre: labelCentre(label, steps, width, labelWidth) }));
  const crowded = (left?: ShownLabel, right?: ShownLabel) =>
    !!left && !!right && right.centre - left.centre < labelWidth + DAY_LABEL_GAP;
  let most: ShownLabel[] = [];
  for (const stride of range(1, placed.length + 1)) {
    let shown = placed.filter((_, k) => k % stride === 0);
    if (crowded(shown[0], shown[1])) shown = shown.slice(1);
    if (shown.at(-1) === placed.at(-1) && crowded(shown.at(-2), shown.at(-1))) shown = shown.slice(0, -1);
    if (shown.length > most.length && shown.every((label, k) => !crowded(shown[k - 1], label))) most = shown;
  }
  return most;
}

/** The day labels whose step starts a day on the strip: every later day, the first only when it starts at midnight. */
export function dayStarts(labels: readonly DayLabel[], dates: readonly string[]): DayLabel[] {
  return labels.filter((label) => label.index > 0 || dates[0]?.slice(11, 16) === "00:00");
}

/** Whether the cells of a strip this wide are wide enough to be told apart by a white line. */
export function separatedCells(steps: number, width: number): boolean {
  return steps > 0 && width / steps > SEPARATED_CELL_WIDTH;
}

@Component({
  selector: "app-danger-series",
  standalone: true,
  template: `
    @for (color of colors(); track $index) {
      <span
        class="danger-series-cell"
        [class.current]="$index === current()"
        [class.hovered]="$index === hovered()"
        [class.outside]="outside()[$index]"
        [style.background-color]="color"
        (mouseenter)="stepHovered.emit($index)"
        (click)="stepPicked.emit($index)"
      ></span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "danger-series", "[class.separated]": "separated()" },
})
export class DangerSeriesComponent {
  readonly levels = input.required<readonly (number | undefined)[]>();
  readonly current = input(-1);
  readonly hovered = input<number | undefined>(undefined);
  readonly outside = input<readonly boolean[]>([]);
  readonly separated = input(false);
  readonly stepHovered = output<number>();
  readonly stepPicked = output<number>();

  readonly colors = computed(() => this.levels().map((level) => (level ? levelColor(level) : null)));
}

@Component({
  selector: "app-danger-series-axis",
  standalone: true,
  template: `
    <span #probe class="danger-series-probe" aria-hidden="true">00.00.</span>
    @for (day of ticks(); track day.index) {
      <span class="danger-series-tick" [style.left.%]="100 * fractionAt(day.index)"></span>
    }
    @for (day of shownDays(); track day.index) {
      <span class="danger-series-day" [class.current]="day.index === currentDay()" [style.left.px]="day.centre">{{
        day.text
      }}</span>
    }
    @if (current() >= 0) {
      <span class="danger-series-now" [style.left.%]="100 * fractionAt(current() + 0.5)"></span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "danger-series-axis" },
})
export class DangerSeriesAxisComponent {
  private probe = viewChild<ElementRef<HTMLElement>>("probe");

  readonly dates = input.required<readonly string[]>();
  readonly current = input(-1);
  readonly width = input(0);

  readonly labelWidth = signal(DAY_LABEL_WIDTH);
  readonly days = computed(() => dayLabels(this.dates()));
  readonly ticks = computed(() => dayStarts(this.days(), this.dates()));
  readonly shownDays = computed(() => shownLabels(this.days(), this.dates().length, this.width(), this.labelWidth()));
  readonly currentDay = computed(() => {
    const started = this.days().filter((day) => day.index <= this.current());
    return started.at(-1)?.index;
  });

  /** Measures a day label as the browser renders it, again whenever its size changes. */
  constructor() {
    effect((onCleanup) => {
      const probe = this.probe()?.nativeElement;
      if (!probe) return;
      const observer = new ResizeObserver(() => {
        const width = probe.getBoundingClientRect().width;
        if (width > 0) this.labelWidth.set(Math.ceil(width));
      });
      observer.observe(probe);
      onCleanup(() => observer.disconnect());
    });
  }

  /** A position along the steps as a fraction of the axis width. */
  fractionAt(step: number): number {
    return step / Math.max(1, this.dates().length);
  }
}
