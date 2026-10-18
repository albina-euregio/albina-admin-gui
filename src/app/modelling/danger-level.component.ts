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

import { DangerRating, Frequency, SnowpackStability } from "../enums/enums";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { AspectRoseComponent } from "./aspect-rose.component";
import { awsomeText } from "./awsome-text";
import type { DangerLevelConfig } from "./awsome.config";
import type { DangerBand } from "./danger-bands";
import { dangerRating, levelColor, levelOfRating, levelStyle } from "./danger-levels";
import type { DangerSeries } from "./danger-series";
import {
  DangerSeriesAxisComponent,
  DangerSeriesComponent,
  separatedCells,
  type SeriesRow,
  type SeriesStep,
} from "./danger-series.component";
import { dayMonth, formatUtcConfigDate, parseModelTime, withinDates } from "./dashboard-date";
import {
  EAWS_MATRIX,
  FREQUENCIES,
  type MatrixFrequency,
  MATRIX_SIZES,
  type NoReading,
  type Reading,
  readSteps,
  stabilityClasses,
  type UnstableClass,
  UNSTABLE_CLASSES,
} from "./eaws-reading";
import { type BandKeys, bandName } from "./elevation-cut";
import { ElevationIconComponent } from "./elevation-icon.component";

const TIP_GAP = 5;
const BAND_PHRASES: BandKeys = {
  all: "at any elevation",
  below: "below {{elevation}} m",
  above: "above {{elevation}} m",
  between: "between {{lower}} and {{upper}} m",
};
const STEP_REASONS: Readonly<Record<NoReading, string>> = {
  classes: "no stability index to read",
  nothing: "nothing read",
  "no size": "the decisive class carries no size",
};
const MEDIAN = 50;
const EMPHASIS = "\uE000";

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

interface InfoLine {
  readonly before: string;
  readonly strong?: string;
  readonly after?: string;
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

/** Whether an answer holds a series to draw: steps and bands. */
function hasRows(series: DangerSeries | "none" | undefined): series is DangerSeries {
  return !!series && series !== "none" && series.timestamps.length > 0 && series.bands.length > 0;
}

@Injectable()
export class DangerLevelColors extends ConstantsService {
  /** The colour of a rating: its level's map colour for levels 1 to 5. */
  override getDangerRatingColor(rating: DangerRating) {
    const level = levelOfRating(rating);
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
    "(document:click)": "closeInfoOutside($event)",
    "(document:keydown.escape)": "infoOpen.set(false)",
  },
})
export class DangerLevelComponent {
  private translate = inject(TranslateService);
  private strip = viewChild<ElementRef<HTMLElement>>("strip");
  private info = viewChild<ElementRef<HTMLElement>>("info");

  readonly bands = input.required<readonly DangerBand[]>();
  readonly cuts = input<readonly number[]>([]);
  readonly index = input<DangerIndex | undefined>(undefined);
  readonly dangerLevel = input.required<DangerLevelConfig>();
  readonly date = input.required<string>();
  readonly dateMin = input<string | undefined>(undefined);
  readonly dateMax = input<string | undefined>(undefined);
  readonly context = input<DangerContext | undefined>(undefined);
  readonly series = input<DangerSeries | "none" | undefined>(undefined);
  readonly clearFilter = output<string>();
  readonly reload = output();
  readonly dateSelected = output<string>();

