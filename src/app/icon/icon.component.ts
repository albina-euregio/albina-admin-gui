import { CommonModule } from "@angular/common";
import { Component, ElementRef, HostListener, OnInit, ViewChild, inject } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

interface SelectorOption {
  id: string;
  label: string;
  labelKey?: string;
}

interface IconParameter {
  key: string;
  code: string;
  description: string;
  descriptionKey?: string;
  modelOptions: SelectorOption[];
  regionOptions: SelectorOption[];
  levelOptions: SelectorOption[];
  levelCodeMap?: Record<string, string>;
  gfsLevelSuffixMap?: Record<string, string>;
}

interface DayGroup {
  date: string;
  dayLabel: string;
  dateLabel: string;
  hours: string[];
}

interface LocalDayGroup {
  localDateKey: string;
  localDayLabel: string;
  localDateLabel: string;
  timestamps: { date: string; hour: string }[];
}

// filesMap[parameterCode][date][hour] = fileName
type FilesMap = Record<string, Record<string, Record<string, string>>>;

const ICON_MODEL: SelectorOption = { id: "ICON", label: "ICON", labelKey: "weather.models.icon" };
const GFS_MODEL: SelectorOption = { id: "GFS", label: "GFS", labelKey: "weather.models.gfs" };
const EUREGIO_REGION: SelectorOption = { id: "euregio", label: "EUREGIO", labelKey: "weather.regions.euregio" };
const EUROPE_REGION: SelectorOption = { id: "eu", label: "Europe", labelKey: "weather.regions.europe" };
const ALPS_REGION: SelectorOption = { id: "al", label: "Alps", labelKey: "weather.regions.alps" };
const ATLANTIC_REGION: SelectorOption = { id: "at", label: "Atlantic", labelKey: "weather.regions.atlantic" };
const GFS_LEVELS: SelectorOption[] = ["500", "700", "800", "850", "925"].map((level) => ({
  id: level,
  label: `${level} hPa`,
}));
const GFS_RH_LEVELS: SelectorOption[] = ["300", "500", "700", "800", "850", "925"].map((level) => ({
  id: level,
  label: `${level} hPa`,
}));
const GFS_GEOP_ISOTACHS_LEVELS: SelectorOption[] = [{ id: "300", label: "300 hPa" }];
const GFS_SURFACE_LEVEL: SelectorOption[] = [{ id: "sfc", label: "Surface", labelKey: "weather.levels.surface" }];
const CLOUD_LEVEL_OPTIONS: SelectorOption[] = [
  { id: "t", label: "Total", labelKey: "weather.levels.cloudTotal" },
  { id: "h", label: "High", labelKey: "weather.levels.cloudHigh" },
  { id: "m", label: "Mid", labelKey: "weather.levels.cloudMid" },
  { id: "l", label: "Low", labelKey: "weather.levels.cloudLow" },
];

@Component({
  selector: "app-icon",
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: "./icon.component.html",
  styleUrls: ["./icon.component.css"],
})
export class IconComponent implements OnInit {
  private readonly translateService = inject(TranslateService);
  private readonly iconBaseUrl = "https://extra.avalanche.report/meteo-bz/meteo-bz/";
  private readonly iconParameterUrl = `${this.iconBaseUrl}Parameter.txt`;
  private readonly gfsBaseUrl = "https://ertel2.uibk.ac.at/ertel/data/pngs/GFS";
  private readonly gfsRuns = ["00", "06", "12", "18"];
  private swipeCoord?: [number, number];
  private swipeTime?: number;
  private readonly allModels: SelectorOption[] = [ICON_MODEL, GFS_MODEL];
  private readonly allRegions: SelectorOption[] = [ATLANTIC_REGION, EUROPE_REGION, ALPS_REGION, EUREGIO_REGION];

  parameters: IconParameter[] = [];
  selectedParameterKey = "";
  selectedModel = ICON_MODEL.id;
  selectedRegion = EUREGIO_REGION.id;
  selectedLevel = "";
  selectedDate = "";
  selectedHour = "";
  selectedImageUrl = "";
  selectedGfsRun = "00";
  imageLoadFailed = false;

  loading = true;
  error = "";

  dayGroups: DayGroup[] = [];

