import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injectable,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { isEqual, mapValues } from "es-toolkit";

import { DangerRating } from "../enums/enums";
import { ConstantsService } from "../providers/constants-service/constants.service";
import type { DangerLevelConfig } from "./awsome.config";
import { type DangerBand, levelColor, levelStyle } from "./danger-paint";
import {
  type DangerSeries,
  DangerSeriesAxisComponent,
  DangerSeriesComponent,
  separatedCells,
  type SeriesRow,
  type SeriesStep,
} from "./danger-series.component";
import { dayMonth, formatConfigDate, withinDates } from "./dashboard-date";
import {
  EAWS_MATRIX,
  FREQUENCIES,
  type Frequency,
  MATRIX_SIZES,
  type NoReading,
  type Reading,
  readSteps,
  type Stability,
  stabilityClasses,
  UNSTABLE_CLASSES,
} from "./eaws-reading";
import { AspectRoseComponent, ElevationIconComponent } from "./elevation-icon.component";

const TIP_GAP = 5;
const LEVEL_NAMES = ["Low", "Moderate", "Considerable", "High", "Very high"];
const RATINGS = [
  DangerRating.missing,
  DangerRating.low,
  DangerRating.moderate,
  DangerRating.considerable,
  DangerRating.high,
  DangerRating.very_high,
];
const STEP_REASONS: Readonly<Record<NoReading, string>> = {
  classes: "no stability index to read",
  nothing: "nothing read",
  "no size": "the decisive class carries no size",
};

export interface DangerIndex {
  readonly label: string;
  readonly bounds?: readonly number[];
  readonly colors: readonly string[];
}

export interface DangerContext {
  readonly aspects: readonly string[];
  readonly conditioning: readonly { readonly type: string; readonly label: string }[];
  readonly selected: readonly { readonly type: string; readonly label: string }[];
  readonly pending: boolean;
}

interface Chip {
  readonly text: string;
  readonly title: string;
  readonly clear?: { readonly type: string; readonly title: string };
  readonly reload?: string;
}

interface BandMark {
  readonly band: number;
  readonly label: string;
}

interface SeriesView {
  readonly series: DangerSeries;
  readonly readings: readonly (readonly Reading[])[];
  readonly rows: readonly SeriesRow[];
  readonly steps: readonly SeriesStep[];
  readonly dates: readonly string[];
  readonly outside: readonly boolean[];
  readonly current: number;
}

interface StripBox {
  readonly left: number;
  readonly width: number;
  readonly bottom: number;
}

/** The danger rating of a level, missing without one. */
export function dangerRating(level: number | undefined): DangerRating {
  return RATINGS[level ?? 0] ?? DangerRating.missing;
}

/** The dashboard text of a key in the awsome block of the translations, the key itself when it has none. */
export function awsomeText(translate: TranslateService, key: string, params?: Record<string, unknown>): string {
  const text = translate.instant(`awsome.${key}`, params);
  return typeof text === "string" && !text.startsWith("awsome.") ? text : key;
}

/** Whether an answer holds a series to draw: steps and bands. */
function hasRows(series: DangerSeries | "none" | undefined): series is DangerSeries {
  return !!series && series !== "none" && series.timestamps.length > 0 && series.bands.length > 0;
}

@Injectable()
export class DangerLevelColors extends ConstantsService {
  /** The colour of a rating: its level's map colour for levels 1 to 5. */
  override getDangerRatingColor(rating: DangerRating) {
    const level = RATINGS.indexOf(rating);
    return (level > 0 ? levelColor(level) : super.getDangerRatingColor(rating)) as ReturnType<
      ConstantsService["getDangerRatingColor"]
    >;
  }
}

@Component({
  selector: "app-danger-level",
  standalone: true,
  imports: [AspectRoseComponent, DangerSeriesAxisComponent, DangerSeriesComponent, ElevationIconComponent],
  templateUrl: "danger-level.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "danger-level",
    role: "region",
    "[attr.aria-label]": "title()",
  },
})
export class DangerLevelComponent {
  private translate = inject(TranslateService);
  private strip = viewChild<ElementRef<HTMLElement>>("strip");

  readonly bands = input.required<readonly DangerBand[]>();
  readonly index = input<DangerIndex | undefined>(undefined);
  readonly calibration = input.required<DangerLevelConfig>();
  readonly date = input.required<string>();
  readonly dateMin = input<string | undefined>(undefined);
  readonly dateMax = input<string | undefined>(undefined);
  readonly context = input<DangerContext | undefined>(undefined);
  readonly series = input<DangerSeries | "none" | undefined>(undefined);
  readonly clearFilter = output<string>();
  readonly reload = output();
  readonly dateSelected = output<string>();

