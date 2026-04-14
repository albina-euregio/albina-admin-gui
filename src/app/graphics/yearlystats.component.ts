import "@albina-euregio/linea/aws-stats";
import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";

import { GraphicsService } from "./graphics.service";

@Component({
  selector: "app-yearlystats",
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: "./yearlystats.component.html",
  styleUrls: ["./yearlystats.component.scss"],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class YearlystatsComponent implements AfterViewInit {
  @ViewChild("wrapperHost", { static: false })
  private wrapperHost?: ElementRef<HTMLElement>;
  private graphicsService = inject(GraphicsService);

  protected authenticationService = inject(AuthenticationService);
  protected startDate = this.toDateInputValue(this.shiftDays(new Date(), -30));
  protected endDate = this.toDateInputValue(new Date());
  protected errorMessage = "";
  protected showWrapper = false;
  protected loading = false;
  protected bulletins = "[]";
  protected blogs = "[]";
  protected stress = "[]";
  protected fieldTrainings = "";
  protected virtualTrainings = "";
  protected dangerRatingReference = "19, 42, 37, 2.2, 0.1";
  protected selectedRegionCodes: string[] = [];

  protected readonly regionCodes = this.graphicsService.getBulletinRegionCodes();

  protected chartTypeSelection: Record<YearlyChartType, boolean> = {
    "aws-danger-rating-micro-regions-bars": true,
    "aws-danger-rating-micro-regions": false,
    "aws-danger-rating-distribution": false,
    "aws-danger-pattern-micro-regions": false,
    "aws-avalanche-problem-micro-regions": false,
    "aws-products": false,
    "aws-stress-level": false,
  };

  ngAfterViewInit() {
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected setLastDays(days: number) {
    this.startDate = this.toDateInputValue(this.shiftDays(new Date(), -days));
    this.endDate = this.toDateInputValue(new Date());
    this.updateCharts();
  }

  protected setCurrentSeason() {
    const { start, end } = this.graphicsService.getCurrentSeason();
    this.startDate = start;
    this.endDate = end;
    this.updateCharts();
  }

  protected setChartType(chartType: YearlyChartType, checked: boolean) {
    this.chartTypeSelection[chartType] = checked;
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected onTrainingInputsChanged() {
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected onReferenceChanged() {
    if (this.showWrapper) {
      this.mountWrapper();
    }
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
      this.errorMessage = "Start date and end date are required.";
      return;
    }

    if (this.startDate > this.endDate) {
      this.errorMessage = "Start date must be before or equal to end date.";
      return;
    }

    this.errorMessage = "";
    this.loading = true;
    try {
      const bulletinRegionCodes = this.getSelectedBulletinRegionCodes();
      const bulletins = await this.graphicsService.loadBulletins(
        this.startDate,
        this.endDate,
        bulletinRegionCodes,
        this.graphicsService.getBulletinLanguage(),
      );
      this.bulletins = JSON.stringify(bulletins);

      const blogRegionCodes = this.getSelectedBlogRegionCodes();
      const blogs = await this.graphicsService.loadBlogs(this.startDate, this.endDate, blogRegionCodes);
      this.blogs = JSON.stringify(blogs);

      const stress = await this.graphicsService.loadTeamStressLevels(this.startDate, this.endDate);
      this.stress = JSON.stringify(stress);
    } catch (error) {
      this.errorMessage = "Failed to load chart data for selected date range.";
      console.error(error);
      this.loading = false;
      return;
    }

    this.showWrapper = true;
    this.mountWrapper();
    this.loading = false;
  }

  protected get showProductsTrainingInputs(): boolean {
    return this.chartTypeSelection["aws-products"];
  }

  protected get showDistributionReferenceInput(): boolean {
    return this.chartTypeSelection["aws-danger-rating-distribution"];
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

    if (this.showProductsTrainingInputs) {
      wrapper.setAttribute("field-trainings", JSON.stringify(this.parseTrainingDates(this.fieldTrainings)));
      wrapper.setAttribute("virtual-trainings", JSON.stringify(this.parseTrainingDates(this.virtualTrainings)));
    }

    if (this.showDistributionReferenceInput) {
      wrapper.setAttribute(
        "danger-rating-reference",
        JSON.stringify(this.parseDangerRatingReference(this.dangerRatingReference)),
      );
    }

    host.appendChild(wrapper);
  }

  private getSelectedChartTypesValue(): string {
    const selected = (Object.keys(this.chartTypeSelection) as YearlyChartType[]).filter(
      (key) => this.chartTypeSelection[key],
    );
    return selected.length ? selected.join(",") : "aws-danger-rating-micro-regions-bars";
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

type YearlyChartType =
  | "aws-danger-rating-micro-regions-bars"
  | "aws-danger-rating-micro-regions"
  | "aws-danger-rating-distribution"
  | "aws-danger-pattern-micro-regions"
  | "aws-avalanche-problem-micro-regions"
  | "aws-products"
  | "aws-stress-level";
