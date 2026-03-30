import "@albina-euregio/linea/aws-stats";
import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";

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

  protected startDate = this.toDateInputValue(this.shiftDays(new Date(), -30));
  protected endDate = this.toDateInputValue(new Date());
  protected errorMessage = "";
  protected showWrapper = false;
  protected fieldTrainings = "";
  protected virtualTrainings = "";
  protected dangerRatingReference = "19, 42, 37, 2.2, 0.1";
  protected selectedRegionCode = "all";

  protected readonly regionCodes = [...new Set(this.graphicsService.bulletinUrls.map((entry) => entry.regionCode))];

  protected chartTypeSelection: Record<YearlyChartType, boolean> = {
    "aws-danger-rating-micro-regions-bars": true,
    "aws-danger-rating-micro-regions": false,
    "aws-danger-rating-distribution": false,
    "aws-danger-pattern-micro-regions": false,
    "aws-avalanche-problem-micro-regions": false,
    "aws-products": false,
  };

  ngAfterViewInit() {
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  private getBlogUrlsValue(): string {
    if (!this.graphicsService.blogUrls.length) {
      return "[]";
    }
    const filtered = this.graphicsService.blogUrls.filter(
      (entry) => this.selectedRegionCode === "all" || entry.regionCode === this.selectedRegionCode,
    );
    return JSON.stringify(filtered);
  }

  private getBulletinUrlsValue(): string {
    const filtered = this.graphicsService.bulletinUrls.filter(
      (entry) => this.selectedRegionCode === "all" || entry.regionCode === this.selectedRegionCode,
    );
    return JSON.stringify(filtered.map((entry) => entry.url));
  }

  protected setLastDays(days: number) {
    this.startDate = this.toDateInputValue(this.shiftDays(new Date(), -days));
    this.endDate = this.toDateInputValue(new Date());
  }

  protected setCurrentSeason() {
    const now = new Date();
    if (now.getMonth() < 7) {
      this.startDate = `${now.getFullYear() - 1}-11-01`;
    } else {
      this.startDate = `${now.getFullYear()}-11-01`;
    }
    this.endDate = this.toDateInputValue(now);
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

  protected setRegionCode(regionCode: string) {
    if (this.selectedRegionCode === regionCode) return;
    this.selectedRegionCode = regionCode;
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected updateCharts() {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = "Start date and end date are required.";
      return;
    }

    if (this.startDate > this.endDate) {
      this.errorMessage = "Start date must be before or equal to end date.";
      return;
    }

    this.errorMessage = "";
    this.showWrapper = true;
    this.mountWrapper();
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
    wrapper.setAttribute("region-code", this.selectedRegionCode);
    wrapper.setAttribute("bulletin-filter-micro-region", "all");
    wrapper.setAttribute("blog-urls", this.getBlogUrlsValue());
    wrapper.setAttribute("bulletin-urls", this.getBulletinUrlsValue());

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
  | "aws-products";