  readonly sizes = MATRIX_SIZES;
  readonly rowLabels = [...FREQUENCIES, "(nearly) none"].map((frequency) => this.tr(frequency));
  readonly sizeCaption = this.tr("avalanche size");
  readonly seriesLabel = this.tr("danger level series");
  readonly loading = this.tr("loading");
  readonly title = computed(() =>
    [this.tr("Danger level"), this.index()?.label, this.dateText(this.date())].filter(Boolean).join(" · "),
  );
  readonly pending = computed(() => !!this.context()?.pending);
  readonly bandRows = computed(() => Math.max(1, this.bands().length));
  readonly cuts = computed(() =>
    this.bands()
      .slice(1)
      .map((band) => band.edges[0]),
  );
  readonly classes = computed(
    (): readonly Stability[] => stabilityClasses((this.index()?.bounds?.length ?? 5) - 1) ?? stabilityClasses(4),
  );
  readonly lines = computed(() =>
    this.bands()
      .map((band) => this.lineOf(band))
      .reverse(),
  );
  readonly panels = computed(() => {
    const bands = this.pending() ? [] : this.bands();
    return UNSTABLE_CLASSES.map((stability, k) => ({
      stability,
      title: this.tr(stability),
      cells: FREQUENCIES.flatMap((frequency) =>
        MATRIX_SIZES.map((size) => this.cellOf(stability, frequency, size, bands)),
      ),
      walk: this.walkOf(k, bands),
    }));
  });
  readonly aspects = computed(() => this.context()?.aspects ?? []);
  readonly aspectsTitle = computed(() =>
    this.aspects().length
      ? this.tr("aspects {{aspects}}", { aspects: this.aspects().join(" ") })
      : this.tr("all aspects"),
  );
  readonly seriesView = computed(() => this.seriesViewOf(this.series()));
  readonly seriesNote = computed(() =>
    this.series() !== undefined && !hasRows(this.series()) ? this.tr("no danger level series") : undefined,
  );
  readonly stripBox = signal<StripBox | undefined>(undefined, { equal: isEqual });
  readonly hovered = signal<number | undefined>(undefined);
  readonly separated = computed(() =>
    separatedCells(this.seriesView()?.steps.length ?? 0, this.stripBox()?.width ?? 0),
  );
  readonly tip = computed(() => {
    const view = this.seriesView();
    const box = this.stripBox();
    const step = this.hovered();
    if (!view || !box || step === undefined || !view.steps[step]) return undefined;
    return {
      x: box.left + ((step + 0.5) * box.width) / view.steps.length,
      y: box.bottom + TIP_GAP,
      lines: view.steps[step].tip,
    };
  });
  readonly chips = computed(() => [...this.actionChips(), ...this.seriesChips()]);

  /** Measures the series strip from when it is shown, and forgets the hovered step when it goes. */
  constructor() {
    effect((onCleanup) => {
      const strip = this.strip()?.nativeElement;
      if (!strip) return;
      const measure = () => this.stripBox.set(this.boxOf(strip));
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(strip);
      onCleanup(() => {
        observer.disconnect();
        this.hovered.set(undefined);
      });
    });
  }

  /** Moves the dashboard to the date of a step picked in the series. */
  pickStep(step: number) {
    const date = this.seriesView()?.steps[step]?.date;
    if (date) this.dateSelected.emit(date);
  }

  /** The strip's left edge and width, and the bottom of its last band row, in the panel's coordinates. */
  private boxOf(strip: HTMLElement): StripBox {
    const row = strip.lastElementChild as HTMLElement;
    return { left: strip.offsetLeft, width: strip.offsetWidth, bottom: row.offsetTop + row.offsetHeight };
  }

  /** The dashboard text of a key, the key itself when it has none. */
  private tr(key: string, params?: Record<string, unknown>): string {
    return awsomeText(this.translate, key, params);
  }

  /** A dashboard date as 05.04.2026 00:00. */
  private dateText(date: string): string {
    return `${dayMonth(date)}${date.slice(0, 4)} ${date.slice(11, 16)}`;
  }

  /** A share as a percentage with one decimal. */
  private percent(count: number, total: number): string {
    return ((100 * count) / total).toFixed(1);
  }

  /** A band's name in the dashboard's words. */
  private nameOf({ name }: DangerBand): string {
    return this.tr(name.key, name.params);
  }

  /** Where a band lies, in words. */
  private phraseOf({ edges: [lower, upper] }: DangerBand): string {
    if (lower === undefined && upper === undefined) return this.tr("at any elevation");
    if (lower === undefined) return this.tr("below {{elevation}} m", { elevation: upper });
    if (upper === undefined) return this.tr("above {{elevation}} m", { elevation: lower });
    return this.tr("between {{lower}} and {{upper}} m", { lower, upper });
  }

  /** The bands as the matrix marks them: each band's index with its name. */
  private marksOf(bands: readonly DangerBand[]): BandMark[] {
    return bands.map((band) => ({ band: band.band, label: this.nameOf(band) })).reverse();
  }

