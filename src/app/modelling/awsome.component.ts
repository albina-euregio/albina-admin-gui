import { CommonModule, Location } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  viewChild,
  ChangeDetectionStrategy,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import type { ScatterSeriesOption } from "echarts/charts";
import type { GridComponentOption, LegendComponentOption } from "echarts/components";
import type { ECElementEvent, ECharts, EChartsCoreOption as EChartsOption } from "echarts/core";
import type {
  CallbackDataParams,
  LineSeriesOption,
  MarkLineOption,
  TooltipOption,
  XAXisOption,
  YAXisOption,
} from "echarts/types/dist/shared";
import { mapValues } from "es-toolkit";
import { get } from "es-toolkit/compat";
import { Feature, FeatureCollection, Geometry, MultiPolygon } from "geojson";
import { GeoJSONSource, Map as MlMap, MapLayerMouseEvent, Marker as MlMarker, Popup } from "maplibre-gl";
import { TabsModule } from "ngx-bootstrap/tabs";
import { NgxEchartsDirective } from "ngx-echarts";
import { firstValueFrom, forkJoin, type Subscription, timer } from "rxjs";
import { map, switchMap, timeout } from "rxjs/operators";
import Split from "split.js";
import * as z from "zod/v4";

import { environment } from "../../environments/environment";
import type { DangerRating } from "../enums/enums";
import { LayerToggleControl } from "../map/controls/layer-toggle-control";
import { RegionMapService } from "../map/region-map.service";
import { addTerrainControl, setTerrainEnabled } from "../map/terrain";
import type { FilterSelectionValue } from "../observations/filter-selection-config";
import { clickFilterValues, FilterSelectionData, FilterSelectionSpec } from "../observations/filter-selection-data";
import type { GenericObservation, ObservationSource } from "../observations/models/generic-observation.model";
import { BAR_CHART_ROWS, ObservationChartComponent } from "../observations/observation-chart.component";
import { ObservationFilterService } from "../observations/observation-filter.service";
import { ObsMarkerElement, ObservationMarkerService } from "../observations/observation-marker.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionProperties } from "../providers/regions-service/regions.service";
import { DangerRatingIconComponent } from "../shared/danger-rating-icon.component";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";
import { AwsomeConfigSchema } from "./awsome.config";
import type { AwsomeConfig, AwsomeSource as AwsomeSource0 } from "./awsome.config";
import {
  awsomeText,
  type DangerContext,
  type DangerIndex,
  DangerLevelColors,
  DangerLevelComponent,
  dangerRating,
} from "./danger-level.component";
import {
  type DangerBand,
  dangerBands,
  dangerNote,
  dangerPaint,
  type DangerProbe,
  type DangerSample,
  levelColor,
  levelStyle,
  NOTE_WORDS,
  planDanger,
  sampleOf,
  SNOW_DEPTH_KEY,
} from "./danger-paint";
import type { DangerSeries } from "./danger-series.component";
import { resolveConfigDate, resolveConfigDates, withinDates } from "./dashboard-date";
import { dormantDatetags, sortDatetags } from "./dormant-datetags";
import { DormantDatetagsMenuComponent } from "./dormant-datetags-menu.component";
import { stabilityClasses } from "./eaws-reading";
import {
  bandEdges,
  bandOf,
  bandValues,
  cutParam,
  cutsFromParam,
  followBands,
  holdsAll,
  isSplit,
  sliderStops,
  staysSplit,
} from "./elevation-cut";
import { type BandLevel, ElevationCutComponent } from "./elevation-cut.component";
import {
  alignToClasses,
  classBounds,
  classSlotsFor,
  fallbackStabilityIndex,
  fitsClassSlots,
  sharedBoundary,
  unstableAtMinimum,
} from "./index-classes";
import { selectionQuery } from "./selection-query";

type AwsomeSource = AwsomeSource0 & { $loading?: Subscription; $error?: unknown };
interface SourceGroup {
  label: string;
  groups: SourceGroup[];
  sources: AwsomeSource[];
}

export type FeatureProperties = GeoJSON.Feature["properties"] & {
  $date: string;
  $stabilityIndex: string;
  $sourceObject?: AwsomeSource;
  $geometry: GeoJSON.Geometry;
  region_id: string;
  location?: string;
} & Pick<GenericObservation, "$source" | "latitude" | "longitude" | "elevation">;

type DetailsTabLabel = string;

const MEDIAN_COLOR = "green";
const ASPECT_FILE = /\.[A-Za-z]+\.json(\?|$)/;
const PUBLISHED_CONFIG = /\/dcfg\/[^/]+\.json$/;
const MEDIAN_SERIES = 1;
const SPLIT_LINE = { lineStyle: { color: "#e8e8e8" } };
const INNER_BAND_COLOR = "#bbb";
const OUTER_BAND_COLOR = "#ddd";
const COMPANION_COLOR = "#555";
const COMPANION_LINE_TYPES: LineSeriesOption["lineStyle"]["type"][] = ["solid", "dotted", "dashed", [8, 4, 2, 4]];
const DORMANT_READ_TIMEOUT_MS = 3000;
const DANGER_SERIES_DEBOUNCE_MS = 150;

const IndexSchema = z.object({
  depth: z.number().nullish().array(),
  size_estimate: z.number().nullish().array(),
  lower: z.number().nullish().array(),
  lower2: z.number().nullish().array().optional(),
  mean: z.number().nullish().array(),
  upper: z.number().nullish().array(),
  upper2: z.number().nullish().array().optional(),
});
const TimeseriesSchema = z.object({
  indexes: z.record(z.string(), IndexSchema),
  timestamps: z.coerce.date().array(),
});
type Timeseries = z.infer<typeof TimeseriesSchema>;
const ClassesSchema = z.object({
  bounds: z.number().array(),
  cuts: z.number().array(),
  bands: z
    .object({
      count: z.number().array().array(),
      size: z.number().nullable().array().array(),
    })
    .array(),
});
const DangerSeriesSchema = TimeseriesSchema.extend({
  indexes: z.record(z.string(), IndexSchema.extend({ classes: ClassesSchema.optional() })),
  applied: z.string().array().optional(),
});

interface DangerView {
  readonly bands: readonly DangerBand[];
  readonly index?: DangerIndex;
  readonly context: DangerContext;
  readonly legend: readonly DangerRating[];
  readonly legendColors: readonly string[];
}

/** Whether a feature is drawn as a polygon rather than as a point marker. */
function isPolygon(o: FeatureProperties): boolean {
  return o.$geometry.type === "Polygon" || o.$geometry.type === "MultiPolygon";
}

/** A series request without its timestep, which asks for the same series at another date. */
function withoutTimestep(url: string): string {
  if (!url) return url;
  const request = new URL(url);
  request.searchParams.delete("ts");
  return request.toString();
}

