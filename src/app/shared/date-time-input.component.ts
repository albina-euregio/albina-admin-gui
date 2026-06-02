import { Component, input, model } from "@angular/core";

@Component({
  selector: "app-date-time-input",
  templateUrl: "date-time-input.component.html",
  standalone: true,
})
export class DateTimeInputComponent {
  readonly value = model<unknown>();
  readonly disabled = input<boolean>(false);

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

  onDateTimeChange(datePart: string, timePart: string): void {
    if (!datePart) {
      this.value.set(undefined);
      return;
    }
    const [year, month, day] = datePart.split("-").map(Number);
    if (year < 1000) {
      return;
    }
    const [hours, minutes] = (timePart || "00:00").split(":").map(Number);
    this.value.set(new Date(year, month - 1, day, hours, minutes));
  }

  clear(): void {
    this.value.set(undefined);
  }
}
