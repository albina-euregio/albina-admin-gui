import "@albina-euregio/linea/aws-stats";
import {
  CONFIGURED_PLOTS,
  type AwsstatsDatatype,
  type AwsstatsPlotConfig,
} from "@albina-euregio/linea/aws-stats-plot-config";
import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { TooltipModule } from "ngx-bootstrap/tooltip";

import { GraphicsService } from "./graphics.service";

const AVAILABLE_YEARLY_CHART_TYPES = CONFIGURED_PLOTS.yearlystats.map((c) => c.id);

@Component({
  selector: "app-yearlystats",
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, TooltipModule],
  templateUrl: "./yearlystats.component.html",
  styleUrls: ["./yearlystats.component.scss"],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class YearlystatsComponent implements AfterViewInit {
  @ViewChild("wrapperHost", { static: false })
  private wrapperHost?: ElementRef<HTMLElement>;
  private graphicsService = inject(GraphicsService);
  private translateService = inject(TranslateService);

  protected authenticationService = inject(AuthenticationService);
  protected startDate = this.toDateInputValue(this.shiftDays(new Date(), -30));
  protected endDate = this.toDateInputValue(new Date());
  protected errorMessage = "";
  protected showWrapper = false;
  protected loading = false;
  protected pendingLoad = true;
  protected showDateChangeHint = false;
  protected activeQuickRange: "last90" | "last180" | "season" | null = null;
  protected bulletins = "[]";
  protected blogs = "[]";
  protected stress = "[]";
  protected observations = "[]";
  protected fieldTrainings = "";
  protected virtualTrainings = "";
  protected dangerRatingReference = "19, 42, 37, 2.2, 0.1";
  protected selectedRegionCodes: string[] = [];
  protected openTooltipId: string | null = null;

  protected readonly regionCodes = this.graphicsService.getBulletinRegionCodes();
  protected readonly chartConfigs = CONFIGURED_PLOTS.yearlystats;

  // derive available yearly chart types from config and initialize selection dynamically
  protected chartTypeSelection: Record<string, boolean> = Object.fromEntries(
    this.chartConfigs.map((c) => [c.id, c.id === "aws-danger-rating-micro-regions-bars"]),
  );

  ngAfterViewInit() {
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected setLastDays(days: number) {
    this.activeQuickRange = days === 90 ? "last90" : days === 180 ? "last180" : null;
    this.showDateChangeHint = false;
    this.pendingLoad = false;
    this.startDate = this.toDateInputValue(this.shiftDays(new Date(), -days));
    this.endDate = this.toDateInputValue(new Date());
    this.updateCharts();
  }

  protected setCurrentSeason() {
    this.activeQuickRange = "season";
    this.showDateChangeHint = false;
    this.pendingLoad = false;
    const { start, end } = this.graphicsService.getCurrentSeason();
    this.startDate = start;
    this.endDate = end;
    this.updateCharts();
  }

  protected onDateChanged() {
    this.pendingLoad = true;
    this.showDateChangeHint = true;
    this.activeQuickRange = null;
  }

  protected setChartType(chartType: string, checked: boolean) {
    this.chartTypeSelection[chartType] = checked;
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected onTrainingInputsChanged() {
    this.pendingLoad = true;
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected onReferenceChanged() {
    this.pendingLoad = true;
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected toggleChartTooltip(event: MouseEvent, chartId: string) {
    event.stopPropagation();
    this.openTooltipId = this.openTooltipId === chartId ? null : chartId;
  }

  protected closeChartTooltips() {
    this.openTooltipId = null;
  }

  protected selectAllRegions() {
    if (this.selectedRegionCodes.length === 0) return;
    this.selectedRegionCodes = [];
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected toggleRegionCode(regionCode: string) {
    if (this.selectedRegionCodes.length === 0) {
      this.selectedRegionCodes = [regionCode];
    } else if (this.selectedRegionCodes.includes(regionCode)) {
      this.selectedRegionCodes = this.selectedRegionCodes.filter((code) => code !== regionCode);
    } else {
      this.selectedRegionCodes = [...this.selectedRegionCodes, regionCode];
    }

    if (this.selectedRegionCodes.length === this.regionCodes.length) {
      this.selectedRegionCodes = [];
    }

    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  private getSelectedChartConfigs(): AwsstatsPlotConfig[] {
    return (Object.keys(this.chartTypeSelection) as string[])
      .filter((key) => this.chartTypeSelection[key] && (AVAILABLE_YEARLY_CHART_TYPES as string[]).includes(key))
      .map((id) => CONFIGURED_PLOTS.yearlystats.find((config: AwsstatsPlotConfig) => config.id === id))
      .filter((config): config is AwsstatsPlotConfig => !!config);
  }

  protected isChartDisabled(config: AwsstatsPlotConfig): boolean {
    if (config.regions === "userRegion") {
      return (
        this.selectedRegionCodes.length !== 1 ||
        this.selectedRegionCodes[0] !== this.authenticationService.getActiveRegionId()
      );
    }

    return false;
  }

  private getRequiredParameters(): Set<AwsstatsDatatype> {
    const configs = this.getSelectedChartConfigs();
    const params = new Set<AwsstatsDatatype>();
    configs.forEach((config) => {
      config.parameters.forEach((param) => params.add(param));
    });
    return params;
  }

  protected isRegionButtonActive(regionCode: string): boolean {
    return this.isRegionSelected(regionCode);
  }

  protected get allRegionsSelected(): boolean {
    return this.selectedRegionCodes.length === 0;
  }

  private isRegionSelected(regionCode: string): boolean {
    return this.selectedRegionCodes.length === 0 || this.selectedRegionCodes.includes(regionCode);
  }

  private getRegionCodeValue(): string {
    return this.selectedRegionCodes.length === 1 ? this.selectedRegionCodes[0] : "all";
  }

  protected async updateCharts() {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = this.translateService.instant("awsstats.error.startDateEndDateRequired");
      return;
    }

    if (this.startDate > this.endDate) {
      this.errorMessage = this.translateService.instant("awsstats.error.startDateBeforeEndDate");
      return;
    }

    this.errorMessage = "";
    this.loading = true;
    try {
      const requiredParams = this.getRequiredParameters();

      if (requiredParams.has("bulletins")) {
        const bulletinRegionCodes = this.getSelectedBulletinRegionCodes();
        const bulletins = await this.graphicsService.loadBulletins(
          this.startDate,
          this.endDate,
          bulletinRegionCodes,
          this.graphicsService.getBulletinLanguage(),
        );
        this.bulletins = JSON.stringify(bulletins);
      }

      if (requiredParams.has("blogs")) {
        const blogRegionCodes = this.getSelectedBlogRegionCodes();
        const blogs = await this.graphicsService.loadBlogs(this.startDate, this.endDate, blogRegionCodes);
        this.blogs = JSON.stringify(blogs);
      }

      if (requiredParams.has("stress-level")) {
        const stress = await this.graphicsService.loadTeamStressLevels(this.startDate, this.endDate);
        this.stress = JSON.stringify(stress);
      }

      if (requiredParams.has("observations")) {
        this.observations = "[]";
      }
    } catch (error) {
      this.errorMessage = this.translateService.instant("awsstats.error.failedLoadData");
      console.error(error);
      this.loading = false;
      return;
    }

    this.showWrapper = true;
    this.mountWrapper();
    this.pendingLoad = false;
    this.showDateChangeHint = false;
    this.loading = false;
  }

  protected get showProductsTrainingInputs(): boolean {
    const params = this.getRequiredParameters();
    return params.has("field-trainings") || params.has("virtual-trainings");
  }

  protected get showDistributionReferenceInput(): boolean {
    return this.getRequiredParameters().has("danger-rating-reference");
  }

  private mountWrapper() {
    if (!this.wrapperHost?.nativeElement) return;

    const host = this.wrapperHost.nativeElement;
    host.replaceChildren();

    const wrapper = document.createElement("aws-stats-wrapper");
    wrapper.setAttribute("chart-type", this.getSelectedChartTypesValue());
    wrapper.setAttribute("start-date", this.startDate);
    wrapper.setAttribute("end-date", this.endDate);
    wrapper.setAttribute("region-code", this.getRegionCodeValue());
    wrapper.setAttribute("bulletin-filter-micro-region", "all");
    wrapper.setAttribute("blogs", this.blogs);
    wrapper.setAttribute("bulletins", this.bulletins);
    wrapper.setAttribute("stress-level", this.stress);

    const requiredParams = this.getRequiredParameters();

    if (requiredParams.has("field-trainings")) {
      wrapper.setAttribute("field-trainings", JSON.stringify(this.parseTrainingDates(this.fieldTrainings)));
    }

    if (requiredParams.has("virtual-trainings")) {
      wrapper.setAttribute("virtual-trainings", JSON.stringify(this.parseTrainingDates(this.virtualTrainings)));
    }

    if (requiredParams.has("danger-rating-reference")) {
      wrapper.setAttribute(
        "danger-rating-reference",
        JSON.stringify(this.parseDangerRatingReference(this.dangerRatingReference)),
      );
    }

    if (requiredParams.has("observations")) {
      wrapper.setAttribute("observations", this.observations);
    }

    host.appendChild(wrapper);
  }

  private getSelectedChartTypesValue(): string {
    const selected = (Object.keys(this.chartTypeSelection) as string[]).filter(
      (key) => this.chartTypeSelection[key] && (AVAILABLE_YEARLY_CHART_TYPES as string[]).includes(key),
    );
    return selected.length
      ? selected.join(",")
      : AVAILABLE_YEARLY_CHART_TYPES.includes("aws-danger-rating-micro-regions-bars")
        ? "aws-danger-rating-micro-regions-bars"
        : (AVAILABLE_YEARLY_CHART_TYPES[0] ?? "");
  }

  private getSelectedBulletinRegionCodes(): string[] {
    const available = this.graphicsService.getBulletinRegionCodes();
    if (this.selectedRegionCodes.length === 0) {
      return available;
    }

    return this.selectedRegionCodes.filter((regionCode) => available.includes(regionCode));
  }

  private getSelectedBlogRegionCodes(): string[] {
    const available = this.graphicsService.getBlogRegionCodes();
    if (this.selectedRegionCodes.length === 0) {
      return available;
    }

    return this.selectedRegionCodes.filter((regionCode) => available.includes(regionCode));
  }

  private parseTrainingDates(value: string): string[] {
    return (value ?? "")
      .split(/[\n,;]+/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .filter((entry) => !Number.isNaN(Date.parse(entry)));
  }

  private parseDangerRatingReference(value: string): number[] {
    return (value ?? "")
      .split(/[\n,;]+/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => parseFloat(entry))
      .filter((num) => !Number.isNaN(num));
  }

  private toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private shiftDays(date: Date, days: number): Date {
    const shifted = new Date(date);
    shifted.setDate(shifted.getDate() + days);
    return shifted;
  }
}
