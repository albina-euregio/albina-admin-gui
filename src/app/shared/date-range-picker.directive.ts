import { Directive, ElementRef, OnDestroy, OnInit, computed, effect, forwardRef, inject, input } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";
import { Calendar, type FormatDateString, months, type Options } from "vanilla-calendar-pro";

const DISPLAY_MONTHS_COUNT = 3;

/**
 * Date range picker based on https://vanilla-calendar.pro/ for `<input>` elements, bound via `ngModel` to `[startDate, endDate]`.
 *
 * Selecting a new range keeps the times of the previous range; with `withTime`, start and end time can be edited.
 * The calendar closes after selecting a range unless `keepOpen` is set, which defaults to `withTime`.
 * The range can also be typed in the displayed format or as ISO dates; omitted times keep the previous times.
 */
@Directive({
  standalone: true,
  selector: "input[appDateRangePicker]",
  host: { "(blur)": "onTouched()", "(change)": "onChangeInput()" },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateRangePickerDirective), multi: true }],
})
export class DateRangePickerDirective implements ControlValueAccessor, OnInit, OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly translateService = inject(TranslateService);

  readonly withTime = input(false);
  readonly keepOpen = input<boolean | undefined>(undefined);
  readonly maxDate = input<Date | undefined>(undefined);

  private calendar: Calendar;
  private defaultLayout: string;
  private value: Date[] = [];
  private onChange: (value: Date[]) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  // compare by day to avoid re-rendering the calendar when `maxDate` is a new Date on every change detection
  private readonly dateMax = computed(() => {
    const maxDate = this.maxDate();
    return maxDate ? formatDate(maxDate) : ("2999-12-31" as const);
  });

  constructor() {
    effect(() => {
      const dateMax = this.dateMax();
      this.calendar?.set({ dateMax }, { dates: false, time: false });
    });
  }

  ngOnInit(): void {
    this.calendar = new Calendar(this.elementRef.nativeElement, {
      inputMode: true,
      positionToInput: "auto",
      extensions: [months],
      type: "multiple",
      displayMonthsCount: DISPLAY_MONTHS_COUNT,
      selectionDatesMode: "multiple-ranged",
      // clicking the first date again selects a single-day range; toggling it off would yield `[undefined, undefined]`
      enableDateToggle: false,
      firstWeekday: 1,
      selectedTheme: "light",
      locale: this.translateService.getCurrentLang() || "en",
      dateMax: this.dateMax(),
      ...this.toCalendarOptions(this.value),
      onClickDate: (self) => this.onClickDate(self),
      onInit: (self) => {
        self.context.mainElement.addEventListener("change", (event) => this.onChangeTime(event.target as HTMLElement));
        self.context.mainElement.addEventListener("click", (event) => {
          if ((event.target as HTMLElement).closest("[data-app-date-range-done]")) self.hide();
        });
        // the default layouts are only set by the first render
        this.defaultLayout = self.layouts.multiple;
        if (this.updateTimeLayout()) self.set(this.toCalendarOptions(this.value));
      },
    });
    this.calendar.init();
  }

  ngOnDestroy(): void {
    this.calendar?.destroy();
  }

  writeValue(value: Date[] | null | undefined): void {
    const dates = Array.isArray(value) ? value.filter((d) => d instanceof Date && !isNaN(d.getTime())) : [];
    const sameDays = dates.length === this.value.length && dates.every((d, i) => sameDay(d, this.value[i]));
    this.value = dates;
    this.elementRef.nativeElement.value = this.format(this.value);
    this.updateTimeLayout();
    // re-rendering the calendar would discard a pending first click of a range selection
    if (!sameDays) this.calendar?.set(this.toCalendarOptions(this.value));
  }

  registerOnChange(fn: (value: Date[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.elementRef.nativeElement.disabled = isDisabled;
  }

  private onClickDate(self: Calendar): void {
    const dates = self.context.selectedDates;
    if (dates.length < 2) {
      // first click of a range selection
      return;
    }
    const [oldStart, oldEnd] = this.value;
    const startDate = new Date(`${dates[0]}T00:00:00`);
    const endDate = new Date(`${dates[dates.length - 1]}T00:00:00`);
    if (oldStart) startDate.setHours(oldStart.getHours(), oldStart.getMinutes(), oldStart.getSeconds());
    if (oldEnd) endDate.setHours(oldEnd.getHours(), oldEnd.getMinutes(), oldEnd.getSeconds());
    this.emit([startDate, endDate]);
    if (!(this.keepOpen() ?? this.withTime())) {
      self.hide();
    }
  }

  private onChangeTime(target: HTMLElement): void {
    if (!(target instanceof HTMLInputElement) || !target.value) return;
    const index = { start: 0, end: 1 }[target.dataset.appDateRangeTime];
    if (index === undefined || !this.value[index]) return;
    const [hours, minutes] = target.value.split(":").map(Number);
    const dates = [...this.value];
    dates[index] = new Date(dates[index]);
    dates[index].setHours(hours, minutes, 0, 0);
    this.emit(dates);
  }

  protected onChangeInput(): void {
    const dates = this.parse(this.elementRef.nativeElement.value);
    if (!dates) {
      this.elementRef.nativeElement.value = this.format(this.value);
      return;
    }
    this.emit(dates);
    this.calendar.set(this.toCalendarOptions(dates));
  }

  private emit(dates: Date[]): void {
    this.value = dates;
    this.elementRef.nativeElement.value = this.format(dates);
    this.updateTimeLayout();
    this.onChange(dates);
  }

  /**
   * The calendar re-renders its layout from scratch (e.g. when switching to month/year selection),
   * so the current times are baked into the layout.
   */
  private updateTimeLayout(): boolean {
    if (!this.withTime() || !this.defaultLayout) return false;
    const [startDate, endDate] = this.value;
    this.calendar.layouts = {
      ...this.calendar.layouts,
      multiple: this.defaultLayout.replace(
        "<#ControlTime />",
        `<div class="app-date-range-time">
        <input type="time" class="form-control form-control-sm" data-app-date-range-time="start" value="${formatTime(startDate)}">
        <span>–</span>
        <input type="time" class="form-control form-control-sm" data-app-date-range-time="end" value="${formatTime(endDate)}">
        <button type="button" class="btn btn-sm btn-primary" data-app-date-range-done>${this.translateService.instant("button.ok")}</button>
      </div>`,
      ),
    };
    return true;
  }

  private toCalendarOptions([startDate, endDate]: Date[]): Options {
    const selectedDates: Options["selectedDates"] =
      startDate && endDate ? [`${formatDate(startDate)}:${formatDate(endDate)}`] : [];
    // show the start month, but no months after `maxDate`
    const start = startDate ?? new Date();
    let month = start.getFullYear() * 12 + start.getMonth();
    const maxDate = this.maxDate();
    if (maxDate) month = Math.min(month, maxDate.getFullYear() * 12 + maxDate.getMonth() - (DISPLAY_MONTHS_COUNT - 1));
    return {
      selectedDates,
      selectedMonth: (month % 12) as Options["selectedMonth"],
      selectedYear: Math.floor(month / 12),
    };
  }

  private dateTimeFormat(): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat(this.translateService.getCurrentLang() || undefined, {
      dateStyle: this.withTime() ? "short" : "medium",
      timeStyle: this.withTime() ? "short" : undefined,
    });
  }

  // not using `formatRange`, which omits shared parts (`Dec 18 – 24, 2024`) and could not be parsed back
  private format(dates: Date[]): string {
    if (dates.length !== 2) return "";
    const format = this.dateTimeFormat();
    return `${format.format(dates[0])} – ${format.format(dates[1])}`;
  }

  private parse(text: string): Date[] | undefined {
    const parts = text.split(/\s+[-–—]\s+|[–—]/).filter((part) => part.trim());
    if (parts.length < 1 || parts.length > 2) return undefined;
    const format = this.dateTimeFormat();
    const [oldStart, oldEnd] = this.value;
    const startDate = parseDate(format, parts[0], oldStart);
    const endDate = parseDate(format, parts[1] ?? parts[0], oldEnd ?? oldStart);
    if (!startDate || !endDate || startDate > endDate) return undefined;
    if (formatDate(endDate) > this.dateMax()) return undefined;
    return [startDate, endDate];
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDate(date: Date): FormatDateString {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as FormatDateString;
}

function formatTime(date: Date | undefined): string {
  return date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : "";
}

const localeNamesCache = new Map<string, { monthNames: string[][]; dayPeriodNames: string[] }>();

/** Lower-cased month names (long and short) and AM/PM names of `locale`, without dots. */
function localeNames(locale: string) {
  let names = localeNamesCache.get(locale);
  if (!names) {
    const monthFormats = (["long", "short"] as const).map((month) => new Intl.DateTimeFormat(locale, { month }));
    const hourFormat = new Intl.DateTimeFormat(locale, { hour: "numeric", hour12: true });
    names = {
      monthNames: Array.from({ length: 12 }, (_, month) =>
        monthFormats.map((format) => normalizeName(locale, format.format(new Date(2000, month, 1)))),
      ),
      dayPeriodNames: [0, 12].map((hour) =>
        normalizeName(
          locale,
          hourFormat.formatToParts(new Date(2000, 0, 1, hour)).find((part) => part.type === "dayPeriod")?.value ?? "",
        ),
      ),
    };
    localeNamesCache.set(locale, names);
  }
  return names;
}

function normalizeName(locale: string, name: string): string {
  return name.toLocaleLowerCase(locale).replace(/\./g, "");
}

/**
 * Parses a date formatted by `format`, using the order of its fields and its month and day period names.
 * Times not given are taken from `timeOf`.
 */
function parseDate(format: Intl.DateTimeFormat, text: string, timeOf: Date | undefined): Date | undefined {
  const { locale } = format.resolvedOptions();
  const { monthNames, dayPeriodNames } = localeNames(locale);

  const fields: Partial<Record<"year" | "month" | "day" | "hour" | "minute", number>> = {};
  let pm: boolean | undefined;
  const numbers = text.match(/\d+/g) ?? [];
  for (const token of text.match(/\p{L}[\p{L}.]*/gu) ?? []) {
    const name = normalizeName(locale, token);
    const month = monthNames.findIndex((names) =>
      names.some((n) => n === name || (name.length >= 3 && n.startsWith(name))),
    );
    const dayPeriod = dayPeriodNames.indexOf(name);
    if (month >= 0) fields.month = month + 1;
    else if (dayPeriod >= 0) pm = dayPeriod === 1;
  }

  const isoOrder = ["year", "month", "day", "hour", "minute"] as const;
  const order =
    numbers[0]?.length === 4
      ? isoOrder
      : format
          .formatToParts(new Date(2000, 0, 1))
          .map((part) => part.type)
          .filter((type): type is (typeof isoOrder)[number] => (isoOrder as readonly string[]).includes(type));
  const numericFields = order.filter((field) => fields[field] === undefined);
  if (numbers.length > numericFields.length) return undefined;
  numbers.forEach((n, i) => (fields[numericFields[i]] = Number(n)));

  const { month, day } = fields;
  let { year, hour, minute } = fields;
  if (year === undefined || month === undefined || day === undefined) return undefined;
  if (year < 100) year += 2000;
  if (hour === undefined) {
    hour = timeOf?.getHours() ?? 0;
    minute = timeOf?.getMinutes() ?? 0;
  } else if (pm !== undefined) {
    if (hour < 1 || hour > 12) return undefined;
    hour = (hour % 12) + (pm ? 12 : 0);
  }
  minute ??= 0;
  if (hour > 23 || minute > 59) return undefined;
  const date = new Date(year, month - 1, day, hour, minute);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : undefined;
}

function sameDay(a: Date, b: Date): boolean {
  return formatDate(a) === formatDate(b);
}