  readonly sizes = MATRIX_SIZES;
  readonly rowLabels = [...FREQUENCIES.map((frequency) => this.frequencyText(frequency)), this.t("(nearly) none")];
  readonly sizeCaption: string = this.translate.instant("matrix.label.avalancheSize");
  readonly seriesLabel = this.t("danger level series");
  readonly loading = this.t("loading");
  readonly infoTitle = this.t("How the danger level is derived");
  readonly infoOpen = signal(false);
  readonly title = computed(() =>
    [this.t("Danger level"), this.index()?.label, this.dateText(this.date())].filter(Boolean).join(" · "),
  );
  readonly pending = computed(() => !!this.context()?.pending);
  readonly bandRows = computed(() => Math.max(1, this.bands().length));
  readonly classes = computed(
    (): readonly SnowpackStability[] =>
      stabilityClasses((this.index()?.bounds?.length ?? 5) - 1) ?? stabilityClasses(4),
  );
  readonly innerBounds = computed(() => this.index()?.bounds?.slice(1, -1));
  readonly infoLines = computed(() => this.infoOf());
  readonly lines = computed(() =>
    this.bands()
      .map((band) => this.lineOf(band))
      .reverse(),
  );
  readonly panels = computed(() => {
    const bands = this.pending() ? [] : this.bands();
    return UNSTABLE_CLASSES.map((stability, k) => ({
      stability,
      title: this.stabilityText(stability),
      cells: FREQUENCIES.flatMap((frequency) =>
        MATRIX_SIZES.map((size) => this.cellOf(stability, frequency, size, bands)),
      ),
      walk: this.walkOf(k, bands),
    }));
  });
  readonly aspects = computed(() => this.context()?.aspects ?? []);
  readonly aspectsTitle = computed(() =>
    this.aspects().length
      ? this.t("aspects {{aspects}}", { aspects: this.aspects().join(" ") })
      : this.t("all aspects"),
  );
  readonly seriesView = computed(() => this.seriesViewOf(this.series()));
  readonly seriesNote = computed(() =>
    this.series() !== undefined && !hasRows(this.series()) ? this.t("no danger level series") : undefined,
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

  /** Opens the explanation of the view, or closes it when it is open. */
  toggleInfo() {
    this.infoOpen.update((open) => !open);
  }

  /** Closes the explanation on a click outside the marker and its text. */
  closeInfoOutside(event: Event) {
    if (this.infoOpen() && !this.info()?.nativeElement.contains(event.target as Node)) this.infoOpen.set(false);
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
  private t(key: string, params?: Record<string, unknown>): string {
    return awsomeText(this.translate, key, params);
  }

  /** The EAWS word of a stability class, good in the map's words. */
  private stabilityText(stability: SnowpackStability): string {
    return stability === SnowpackStability.good
      ? this.t("good")
      : this.translate.instant(`snowpackStability.${stability}`);
  }

  /** The EAWS word of a frequency. */
  private frequencyText(frequency: Frequency): string {
    return this.translate.instant(`frequency.${frequency}`);
  }

  /** The name of a danger level: its danger rating's. */
  private levelName(level: number): string {
    return this.translate.instant(`dangerRating.${dangerRating(level)}`);
  }

  /** A dashboard date as 05.04.2026 00:00. */
  private dateText(date: string): string {
    return `${dayMonth(date)}${date.slice(0, 4)} ${date.slice(11, 16)}`;
  }

  /** A share as a percentage with one decimal. */
  private percent(count: number, total: number): string {
    return ((100 * count) / total).toFixed(1);
  }

  /** Where a band lies, in words. */
  private phraseOf({ edges }: DangerBand): string {
    const { key, params } = bandName(edges, BAND_PHRASES);
    return this.t(key, params);
  }

  /** The bands as the matrix marks them: each band's index with its name. */
  private marksOf(bands: readonly DangerBand[]): BandMark[] {
    return bands.map((band) => ({ band: band.band, label: band.name })).reverse();
  }

  /** The line of one band: its level, elevation and distribution, its reading in words as the title. */
  private lineOf(band: DangerBand) {
    const { reading, name } = band;
    const pending = this.pending();
    const level = pending ? undefined : reading.levels?.[0];
    const alt = pending ? undefined : reading.levels?.[1];
    const head = level
      ? [`${level} ${this.levelName(level)}`, alt ? this.t("also {{level}}", { level: alt }) : undefined]
          .filter(Boolean)
          .join(", ")
      : undefined;
    const triple =
      pending || !reading.stability
        ? undefined
        : reading.stability === SnowpackStability.good
          ? this.t("good throughout")
          : [
              this.stabilityText(reading.stability),
              this.frequencyText(reading.frequency),
              reading.sizeClass ? this.t("size {{size}}", { size: reading.sizeClass }) : this.t("no size"),
            ].join(" · ");
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
            title: `${this.stabilityText(reading.classes[k])}: ${this.percent(count, reading.total)} %`,
          }))
        : [],
    };
  }

  /** A band's reading in words: its margin, or why it has no level. */
  private detailOf(band: DangerBand, pending: boolean): string {
    const { reading } = band;
    const { frequencyBounds, sizePercentile } = this.dangerLevel();
    if (pending) return this.t("selection not loaded");
    if (reading.reason === "classes") {
      return this.index()
        ? this.t("{{index}} has no 2 to 4 chained classes the matrix can read", { index: this.index().label })
        : this.t("no stability index to read");
    }
    if (reading.reason === "nothing") {
      return band.selected
        ? this.t("nothing read {{band}}: {{count}} selected", { band: this.phraseOf(band), count: band.selected })
        : this.t("nothing selected {{band}}", { band: this.phraseOf(band) });
    }
    const decisive = reading.decisive ?? 0;
    const share = this.percent(reading.counts[decisive], reading.total);
    if (reading.stability === SnowpackStability.good) {
      return this.t("{{share}} % good of {{total}} slopes; every other class {{none}}", {
        share,
        total: reading.total,
        none: this.t("none or nearly none"),
      });
    }
    const bounds = mapValues(frequencyBounds, (bound) => +(100 * bound).toFixed(2));
    const margin = this.t(
      {
        [Frequency.many]: "many above {{many}} %",
        [Frequency.some]: "some from {{some}} %, many above {{many}} %",
        [Frequency.few]: "few above {{few}} %, some from {{some}} %",
      }[reading.frequency as MatrixFrequency],
      bounds,
    );
    const sized =
      reading.reason === "no size"
        ? this.t("the decisive class carries no size")
        : this.t("p{{percentile}} size {{size}}", { percentile: sizePercentile, size: reading.size.toFixed(2) });
    return [
      this.t("{{share}} % {{stability}} of {{total}} slopes ({{margin}})", {
        share,
        stability: this.stabilityText(reading.stability),
        total: reading.total,
        margin,
      }),
      sized,
    ].join(" · ");
  }

  /** How the view derives a band's stability class, frequency class and size, in three general sentences. */
  private infoOf(): InfoLine[] {
    const { sizePercentile } = this.dangerLevel();
    const words = mapValues(Frequency, (frequency) => this.frequencyText(frequency));
    const statistic =
      sizePercentile === MEDIAN
        ? this.t("median of the decisive class's size estimates")
        : this.t("p{{percentile}} of the decisive class's size estimates", { percentile: sizePercentile });
    const [before, after] = this.t("The avalanche size is the {{statistic}}.", { statistic: EMPHASIS }).split(EMPHASIS);
    return [
      { before: this.t("Each read slope's stability class comes from the classifying stability index.") },
      {
        before: this.t(
          "The decisive class is the most unstable class whose share of the band's read slopes is above the {{few}} bound; without one the band is good throughout and reads 1. Its frequency class, {{none}}, {{few}}, {{some}} or {{many}}, follows the configured bounds.",
          words,
        ),
      },
      { before, strong: statistic, after },
    ];
  }

  /** One matrix cell: its levels, and the bands whose reading lands on it. */
  private cellOf(stability: UnstableClass, frequency: MatrixFrequency, size: number, bands: readonly DangerBand[]) {
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
      title: this.t("{{stability}} in {{frequency}} locations, size {{size}}: {{levels}}", {
        stability: this.stabilityText(stability),
        frequency: this.frequencyText(frequency),
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
    const low = next === SnowpackStability.good;
    return {
      low,
      color: low ? levelColor(1) : undefined,
      text: low ? `1 ${this.levelName(1)}` : this.t("→ {{next}}", { next: this.stabilityText(next) }),
      passed: this.marksOf(bands.filter(({ reading }) => (reading.decisive ?? -1) > k)),
    };
  }

  /** The rows of a series cut like the bands: each band's level per step, top band first, and the steps' tips. */
  private seriesViewOf(series: DangerSeries | "none" | undefined): SeriesView | undefined {
    if (!hasRows(series)) return undefined;
    const bands = this.bands();
    const readsLikeBands =
      series.bands.length === bands.length &&
      isEqual(series.cuts, this.cuts()) &&
      isEqual(series.bounds, this.innerBounds());
    if (!readsLikeBands) return undefined;
    const dangerLevel = this.dangerLevel();
    const readings = series.bands.map((band) => readSteps(band.count, band.size, dangerLevel));
    const labels = bands.map((band) => band.name);
    const steps = series.timestamps.map((timestamp, t) => {
      const date = formatUtcConfigDate(timestamp);
      return {
        date,
        tip: [
          `${dayMonth(date)} ${date.slice(11, 16)}`,
          ...readings.map((band, b) => `${labels[b]}: ${this.stepText(band[t])}`).reverse(),
        ],
      };
    });
    const dashboardTime = parseModelTime(this.date()).getTime();
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
    const read = reading.total ? ` · ${this.t("{{count}} read", { count: reading.total })}` : "";
    const level = reading.levels?.[0];
    if (level && reading.stability === SnowpackStability.good) return `${level} (${this.t("good throughout")})${read}`;
    if (level) {
      const share = ((100 * reading.counts[reading.decisive]) / reading.total).toFixed(0);
      const where = [
        this.stabilityText(reading.stability),
        `${this.frequencyText(reading.frequency)} ${share} %`,
        this.t("size {{size}}", { size: reading.sizeClass }),
      ];
      return `${level} (${where.join(" · ")})${read}`;
    }
    const reason = this.t(STEP_REASONS[reading.reason ?? "nothing"]);
    return `– (${reason})${read}`;
  }

  /** The bands whose series level at the current step differs from the panel's, when both read the same bands. */
  private differingBands(view: SeriesView): string[] {
    if (view.current < 0 || this.pending()) return [];
    return this.bands().flatMap((band) => {
      const series = view.readings[band.band][view.current].levels?.[0];
      const panel = band.reading.levels?.[0];
      return series === panel
        ? []
        : [
            this.t("{{band}}: series {{series}}, panel {{panel}}", {
              band: band.name,
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
        text: this.t("series ignores: {{types}}", { types: ignored.join(", ") }),
        title: this.t("the API reads the danger level series without the {{types}} selection", {
          types: ignored.join(", "),
        }),
      });
    }
    const differing = this.differingBands(view);
    if (differing.length) {
      const reason = ignored.length
        ? this.t("the panel applies the {{types}} selection, the series does not", { types: ignored.join(", ") })
        : this.t(
            "the series reads the API's population, every stored slope with a compass aspect, the panel the loaded features",
          );
      chips.push({ text: this.t("series ≠ panel at this step"), title: [...differing, reason].join("\n") });
    }
    return chips;
  }

  /** The chips that offer an action: reload a selection not loaded yet, clear a filter that conditions the shares. */
  private actionChips(): Chip[] {
    const context = this.context();
    if (!context) return [];
    const chips: Chip[] = [];
    if (context.pending) {
      const text = this.t("selection not loaded");
      chips.push({ text, title: text, reload: this.t("Reload") });
    }
    for (const { type, label } of context.conditioning) {
      const text = this.t("{{label}} selected: the shares are conditioned", { label });
      chips.push({ text, title: text, clear: { type, title: this.t("Clear the {{label}} selection", { label }) } });
    }
    return chips;
  }
}