  /** The line of one band: its level, elevation and distribution, its reading in words as the title. */
  private lineOf(band: DangerBand) {
    const { reading } = band;
    const pending = this.pending();
    const level = pending ? undefined : reading.levels?.[0];
    const alt = pending ? undefined : reading.levels?.[1];
    const head = level
      ? [`${level} ${this.tr(LEVEL_NAMES[level - 1])}`, alt ? this.tr("also {{level}}", { level: alt }) : undefined]
          .filter(Boolean)
          .join(", ")
      : undefined;
    const triple =
      pending || !reading.stability
        ? undefined
        : reading.stability === "good"
          ? this.tr("good throughout")
          : [
              this.tr(reading.stability),
              this.tr(reading.frequency),
              reading.sizeClass ? this.tr("size {{size}}", { size: reading.sizeClass }) : this.tr("no size"),
            ].join(" · ");
    const name = this.nameOf(band);
    const detail = this.detailOf(band, pending);
    return {
      band: band.band,
      name,
      elevation: this.cuts().length ? name : "",
      level,
      ...levelStyle(level),
      title: [[name, head].filter(Boolean).join(" · "), triple, detail].filter(Boolean).join("\n"),
      reason: level ? undefined : detail,
      shares: reading.total
        ? reading.counts.map((count, k) => ({
            width: (100 * count) / reading.total,
            color: this.index()?.colors[k] ?? "#ccc",
            title: `${this.tr(reading.classes[k])}: ${this.percent(count, reading.total)} %`,
          }))
        : [],
    };
  }

  /** A band's reading in words: its margin, or why it has no level. */
  private detailOf(band: DangerBand, pending: boolean): string {
    const { reading } = band;
    const { frequencyBounds, sizePercentile } = this.calibration();
    if (pending) return this.tr("selection not loaded");
    if (reading.reason === "classes") {
      return this.index()
        ? this.tr("{{index}} has no 2 to 4 chained classes the matrix can read", { index: this.index().label })
        : this.tr("no stability index to read");
    }
    if (reading.reason === "nothing") {
      return band.selected
        ? this.tr("nothing read {{band}}: {{count}} selected", { band: this.phraseOf(band), count: band.selected })
        : this.tr("nothing selected {{band}}", { band: this.phraseOf(band) });
    }
    const decisive = reading.decisive ?? 0;
    const share = this.percent(reading.counts[decisive], reading.total);
    if (reading.stability === "good") {
      return this.tr("{{share}} % good of {{total}} slopes; every other class {{none}}", {
        share,
        total: reading.total,
        none: this.tr("none or nearly none"),
      });
    }
    const bounds = mapValues(frequencyBounds, (bound) => +(100 * bound).toFixed(2));
    const margin = this.tr(
      {
        many: "many above {{many}} %",
        some: "some from {{some}} %, many above {{many}} %",
        "a few": "a few above {{few}} %, some from {{some}} %",
      }[reading.frequency as Frequency],
      bounds,
    );
    const sized =
      reading.reason === "no size"
        ? this.tr("the decisive class carries no size")
        : this.tr("p{{percentile}} size {{size}}", { percentile: sizePercentile, size: reading.size.toFixed(2) });
    return [
      this.tr("{{share}} % {{stability}} of {{total}} slopes ({{margin}})", {
        share,
        stability: this.tr(reading.stability),
        total: reading.total,
        margin,
      }),
      sized,
    ].join(" · ");
  }

  /** One matrix cell: its levels, and the bands whose reading lands on it. */
  private cellOf(stability: Stability, frequency: Frequency, size: number, bands: readonly DangerBand[]) {
    const levels = EAWS_MATRIX[stability][frequency][size];
    const marks = this.marksOf(
      bands.filter(
        ({ reading }) =>
          reading.levels &&
          reading.stability === stability &&
          reading.frequency === frequency &&
          reading.sizeClass === size,
      ),
    );
    return {
      key: `${frequency}-${size}`,
      level: levels[0],
      alt: levels[1],
      marks,
      ...levelStyle(levels[0]),
      title: this.tr("{{stability}} in {{frequency}} locations, size {{size}}: {{levels}}", {
        stability: this.tr(stability),
        frequency: this.tr(frequency),
        size,
        levels: levels.join(", "),
      }),
    };
  }

  /** The (nearly) none box of a panel: where the walk goes on, 1 Low after the last class; the bands that passed it. */
  private walkOf(k: number, bands: readonly DangerBand[]) {
    const classes = this.classes();
    if (k >= classes.length - 1) return undefined;
    const next = classes[k + 1];
    const low = next === "good";
    return {
      low,
      color: low ? levelColor(1) : undefined,
      text: low ? this.tr("1 Low") : this.tr("→ {{next}}", { next: this.tr(next) }),
      passed: this.marksOf(bands.filter(({ reading }) => (reading.decisive ?? -1) > k)),
    };
  }