@Component({
  selector: "app-awsome",
  standalone: true,
  imports: [
    CommonModule,
    DangerLevelComponent,
    DangerRatingIconComponent,
    DormantDatetagsMenuComponent,
    ElevationCutComponent,
    FormsModule,
    FormsModule,
    ObservationChartComponent,
    TabsModule,
    TranslatePipe,
    NgxMousetrapDirective,
    NgxEchartsDirective,
  ],
  templateUrl: "awsome.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    RegionMapService,
    ObservationFilterService,
    ObservationMarkerService,
    { provide: ConstantsService, useClass: DangerLevelColors },
  ],
})
export class AwsomeComponent implements AfterViewInit, OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  filterService = inject<ObservationFilterService<FeatureProperties>>(ObservationFilterService);
  mapService = inject(RegionMapService);
  markerService = inject<ObservationMarkerService<FeatureProperties>>(ObservationMarkerService);
  private sanitizer = inject(DomSanitizer);
  private httpClient = inject(HttpClient);
  private translateService = inject(TranslateService);
  private authenticationService = inject(AuthenticationService);

  // https://gitlab.com/avalanche-warning
  private configURL = "";
  private config$q: Promise<AwsomeConfig>;
  config: AwsomeConfig = {} as AwsomeConfig;
  private dormantDatetags?: Set<string>;
  /** The filters with a panel: every filter not marked hidden. */
  shownFilters: FilterSelectionData<FeatureProperties>[] = [];
  /** One class slot count for every chart and its data. */
  classSlots = 10;
  dormantMenu?: { values: FilterSelectionValue[]; dormant: Set<string>; saveUrl: string };
  cutFilter?: FilterSelectionData<FeatureProperties>;
  cutStops: number[] = [];
  defaultCuts: number[] = [];
  elevationCuts: readonly number[] = [];
  bandPressed: boolean[] = [];
  bandHighlighted: boolean[] = [];
  view: "hazard" | "danger" = "hazard";
  danger?: DangerView;
  cutLevels: readonly (BandLevel | undefined)[] = [];
  date = "";
  layout: "map" | "chart" | "details" = "map";
  readonly mapDiv = viewChild<ElementRef<HTMLDivElement>>("observationsMap");
  private observations: FeatureProperties[] = [];
  private loadedSelectionQuery = "";
  private localObservations: FeatureProperties[] = [];
  selectedObservation: FeatureProperties | undefined = undefined;
  selectedObservationDetails: { label: DetailsTabLabel; html: SafeHtml; source: string; frame?: string }[] | undefined =
    undefined;
  selectedObservationActiveTabs = {} as Record<string, DetailsTabLabel>;
  sources: AwsomeSource[];
  sourceTree: SourceGroup = { label: "", groups: [], sources: [] };
  private chartObservations: FeatureProperties[] = [];
  private map?: MlMap;
  private pointMarkers: MlMarker[] = [];
  private highlightMarker?: MlMarker;
  private highlightPolygon?: number;
  // a hovered circle marker takes tooltip priority over the polygon layer underneath it
  private markerHovered = false;
  private hoveredObservation?: FeatureProperties;
  private imageOverlays: { id: string; name: string }[] = [];
  private overlayControl?: LayerToggleControl;
  shareCopied = false;
  private defaultClassify?: string;
  private defaultLabel?: string;
  private defaultSelected = new Map<string, string[]>();
  private readonly polygonSource = "awsome-polygons";
  private readonly tooltipPopup = new Popup({
    closeButton: false,
    closeOnClick: false,
    className: "obs-tooltip",
  }) as Popup;
  hazardChart: EChartsOption | undefined;
  hazardInstance?: ECharts;
  private hazardHighlight = -1;
  timeseriesChart: EChartsOption | undefined;
  timeseriesInstance?: ECharts;
  private timeseriesDateIndex = -1;
  private timeseries?: { url: string; data: Timeseries };
  private timeseries$loading?: { url: string; subscription: Subscription };
  dangerSeries?: { url: string; series: DangerSeries | "none"; outdated?: boolean };
  private dangerSeries$loading?: { url: string; subscription: Subscription };
  loadingState: "loading" | "error" | undefined;

  /** The dashboard text of a key, the key itself when it has none. */
  t(key: string, params?: Record<string, unknown>): string {
    return awsomeText(this.translateService, key, params);
  }

  async ngOnInit() {
    this.configURL = this.authenticationService.getActiveRegion()?.awsomeUrl || environment.awsomeConfigUrl;
    // this.config = (await import("./awsome.json")) as unknown as Awsome;
    this.route.queryParamMap.subscribe((params) => {
      this.configURL = params.get("config") || this.configURL;
      this.date = params.get("date") || this.date;
    });
    this.config$q = firstValueFrom(this.fetchJSON(this.configURL))
      .then((c) => AwsomeConfigSchema.parseAsync(c))
      .then((c) => this.prepareDatetags(c));
    this.config = await this.config$q;
    const dateStepSeconds = this.config.dateStepSeconds ?? 3600;
    resolveConfigDates(this.config, dateStepSeconds);
    this.date = this.date ? resolveConfigDate(this.date, dateStepSeconds) : this.config.date;
    this.sources = this.config.sources;
    this.sourceTree = this.buildSourceTree(this.sources);
    this.sources.forEach((s) => (this.filterService.observationSources[this.asSource(s)] ??= true));
    const wantedSources = this.listParam("source").filter((name) => this.sources.some((s) => s.name === name));
    if (wantedSources.length) {
      this.sources.forEach(
        (s) => (this.filterService.observationSources[this.asSource(s)] = wantedSources.includes(s.name)),
      );
    }

    const spec = this.config.filters as FilterSelectionSpec<FeatureProperties>[];
    this.filterService.filterSelectionData = spec.map((f) => {
      f.label = f.labelI18nKey ? this.translateService.instant(f.labelI18nKey) : this.t(f.label);
      f.values.forEach((v) => {
        v.label = v.labelI18nKey ? this.translateService.instant(v.labelI18nKey) : this.t(v.label);
      });
      const dormant = f.type === "datetag" ? this.dormantDatetags : undefined;
      const filter = new FilterSelectionData<FeatureProperties>({
        ...f,
        values: f.values.filter((v) => !dormant?.has(v.value)),
      });
      filter.unmatchedAsNan = f.type === "datetag";
      filter.retainKnown();
      return filter;
    });
    this.shownFilters = this.filterService.filterSelectionData.filter((f) => !f.hidden);
    this.classSlots = classSlotsFor(this.filterService.filterSelectionData);
    this.filterService.mapBounds = undefined;

    const defaultClassifier = this.filterService.filterSelectionData.find(
      (f) => f.type === spec.find((f) => f.default === "classify")?.type,
    );
    const defaultFits = !!defaultClassifier && fitsClassSlots(defaultClassifier, this.classSlots);
    if (defaultClassifier && !defaultFits) {
      console.warn(
        `The default classifier ${defaultClassifier.type} has more values than the class slots, none classifies`,
      );
    }
    this.markerService.markerClassify = defaultFits ? defaultClassifier : undefined;
    this.markerService.markerLabel = this.filterService.filterSelectionData.find(
      (f) => f.type === spec.find((f) => f.default === "label")?.type,
    );
    this.defaultClassify = this.markerService.markerClassify?.type;
    this.defaultLabel = this.markerService.markerLabel?.type;
    this.defaultSelected = new Map(this.filterService.filterSelectionData.map((f) => [f.type, [...f.selected]]));
    this.initElevationCuts();
    this.applyStateParams();
    await this.loadSources();
  }

  get activeSources() {
    return this.sources.filter((s) => this.filterService.observationSources[this.asSource(s)]);
  }

  /** Active sources whose last load succeeded, i.e. the ones on the map. */
  private get loadedSources() {
    return this.activeSources.filter((s) => !s.$error);
  }

  /** Whether a filter may classify: it classifies already or has no url, and its values fit the class slots. */
  canClassify(filter: FilterSelectionData<FeatureProperties>): boolean {
    return (
      (filter.type === this.markerService.markerClassify?.type || !filter.url) &&
      fitsClassSlots(filter, this.classSlots)
    );
  }

  /**
   * Sorts the datetag values canonically and reads the dormant dates; the menu that changes them only when the
   * datetag filter asks for it. When that list cannot be read, nothing is dormant and there is no menu.
   */
  private async prepareDatetags(config: AwsomeConfig): Promise<AwsomeConfig> {
    const datetag = config.filters.find((f) => f.type === "datetag");
    if (!datetag) return config;
    datetag.values = sortDatetags(datetag.values);
    const dormant = await this.readDormantDatetags(datetag.values);
    this.dormantDatetags = dormant;
    if (dormant && datetag.dormantMenu) {
      this.dormantMenu = {
        values: datetag.values,
        dormant,
        saveUrl: new URL("api/dormant-datetags", this.baseURL).toString(),
      };
    }
    return config;
  }

  /** The dormant dates listed next to the config, undefined when that list cannot be read in time. */
  private async readDormantDatetags(values: FilterSelectionValue[]): Promise<Set<string> | undefined> {
    try {
      const url = new URL("dormant_datetags.json", new URL(this.configURL, document.baseURI));
      const content = await firstValueFrom(this.fetchJSON(url.toString()).pipe(timeout(DORMANT_READ_TIMEOUT_MS)));
      return dormantDatetags(content, values);
    } catch (err) {
      console.warn("Failed to read the dormant datetags, all of them stay active and the menu is off", err);
      return undefined;
    }
  }

  /** Reopens the dashboard on the current view, which reads the saved dormant dates anew. */
  reloadView() {
    window.history.replaceState(window.history.state, "", this.shareLink());
    window.location.reload();
  }

  private listParam(key: string): string[] {
    return this.route.snapshot.queryParamMap
      .getAll(key)
      .flatMap((v) => v.split(","))
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private filterByType(type: string | null): FilterSelectionData<FeatureProperties> | undefined {
    return this.filterService.filterSelectionData.find((f) => f.type === type);
  }

  private applyStateParams() {
    const params = this.route.snapshot.queryParamMap;
    for (const f of this.filterService.filterSelectionData) {
      if (params.has(`filter.${f.type}`)) f.selected = new Set(this.listParam(`filter.${f.type}`));
      if (params.has(`highlight.${f.type}`)) f.highlighted = new Set(this.listParam(`highlight.${f.type}`));
      f.retainKnown();
    }
    const classifier = this.filterByType(params.get("classify"));
    if (params.has("classify") && (!classifier || this.canClassify(classifier))) {
      this.markerService.markerClassify = classifier;
    }
    if (params.has("label")) this.markerService.markerLabel = this.filterByType(params.get("label"));
    const layout = params.get("layout");
    if (layout === "map" || layout === "chart" || layout === "details") this.layout = layout;
    const cut = params.get("cut");
    if (this.cutFilter && cut !== null) {
      this.elevationCuts = cutsFromParam(cut, this.cutStops, this.defaultCuts) ?? this.elevationCuts;
    }
    if (this.config.dangerLevel && params.get("view") === "danger") this.view = "danger";
  }

  /** Link that reopens the dashboard with the current date, sources, regions, filters, layout and map view. */
  shareLink(): string {
    const params: Params = {};
    const config = this.route.snapshot.queryParamMap.get("config");
    if (config) params["config"] = config;
    params["date"] = this.date;
    if (this.activeSources.length < this.sources.length) params["source"] = this.activeSources.map((s) => s.name);
    const regions = this.mapService.getSelectedRegions();
    if (regions.length) params["region"] = regions;
    for (const f of this.filterService.filterSelectionData) {
      const defaults = this.defaultSelected.get(f.type) ?? [];
      const isDefault = f.selected.size === defaults.length && defaults.every((v) => f.selected.has(v));
      if (!isDefault) params[`filter.${f.type}`] = [...f.selected].join(",");
      if (f.highlighted.size) params[`highlight.${f.type}`] = [...f.highlighted].join(",");
    }
    const classify = this.markerService.markerClassify?.type ?? "none";
    if (classify !== (this.defaultClassify ?? "none")) params["classify"] = classify;
    const label = this.markerService.markerLabel?.type ?? "none";
    if (label !== (this.defaultLabel ?? "none")) params["label"] = label;
    if (this.cutFilter) {
      const cut = cutParam(this.cutStops, this.elevationCuts, this.defaultCuts);
      if (cut !== this.defaultCuts.join(",") || this.view === "danger") params["cut"] = cut;
    }
    if (this.view === "danger") params["view"] = "danger";
    if (this.layout !== "map") params["layout"] = this.layout;
    if (this.map) {
      const { lat, lng } = this.map.getCenter();
      const view = [
        lat.toFixed(4),
        lng.toFixed(4),
        this.map.getZoom().toFixed(2),
        Math.round(this.map.getBearing()),
        Math.round(this.map.getPitch()),
      ];
      params["map"] = view.join(",");
      if (this.map.getTerrain()) params["terrain"] = "1";
    }
    const tree = this.router.createUrlTree([], { relativeTo: this.route, queryParams: params });
    return new URL(this.location.prepareExternalUrl(this.router.serializeUrl(tree)), window.location.href).toString();
  }

  async copyShareLink() {
    const link = this.shareLink();
    try {
      await navigator.clipboard.writeText(link);
      this.shareCopied = true;
      setTimeout(() => (this.shareCopied = false), 2000);
    } catch {
      window.prompt("Link to this view", link);
    }
  }

  private asSource(source: AwsomeSource): ObservationSource {
    return source.name as unknown as ObservationSource;
  }

  private buildSourceTree(sources: AwsomeSource[]): SourceGroup {
    const root: SourceGroup = { label: "", groups: [], sources: [] };
    for (const source of sources) {
      let node = root;
      for (const label of source.group?.split("/").filter(Boolean) ?? []) {
        node =
          node.groups.find((g) => g.label === label) ??
          node.groups[node.groups.push({ label, groups: [], sources: [] }) - 1];
      }
      node.sources.push(source);
    }
    return root;
  }

  private groupSources(group: SourceGroup): AwsomeSource[] {
    return [...group.sources, ...group.groups.flatMap((g) => this.groupSources(g))];
  }

  isGroupOn(group: SourceGroup): boolean {
    return this.groupSources(group).every((s) => this.filterService.observationSources[this.asSource(s)]);
  }

  isGroupMixed(group: SourceGroup): boolean {
    const on = this.groupSources(group).map((s) => !!this.filterService.observationSources[this.asSource(s)]);
    return on.some(Boolean) && !on.every(Boolean);
  }

  toggleGroup(group: SourceGroup, on: boolean) {
    this.groupSources(group).forEach((s) => (this.filterService.observationSources[this.asSource(s)] = on));
    this.loadSources();
  }

  async loadSources() {
    this.removeImageOverlays();
    this.observations.length = 0;
    this.timeseries = undefined;
    this.clearDangerLevel();
    this.clearMap();
    this.loadHazardChart();
    this.loadTimeseriesChart();
    this.dangerSeries &&= { ...this.dangerSeries, outdated: true };
    this.loadDangerSeries();

    this.loadingState = "loading";
    this.loadedSelectionQuery = selectionQuery(this.filterService.filterSelectionData);
    this.observations = (
      await Promise.all(
        this.activeSources.flatMap(async (source): Promise<FeatureProperties[]> => {
          try {
            source.$error = undefined;
            return await this.loadSource(source);
          } catch (err) {
            source.$error = err;
            this.loadingState = "error";
            console.warn("Failed to load source", source, err);
            return [];
          } finally {
            source.$loading?.unsubscribe();
            source.$loading = undefined;
          }
        }),
      )
    ).flat();
    if (this.loadingState === "loading") {
      this.loadingState = undefined;
    }

    if (this.imageOverlays.length && this.map) {
      this.overlayControl = new LayerToggleControl(this.imageOverlays);
      this.map.addControl(this.overlayControl, "bottom-right");
    }

    this.applyLocalFilter();
  }

  get dateForPicker() {
    return this.date;
  }

  set dateForPicker(d: string) {
    if (this.date.length === "2006-01-02T03:04:05".length && d.length === "2006-01-02T03:04".length) {
      d += ":00";
    }
    this.date = d;
  }

  private get albinaDate() {
    return this.date.replace(/T/, "_").replace(/:/g, "-");
  }

  private setSearchParams(url: URL, sources: AwsomeSource[]): URL {
    const date = this.albinaDate;
    // replace 2023-11-12_06-00-00 with current date
    url.pathname =
      date.length === "2006-01-02T03:04:05".length
        ? url.pathname.replace(/20\d{2}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/, date)
        : url.pathname.replace(/20\d{2}-\d{2}-\d{2}_\d{2}-\d{2}/, date);
    url.searchParams.set("ts", date);

    sources.forEach((source) => {
      if (source.name) url.searchParams.append("source", source.name);
    });

    const stabilityIndex = this.stabilityIndex;
    if (stabilityIndex) {
      url.searchParams.set("stabilityIndex", stabilityIndex.type);
    }

    this.filterService.filterSelectionData.forEach((f) => {
      f.getSelectedValues("selected").forEach((v) => url.searchParams.append(String(f.type), v.value));
      if (f.type === "aspect" && f.selected.has("nan")) url.searchParams.append("aspect", "nan");
    });
    this.filterService.regions.forEach((r) => url.searchParams.append("region", r));
    return url;
  }

  /** The base of the config's data and API URLs: the folder above a config's dcfg/ folder, else the app's base href. */
  private get baseURL(): string {
    const config = new URL(this.configURL, document.baseURI);
    return PUBLISHED_CONFIG.test(config.pathname) ? new URL("..", config).toString() : document.baseURI;
  }

  private async loadSource(source: AwsomeSource): Promise<FeatureProperties[]> {
    const date = this.albinaDate;
    const filterUrl = this.filterService.filterSelectionData.find(
      (f) => f.url && f.getSelectedValues("selected").length,
    );
    const url0 = new URL(filterUrl?.url ?? source.url, this.baseURL);
    const url = this.setSearchParams(url0, [source]).toString();

    const aspectFilter = this.filterService.filterSelectionData.find((f) => f.type === "aspect");
    const aspects = Array.isArray(aspectFilter?.values)
      ? aspectFilter.values.map((v) => v.value)
      : ["east", "flat", "north", "south", "west"];
    const selectedAspects = aspectFilter?.selected.size ? [...aspectFilter.selected] : [...aspects, "nan"];
    // Only URLs carrying an aspect infix (foo.north.json) exist once per aspect;
    // for any other source the replace would be a no-op and we would fetch the
    // same URL once per aspect, duplicating every observation.
    const urls =
      filterUrl || !ASPECT_FILE.test(url)
        ? [url]
        : selectedAspects.map((aspect) => url.replace(ASPECT_FILE, `.${aspect}.json$1`));

    source.imageOverlays?.forEach((overlay) => this.addImageOverlay(overlay));

    source.$loading?.unsubscribe();
    return new Promise((next, error) => {
      source.$loading = forkJoin(urls.map((u) => this.fetchJSON<GeoJSON.FeatureCollection>(u)))
        .pipe(
          map((collections): FeatureProperties[] =>
            collections
              .flatMap((c) => c.features)
              .map((feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProperties>): FeatureProperties => {
                feature.properties.$date = date;
                feature.properties.$source = this.asSource(source);
                feature.properties.$sourceObject = source;
                feature.properties.$geometry = feature.geometry;
                if (feature.geometry.type === "Point") {
                  feature.properties.longitude ??= feature.geometry.coordinates[0];
                  feature.properties.latitude ??= feature.geometry.coordinates[1];
                  feature.properties.elevation ??= feature.geometry.coordinates[2];
                } else if (feature.geometry.type === "Polygon") {
                  feature.properties.longitude ??= feature.geometry.coordinates[0][0][0];
                  feature.properties.latitude ??= feature.geometry.coordinates[0][0][1];
                  feature.properties.elevation ??= feature.geometry.coordinates[0][0][2];
                } else if (feature.geometry.type === "MultiPolygon") {
                  feature.properties.longitude ??= feature.geometry.coordinates[0][0][0][0];
                  feature.properties.latitude ??= feature.geometry.coordinates[0][0][0][1];
                  feature.properties.elevation ??= feature.geometry.coordinates[0][0][0][2];
                }
                return feature.properties;
              }),
          ),
        )
        .subscribe({ next, error });
    });
  }

  async ngAfterViewInit() {
    await this.config$q;
    let regions: FeatureCollection<MultiPolygon, RegionProperties> | undefined;
    if (this.config.regions?.url) {
      // like every other URL in the config: relative to the app, not the route
      regions = await firstValueFrom(
        this.fetchJSON<FeatureCollection<MultiPolygon, RegionProperties>>(
          new URL(this.config.regions.url, this.baseURL).toString(),
        ),
      );
    }

    const map = await this.mapService.initMap(this.mapDiv().nativeElement, { clickMode: "awsome", regions });
    this.map = map;
    map.boxZoom.disable();
    addTerrainControl(map);

    if (this.route.snapshot.queryParamMap.get("terrain") === "1") setTerrainEnabled(map, true);
    const view = this.listParam("map").map(Number);
    if (view.length >= 3 && view.every(Number.isFinite)) {
      map.jumpTo({ center: [view[1], view[0]], zoom: view[2], bearing: view[3] ?? 0, pitch: view[4] ?? 0 });
    } else {
      const [lat, lon, zoom] = this.config.mapCenter;
      map.jumpTo({ center: [lon, lat], zoom });
    }

    this.setupPolygonLayer(map);
    this.mapService.onSelectionChange(() => {
      this.filterService.regions = new Set(this.mapService.getSelectedRegions());
      this.applyLocalFilter();
    });
    const selectedRegions = this.listParam("region");
    if (selectedRegions.length) {
      this.mapService.setSelectedRegions(selectedRegions);
      this.filterService.regions = new Set(this.mapService.getSelectedRegions());
    }
    this.applyLocalFilter();

    if (window.matchMedia("(min-width: 769px)").matches) {
      Split([".layout-left", ".layout-right"], { onDragEnd: () => map.resize() });
      Split([".toolset-1", ".toolset-2"], { sizes: [33, 66], direction: "vertical" });
    }
  }

  nextDate(direction: -1 | 1) {
    const dateStepSeconds = this.config.dateStepSeconds ?? 3600;
    return Temporal.PlainDateTime.from(this.date)
      .add({ seconds: direction * dateStepSeconds })
      .toString();
  }

  async switchDate(direction: -1 | 1) {
    this.date = this.nextDate(direction);
    await this.loadSources();
  }

  private clearMap() {
    this.pointMarkers.forEach((m) => m.remove());
    this.pointMarkers = [];
    this.localObservations = [];
    (this.map?.getSource(this.polygonSource) as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: [],
    });
  }

  applyLocalFilter() {
    this.clearMap();
    const placeholderIndex = this.placeholderIndex;
    this.observations.forEach((o) => (o.$stabilityIndex = placeholderIndex?.type));
    const selected = new Set(this.observations.filter((o) => this.filterService.isSelected(o)));
    const classify = new Map(this.observations.map((o) => [o, this.markerService.markerClassify?.getValue(o)]));
    const highlighting = this.filterService.filterSelectionData.some((f) => f.highlighted.size > 0);
    this.localObservations = this.observations.filter(
      (o) => selected.has(o) || (highlighting && this.filterService.isHighlighted(o)),
    );
    this.readDangerLevel(selected);

    const polygonFeatures: Feature[] = [];
    this.localObservations.forEach((observation, index) => {
      const isHighlighted = this.filterService.isHighlighted(observation);
      if (isPolygon(observation)) {
        polygonFeatures.push({
          type: "Feature",
          properties: { index, ...this.markerService.maplibrePolygonPaint(observation, isHighlighted) },
          geometry: observation.$geometry,
        });
      } else {
        const marker = this.markerService.createMaplibreMarker(observation, isHighlighted);
        if (marker && this.map) {
          this.wirePointMarker(marker, observation);
          marker.addTo(this.map);
          this.pointMarkers.push(marker);
        }
      }
    });
    (this.map?.getSource(this.polygonSource) as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: polygonFeatures,
    });

    this.shownFilters.forEach((filter) =>
      filter.buildChartsData(
        this.markerService.markerClassify,
        this.observations,
        (o) => selected.has(o),
        (o) => classify.get(o),
        this.classSlots,
      ),
    );
    this.updateCutBands();

    if (this.selectedObservation) {
      // the details follow the selection: the same observation, or its stand-in after a
      // reload, which only a location can name -- without one every observation looks alike
      const location = this.selectedObservation.location;
      const standIn = location === undefined ? undefined : this.localObservations.find((o) => o.location === location);
      const observation = this.localObservations.includes(this.selectedObservation)
        ? this.selectedObservation
        : (standIn ?? this.selectedObservation);
      this.showObservationDetails(observation);
    }

    try {
      this.loadHazardChart();
    } catch (e) {
      console.error("Failed to load hazard chart", e);
    }

    try {
      this.loadTimeseriesChart();
    } catch (e) {
      console.error("Failed to load timeseries chart", e);
    }
    this.loadDangerSeries();
  }

  private loadHazardChart() {
    const markerClassify = this.markerService.markerClassify;
    const grainType = this.filterService.filterSelectionData.find((f) => f.type === "grainType");
    const xType = this.filterService.filterSelectionData.find((f) => f.type === this.config.hazardChart.xType);
    if (!markerClassify || this.view === "danger") {
      this.hazardChart = undefined;
      return;
    }
    this.chartObservations = this.localObservations;
    this.liveHazardChart?.dispatchAction({ type: "downplay", seriesIndex: 0 });
    this.hazardHighlight = -1;
    this.hoveredObservation = undefined;
    const observations = this.chartObservations;
    const data = observations.map((o, i) => this.toChartData(o, i));
    this.hazardChart = {
      xAxis: {
        nameLocation: "center",
        name: this.t(xType.label),
        axisLabel: {
          formatter: (value) => this.config.hazardChart.xAxisLabels?.[value] ?? value,
        },
        min: xType?.chartAxisRange?.[0],
        max: xType?.chartAxisRange?.[1],
        axisPointer: { type: "line" },
        axisLine: { onZero: false },
        splitLine: SPLIT_LINE,
      } satisfies XAXisOption,
      yAxis: {
        name: this.t(markerClassify.label),
        ...this.unstableOnTop(markerClassify),
        min: markerClassify.chartAxisRange?.[0],
        max: markerClassify.chartAxisRange?.[1],
        axisPointer: { type: "line" },
        splitLine: SPLIT_LINE,
      } satisfies YAXisOption,
      grid: {
        left: 40,
        top: 40,
        bottom: 40,
        right: 10,
        backgroundColor: "#f7f7f7",
        show: true,
      } satisfies GridComponentOption,
      tooltip: {
        trigger: "axis",
        showContent: false,
        axisPointer: { type: "cross" },
      } satisfies TooltipOption,
      axisPointer: { triggerEmphasis: false },
      series: [
        {
          type: "scatter",
          itemStyle: {
            borderColor: "rgba(0, 0, 0, 0.3)",
            color: ({ data }) => grainType?.findForObservation(observations[data[2] as number])?.color ?? "black",
          },
          data,
          symbolSize: 7,
          emphasis: { scale: 1.8, itemStyle: { borderColor: "#000", borderWidth: 1.5 } },
          markLine: this.classLines(markerClassify, 1),
        } satisfies ScatterSeriesOption,
        {
          type: "scatter",
          data: [],
          symbol: "diamond",
          symbolSize: 25,
          color: MEDIAN_COLOR,
          itemStyle: { borderColor: "#000", borderWidth: 1 },
        } satisfies ScatterSeriesOption,
      ],
    } satisfies EChartsOption;
  }

  private toChartData(o: FeatureProperties, index: number): number[] {
    const markerClassify = this.markerService.markerClassify;
    const xType = this.filterService.filterSelectionData.find((f) => f.type === this.config.hazardChart?.xType);
    return [
      // snowpack.Punstable.size_estimate
      xType.getValue(o) as number,
      // snowpack.Punstable.value
      markerClassify.getValue(o) as number,
      // this.chartObservations[$event.data[2]]
      index,
    ];
  }

  /** Dashed lines on a filter's class boundaries, each coloured like the class listed above it. */
  private classLines(filter: FilterSelectionData<FeatureProperties>, z: number): MarkLineOption {
    const classes = filter.values.filter((v): v is FilterSelectionValue & { numericRange: number[] } =>
      Array.isArray(v.numericRange),
    );
    const data = classes.slice(1).flatMap((below, i) => {
      const above = classes[i];
      const bound = sharedBoundary(above.numericRange, below.numericRange);
      return bound === undefined ? [] : [{ yAxis: bound, lineStyle: { color: above.color } }];
    });
    return { z, silent: true, symbol: "none", label: { show: false }, lineStyle: { type: "dashed", width: 1.6 }, data };
  }

  /** A stability index axis runs downwards when the index is most unstable at its minimum, its name kept on top. */
  private unstableOnTop(filter: FilterSelectionData<FeatureProperties>): Pick<YAXisOption, "inverse" | "nameLocation"> {
    const inverse = !!filter.stabilityIndex && unstableAtMinimum(filter);
    return { inverse, nameLocation: inverse ? "start" : "end" };
  }

  /** Crosshair and emphasis on the hovered observation's point, without touching the option object. */
  private highlightInHazardChart(observation: FeatureProperties | undefined) {
    const chart = this.liveHazardChart;
    if (!chart) return;
    if (this.hazardHighlight >= 0) {
      chart.dispatchAction({ type: "downplay", seriesIndex: 0, dataIndex: this.hazardHighlight });
    }
    const dataIndex = observation ? this.chartObservations.indexOf(observation) : -1;
    this.hazardHighlight = dataIndex;
    if (dataIndex >= 0) {
      chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex });
      chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex });
    } else {
      chart.dispatchAction({ type: "updateAxisPointer", currTrigger: "leave" });
    }
  }

  private get stabilityIndex(): FilterSelectionData<FeatureProperties> | undefined {
    const markerClassify = this.markerService.markerClassify;
    return markerClassify?.stabilityIndex ? markerClassify : undefined;
  }

  /** The index whose type fills the $stabilityIndex placeholder: the classifying one, else the fallback index. */
  private get placeholderIndex(): FilterSelectionData<FeatureProperties> | undefined {
    return this.stabilityIndex ?? fallbackStabilityIndex(this.filterService.filterSelectionData, this.defaultClassify);
  }

  /** The other indices of the classified index's regime, in config order, at most one per companion line style. */
  private companionsOf(
    stabilityIndex: FilterSelectionData<FeatureProperties>,
  ): FilterSelectionData<FeatureProperties>[] {
    if (!classBounds(stabilityIndex)) return [];
    return this.filterService.filterSelectionData
      .filter((f) => f !== stabilityIndex && f.stabilityIndex === stabilityIndex.stabilityIndex && classBounds(f))
      .slice(0, COMPANION_LINE_TYPES.length);
  }

  private loadTimeseriesChart() {
    if (this.view === "danger") return;
    const stabilityIndex = this.stabilityIndex;
    const url0 = this.config.timeseriesChart?.url;
    if (!stabilityIndex || !url0 || !this.loadedSources.length) {
      this.timeseriesChart = undefined;
      this.timeseries$loading?.subscription.unsubscribe();
      this.timeseries$loading = undefined;
      return;
    }
    const companions = this.companionsOf(stabilityIndex);
    const request = this.setSearchParams(new URL(url0, this.baseURL), this.loadedSources);
    companions.forEach((companion) => request.searchParams.append("stabilityIndex", companion.type));
    const url = request.toString();
    if (this.timeseries?.url === url) {
      this.renderTimeseries(this.timeseries.data, stabilityIndex, companions);
      return;
    }
    if (this.timeseries$loading?.url === url) {
      return;
    }
    this.timeseriesChart = undefined;
    this.timeseries$loading?.subscription.unsubscribe();
    this.timeseries$loading = {
      url,
      subscription: this.fetchJSON(url).subscribe({
        next: (d) => {
          this.timeseries$loading = undefined;
          this.timeseries = { url, data: TimeseriesSchema.parse(d) };
          this.renderTimeseries(this.timeseries.data, stabilityIndex, companions);
        },
        // a failed load has to forget its URL, or the guard above takes it for
        // one still in flight and the chart is never asked for again
        error: (err) => {
          this.timeseries$loading = undefined;
          console.warn("Failed to load timeseries", url, err);
        },
      }),
    };
  }

  /**
   * Asks the API for the danger level series of the selection while the danger level view is on: the index chart's
   * request with the reading index's classes, the cuts, the size percentile and the panel's compass population.
   */
  private loadDangerSeries() {
    const calibration = this.config.dangerLevel;
    if (this.view !== "danger" || !calibration) {
      this.cancelDangerSeries();
      return;
    }
    const index = this.placeholderIndex;
    const bounds = index && classBounds(index);
    const url0 = this.config.timeseriesChart?.url;
    if (!url0 || !bounds || !stabilityClasses(bounds.length - 1) || !this.loadedSources.length) {
      this.cancelDangerSeries();
      this.dangerSeries = { url: "", series: "none" };
      return;
    }
    const request = this.setSearchParams(new URL(url0, this.baseURL), this.loadedSources);
    request.searchParams.set("stabilityIndex", index.type);
    this.companionsOf(index).forEach((companion) => request.searchParams.append("stabilityIndex", companion.type));
    request.searchParams.set(`classes.${index.type}`, bounds.slice(1, -1).join(","));
    this.splitCuts.forEach((cut) => request.searchParams.append("cut", String(cut)));
    request.searchParams.set("size_percentile", String(calibration.sizePercentile));
    request.searchParams.set("population", "compass");
    const url = request.toString();
    const shown = this.dangerSeries;
    if ((shown?.url === url && !shown.outdated) || this.dangerSeries$loading?.url === url) return;
    this.cancelDangerSeries();
    if (shown && withoutTimestep(shown.url) !== withoutTimestep(url)) this.dangerSeries = undefined;
    this.dangerSeries$loading = {
      url,
      subscription: timer(DANGER_SERIES_DEBOUNCE_MS)
        .pipe(switchMap(() => this.fetchJSON(url)))
        .subscribe({
          next: (body) => {
            this.dangerSeries$loading = undefined;
            this.dangerSeries = { url, series: this.dangerSeriesOf(body, index.type) };
          },
          error: (err) => {
            this.dangerSeries$loading = undefined;
            this.dangerSeries = { url, series: "none", outdated: true };
            console.warn("Failed to load the danger level series", url, err);
          },
        }),
    };
  }

  /** Stops the danger level series request in flight, if any. */
  private cancelDangerSeries() {
    this.dangerSeries$loading?.subscription.unsubscribe();
    this.dangerSeries$loading = undefined;
  }

  /** The danger level series in an API answer, none when the answer carries no classes of the reading index. */
  private dangerSeriesOf(body: unknown, index: string): DangerSeries | "none" {
    const parsed = DangerSeriesSchema.safeParse(body);
    if (!parsed.success) console.warn("Failed to parse the danger level series", parsed.error);
    const classes = parsed.data?.indexes[index]?.classes;
    if (!classes) return "none";
    const { bounds, cuts, bands } = classes;
    return { timestamps: parsed.data.timestamps, bounds, cuts, bands, applied: parsed.data.applied };
  }

  /** Moves the dashboard to a date picked in the danger level series and loads it as a date step does. */
  async selectDate(date: string) {
    const picked = date.slice(0, this.date.length);
    if (picked === this.date || !withinDates(picked, this.config.dateMin, this.config.dateMax)) return;
    this.date = picked;
    await this.loadSources();
  }

  private renderTimeseries(
    data: Timeseries,
    stabilityIndex: FilterSelectionData<FeatureProperties>,
    companions: FilterSelectionData<FeatureProperties>[],
  ) {
    const indexData = data.indexes[stabilityIndex.type];
    if (!indexData) {
      this.timeseriesChart = undefined;
      return;
    }
    const label = this.t(stabilityIndex.label);
    const innerBand = `${label} 25-75 %`;
    const outerBand = `${label} 10-90 %`;
    const bounds = classBounds(stabilityIndex);
    const classLines = this.classLines(stabilityIndex, 2);
    const companionLines = companions
      .map((companion, i) => ({
        companion,
        name: this.t(companion.label),
        median: data.indexes[companion.type]?.mean,
        from: classBounds(companion),
        type: COMPANION_LINE_TYPES[i],
      }))
      .filter(({ median }) => median);
    this.timeseriesChart = {
      xAxis: {
        type: "time",
        nameLocation: "center",
        name: this.t("Date"),
        axisLine: { onZero: false },
        splitLine: SPLIT_LINE,
      } satisfies XAXisOption,
      yAxis: {
        name: label,
        position: "right",
        ...this.unstableOnTop(stabilityIndex),
        min: stabilityIndex.chartAxisRange?.[0],
        max: stabilityIndex.chartAxisRange?.[1],
        splitLine: SPLIT_LINE,
      } satisfies YAXisOption,
      grid: {
        left: 10,
        top: 40,
        bottom: 40,
        right: 50,
        backgroundColor: "#f7f7f7",
        show: true,
      } satisfies GridComponentOption,
      legend: {
        orient: "vertical",
        left: 16,
        bottom: 46,
        itemGap: 6,
        padding: 6,
        backgroundColor: "rgba(255, 255, 255, 0.75)",
        data: [
          label,
          { name: innerBand, icon: "rect", itemStyle: { color: INNER_BAND_COLOR, borderWidth: 0, opacity: 1 } },
          ...(indexData.lower2
            ? [{ name: outerBand, icon: "rect", itemStyle: { color: OUTER_BAND_COLOR, borderWidth: 0, opacity: 1 } }]
            : []),
          ...companionLines.map(({ name }) => ({ name, itemStyle: { opacity: 0 } })),
        ],
      } satisfies LegendComponentOption,
      tooltip: {
        trigger: "axis",
        formatter: ([series]: CallbackDataParams[]) => {
          if (!series) return "";
          const companionRows = companionLines.map(
            ({ companion, median }) => `<dt>${companion.type}</dt><dd>${median[series.dataIndex]}</dd>`,
          );
          return `
            <dl>
              <dt>${stabilityIndex.type}</dt><dd>${indexData.mean[series.dataIndex]}</dd>
              <dt>${this.t("Depth")}</dt><dd>${indexData.depth[series.dataIndex]}</dd>
              <dt>${this.t("Size estimate")}</dt><dd>${indexData.size_estimate[series.dataIndex]}</dd>
              ${companionRows.join("")}
            </dl>`;
        },
        showContent: true,
        axisPointer: {
          type: "cross",
        },
      } satisfies TooltipOption,
      series: [
        {
          name: label,
          type: "line",
          color: MEDIAN_COLOR,
          emphasis: { scale: 2.5 },
          data: data.timestamps.map((t, i) => [t, indexData.mean[i]]),
        } satisfies LineSeriesOption,
        {
          type: "line",
          data: [],
          markLine: {
            ...classLines,
            data: [...classLines.data, { xAxis: this.date, lineStyle: { color: "#000", width: 1 } }],
          } satisfies MarkLineOption,
        } satisfies LineSeriesOption,
        {
          name: innerBand,
          type: "line",
          z: 1,
          data: data.timestamps.map((t, i) => [t, indexData.lower[i]]),
          lineStyle: { opacity: 0 },
          stack: "confidence-band",
          symbol: "none",
        } satisfies LineSeriesOption,
        {
          name: innerBand,
          type: "line",
          z: 1,
          data: data.timestamps.map((t, i) => [t, indexData.upper[i] - indexData.lower[i]]),
          lineStyle: { opacity: 0 },
          areaStyle: { color: INNER_BAND_COLOR },
          stack: "confidence-band",
          symbol: "none",
        } satisfies LineSeriesOption,
        ...(indexData.lower2
          ? [
              {
                name: outerBand,
                type: "line",
                z: 1,
                data: data.timestamps.map((t, i) => [t, indexData.lower2[i]]),
                lineStyle: { opacity: 0 },
                stack: "confidence-band2",
                symbol: "none",
              } satisfies LineSeriesOption,
              {
                name: outerBand,
                type: "line",
                z: 1,
                data: data.timestamps.map((t, i) => [t, indexData.upper2[i] - indexData.lower2[i]]),
                lineStyle: { opacity: 0 },
                areaStyle: { color: OUTER_BAND_COLOR },
                stack: "confidence-band2",
                symbol: "none",
              } satisfies LineSeriesOption,
            ]
          : []),
        ...companionLines.map(
          ({ name, median, from, type }) =>
            ({
              name,
              type: "line",
              z: 2,
              color: COMPANION_COLOR,
              symbol: "none",
              lineStyle: { width: 1.2, type },
              data: data.timestamps.map((t, i) => [
                t,
                typeof median[i] === "number" ? alignToClasses(median[i], from, bounds) : null,
              ]),
            }) satisfies LineSeriesOption,
        ),
      ],
    } satisfies EChartsOption;

    // show diamond marker in hazard chart
    if (!this.hazardChart) {
      return;
    }
    this.hazardChart = { ...this.hazardChart };
    const series: ScatterSeriesOption = this.hazardChart.series[MEDIAN_SERIES];
    const i = data.timestamps.findIndex((t) => +t === Date.parse(this.date));
    this.timeseriesDateIndex = i;
    if (this.config.hazardChart.xType === "size_estimate") {
      series.data = i >= 0 ? [[indexData.size_estimate[i], indexData.mean[i]]] : [];
    } else {
      series.data = [];
    }
  }

  /** The chart instance while its view exists; the details view disposes it without telling us. */
  private get liveHazardChart(): ECharts | undefined {
    return this.hazardInstance?.isDisposed() ? undefined : this.hazardInstance;
  }

  chartMouseOver($event: ECElementEvent) {
    this.clearHighlight();
    if ($event.seriesIndex === MEDIAN_SERIES) {
      this.emphasizeMedian("highlight");
      return;
    }
    const observation = this.chartObservations[$event.data[2] as number];
    if (observation) {
      this.highlightOnMap(observation);
    }
  }

  /** The viewer in a details frame names the location under its pointer, or null when it left. */
  @HostListener("window:message", ["$event"])
  onViewerMessage(event: MessageEvent<{ type?: string; location?: string | null; state?: Record<string, string> }>) {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === "nivix:state") {
      this.resteerFrame(event.source, event.data.state ?? {});
      return;
    }
    if (event.data?.type !== "nivix:hover") return;
    this.clearHighlight();
    const location = event.data.location;
    const observation = location && this.localObservations.find((o) => o.location === location);
    if (observation) {
      this.highlightOnMap(observation);
    }
  }

  /** A cell keeps its shape and gets a heavy outline; a point grows, in its own colour. */
  /** Both HTML hold one viewer frame on the same path: post the new query to the rendered frame. */
  // the tabs left behind lose their content; a steered one gets its current link back
  // for when it is shown again
  selectDetailsTab(tab: { label: DetailsTabLabel }) {
    this.selectedObservationActiveTabs[this.selectedObservation.$source] = tab.label;
    for (const other of this.selectedObservationDetails ?? []) {
      if (other !== tab && other.frame !== undefined && other.frame !== this.frameSrc(other.source)) {
        other.html = this.sanitizer.bypassSecurityTrustHtml(other.source);
        other.frame = this.frameSrc(other.source);
      }
    }
  }

  private frameSrc(html: string): string | undefined {
    return html.match(/<iframe[^>]*\ssrc="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&");
  }

  private detailsFrames(): HTMLIFrameElement[] {
    return [...document.querySelectorAll<HTMLIFrameElement>(".layout-details iframe")];
  }

  // the frame keeps the src it was rendered with; the viewer inside follows the posted queries
  private steerFrame(frame: HTMLIFrameElement, nextHtml: string): boolean {
    const after = this.frameSrc(nextHtml);
    if (!after || !frame.contentWindow) return false;
    const [pathBefore] = (frame.getAttribute("src") ?? "").split("?");
    const [pathAfter, query] = after.split("?");
    if (pathBefore !== pathAfter || !pathAfter.includes("/nivix/") || !query) return false;
    frame.contentWindow.postMessage({ type: "nivix:query", query: `?${query}` }, window.location.origin);
    return true;
  }

  // a viewer that announces a selection other than its tab's missed a steer while it was
  // still loading: it is steered again
  private resteerFrame(source: MessageEventSource | null, shown: Record<string, string>) {
    const frame = this.detailsFrames().find((f) => f.contentWindow === source);
    const tab = frame && this.selectedObservationDetails?.find((t) => t.frame === frame.getAttribute("src"));
    const wanted = tab && this.frameSrc(tab.source)?.split("?")[1];
    if (!wanted) return;
    const params = new URLSearchParams(wanted);
    if (["file", "region", "band"].every((key) => (params.get(key) ?? "") === (shown[key] ?? ""))) return;
    frame.contentWindow?.postMessage({ type: "nivix:query", query: `?${wanted}` }, window.location.origin);
  }

  private topEdgeCentre(geometry: Geometry): [number, number] | undefined {
    const rings =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.type === "MultiPolygon"
          ? geometry.coordinates
          : [];
    const points = rings.flatMap((polygon) => polygon[0] ?? []);
    if (!points.length) return undefined;
    const lngs = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    return [(Math.min(...lngs) + Math.max(...lngs)) / 2, Math.max(...lats)];
  }

  private highlightOnMap(observation: FeatureProperties) {
    if (!this.map) return;
    if (observation.$geometry.type !== "Point") {
      const index = this.localObservations.indexOf(observation);
      if (index < 0) return;
      this.map.setFeatureState({ source: this.polygonSource, id: index }, { hover: true });
      this.highlightPolygon = index;
      // the popup stands above the cell, pointing at the middle of its top edge,
      // so the cell it names stays visible
      this.tooltipPopup
        .setLngLat(this.topEdgeCentre(observation.$geometry) ?? [observation.longitude, observation.latitude])
        .setHTML(this.markerService.tooltipHtml(observation))
        .addTo(this.map);
      return;
    }
    const marker = this.markerService.createMaplibreMarker(observation);
    if (!marker) return;
    const el = marker.getElement() as ObsMarkerElement;
    el.style.zIndex = "42000";
    const size = (parseFloat(el.style.width) || 40) * 1.6;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    marker.addTo(this.map);
    this.highlightMarker = marker;
    this.tooltipPopup
      .setLngLat(marker.getLngLat())
      .setHTML(el.tooltipHtml ?? "")
      .addTo(this.map);
  }

  /** Whether the filter has a url while the url-backed selections differ from those the shown data was loaded with. */
  isReloadPending(filter: FilterSelectionData<FeatureProperties>): boolean {
    return !!filter.url && selectionQuery(this.filterService.filterSelectionData) !== this.loadedSelectionQuery;
  }

  onFilterChange(filter: FilterSelectionData<FeatureProperties>) {
    const queryCleared =
      !!filter.url && !!this.loadedSelectionQuery && !selectionQuery(this.filterService.filterSelectionData);
    if (filter.type === "aspect" || queryCleared) {
      this.loadSources();
    } else {
      this.applyLocalFilter();
    }
  }

  /** Offers the cut slider beside the elevation chart when its filter has cuts and a chart the slider can follow. */
  private initElevationCuts() {
    const cuts = this.config.filters.find((f) => f.type === "elevation")?.cuts;
    const filter = this.filterByType("elevation");
    const stops = filter && sliderStops(filter, BAR_CHART_ROWS);
    if (!cuts?.length || !stops) return;
    this.cutFilter = filter;
    this.cutStops = stops;
    this.defaultCuts = [...cuts];
    this.elevationCuts = [...cuts];
  }

  /** The elevation values of the rows wholly inside each band of the cuts, lowest band first. */
  private bandsOf(cuts: readonly number[]): string[][] {
    return bandValues(this.cutFilter?.values ?? [], this.cutStops, cuts);
  }

  /** Moves the cuts; between splits, a fully selected or highlighted band keeps all its rows at its new extent. */
  setElevationCuts(cuts: readonly number[]) {
    const filter = this.cutFilter;
    if (!filter) return;
    const before = this.bandsOf(this.elevationCuts);
    const after = this.bandsOf(cuts);
    const follow = staysSplit(this.cutStops, this.elevationCuts, cuts);
    this.elevationCuts = cuts;
    const selected = follow ? followBands(filter.selected, before, after) : undefined;
    const highlighted = follow ? followBands(filter.highlighted, before, after) : undefined;
    if (selected) filter.selected = selected;
    if (highlighted) filter.highlighted = highlighted;
    if (selected || highlighted) {
      this.onFilterChange(filter);
    } else if (this.view === "danger") {
      this.applyLocalFilter();
    } else {
      this.updateCutBands();
    }
  }

  /** Applies a click on a band to its rows as a click on a row applies to that row. */
  onCutBand(band: number, event: MouseEvent) {
    if (!this.cutFilter) return;
    clickFilterValues(this.cutFilter, event, this.bandsOf(this.elevationCuts)[band] ?? []);
    this.onFilterChange(this.cutFilter);
  }

  /** Toggles a band in the highlight, as a long press on a row toggles that row. */
  onCutBandPress(band: number) {
    if (!this.cutFilter) return;
    this.cutFilter.toggleFilterValues("highlighted", this.bandsOf(this.elevationCuts)[band] ?? []);
    this.onFilterChange(this.cutFilter);
  }

  /** Marks the bands whose rows are all selected, and those whose rows are all highlighted. */
  private updateCutBands() {
    if (!this.cutFilter) return;
    const bands = this.bandsOf(this.elevationCuts);
    this.bandPressed = bands.map((rows) => holdsAll(this.cutFilter.selected, rows));
    this.bandHighlighted = bands.map((rows) => holdsAll(this.cutFilter.highlighted, rows));
  }

  /** The cuts that split the elevations, ascending; none without the cut slider. */
  private get splitCuts(): number[] {
    return this.cutFilter ? this.elevationCuts.filter((cut) => isSplit(this.cutStops, cut)) : [];
  }

  /** Switches the right column between the hazard chart view and the danger level view. */
  toggleDangerView() {
    if (!this.config.dangerLevel) return;
    this.view = this.view === "danger" ? "hazard" : "danger";
    this.applyLocalFilter();
  }

  /** Clears the selection of a filter that conditions the danger level shares. */
  clearDangerFilter(type: string) {
    const filter = this.filterByType(type);
    if (!filter) return;
    filter.selected = new Set();
    this.onFilterChange(filter);
  }

  /** Forgets the danger level readings with their paint and tooltip note. */
  private clearDangerLevel() {
    this.danger = undefined;
    this.cutLevels = [];
    this.markerService.paintOverride = undefined;
    this.markerService.tooltipNote = undefined;
  }

  /** The level of each band of the slider while the danger level view is on, none for a band without a level. */
  private levelsOnSlider(levels: readonly (number | undefined)[]): (BandLevel | undefined)[] {
    if (this.view !== "danger" || !this.cutFilter) return [];
    const cuts = this.splitCuts;
    return bandEdges(this.cutStops, this.elevationCuts).map(([lower, upper]) => {
      const level = upper > lower ? levels[bandOf(lower, cuts)] : undefined;
      return level ? { level, ...levelStyle(level) } : undefined;
    });
  }

  /** What the danger level asks of a feature: its location, aspect, elevation, snow depth, index value and size. */
  private dangerProbe(
    o: FeatureProperties,
    key: string,
    index: FilterSelectionData<FeatureProperties> | undefined,
    sizeFilter: FilterSelectionData<FeatureProperties> | undefined,
  ): DangerProbe {
    return {
      key,
      polygon: isPolygon(o),
      aspect: o["aspect"],
      elevation: o.elevation,
      snowDepth: get(o, SNOW_DEPTH_KEY),
      value: index?.getValue(o),
      size: sizeFilter?.getValue(o),
    };
  }

  /**
   * Reads the selected features against the EAWS matrix once per elevation band while the danger level view is on
   * and the sources are loaded, and paints the map by the bands' levels; the readings must exist before the map is
   * painted.
   */
  private readDangerLevel(selected: ReadonlySet<FeatureProperties>) {
    const calibration = this.config.dangerLevel;
    if (this.view !== "danger" || !calibration || this.loadingState === "loading") {
      this.clearDangerLevel();
      return;
    }
    const index = this.placeholderIndex;
    const bounds = index && classBounds(index);
    const sizeFilter = this.filterByType(this.config.hazardChart.xType);
    const cuts = this.splitCuts;
    const samples = new Map<FeatureProperties, DangerSample>();
    for (const o of selected) {
      const key = `${o.$source}\n${o.location ?? `#${samples.size}`}`;
      samples.set(o, sampleOf(this.dangerProbe(o, key, index, sizeFilter), cuts));
    }
    const bands = dangerBands(samples.values(), cuts, bounds ?? [], calibration);
    const pending = this.filterService.filterSelectionData.some((f) => this.isReloadPending(f));
    const levels = bands.map(({ reading }) => (pending ? undefined : reading.levels?.[0]));
    const plan = planDanger(samples, levels);
    this.markerService.paintOverride = (o) => dangerPaint(plan, o, isPolygon(o));
    const words = mapValues(NOTE_WORDS, (word) => this.t(word));
    const names = bands.map(({ name }) => this.t(name.key, name.params));
    this.markerService.tooltipNote = (o) => dangerNote(plan, o, names, words);
    this.danger = {
      bands,
      index: index && {
        label: index.label,
        bounds,
        colors: index.values.filter((v) => Array.isArray(v.numericRange)).map((v) => v.color),
      },
      context: this.dangerContext(index, sizeFilter, pending),
      legend: levels.map(dangerRating),
      legendColors: [...levels].reverse().map(levelColor),
    };
    this.cutLevels = this.levelsOnSlider(levels);
  }

  /** What the danger level panel shows beside its readings: the selected aspects and filters, a pending reload. */
  private dangerContext(
    index: FilterSelectionData<FeatureProperties> | undefined,
    sizeFilter: FilterSelectionData<FeatureProperties> | undefined,
    pending: boolean,
  ): DangerContext {
    const chosen = this.filterService.filterSelectionData.filter((f) => f.selected.size);
    const named = ({ type, label }: FilterSelectionData<FeatureProperties>) => ({ type, label });
    return {
      aspects:
        this.filterByType("aspect")
          ?.getSelectedValues("selected")
          .map((v) => v.value) ?? [],
      conditioning: chosen
        .filter((f) => f === index || f === sizeFilter || String(f.key).includes("$stabilityIndex"))
        .map(named),
      selected: [
        ...(this.filterService.regions.size ? [{ type: "region", label: this.t("Region") }] : []),
        ...chosen.map(named),
      ],
      pending,
    };
  }

  chartMouseOut() {
    this.clearHighlight();
    this.emphasizeMedian("downplay");
  }

  private emphasizeMedian(type: "highlight" | "downplay") {
    if (this.timeseriesDateIndex >= 0) {
      this.timeseriesInstance?.dispatchAction({ type, seriesIndex: 0, dataIndex: this.timeseriesDateIndex });
    }
  }

  chartClick($event: ECElementEvent) {
    const observation = this.chartObservations[$event.data[2] as number];
    if (observation) {
      this.chartMouseOut();
      this.showObservationDetails(observation);
    }
  }

  private clearHighlight() {
    this.highlightMarker?.remove();
    this.highlightMarker = undefined;
    if (this.highlightPolygon !== undefined) {
      this.map?.removeFeatureState({ source: this.polygonSource, id: this.highlightPolygon });
      this.highlightPolygon = undefined;
    }
    this.tooltipPopup.remove();
  }

  private setupPolygonLayer(map: MlMap) {
    map.addSource(this.polygonSource, {
      type: "geojson",
      promoteId: "index",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: `${this.polygonSource}-fill`,
      type: "fill",
      source: this.polygonSource,
      paint: {
        "fill-color": ["get", "fillColor"],
        "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, ["get", "fillOpacity"]],
      },
    });
    map.addLayer({
      id: `${this.polygonSource}-line`,
      type: "line",
      source: this.polygonSource,
      paint: {
        "line-color": ["case", ["boolean", ["feature-state", "hover"], false], "#000", ["get", "color"]],
        "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 4, ["get", "weight"]],
        "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, ["get", "opacity"]],
      },
    });
    const fillId = `${this.polygonSource}-fill`;
    const obsAt = (e: MapLayerMouseEvent): FeatureProperties | undefined =>
      this.localObservations[e.features?.[0]?.properties?.["index"] as number];
    const hover = (e: MapLayerMouseEvent) => {
      if (this.markerHovered) return; // prefer the circle marker's tooltip
      map.getCanvas().style.cursor = "pointer";
      const o = obsAt(e);
      if (!o) return;
      this.tooltipPopup.setLngLat(e.lngLat);
      if (o === this.hoveredObservation) return;
      this.hoveredObservation = o;
      this.tooltipPopup.setHTML(this.markerService.tooltipHtml(o)).addTo(map);
      this.highlightInHazardChart(o);
    };
    map.on("mouseenter", fillId, hover);
    map.on("mousemove", fillId, hover);
    map.on("mouseleave", fillId, () => {
      map.getCanvas().style.cursor = "";
      this.hoveredObservation = undefined;
      this.tooltipPopup.remove();
      this.highlightInHazardChart(undefined);
    });
    map.on("click", fillId, (e) => {
      const o = obsAt(e);
      if (o) this.onObservationClick(o, e.originalEvent);
    });
    map.on("contextmenu", fillId, (e) => {
      const o = obsAt(e);
      if (o) this.showObservationDetails(o);
    });
  }

  private wirePointMarker(marker: MlMarker, observation: FeatureProperties) {
    const el = marker.getElement() as ObsMarkerElement;
    el.style.cursor = "pointer";
    el.addEventListener("mouseenter", () => {
      if (!this.map) return;
      this.markerHovered = true;
      this.tooltipPopup
        .setLngLat(marker.getLngLat())
        .setHTML(el.tooltipHtml ?? "")
        .addTo(this.map);
      this.highlightInHazardChart(observation);
    });
    el.addEventListener("mouseleave", () => {
      this.markerHovered = false;
      this.tooltipPopup.remove();
      this.highlightInHazardChart(undefined);
    });
    el.addEventListener("click", (e) => {
      // stop the click from also reaching the region layer underneath the marker
      e.stopPropagation();
      this.onObservationClick(observation, e);
    });
    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showObservationDetails(observation);
    });
  }

  private addImageOverlay(overlay: { imageUrl?: string; imageBounds: number[][]; name: string }) {
    const map = this.map;
    if (!map || !overlay.imageUrl) return;
    const id = `awsome-overlay-${this.imageOverlays.length}`;
    const [[south, west], [north, east]] = overlay.imageBounds as [[number, number], [number, number]];
    map.addSource(id, {
      type: "image",
      url: overlay.imageUrl,
      coordinates: [
        [west, north],
        [east, north],
        [east, south],
        [west, south],
      ],
    });
    map.addLayer({ id, type: "raster", source: id, layout: { visibility: "none" } });
    this.imageOverlays.push({ id, name: overlay.name });
  }

  private removeImageOverlays() {
    const map = this.map;
    if (this.overlayControl && map) {
      map.removeControl(this.overlayControl);
    }
    this.overlayControl = undefined;
    for (const o of this.imageOverlays) {
      if (map?.getLayer(o.id)) map.removeLayer(o.id);
      if (map?.getSource(o.id)) map.removeSource(o.id);
    }
    this.imageOverlays = [];
  }

  /**
   * @see BaseMapService.handleClick
   */
  private onObservationClick(observation: FeatureProperties, e: MouseEvent) {
    const id = observation.region_id;

    if (e.shiftKey) {
      this.mapService.toggleSelectedRegions([id]);
    } else if (this.mapService.isRegionSelected(id)) {
      this.mapService.clearSelectedRegions();
    } else {
      this.mapService.setSelectedRegions([id]);
    }
    this.filterService.regions = new Set(this.mapService.getSelectedRegions());
    this.applyLocalFilter();

    if (this.isMobile) {
      this.layout = "details";
    }
  }

  private showObservationDetails(observation: FeatureProperties) {
    const previous =
      this.selectedObservation?.$source === observation.$source ? (this.selectedObservationDetails ?? []) : [];
    const active = this.selectedObservationActiveTabs[observation.$source];
    const activeIndex = previous.findIndex((p) => p.label === active);
    this.selectedObservation = observation;
    const regions = [...this.filterService.regions].sort();
    const band = this.filterService.filterSelectionData.find((f) => f.key === "band");
    // a template may address the selection: the selected regions (else the observation's) and bands
    const context = {
      ...observation,
      $regions: (regions.length ? regions : [observation.region_id]).join(","),
      $bands: [...(band?.selected ?? [])].sort().join(","),
    };
    this.selectedObservationDetails = observation.$sourceObject.detailsTemplates.map(({ label, template }, index) => {
      let html = this.markerService.formatTemplate(template, context);
      try {
        const dom = new DOMParser().parseFromString(html, "text/html");
        dom.querySelectorAll("[src]").forEach((node) => {
          node.setAttribute("src", new URL(node.getAttribute("src"), this.baseURL).toString());
        });
        html = dom.body.innerHTML;
      } catch (e) {
        console.warn("Failed update URLs using DOMParser", html, e);
      }
      const tab = { label: this.markerService.formatTemplate(label, context), source: html };
      // an unchanged tab keeps its object, so its content is not re-rendered; a tab whose
      // viewer frame is on the page and only got another query keeps it too and re-points
      // the frame; a steered tab that is not shown is rebuilt, for when it is
      const prev = previous[index];
      if (prev) {
        const steered = prev.frame !== undefined && prev.frame !== this.frameSrc(prev.source);
        const frame = prev.frame && this.detailsFrames().find((f) => f.getAttribute("src") === prev.frame);
        if (prev.source === tab.source && (!steered || frame)) return prev;
        if (frame && this.steerFrame(frame, html)) {
          prev.label = tab.label;
          prev.source = html;
          return prev;
        }
      }
      return { ...tab, html: this.sanitizer.bypassSecurityTrustHtml(html), frame: this.frameSrc(html) };
    });
    this.selectedObservationActiveTabs[observation.$source] = (
      this.selectedObservationDetails[activeIndex] ??
      this.selectedObservationDetails.find(({ label }) => label === active) ??
      this.selectedObservationDetails[0]
    ).label;
    if (this.isMobile) {
      this.layout = "chart";
    }
  }

  closeObservation() {
    this.selectedObservation = undefined;
    this.selectedObservationDetails = undefined;
    if (this.isMobile) {
      this.layout = "map";
    }
  }

  private get isMobile() {
    // see scss/sections/_observations.scss
    return window.matchMedia("(max-width: 768px)").matches;
  }

  private fetchJSON<T>(url: string) {
    return this.httpClient.get<T>(url, { cache: "no-cache" });
  }

  requestFullscreen($event: MouseEvent) {
    ($event.target as HTMLElement).parentElement.parentElement.requestFullscreen();
  }
}
