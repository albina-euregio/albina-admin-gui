import { Directive, ElementRef, OnDestroy, OnInit, computed, effect, forwardRef, inject, input } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";
import { Calendar, type FormatDateString, type Options } from "vanilla-calendar-pro";

/**
 * Date range picker based on https://vanilla-calendar.pro/ for `<input>` elements, bound via `ngModel` to `[startDate, endDate]`.
 *
 * Selecting a new range keeps the times of the previous range; with `withTime`, start and end time can be edited.
 */
@Directive({
  standalone: true,
  selector: "input[appDateRangePicker]",
  host: { readonly: "", "(blur)": "onTouched()" },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateRangePickerDirective), multi: true }],
})
export class DateRangePickerDirective implements ControlValueAccessor, OnInit, OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly translateService = inject(TranslateService);

  readonly withTime = input(false);
  readonly keepOpen = input(false);
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
      selectionDatesMode: "multiple-ranged",
      firstWeekday: 1,
      selectedTheme: "light",
      locale: this.translateService.getCurrentLang() || "en",
      dateMax: this.dateMax(),
      ...this.toCalendarOptions(this.value),
      onClickDate: (self) => this.onClickDate(self),
      onInit: (self) => {
        self.context.mainElement.addEventListener("change", (event) => this.onChangeTime(event.target as HTMLElement));
        // the default layouts are only set by the first render
        this.defaultLayout = self.layouts.default;
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
    if (!this.keepOpen()) {
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
      default: this.defaultLayout.replace(
        "<#ControlTime />",
        `<div class="app-date-range-time">
        <input type="time" class="form-control form-control-sm" data-app-date-range-time="start" value="${formatTime(startDate)}">
        <span>–</span>
        <input type="time" class="form-control form-control-sm" data-app-date-range-time="end" value="${formatTime(endDate)}">
      </div>`,
      ),
    };
    return true;
  }

  private toCalendarOptions([startDate, endDate]: Date[]): Options {
    if (!startDate || !endDate) return { selectedDates: [] };
    return {
      selectedDates: [`${formatDate(startDate)}:${formatDate(endDate)}`],
      selectedMonth: startDate.getMonth() as Options["selectedMonth"],
      selectedYear: startDate.getFullYear(),
    };
  }

  private format(dates: Date[]): string {
    if (dates.length !== 2) return "";
    const format = new Intl.DateTimeFormat(this.translateService.getCurrentLang() || undefined, {
      dateStyle: this.withTime() ? "short" : "medium",
      timeStyle: this.withTime() ? "short" : undefined,
    });
    return format.formatRange(dates[0], dates[1]);
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

function sameDay(a: Date, b: Date): boolean {
  return formatDate(a) === formatDate(b);
}
