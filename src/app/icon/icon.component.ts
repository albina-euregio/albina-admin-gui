import { CommonModule } from "@angular/common";
import { Component, HostListener, OnInit } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

interface IconParameter {
  code: string;
  description: string;
}

interface DayGroup {
  date: string;
  dayLabel: string;
  dateLabel: string;
  hours: string[];
}

// filesMap[parameterCode][date][hour] = fileName
type FilesMap = Record<string, Record<string, Record<string, string>>>;

@Component({
  selector: "app-icon",
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: "./icon.component.html",
  styleUrls: ["./icon.component.css"],
})
export class IconComponent implements OnInit {
  private readonly baseUrl = "https://extra.avalanche.report/meteo-bz/meteo-bz/";
  private readonly parameterUrl = `${this.baseUrl}Parameter.txt`;
  private swipeCoord?: [number, number];
  private swipeTime?: number;

  parameters: IconParameter[] = [];
  selectedIndex = 0;
  selectedDate = "";
  selectedHour = "";
  selectedImageUrl = "";

  loading = true;
  error = "";

  dayGroups: DayGroup[] = [];

  private filesMap: FilesMap = {};

  async ngOnInit() {
    await this.loadData();
  }

  @HostListener("document:keydown", ["$event"])
  onDocumentKeydown(event: KeyboardEvent) {
    if (!this.parameters.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.selectParameterByIndex(this.selectedIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.selectParameterByIndex(this.selectedIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      this.navigateTimestamp(+1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.navigateTimestamp(-1);
    }
  }

  selectParameterByIndex(index: number) {
    const parameterCount = this.parameters.length;
    if (!parameterCount) return;
    this.selectedIndex = (index + parameterCount) % parameterCount;
    this.updateSelectedImage();
  }

  selectTimestamp(date: string, hour: string) {
    this.selectedDate = date;
    this.selectedHour = hour;
    this.updateSelectedImage();
  }

  private navigateTimestamp(direction: number) {
    const allTimestamps = this.dayGroups.flatMap((d) => d.hours.map((h) => ({ date: d.date, hour: h })));
    const currentIndex = allTimestamps.findIndex((t) => t.date === this.selectedDate && t.hour === this.selectedHour);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= allTimestamps.length) return;
    const next = allTimestamps[nextIndex];
    this.selectTimestamp(next.date, next.hour);
  }

  onSwipe(event: TouchEvent, when: "start" | "end") {
    if (!this.parameters.length) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const coord: [number, number] = [touch.clientX, touch.clientY];
    const time = Date.now();

    if (when === "start") {
      this.swipeCoord = coord;
      this.swipeTime = time;
      return;
    }

    if (!this.swipeCoord || this.swipeTime === undefined) return;

    const direction: [number, number] = [coord[0] - this.swipeCoord[0], coord[1] - this.swipeCoord[1]];
    const duration = time - this.swipeTime;

    if (duration < 1000 && Math.abs(direction[1]) > 30 && Math.abs(direction[1]) > Math.abs(direction[0] * 3)) {
      this.selectParameterByIndex(this.selectedIndex + (direction[1] < 0 ? 1 : -1));
    } else if (duration < 1000 && Math.abs(direction[0]) > 30 && Math.abs(direction[0]) > Math.abs(direction[1] * 3)) {
      this.navigateTimestamp(direction[0] < 0 ? +1 : -1);
    }

    this.swipeCoord = undefined;
    this.swipeTime = undefined;
  }

  private async loadData() {
    this.loading = true;
    this.error = "";

    try {
      const [parameterText, directoryIndex] = await Promise.all([
        fetch(this.parameterUrl).then((response) => {
          if (!response.ok) throw new Error(`Failed to load parameters (${response.status})`);
          return response.text();
        }),
        fetch(this.baseUrl).then((response) => {
          if (!response.ok) throw new Error(`Failed to load image index (${response.status})`);
          return response.text();
        }),
      ]);

      this.parameters = this.parseParameters(parameterText);
      this.filesMap = this.parseAllFiles(directoryIndex);

      if (!this.parameters.length) {
        this.error = "No ICON parameters available.";
        return;
      }

      this.dayGroups = this.buildDayGroups();

      // Select latest available timestamp by default
      const lastDay = this.dayGroups[this.dayGroups.length - 1];
      if (lastDay) {
        this.selectedDate = lastDay.date;
        this.selectedHour = lastDay.hours[lastDay.hours.length - 1];
      }

      this.updateSelectedImage();
    } catch {
      this.error = "Could not load ICON data.";
    } finally {
      this.loading = false;
    }
  }

  private updateSelectedImage() {
    const code = this.parameters[this.selectedIndex]?.code;
    const fileName = code ? (this.filesMap[code]?.[this.selectedDate]?.[this.selectedHour] ?? "") : "";
    this.selectedImageUrl = fileName ? `${this.baseUrl}${fileName}` : "";
  }

  private buildDayGroups(): DayGroup[] {
    const dateHoursMap = new Map<string, Set<string>>();
    for (const paramFiles of Object.values(this.filesMap)) {
      for (const [date, hourFiles] of Object.entries(paramFiles)) {
        if (!dateHoursMap.has(date)) dateHoursMap.set(date, new Set());
        for (const hour of Object.keys(hourFiles)) {
          dateHoursMap.get(date)!.add(hour);
        }
      }
    }
    return [...dateHoursMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, hoursSet]) => ({
        date,
        dayLabel: this.getDayLabel(date),
        dateLabel: this.getDateLabel(date),
        hours: [...hoursSet].sort(),
      }));
  }

  private getDayLabel(date: string): string {
    const d = new Date(+date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6, 8));
    return d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  }

  private getDateLabel(date: string): string {
    const d = new Date(+date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6, 8));
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  }

  private parseParameters(parameterText: string): IconParameter[] {
    return parameterText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.toLowerCase().startsWith("name"))
      .map((line) => {
        const match = line.match(/^([a-z0-9]+)\s+(.+)$/i);
        if (!match) return undefined;
        return { code: match[1], description: match[2].trim() };
      })
      .filter((parameter): parameter is IconParameter => parameter !== undefined);
  }

  private parseAllFiles(directoryIndexHtml: string): FilesMap {
    const result: FilesMap = {};
    const regex = /href="\.\/(ICON-1E_(\d{8})_(\d{2})_([a-z0-9]+)al\.png)"/gi;

    for (const match of directoryIndexHtml.matchAll(regex)) {
      const fileName = match[1];
      const date = match[2];
      const hour = match[3];
      const code = match[4];

      if (!result[code]) result[code] = {};
      if (!result[code][date]) result[code][date] = {};
      result[code][date][hour] = fileName;
    }

    return result;
  }
}
