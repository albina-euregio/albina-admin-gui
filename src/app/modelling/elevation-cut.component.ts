import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  output,
} from "@angular/core";
import { TranslatePipe } from "@ngx-translate/core";
import { clamp, isEqual } from "es-toolkit";

import { BAR_CHART_GRID_TOP, BAR_CHART_ROWS, BAR_LABEL_OFFSET } from "../observations/observation-chart.component";
import { bandEdges, isSplit, stepStop, stopAtPointer, stopCode, thumbRange } from "./elevation-cut";

const LONG_PRESS_MS = 200;
const PAIRED_THUMB_LABELS = ["awsome.Lower elevation cut", "awsome.Upper elevation cut"];

export interface BandClick {
  band: number;
  event: MouseEvent;
}

export interface BandLevel {
  readonly level: number;
  readonly color: string;
  readonly white: boolean;
}

@Component({
  selector: "app-elevation-cut",
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: "elevation-cut.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "elevation-cut",
    "[style.--grid-top.px]": "chart.gridTop",
    "[style.--label-offset.px]": "chart.labelOffset",
    "[style.--rows]": "chart.rows",
    "[style.--last]": "stops().length - 1",
  },
})
export class ElevationCutComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly stops = input.required<readonly number[]>();
  readonly cuts = model.required<readonly number[]>();
  readonly pressed = input<readonly boolean[]>([]);
  readonly highlighted = input<readonly boolean[]>([]);
  readonly levels = input<readonly (BandLevel | undefined)[]>([]);
  readonly solid = input(false);
  readonly bandClick = output<BandClick>();
  readonly bandPress = output<number>();

  readonly chart = { rows: BAR_CHART_ROWS, gridTop: BAR_CHART_GRID_TOP, labelOffset: BAR_LABEL_OFFSET };
  readonly preview = linkedSignal(() => [...this.cuts()]);
  readonly thumbs = computed(() => {
    const stops = this.stops();
    const cuts = this.preview();
    return cuts
      .map((cut, cutIndex) => {
        const [top, bottom] = thumbRange(stops, cuts, cutIndex);
        const split = isSplit(stops, cut);
        return {
          cut,
          cutIndex,
          stop: stops.indexOf(cut),
          min: stops[bottom],
          max: stops[top],
          code: stopCode(cut),
          split,
          valueText: split ? "awsome.{{elevation}} m" : "awsome.No split",
          label: cuts.length === 1 ? "awsome.Elevation cut" : PAIRED_THUMB_LABELS[cutIndex],
        };
      })
      .reverse();
  });
  readonly bands = computed(() => {
    const stops = this.stops();
    return bandEdges(stops, this.preview())
      .map(([lower, upper], index) => ({
        index,
        top: stops.indexOf(upper),
        bottom: stops.indexOf(lower),
        pressed: !!this.pressed()[index],
        highlighted: !!this.highlighted()[index],
        level: this.levels()[index],
        ...this.bandLabel(lower, upper),
      }))
      .filter(({ top, bottom }) => bottom > top)
      .reverse();
  });
  private grabbed?: number;
  private pressTimer?: ReturnType<typeof setTimeout>;
  private longPressed = false;

  /** The label of a band's button and its parameters; a band over every row names both bounds. */
  private bandLabel(lower: number, upper: number): { label: string; params: Record<string, number> } {
    const bottom = lower === this.stops().at(-1);
    const top = upper === this.stops()[0];
    if (bottom && !top) {
      return { label: "awsome.Select the elevations below {{elevation}} m", params: { elevation: upper } };
    }
    if (top && !bottom) {
      return { label: "awsome.Select the elevations above {{elevation}} m", params: { elevation: lower } };
    }
    return { label: "awsome.Select the elevations between {{lower}} and {{upper}} m", params: { lower, upper } };
  }

  /** Moves a thumb by the key pressed on it; modified keys pass, so Shift+Arrow keeps stepping the date. */
  step(thumb: number, event: KeyboardEvent) {
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    const cuts = this.preview();
    const index = stepStop(event.key, this.stops().indexOf(cuts[thumb]), thumbRange(this.stops(), cuts, thumb));
    if (index === undefined) return;
    event.preventDefault();
    this.moveThumb(thumb, index);
  }

  /** Lets a thumb follow the pointer until it is released. */
  grab(thumb: number, event: PointerEvent) {
    if (event.button !== 0) return;
    event.preventDefault();
    const element = event.currentTarget as HTMLElement;
    element.focus({ preventScroll: true });
    element.setPointerCapture(event.pointerId);
    this.grabbed = thumb;
  }

  /** Puts the grabbed thumb on the stop nearest the pointer that its neighbours leave free. */
  drag(thumb: number, event: PointerEvent) {
    if (this.grabbed !== thumb) return;
    const { top, height } = this.host.nativeElement.getBoundingClientRect();
    const [highest, lowest] = thumbRange(this.stops(), this.preview(), thumb);
    this.moveThumb(thumb, clamp(stopAtPointer(event.clientY - top, height, this.chart), highest, lowest));
  }

  /** Lets go of the grabbed thumb and commits where it stands. */
  release() {
    if (this.grabbed === undefined) return;
    this.grabbed = undefined;
    this.commit();
  }

  /** Lets go of the grabbed thumb and puts it back. */
  abandon() {
    this.grabbed = undefined;
    this.preview.set([...this.cuts()]);
  }

  /** Commits the previewed cuts once they differ from the committed ones. */
  commit() {
    if (!isEqual(this.preview(), this.cuts())) this.cuts.set([...this.preview()]);
  }

  /** Starts the long press that highlights a band instead of selecting it. */
  startPress(band: number, event: PointerEvent) {
    this.cancelPress();
    this.longPressed = false;
    if (event.button !== 0) return;
    this.pressTimer = setTimeout(() => {
      this.pressTimer = undefined;
      this.longPressed = true;
      this.bandPress.emit(band);
    }, LONG_PRESS_MS);
  }

  /** Drops a press that ends before it is long. */
  cancelPress() {
    clearTimeout(this.pressTimer);
    this.pressTimer = undefined;
  }

  /** Hands a click on a band to the quick filter, unless the pointer click ends a long press. */
  clickBand(band: number, event: MouseEvent) {
    if (this.longPressed && event.detail > 0) {
      this.longPressed = false;
      return;
    }
    this.bandClick.emit({ band, event });
  }

  /** Previews a thumb on the stop with the given index. */
  private moveThumb(thumb: number, index: number) {
    const cut = this.stops()[index];
    if (this.preview()[thumb] !== cut) this.preview.update((cuts) => cuts.map((c, i) => (i === thumb ? cut : c)));
  }
}