  @ViewChild("timelineWrapper") private timelineWrapper?: ElementRef<HTMLDivElement>;

  private filesMap: FilesMap = {};
  private readonly gfsTimelineCache = new Map<string, string[]>();
  private readonly gfsTimelineRequestCache = new Map<string, Promise<string[]>>();
  private dayGroupsRequestId = 0;

  async ngOnInit() {
    await this.loadData();
  }

  get selectedParameter(): IconParameter | undefined {
    return this.parameters.find((parameter) => parameter.key === this.selectedParameterKey);
  }

  get availableModels(): SelectorOption[] {
    return this.allModels;
  }

  get filteredParameters(): IconParameter[] {
    return this.parameters.filter((parameter) =>
      parameter.modelOptions.some((modelOption) => modelOption.id === this.selectedModel),
    );
  }

  get availableRegions(): SelectorOption[] {
    return this.selectedParameter?.regionOptions ?? [];
  }

  get orderedRegions(): SelectorOption[] {
    return this.allRegions;
  }

  get availableLevels(): SelectorOption[] {
    return this.selectedParameter?.levelOptions ?? [];
  }

  get selectedModelLabel(): string {
    return this.getOptionLabel(this.availableModels.find((model) => model.id === this.selectedModel));
  }

  get selectedRegionLabel(): string {
    return this.getOptionLabel(this.orderedRegions.find((region) => region.id === this.selectedRegion));
  }

  get selectedLevelLabel(): string {
    return this.getOptionLabel(this.availableLevels.find((level) => level.id === this.selectedLevel));
  }

  get availableGfsRuns(): string[] {
    return this.gfsRuns;
  }

  get localDayGroups(): LocalDayGroup[] {
    const map = new Map<string, LocalDayGroup>();
    const locale = this.getCurrentLocale();

    for (const day of this.dayGroups) {
      for (const hour of day.hours) {
        const localTs = this.toLocalTimestamp(day.date, hour);
        const localKey = `${localTs.getFullYear()}${String(localTs.getMonth() + 1).padStart(2, "0")}${String(localTs.getDate()).padStart(2, "0")}`;

        if (!map.has(localKey)) {
          map.set(localKey, {
            localDateKey: localKey,
            localDayLabel: localTs.toLocaleDateString(locale, { weekday: "short" }).toUpperCase(),
            localDateLabel: localTs.toLocaleDateString(locale, { day: "numeric", month: "short" }),
            timestamps: [],
          });
        }
        map.get(localKey)!.timestamps.push({ date: day.date, hour });
      }
    }

    return [...map.values()];
  }

  get currentImageAlt(): string {
    const parameter = this.selectedParameter;
    if (!parameter) return this.translateService.instant("weather.alt.fallback");

    const levelSuffix = this.selectedLevelLabel ? ` ${this.selectedLevelLabel}` : "";
    return this.translateService.instant("weather.alt.image", {
      model: this.selectedModelLabel,
      parameter: this.getParameterDescription(parameter),
      level: levelSuffix,
      region: this.selectedRegionLabel,
      date: this.selectedDate,
      hour: this.selectedHour,
    });
  }

  private getOptionLabel(option: SelectorOption | undefined): string {
    if (!option) return "";
    return option.labelKey ? this.translateService.instant(option.labelKey) : option.label;
  }

  private getParameterDescription(parameter: IconParameter | undefined): string {
    if (!parameter) return "";
    if (!parameter.descriptionKey) return parameter.description;
    const translated = this.translateService.instant(parameter.descriptionKey);
    return translated === parameter.descriptionKey ? parameter.description : translated;
  }

  private getCurrentLocale(): string {
    return this.translateService.getCurrentLang() || "en";
  }

  getLocalHourLabel(date: string, hour: string): string {
    const localTimestamp = this.toLocalTimestamp(date, hour);
    return String(localTimestamp.getHours()).padStart(2, "0");
  }

  getLocalTimestampAriaLabel(date: string, hour: string): string {
    const localTimestamp = this.toLocalTimestamp(date, hour);
    const localDay = localTimestamp.toLocaleDateString(this.getCurrentLocale(), { weekday: "short" }).toUpperCase();
    const localDate = localTimestamp.toLocaleDateString(this.getCurrentLocale(), { day: "numeric", month: "short" });
    const localHour = String(localTimestamp.getHours()).padStart(2, "0");

    return `${localDay} ${localDate} ${localHour}:00`;
  }

