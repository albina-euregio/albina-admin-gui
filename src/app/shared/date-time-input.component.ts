import { Component, input, model, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-date-time-input",
  templateUrl: "date-time-input.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class DateTimeInputComponent {
  readonly value = model<unknown>();
  readonly disabled = input<boolean>(false);
  readonly showTime = input<boolean>(true);

  getDateString(inputEl?: HTMLInputElement): string {
    if (inputEl && document.activeElement === inputEl) {
      return inputEl.value;
    }
    const raw = this.value();
    if (!raw) return "";
    const val = new Date(raw as string | number | Date);
    if (isNaN(val.getTime())) return "";
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, "0");
    const day = String(val.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  getTimeString(inputEl?: HTMLInputElement): string {
    if (inputEl && document.activeElement === inputEl) {
      return inputEl.value;
    }
    const raw = this.value();
    if (!raw) return "";
    const val = new Date(raw as string | number | Date);
    if (isNaN(val.getTime())) return "";
    const hours = String(val.getHours()).padStart(2, "0");
    const minutes = String(val.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  onDatePartChange(datePart: string): void {
    if (!datePart) {
      this.value.set(undefined);
      return;
    }
    const [year, month, day] = datePart.split("-").map(Number);
    if (year < 1000) {
      return;
    }
    const currentVal = this.value();
    let hours = 0;
    let minutes = 0;
    if (currentVal) {
      const val = new Date(currentVal as string | number | Date);
      if (!isNaN(val.getTime())) {
        hours = val.getHours();
        minutes = val.getMinutes();
      }
    }
    this.value.set(new Date(year, month - 1, day, hours, minutes));
  }

  onTimePartChange(timePart: string): void {
    const currentVal = this.value();
    const val = currentVal ? new Date(currentVal as string | number | Date) : new Date();
    const [hours, minutes] = (timePart || "00:00").split(":").map(Number);
    this.value.set(new Date(val.getFullYear(), val.getMonth(), val.getDate(), hours, minutes));
  }

  clear(): void {
    this.value.set(undefined);
  }
}
