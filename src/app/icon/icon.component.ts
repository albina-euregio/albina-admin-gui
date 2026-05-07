import { CommonModule } from "@angular/common";
import { Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

interface SelectorOption {
  id: string;
  label: string;
}

interface IconParameter {
  key: string;
  code: string;
  description: string;
  modelOptions: SelectorOption[];
  regionOptions: SelectorOption[];
  levelOptions: SelectorOption[];
  levelCodeMap?: Record<string, string>;
}

interface DayGroup {
  date: string;
  dayLabel: string;
  dateLabel: string;
  hours: string[];
}

// filesMap[parameterCode][date][hour] = fileName
type FilesMap = Record<string, Record<string, Record<string, string>>>;

const ICON_MODEL: SelectorOption = { id: "ICON", label: "ICON" };
const GFS_MODEL: SelectorOption = { id: "GFS", label: "GFS" };
const EUREGIO_REGION: SelectorOption = { id: "euregio", label: "EUREGIO" };
const EUROPE_REGION: SelectorOption = { id: "eu", label: "Europe" };
const ALPS_REGION: SelectorOption = { id: "al", label: "Alps" };
const GFS_LEVELS: SelectorOption[] = ["500", "700", "800", "850", "925"].map((level) => ({
  id: level,
  label: `${level} hPa`,
}));
const CLOUD_LEVEL_OPTIONS: SelectorOption[] = [
  { id: "t", label: "Total" },
  { id: "l", label: "Low" },
  { id: "m", label: "Mid" },
  { id: "h", label: "High" },
];

@Component({
  selector: "app-icon",
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: "./icon.component.html",
  styleUrls: ["./icon.component.css"],
})
export class IconComponent implements OnInit {
  private readonly iconBaseUrl = "https://extra.avalanche.report/meteo-bz/meteo-bz/";
  private readonly iconParameterUrl = `${this.iconBaseUrl}Parameter.txt`;
  private readonly gfsBaseUrl = "https://ertel2.uibk.ac.at/ertel/data/pngs/GFS/00/";
  private swipeCoord?: [number, number];
  private swipeTime?: number;

  parameters: IconParameter[] = [];
  selectedIndex = 0;
  selectedModel = ICON_MODEL.id;
  selectedRegion = EUREGIO_REGION.id;
  selectedLevel = "";
  selectedDate = "";
  selectedHour = "";
  selectedImageUrl = "";
  imageLoadFailed = false;

  loading = true;
  error = "";

  dayGroups: DayGroup[] = [];

  @ViewChild("timelineWrapper") private timelineWrapper?: ElementRef<HTMLDivElement>;

  private filesMap: FilesMap = {};

  async ngOnInit() {
    await this.loadData();
  }

  get selectedParameter(): IconParameter | undefined {
    return this.parameters[this.selectedIndex];
  }

  get availableModels(): SelectorOption[] {
    return this.selectedParameter?.modelOptions ?? [];
  }

  get availableRegions(): SelectorOption[] {
    return this.selectedParameter?.regionOptions ?? [];
  }

  get availableLevels(): SelectorOption[] {
    return this.selectedParameter?.levelOptions ?? [];
  }

  get selectedModelLabel(): string {
    return this.availableModels.find((model) => model.id === this.selectedModel)?.label ?? "";
  }

  get selectedRegionLabel(): string {
    return this.availableRegions.find((region) => region.id === this.selectedRegion)?.label ?? "";
  }

  get selectedLevelLabel(): string {
    return this.availableLevels.find((level) => level.id === this.selectedLevel)?.label ?? "";
  }

  get currentImageAlt(): string {
    const parameter = this.selectedParameter;
    if (!parameter) return "Forecast map";

    const levelSuffix = this.selectedLevelLabel ? ` ${this.selectedLevelLabel}` : "";
    return `${this.selectedModelLabel} ${parameter.description}${levelSuffix} ${this.selectedRegionLabel} ${this.selectedDate} ${this.selectedHour}Z`;
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
    this.syncSelectionsWithParameter();
    this.rebuildDayGroups();
    this.ensureSelectedTimestamp();
    this.updateSelectedImage();
  }

  selectModel(modelId: string) {
    if (this.selectedModel === modelId) return;

    this.selectedModel = modelId;
    this.rebuildDayGroups();
    this.ensureSelectedTimestamp();
    this.updateSelectedImage();
  }

  selectRegion(regionId: string) {
    if (this.selectedRegion === regionId) return;

    this.selectedRegion = regionId;
    this.rebuildDayGroups();
    this.ensureSelectedTimestamp();
    this.updateSelectedImage();
  }

  selectLevel(levelId: string) {
    if (this.selectedLevel === levelId) return;

    this.selectedLevel = levelId;
    this.rebuildDayGroups();
    this.ensureSelectedTimestamp();
    this.updateSelectedImage();
  }

  selectTimestamp(date: string, hour: string) {
    this.selectedDate = date;
    this.selectedHour = hour;
    this.updateSelectedImage();
    this.scheduleTimelineScroll();
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

  onImageLoad() {
    this.imageLoadFailed = false;
  }

  onImageError() {
    this.imageLoadFailed = true;
  }

  private async loadData() {
    this.loading = true;
    this.error = "";

    try {
      const [parameterText, directoryIndex] = await Promise.all([
        fetch(this.iconParameterUrl).then((response) => {
          if (!response.ok) throw new Error(`Failed to load parameters (${response.status})`);
          return response.text();
        }),
        fetch(this.iconBaseUrl).then((response) => {
          if (!response.ok) throw new Error(`Failed to load image index (${response.status})`);
          return response.text();
        }),
      ]);

      this.parameters = this.parseParameters(parameterText);
      this.filesMap = this.parseAllFiles(directoryIndex);

      if (!this.parameters.length) {
        this.error = "No forecast parameters available.";
        return;
      }

      this.syncSelectionsWithParameter();
      this.rebuildDayGroups();
      this.selectInitialTimestamp();
      this.updateSelectedImage();
    } catch {
      this.error = "Could not load forecast data.";
    } finally {
      this.loading = false;
      this.scheduleTimelineScroll();
    }
  }

  private scheduleTimelineScroll() {
    requestAnimationFrame(() => this.scrollSelectedTimestampIntoView());
  }

  private scrollSelectedTimestampIntoView() {
    const wrapper = this.timelineWrapper?.nativeElement;
    if (!wrapper) return;

    const activeButton = wrapper.querySelector<HTMLButtonElement>(".timeline-hour-btn.active");
    if (!activeButton) return;

    const targetLeft = activeButton.offsetLeft - (wrapper.clientWidth - activeButton.offsetWidth) / 2;
    const maxScrollLeft = Math.max(0, wrapper.scrollWidth - wrapper.clientWidth);
    const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, targetLeft));

    wrapper.scrollTo({ left: nextScrollLeft, behavior: "smooth" });
  }

  private updateSelectedImage() {
    const parameter = this.selectedParameter;
    this.imageLoadFailed = false;

    if (!parameter || !this.selectedDate || !this.selectedHour) {
      this.selectedImageUrl = "";
      return;
    }

    if (parameter.key.startsWith("icon:")) {
      const resolvedCode = this.getResolvedIconCode(parameter);
      const fileName = this.filesMap[resolvedCode]?.[this.selectedDate]?.[this.selectedHour] ?? "";
      this.selectedImageUrl = fileName ? `${this.iconBaseUrl}${fileName}` : "";
      return;
    }

    if (!this.selectedRegion) {
      this.selectedImageUrl = "";
      return;
    }

    if (parameter.levelOptions.length > 0 && !this.selectedLevel) {
      this.selectedImageUrl = "";
      return;
    }

    this.selectedImageUrl = `${this.gfsBaseUrl}GFS_${this.selectedDate}_${this.selectedHour}_${parameter.code}${this.selectedLevel}${this.selectedRegion}.png`;
  }

  private rebuildDayGroups() {
    this.dayGroups = this.buildDayGroups();
  }

  private buildDayGroups(): DayGroup[] {
    const parameter = this.selectedParameter;
    if (!parameter) return [];

    if (parameter.key.startsWith("gfs:")) {
      return this.buildGeneratedDayGroups();
    }

    const dateHoursMap = new Map<string, Set<string>>();
    const resolvedCode = this.getResolvedIconCode(parameter);

    for (const [date, hourFiles] of Object.entries(this.filesMap[resolvedCode] ?? {})) {
      if (!dateHoursMap.has(date)) dateHoursMap.set(date, new Set());
      for (const hour of Object.keys(hourFiles)) {
        dateHoursMap.get(date)!.add(hour);
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

  private buildGeneratedDayGroups(): DayGroup[] {
    const dateHoursMap = new Map<string, string[]>();
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    for (let offset = 0; offset <= 168; offset += 3) {
      const timestamp = new Date(start.getTime() + offset * 60 * 60 * 1000);
      const date = `${timestamp.getUTCFullYear()}${String(timestamp.getUTCMonth() + 1).padStart(2, "0")}${String(timestamp.getUTCDate()).padStart(2, "0")}`;
      const hour = String(timestamp.getUTCHours()).padStart(2, "0");
      const hours = dateHoursMap.get(date) ?? [];

      if (!hours.includes(hour)) {
        hours.push(hour);
        dateHoursMap.set(date, hours);
      }
    }

    return [...dateHoursMap.entries()].map(([date, hours]) => ({
      date,
      dayLabel: this.getDayLabel(date),
      dateLabel: this.getDateLabel(date),
      hours,
    }));
  }

  private syncSelectionsWithParameter() {
    const parameter = this.selectedParameter;
    if (!parameter) return;

    this.selectedModel = this.getValidSelection(this.selectedModel, parameter.modelOptions);
    this.selectedRegion = this.getValidSelection(this.selectedRegion, parameter.regionOptions);
    this.selectedLevel = this.getValidSelection(this.selectedLevel, parameter.levelOptions, true);
  }

  private getValidSelection(current: string, options: SelectorOption[], allowEmpty = false): string {
    if (!options.length) return allowEmpty ? "" : current;
    return options.some((option) => option.id === current) ? current : options[0].id;
  }

  private getResolvedIconCode(parameter: IconParameter): string {
    if (!parameter.levelCodeMap) return parameter.code;
    return (
      parameter.levelCodeMap[this.selectedLevel] ??
      parameter.levelCodeMap[parameter.levelOptions[0]?.id] ??
      parameter.code
    );
  }

  private ensureSelectedTimestamp() {
    const isStillAvailable = this.dayGroups.some(
      (dayGroup) => dayGroup.date === this.selectedDate && dayGroup.hours.includes(this.selectedHour),
    );

    if (isStillAvailable) return;

    this.selectInitialTimestamp();
  }

  private selectInitialTimestamp() {
    const allTimestamps = this.dayGroups.flatMap((d) => d.hours.map((h) => ({ date: d.date, hour: h })));
    if (!allTimestamps.length) return;

    const now = new Date();
    const currentDate = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
    const currentHour = String(now.getUTCHours()).padStart(2, "0");

    const exactNow = allTimestamps.find((t) => t.date === currentDate && t.hour === currentHour);
    if (exactNow) {
      this.selectedDate = exactNow.date;
      this.selectedHour = exactNow.hour;
      return;
    }

    const currentKey = `${currentDate}${currentHour}`;
    let latestPastOrCurrent = allTimestamps[0];

    for (const timestamp of allTimestamps) {
      const timestampKey = `${timestamp.date}${timestamp.hour}`;
      if (timestampKey <= currentKey) {
        latestPastOrCurrent = timestamp;
      } else {
        break;
      }
    }

    this.selectedDate = latestPastOrCurrent.date;
    this.selectedHour = latestPastOrCurrent.hour;
  }

  private getDayLabel(date: string): string {
    const d = new Date(Date.UTC(+date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6, 8)));
    return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase();
  }

  private getDateLabel(date: string): string {
    const d = new Date(Date.UTC(+date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6, 8)));
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
  }

  private parseParameters(parameterText: string): IconParameter[] {
    const rawIconParameters = parameterText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.toLowerCase().startsWith("name"))
      .map((line) => {
        const match = line.match(/^([a-z0-9]+)\s+(.+)$/i);
        if (!match) return undefined;
        return { code: match[1], description: match[2].trim() };
      })
      .filter((parameter): parameter is { code: string; description: string } => parameter !== undefined);

    const cloudCodeSet = new Set(["cct", "ccl", "ccm", "cch"]);
    const cloudCodeMap: Record<string, string> = {};
    const cloudLevelOptions: SelectorOption[] = [];

    for (const option of CLOUD_LEVEL_OPTIONS) {
      const codeByLevel: Record<string, string> = {
        t: "cct",
        l: "ccl",
        m: "ccm",
        h: "cch",
      };
      const cloudCode = codeByLevel[option.id];
      const isAvailable = rawIconParameters.some((parameter) => parameter.code === cloudCode);
      if (!isAvailable) continue;

      cloudCodeMap[option.id] = cloudCode;
      cloudLevelOptions.push(option);
    }

    const iconParameters: IconParameter[] = rawIconParameters
      .filter((parameter) => !cloudCodeSet.has(parameter.code))
      .map((parameter) => ({
        key: `icon:${parameter.code}`,
        code: parameter.code,
        description: parameter.description,
        modelOptions: [ICON_MODEL],
        regionOptions: [EUREGIO_REGION],
        levelOptions: [] as SelectorOption[],
      }));

    if (cloudLevelOptions.length) {
      iconParameters.push({
        key: "icon:cc",
        code: "cc",
        description: "Cloud Cover",
        modelOptions: [ICON_MODEL],
        regionOptions: [EUREGIO_REGION],
        levelOptions: cloudLevelOptions,
        levelCodeMap: cloudCodeMap,
      });
    }

    return [
      ...iconParameters,
      {
        key: "gfs:et",
        code: "et",
        description: "Equivalent Potential Temp.",
        modelOptions: [GFS_MODEL],
        regionOptions: [EUROPE_REGION, ALPS_REGION],
        levelOptions: GFS_LEVELS,
      },
      {
        key: "gfs:ns",
        code: "ns",
        description: "Precipitation",
        modelOptions: [GFS_MODEL],
        regionOptions: [EUROPE_REGION, ALPS_REGION],
        levelOptions: [] as SelectorOption[],
      },
    ];
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