  getLocalDayLabel(date: string, hour: string): string {
    const localTimestamp = this.toLocalTimestamp(date, hour);
    return localTimestamp.toLocaleDateString(this.getCurrentLocale(), { weekday: "short" }).toUpperCase();
  }

  getLocalDateLabel(date: string, hour: string): string {
    const localTimestamp = this.toLocalTimestamp(date, hour);
    return localTimestamp.toLocaleDateString(this.getCurrentLocale(), { day: "numeric", month: "short" });
  }

  private toLocalTimestamp(date: string, hour: string): Date {
    return new Date(Date.UTC(+date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6, 8), +hour, 0, 0));
  }

  @HostListener("document:keydown", ["$event"])
  onDocumentKeydown(event: KeyboardEvent) {
    if (!this.filteredParameters.length) return;

    if (event.key.toLowerCase() === "m") {
      event.preventDefault();
      const currentModelIndex = this.availableModels.findIndex((model) => model.id === this.selectedModel);
      const nextModel = this.availableModels[(currentModelIndex + 1) % this.availableModels.length];
      this.selectModel(nextModel.id);
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      const nextRegionId = this.getNextAvailableRegionId();
      if (nextRegionId) {
        this.selectRegion(nextRegionId);
      }
    } else if (event.ctrlKey && event.key === "ArrowDown") {
      event.preventDefault();
      const nextLevelId = this.getAdjacentAvailableLevelId(+1);
      if (nextLevelId) {
        this.selectLevel(nextLevelId);
      }
    } else if (event.ctrlKey && event.key === "ArrowUp") {
      event.preventDefault();
      const nextLevelId = this.getAdjacentAvailableLevelId(-1);
      if (nextLevelId) {
        this.selectLevel(nextLevelId);
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      this.selectParameterByIndex(this.getSelectedParameterIndex() + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.selectParameterByIndex(this.getSelectedParameterIndex() - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      this.navigateTimestamp(+1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.navigateTimestamp(-1);
    }
  }

  selectParameterByIndex(index: number) {
    const parameterCount = this.filteredParameters.length;
    if (!parameterCount) return;

    this.selectedParameterKey = this.filteredParameters[(index + parameterCount) % parameterCount].key;
    this.syncSelectionsWithParameter();
    void this.refreshTimelineAndImage();
  }

  selectModel(modelId: string) {
    if (this.selectedModel === modelId) return;

    const previousParameterCode = this.selectedParameter?.code;
    this.selectedModel = modelId;
    this.ensureSelectedParameterForModel(previousParameterCode);
    this.syncSelectionsWithParameter();
    void this.refreshTimelineAndImage();
  }

  selectRegion(regionId: string) {
    if (!this.isRegionAvailable(regionId)) return;
    if (this.selectedRegion === regionId) return;

    this.selectedRegion = regionId;
    void this.refreshTimelineAndImage();
  }

  isRegionAvailable(regionId: string): boolean {
    return this.availableRegions.some((region) => region.id === regionId);
  }

  private getNextAvailableRegionId(): string | undefined {
    const availableRegionIds = this.orderedRegions
      .filter((region) => this.isRegionAvailable(region.id))
      .map((region) => region.id);
    if (!availableRegionIds.length) return undefined;

    const currentRegionIndex = availableRegionIds.indexOf(this.selectedRegion);
    const nextRegionIndex = currentRegionIndex === -1 ? 0 : (currentRegionIndex + 1) % availableRegionIds.length;
    return availableRegionIds[nextRegionIndex];
  }

  private getAdjacentAvailableLevelId(direction: number): string | undefined {
    const availableLevelIds = this.availableLevels.map((level) => level.id);
    if (!availableLevelIds.length) return undefined;

    const currentLevelIndex = availableLevelIds.indexOf(this.selectedLevel);
    const nextLevelIndex = currentLevelIndex === -1 ? 0 : currentLevelIndex + direction;
    if (nextLevelIndex < 0 || nextLevelIndex >= availableLevelIds.length) return undefined;

    return availableLevelIds[nextLevelIndex];
  }

  selectLevel(levelId: string) {
    if (this.selectedLevel === levelId) return;

    this.selectedLevel = levelId;
    void this.refreshTimelineAndImage();
  }

  selectGfsRun(run: string) {
    if (!this.gfsRuns.includes(run)) return;
    if (this.selectedGfsRun === run) return;

    this.selectedGfsRun = run;
    void this.refreshTimelineAndImage();
  }

  selectTimestamp(date: string, hour: string, ensureVisible = false) {
    this.selectedDate = date;
    this.selectedHour = hour;
    this.updateSelectedImage();

    if (ensureVisible) {
      setTimeout(() => this.ensureTimestampVisible(date, hour), 0);
    }
  }

  private navigateTimestamp(direction: number) {
    const allTimestamps = this.dayGroups.flatMap((d) => d.hours.map((h) => ({ date: d.date, hour: h })));
    const currentIndex = allTimestamps.findIndex((t) => t.date === this.selectedDate && t.hour === this.selectedHour);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= allTimestamps.length) return;
    const next = allTimestamps[nextIndex];
    this.selectTimestamp(next.date, next.hour, true);
  }

  onSwipe(event: TouchEvent, when: "start" | "end") {
    if (!this.filteredParameters.length) return;

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

    if (duration < 1000 && Math.abs(direction[0]) > 30 && Math.abs(direction[0]) > Math.abs(direction[1] * 3)) {
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

  private ensureTimestampVisible(date: string, hour: string) {
    const wrapper = this.timelineWrapper?.nativeElement;
    if (!wrapper) return;

    const targetButton = wrapper.querySelector<HTMLButtonElement>(
      `.timeline-hour-btn[data-date="${date}"][data-hour="${hour}"]`,
    );
    if (!targetButton) return;

    const buttonLeft = targetButton.offsetLeft;
    const buttonRight = buttonLeft + targetButton.offsetWidth;
    const visibleLeft = wrapper.scrollLeft;
    const visibleRight = visibleLeft + wrapper.clientWidth;
    const visibilityPadding = 4;

    if (buttonLeft >= visibleLeft + visibilityPadding && buttonRight <= visibleRight - visibilityPadding) return;

    const maxScrollLeft = Math.max(0, wrapper.scrollWidth - wrapper.clientWidth);
    let nextScrollLeft = wrapper.scrollLeft;

    if (buttonLeft < visibleLeft + visibilityPadding) {
      nextScrollLeft = buttonLeft - visibilityPadding;
    } else if (buttonRight > visibleRight - visibilityPadding) {
      nextScrollLeft = buttonRight - wrapper.clientWidth + visibilityPadding;
    }

    wrapper.scrollLeft = Math.min(maxScrollLeft, Math.max(0, nextScrollLeft));
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
      await this.detectLatestGfsRun();

      if (!this.parameters.length) {
        this.error = this.translateService.instant("weather.error.noParameters");
        return;
      }

      this.ensureSelectedParameterForModel();
      this.syncSelectionsWithParameter();
      await this.rebuildDayGroups();
      this.selectInitialTimestamp();
      this.updateSelectedImage();
    } catch {
      this.error = this.translateService.instant("weather.error.loadFailed");
    } finally {
      this.loading = false;
    }
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

    const levelSuffix = this.getResolvedGfsLevelSuffix(parameter);
    const gfsBaseUrl = this.getGfsBaseUrl();
    this.selectedImageUrl = `${gfsBaseUrl}GFS_${this.selectedDate}_${this.selectedHour}_${parameter.code}${levelSuffix}${this.selectedRegion}.png`;
  }

  private getGfsBaseUrl(run = this.selectedGfsRun): string {
    return `${this.gfsBaseUrl}/${run}/`;
  }

  private async detectLatestGfsRun() {
    const probeTimestamps = this.getGfsProbeTimestamps();
    const representativeFiles = ["nseu", "et500eu", "capeeu"];

    console.info("[IconWeather] Detecting latest GFS run by probing image availability", {
      runs: this.gfsRuns,
      probeTimestamps: probeTimestamps.map((timestamp) => `${timestamp.date}_${timestamp.hour}`),
      representativeFiles,
    });

    const runScores = await Promise.all(
      this.gfsRuns.map(async (run) => ({
        run,
        score: await this.getRunAvailabilityScore(run, probeTimestamps, representativeFiles),
      })),
    );

    for (const score of runScores) {
      console.info(`[IconWeather] Run ${score.run} available timestamps`, {
        newest: score.score.newestTimestampKey,
        count: score.score.availableTimestampLabels.length,
        timestamps: score.score.availableTimestampLabels,
      });
    }

    const latestByAvailability = runScores
      .filter((score) => !!score.score.newestTimestampKey)
      .sort((left, right) => {
        if (right.score.newestTimestampKey !== left.score.newestTimestampKey) {
          return right.score.newestTimestampKey.localeCompare(left.score.newestTimestampKey);
        }

        if (right.score.availableTimestampLabels.length !== left.score.availableTimestampLabels.length) {
          return right.score.availableTimestampLabels.length - left.score.availableTimestampLabels.length;
        }

        return Number(right.run) - Number(left.run);
      })[0];

    if (latestByAvailability) {
      this.selectedGfsRun = latestByAvailability.run;
      console.info(`[IconWeather] Latest GFS run selected: ${this.selectedGfsRun}`);
      return;
    }

    this.selectedGfsRun = this.getFallbackGfsRun();
    console.warn(`[IconWeather] No GFS images found while probing; falling back to run ${this.selectedGfsRun}`);
  }

  private getGfsProbeTimestamps(): { date: string; hour: string }[] {
    const now = new Date();
    const roundedHour = Math.floor(now.getUTCHours() / 3) * 3;
    const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), roundedHour, 0, 0, 0));

    const offsets = [-12, -9, -6, -3, 0, 3, 6, 9, 12, 24, 36, 48];
    return offsets.map((offset) => {
      const timestamp = new Date(base.getTime() + offset * 60 * 60 * 1000);
      const date = `${timestamp.getUTCFullYear()}${String(timestamp.getUTCMonth() + 1).padStart(2, "0")}${String(timestamp.getUTCDate()).padStart(2, "0")}`;
      const hour = String(timestamp.getUTCHours()).padStart(2, "0");
      return { date, hour };
    });
  }

  private async getRunAvailabilityScore(
    run: string,
    probeTimestamps: { date: string; hour: string }[],
    representativeFiles: string[],
  ): Promise<{ newestTimestampKey: string; availableTimestampLabels: string[] }> {
    let newestTimestampKey = "";
    const availableTimestampLabels: string[] = [];
    const baseUrl = this.getGfsBaseUrl(run);

    for (const timestamp of probeTimestamps) {
      let existsForTimestamp = false;

      for (const fileSuffix of representativeFiles) {
        const url = `${baseUrl}GFS_${timestamp.date}_${timestamp.hour}_${fileSuffix}.png`;
        const exists = await this.checkImageExists(url);

        if (exists) {
          existsForTimestamp = true;
          break;
        }
      }

      if (!existsForTimestamp) continue;

      const label = `${timestamp.date}_${timestamp.hour}`;
      availableTimestampLabels.push(label);

      if (!newestTimestampKey || label > newestTimestampKey) {
        newestTimestampKey = label;
      }
    }

    return {
      newestTimestampKey,
      availableTimestampLabels,
    };
  }

  private async checkImageExists(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const image = new Image();
      const timeoutId = window.setTimeout(() => {
        image.onload = null;
        image.onerror = null;
        resolve(false);
      }, 5000);

      image.onload = () => {
        window.clearTimeout(timeoutId);
        resolve(true);
      };

      image.onerror = () => {
        window.clearTimeout(timeoutId);
        resolve(false);
      };

      image.src = `${url}${url.includes("?") ? "&" : "?"}probe=${Date.now()}`;
    });
  }

  private getFallbackGfsRun(): string {
    const currentUtcHour = new Date().getUTCHours();

    if (currentUtcHour >= 18) return "18";
    if (currentUtcHour >= 12) return "12";
    if (currentUtcHour >= 6) return "06";
    return "00";
  }

  private async refreshTimelineAndImage() {
    await this.rebuildDayGroups();
    this.ensureSelectedTimestamp();
    this.updateSelectedImage();
  }

  private async rebuildDayGroups() {
    const requestId = ++this.dayGroupsRequestId;
    const nextGroups = await this.buildDayGroups();
    if (requestId !== this.dayGroupsRequestId) return;
    this.dayGroups = nextGroups;
  }

  private async buildDayGroups(): Promise<DayGroup[]> {
    const parameter = this.selectedParameter;
    if (!parameter) return [];

    if (parameter.key.startsWith("gfs:")) {
      return this.buildGeneratedDayGroups(parameter);
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

  private async buildGeneratedDayGroups(parameter: IconParameter): Promise<DayGroup[]> {
    if (!this.selectedRegion) return [];
    if (parameter.levelOptions.length > 0 && !this.selectedLevel) return [];

    const levelSuffix = this.getResolvedGfsLevelSuffix(parameter);
    const cacheKey = `${this.selectedGfsRun}|${parameter.code}|${levelSuffix}|${this.selectedRegion}`;
    const availableTimestamps = await this.getOrLoadGfsTimeline(
      cacheKey,
      parameter.code,
      levelSuffix,
      this.selectedRegion,
    );

    const dateHoursMap = new Map<string, string[]>();

    for (const timestamp of availableTimestamps) {
      const [date, hour] = timestamp.split("_");
      if (!date || !hour) continue;

      const hours = dateHoursMap.get(date) ?? [];
      if (hours.includes(hour)) continue;
      hours.push(hour);
      dateHoursMap.set(date, hours);
    }

    return [...dateHoursMap.entries()].map(([date, hours]) => ({
      date,
      dayLabel: this.getDayLabel(date),
      dateLabel: this.getDateLabel(date),
      hours: hours.sort(),
    }));
  }

  private async getOrLoadGfsTimeline(
    cacheKey: string,
    parameterCode: string,
    levelSuffix: string,
    region: string,
  ): Promise<string[]> {
    const cached = this.gfsTimelineCache.get(cacheKey);
    if (cached) return cached;

    const pending = this.gfsTimelineRequestCache.get(cacheKey);
    if (pending) return pending;

    const request = this.probeAvailableGfsTimestamps(parameterCode, levelSuffix, region)
      .then((timestamps) => {
        this.gfsTimelineCache.set(cacheKey, timestamps);
        this.gfsTimelineRequestCache.delete(cacheKey);
        return timestamps;
      })
      .catch(() => {
        this.gfsTimelineRequestCache.delete(cacheKey);
        return [] as string[];
      });

    this.gfsTimelineRequestCache.set(cacheKey, request);
    return request;
  }

  private async probeAvailableGfsTimestamps(
    parameterCode: string,
    levelSuffix: string,
    region: string,
  ): Promise<string[]> {
    const baseUrl = this.getGfsBaseUrl();
    const candidates = this.getGfsTimelineCandidates();
    const checks = candidates.map(async ({ date, hour }) => {
      const url = `${baseUrl}GFS_${date}_${hour}_${parameterCode}${levelSuffix}${region}.png`;
      const exists = await this.checkImageExists(url);
      return exists ? `${date}_${hour}` : "";
    });

    const results = await Promise.all(checks);
    return results.filter((value): value is string => !!value).sort();
  }

  private getGfsTimelineCandidates(): { date: string; hour: string }[] {
    const candidates: { date: string; hour: string }[] = [];
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    for (let offset = 0; offset <= 168; offset += 3) {
      const timestamp = new Date(start.getTime() + offset * 60 * 60 * 1000);
      const date = `${timestamp.getUTCFullYear()}${String(timestamp.getUTCMonth() + 1).padStart(2, "0")}${String(timestamp.getUTCDate()).padStart(2, "0")}`;
      const hour = String(timestamp.getUTCHours()).padStart(2, "0");
      candidates.push({ date, hour });
    }

    return candidates;
  }

  private syncSelectionsWithParameter() {
    const parameter = this.selectedParameter;
    if (!parameter) return;

    this.selectedRegion = this.getValidSelection(this.selectedRegion, parameter.regionOptions);
    this.selectedLevel = this.getValidSelection(this.selectedLevel, parameter.levelOptions, true);
  }

  private getSelectedParameterIndex(): number {
    return this.filteredParameters.findIndex((parameter) => parameter.key === this.selectedParameterKey);
  }

  private ensureSelectedParameterForModel(preferredCode?: string) {
    const availableParameters = this.filteredParameters;

    if (!availableParameters.length) {
      this.selectedParameterKey = "";
      return;
    }

    const preferredParameter = preferredCode
      ? availableParameters.find((parameter) => parameter.code === preferredCode)
      : undefined;
    const currentlySelected = availableParameters.find((parameter) => parameter.key === this.selectedParameterKey);

    this.selectedParameterKey = (preferredParameter ?? currentlySelected ?? availableParameters[0]).key;
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

  private getResolvedGfsLevelSuffix(parameter: IconParameter): string {
    if (!parameter.levelOptions.length) return "";
    if (!parameter.gfsLevelSuffixMap) return this.selectedLevel;

    return (
      parameter.gfsLevelSuffixMap[this.selectedLevel] ??
      parameter.gfsLevelSuffixMap[parameter.levelOptions[0]?.id] ??
      ""
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
    return d.toLocaleDateString(this.getCurrentLocale(), { weekday: "short", timeZone: "UTC" }).toUpperCase();
  }

  private getDateLabel(date: string): string {
    const d = new Date(Date.UTC(+date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6, 8)));
    return d.toLocaleDateString(this.getCurrentLocale(), { day: "numeric", month: "short", timeZone: "UTC" });
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
        descriptionKey: `weather.parameters.icon.${parameter.code}`,
        modelOptions: [ICON_MODEL],
        regionOptions: [EUREGIO_REGION],
        levelOptions: [] as SelectorOption[],
      }));

    const cloudParameter = cloudLevelOptions.length
      ? {
          key: "icon:cc",
          code: "cc",
          description: "Cloud Cover",
          descriptionKey: "weather.parameters.icon.cloudCover",
          modelOptions: [ICON_MODEL],
          regionOptions: [EUREGIO_REGION],
          levelOptions: cloudLevelOptions,
          levelCodeMap: cloudCodeMap,
        }
      : undefined;

    return [
      ...(cloudParameter ? [cloudParameter] : []),
      ...iconParameters,
      {
        key: "gfs:et",
        code: "et",
        description: "Equivalent Potential Temp.",
        descriptionKey: "weather.parameters.gfs.equivalentPotentialTemp",
        modelOptions: [GFS_MODEL],
        regionOptions: [EUROPE_REGION, ALPS_REGION, ATLANTIC_REGION],
        levelOptions: GFS_LEVELS,
      },
      {
        key: "gfs:r",
        code: "r",
        description: "Relative Humidity",
        descriptionKey: "weather.parameters.gfs.relativeHumidity",
        modelOptions: [GFS_MODEL],
        regionOptions: [EUROPE_REGION, ALPS_REGION, ATLANTIC_REGION],
        levelOptions: GFS_RH_LEVELS,
      },
      {
        key: "gfs:g",
        code: "g",
        description: "Geopotential and Isotachs",
        descriptionKey: "weather.parameters.gfs.geopotentialAndIsotachs",
        modelOptions: [GFS_MODEL],
        regionOptions: [EUROPE_REGION, ATLANTIC_REGION],
        levelOptions: GFS_GEOP_ISOTACHS_LEVELS,
      },
      {
        key: "gfs:ns",
        code: "ns",
        description: "Precipitation",
        descriptionKey: "weather.parameters.gfs.precipitation",
        modelOptions: [GFS_MODEL],
        regionOptions: [EUROPE_REGION, ALPS_REGION, ATLANTIC_REGION],
        levelOptions: GFS_SURFACE_LEVEL,
        gfsLevelSuffixMap: { sfc: "" },
      },
      {
        key: "gfs:cape",
        code: "cape",
        description: "CAPE",
        descriptionKey: "weather.parameters.gfs.cape",
        modelOptions: [GFS_MODEL],
        regionOptions: [EUROPE_REGION, ALPS_REGION, ATLANTIC_REGION],
        levelOptions: GFS_SURFACE_LEVEL,
        gfsLevelSuffixMap: { sfc: "" },
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