  /** The rows of a series cut like the bands: each band's level per step, top band first, and the steps' tips. */
  private seriesViewOf(series: DangerSeries | "none" | undefined): SeriesView | undefined {
    if (!hasRows(series)) return undefined;
    const bands = this.bands();
    if (series.bands.length !== bands.length || !isEqual(series.cuts, this.cuts())) return undefined;
    const calibration = this.calibration();
    const readings = series.bands.map((band) => readSteps(band.count, band.size, calibration));
    const labels = bands.map((band) => this.nameOf(band));
    const steps = series.timestamps.map((timestamp, t) => {
      const date = formatConfigDate(timestamp);
      return {
        date,
        tip: [
          `${dayMonth(date)} ${date.slice(11, 16)}`,
          ...readings.map((band, b) => `${labels[b]}: ${this.stepText(band[t])}`).reverse(),
        ],
      };
    });
    const dashboardTime = Date.parse(this.date());
    return {
      series,
      readings,
      rows: readings.map((band, b) => ({ band: b, levels: band.map((reading) => reading.levels?.[0]) })).reverse(),
      steps,
      dates: steps.map((step) => step.date),
      outside: steps.map(({ date }) => !withinDates(date.slice(0, this.date().length), this.dateMin(), this.dateMax())),
      current: series.timestamps.findIndex((timestamp) => +timestamp === dashboardTime),
    };
  }

  /** One step of a band in words: its level and where it lands, or why it has none; then how many slopes were read. */
  private stepText(reading: Reading): string {
    const read = reading.total ? ` · ${this.tr("{{count}} read", { count: reading.total })}` : "";
    const level = reading.levels?.[0];
    if (level && reading.stability === "good") return `${level} (${this.tr("good throughout")})${read}`;
    if (level) {
      const share = ((100 * reading.counts[reading.decisive]) / reading.total).toFixed(0);
      const where = [
        this.tr(reading.stability),
        `${this.tr(reading.frequency)} ${share} %`,
        this.tr("size {{size}}", { size: reading.sizeClass }),
      ];
      return `${level} (${where.join(" · ")})${read}`;
    }
    const reason = this.tr(STEP_REASONS[reading.reason ?? "nothing"]);
    return `– (${reason})${read}`;
  }

  /** The bands whose series level at the current step differs from the panel's, when both read the same bands. */
  private differingBands(view: SeriesView): string[] {
    const inner = this.index()?.bounds?.slice(1, -1);
    if (view.current < 0 || this.pending() || !isEqual(view.series.bounds, inner)) return [];
    return this.bands().flatMap((band) => {
      const series = view.readings[band.band][view.current].levels?.[0];
      const panel = band.reading.levels?.[0];
      return series === panel
        ? []
        : [
            this.tr("{{band}}: series {{series}}, panel {{panel}}", {
              band: this.nameOf(band),
              series: series ?? "–",
              panel: panel ?? "–",
            }),
          ];
    });
  }

  /** The warnings on the series: the selected filters the API did not apply, and a level that differs from the panel's. */
  private seriesChips(): Chip[] {
    const view = this.seriesView();
    const context = this.context();
    if (!view || !context) return [];
    const applied = view.series.applied ?? [];
    const ignored = context.selected.filter(({ type }) => !applied.includes(type)).map(({ label }) => label);
    const chips: Chip[] = [];
    if (ignored.length) {
      chips.push({
        text: this.tr("series ignores: {{types}}", { types: ignored.join(", ") }),
        title: this.tr("the API reads the danger level series without the {{types}} selection", {
          types: ignored.join(", "),
        }),
      });
    }
    const differing = this.differingBands(view);
    if (differing.length) {
      const reason = ignored.length
        ? this.tr("the panel applies the {{types}} selection, the series does not", { types: ignored.join(", ") })
        : this.tr(
            "the series reads the API's population, every stored slope with a compass aspect, the panel the loaded features",
          );
      chips.push({ text: this.tr("series ≠ panel at this step"), title: [...differing, reason].join("\n") });
    }
    return chips;
  }

  /** The chips that offer an action: reload a selection not loaded yet, clear a filter that conditions the shares. */
  private actionChips(): Chip[] {
    const context = this.context();
    if (!context) return [];
    const chips: Chip[] = [];
    if (context.pending) {
      const text = this.tr("selection not loaded");
      chips.push({ text, title: text, reload: this.tr("Reload") });
    }
    for (const { type, label } of context.conditioning) {
      const text = this.tr("{{label}} selected: the shares are conditioned", { label });
      chips.push({ text, title: text, clear: { type, title: this.tr("Clear the {{label}} selection", { label }) } });
    }
    return chips;
  }
}
