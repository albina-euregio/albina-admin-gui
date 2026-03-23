// import "@albina-euregio/awsstats/dist/awsstats/awsstats";
import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { TranslateModule } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import { type GenericObservation, toGeoJSON } from "../observations/models/generic-observation.model";
import { BaseMapService } from "../providers/map-service/base-map.service";

@Component({
  selector: "app-awsstats",
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: "./awsstats.component.html",
  styleUrls: ["./awsstats.component.scss"],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AwsstatsComponent implements AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  protected mapService = inject(BaseMapService);
  @ViewChild("regionMapHost", { static: false }) private regionMapHost?: ElementRef<HTMLElement>;
  @ViewChild("wrapperHost", { static: false }) private wrapperHost?: ElementRef<HTMLElement>;

  protected startDate = this.toDateInputValue(this.shiftDays(new Date(), -7));
  protected endDate = this.toDateInputValue(new Date());
  protected wrapperStartDate = "2026-03-10";
  protected wrapperEndDate = "2026-03-17";
  protected observationsUrl = "";
  protected showWrapper = false;
  protected loading = false;
  protected errorMessage = "";
  protected selectedMicroRegions: string[] = [];

  async ngAfterViewInit() {
    if (!this.regionMapHost?.nativeElement) return;
    try {
      const host = this.regionMapHost.nativeElement;
      this.mapService.removeMaps();
      const map = await this.mapService.initMaps(host);
      this.mapService.overlayMaps?.editSelection?.setSelectedRegions(this.selectedMicroRegions);
      this.mapService.overlayMaps?.editSelection?.updateEditSelection();
      requestAnimationFrame(() => map.invalidateSize(true));
      setTimeout(() => map.invalidateSize(true), 120);
      map.on("click", () => {
        this.selectedMicroRegions = this.normalizeSelectedMicroRegions(this.mapService.getSelectedRegions());
        if (this.showWrapper) {
          this.mountWrapper();
        }
      });
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }
  }

  ngOnDestroy() {
    this.revokeObservationsUrl();
    this.mapService.removeMaps();
  }

  protected setLastDays(days: number) {
    this.startDate = this.toDateInputValue(this.shiftDays(new Date(), -days));
    this.endDate = this.toDateInputValue(new Date());
  }

  protected clearSelectedRegions() {
    this.selectedMicroRegions = [];
    this.mapService.overlayMaps?.editSelection?.clearSelectedRegions();
    this.mapService.overlayMaps?.editSelection?.updateEditSelection();
    if (this.showWrapper) {
      this.mountWrapper();
    }
  }

  protected async updateObservations() {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = "Start date and end date are required.";
      return;
    }

    if (this.startDate > this.endDate) {
      this.errorMessage = "Start date must be before or equal to end date.";
      return;
    }

    this.loading = true;
    this.errorMessage = "";
    try {
      this.showWrapper = false;
      const url = environment.apiBaseUrl + "../api_ext/observations";
      const params = this.getObservationDateRangeParams(this.startDate, this.endDate);
      const observations = await firstValueFrom(this.http.get<GenericObservation[]>(url, { params }));
      const collection: GeoJSON.FeatureCollection = toGeoJSON(observations ?? []);
      const blob = new Blob([JSON.stringify(collection, undefined, 2)], { type: "application/geo+json" });
      this.revokeObservationsUrl();
      this.wrapperStartDate = this.startDate;
      this.wrapperEndDate = this.endDate;
      this.observationsUrl = URL.createObjectURL(blob);
      this.showWrapper = true;
      this.mountWrapper();
    } catch (error) {
      this.revokeObservationsUrl();
      this.showWrapper = false;
      this.errorMessage = "Failed to load observations for selected date range.";
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  private revokeObservationsUrl() {
    if (!this.observationsUrl) return;
    URL.revokeObjectURL(this.observationsUrl);
    this.observationsUrl = "";
    this.showWrapper = false;
    this.wrapperHost?.nativeElement.replaceChildren();
  }

  private toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private shiftDays(date: Date, days: number): Date {
    const shifted = new Date(date);
    shifted.setDate(shifted.getDate() + days);
    return shifted;
  }

  private getObservationDateRangeParams(startDate: string, endDate: string) {
    // Match observations page behavior: request whole days via ISO datetime params.
    const start = new Date(`${startDate}T01:00:00`);
    const end = new Date(`${endDate}T23:59:59`);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }

  private mountWrapper() {
    if (!this.wrapperHost || !this.observationsUrl || !this.wrapperStartDate || !this.wrapperEndDate) return;

    const host = this.wrapperHost.nativeElement;
    host.replaceChildren();

    const wrapper = document.createElement("aws-stats-wrapper");
    wrapper.setAttribute("chart-type", "aws-observations,aws-danger-rating,aws-danger-rating-altitude");
    wrapper.setAttribute("observations", this.observationsUrl);
    wrapper.setAttribute("stationsrc", "https://api.avalanche.report/lawine/grafiken/smet/winter/AXLIZ1.smet.gz");
    wrapper.setAttribute("start-date", this.wrapperStartDate);
    wrapper.setAttribute("end-date", this.wrapperEndDate);
    wrapper.setAttribute("bulletin-filter-micro-region", this.getBulletinFilterMicroRegionValue());

    host.appendChild(wrapper);
  }

  private getBulletinFilterMicroRegionValue(): string {
    return this.selectedMicroRegions.length
      ? JSON.stringify(this.normalizeSelectedMicroRegions(this.selectedMicroRegions))
      : "";
  }

  private normalizeSelectedMicroRegions(regions: string[]): string[] {
    return [...new Set((regions ?? []).filter(Boolean))];
  }
}
