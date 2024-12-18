import { FilterSelectionData } from "./filter-selection-data";
import { Aspect, AvalancheProblem, DangerPattern, SnowpackStability } from "../enums/enums";
import { GenericObservation, ImportantObservation, ObservationType } from "./models/generic-observation.model";

export function observationFilters(t: (message: string) => string): FilterSelectionData<GenericObservation>[] {
  return [
    new FilterSelectionData<GenericObservation>({
      type: "Aspect",
      label: t("admin.observations.charts.aspect.caption"),
      key: "aspect",
      chartType: "rose",
      chartRichLabel: "label",
      values: [
        // FATMAP
        { value: Aspect.N, color: "#2f74f9", label: Aspect.N, legend: t("aspect.N") },
        { value: Aspect.NE, color: "#96c0fc", label: Aspect.NE, legend: t("aspect.NE") },
        { value: Aspect.E, color: "#b3b3b3", label: Aspect.E, legend: t("aspect.E") },
        { value: Aspect.SE, color: "#f6ba91", label: Aspect.SE, legend: t("aspect.SE") },
        { value: Aspect.S, color: "#ef6d25", label: Aspect.S, legend: t("aspect.S") },
        { value: Aspect.SW, color: "#6c300b", label: Aspect.SW, legend: t("aspect.SW") },
        { value: Aspect.W, color: "#000000", label: Aspect.W, legend: t("aspect.W") },
        { value: Aspect.NW, color: "#113570", label: Aspect.NW, legend: t("aspect.NW") },
      ],
    }),
    new FilterSelectionData<GenericObservation>({
      type: "Days",
      label: t("admin.observations.charts.days.caption"),
      key: "eventDate",
      chartType: "bar",
      chartRichLabel: "label",
      values: [],
    }),
    new FilterSelectionData<GenericObservation>({
      type: "Elevation",
      label: t("admin.observations.charts.elevation.caption"),
      key: "elevation",
      chartType: "bar",
      chartRichLabel: "label",
      values: [
        { value: "4000 – ∞", numericRange: [4000, 9999], color: "#CC0CE8", label: "40", legend: "4000 – ∞" },
        { value: "3500 – 4000", numericRange: [3500, 4000], color: "#784BFF", label: "35", legend: "3500 – 4000" },
        { value: "3000 – 3500", numericRange: [3000, 3500], color: "#035BBE", label: "30", legend: "3000 – 3500" },
        { value: "2500 – 3000", numericRange: [2500, 3000], color: "#0481FF", label: "25", legend: "2500 – 3000" },
        { value: "2000 – 2500", numericRange: [2000, 2500], color: "#03CDFF", label: "20", legend: "2000 – 2500" },
        { value: "1500 – 2000", numericRange: [1500, 2000], color: "#8CFFFF", label: "15", legend: "1500 – 2000" },
        { value: "1000 – 1500", numericRange: [1000, 1500], color: "#B0FFBC", label: "10", legend: "1000 – 1500" },
        { value: "500 – 1000", numericRange: [500, 1000], color: "#FFFFB3", label: "5", legend: "500 – 1000" },
        { value: "0 – 500", numericRange: [0, 500], color: "#FFFFFE", label: "0", legend: "0 – 500" },
      ],
    }),
    new FilterSelectionData<GenericObservation>({
      type: "Stability",
      label: t("admin.observations.charts.stability.caption"),
      key: "stability",
      chartType: "bar",
      chartRichLabel: "symbol",
      values: [
        // https://colorbrewer2.org/#type=diverging&scheme=RdYlGn&n=5
        {
          value: SnowpackStability.very_poor,
          color: "#d7191c",
          label: "🔴",
          legend: t("snowpackStability.very_poor"),
        },
        {
          value: SnowpackStability.poor,
          color: "#fdae61",
          label: "🟠",
          legend: t("snowpackStability.poor"),
        },
        {
          value: SnowpackStability.fair,
          color: "#ffffbf",
          label: "🟡",
          legend: t("snowpackStability.fair"),
        },
        {
          value: SnowpackStability.good,
          color: "#a6d96a",
          label: "🟢",
          legend: t("snowpackStability.good"),
        },
      ],
    }),
    new FilterSelectionData<GenericObservation>({
      type: "ObservationType",
      label: t("admin.observations.charts.observationType.caption"),
      key: "$type",
      chartType: "bar",
      chartRichLabel: "symbol",
      values: [
        // https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=9
        {
          value: ObservationType.SimpleObservation,
          color: "#e41a1c",
          label: "👁",
          legend: t("observationType.SimpleObservation"),
        },
        {
          value: ObservationType.Evaluation,
          color: "#377eb8",
          label: "✓",
          legend: t("observationType.Evaluation"),
        },
        {
          value: ObservationType.Avalanche,
          color: "#4daf4a",
          label: "⛰",
          legend: t("observationType.Avalanche"),
        },
        {
          value: ObservationType.Blasting,
          color: "#984ea3",
          label: "⁜",
          legend: t("observationType.Blasting"),
        },
        {
          value: ObservationType.Closure,
          color: "#ff7f00",
          label: "𐄂",
          legend: t("observationType.Closure"),
        },
        {
          value: ObservationType.Profile,
          color: "#ffff33",
          label: "⌇",
          legend: t("observationType.Profile"),
        },
      ],
    }),
    new FilterSelectionData<GenericObservation>({
      type: "ImportantObservation",
      label: t("admin.observations.charts.importantObservation.caption"),
      key: "importantObservations",
      chartType: "bar",
      chartRichLabel: "grainShape",
      values: [
        // https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=9
        {
          value: ImportantObservation.SnowLine,
          color: "#e41a1c",
          label: "S",
          legend: t("importantObservation.SnowLine"),
        },
        {
          value: ImportantObservation.SurfaceHoar,
          color: "#377eb8",
          label: "g",
          legend: t("importantObservation.SurfaceHoar"),
        },
        {
          value: ImportantObservation.Graupel,
          color: "#4daf4a",
          label: "o",
          legend: t("importantObservation.Graupel"),
        },
        {
          value: ImportantObservation.StabilityTest,
          color: "#984ea3",
          label: "k",
          legend: t("importantObservation.StabilityTest"),
        },
        {
          value: ImportantObservation.IceFormation,
          color: "#ff7f00",
          label: "i",
          legend: t("importantObservation.IceFormation"),
        },
        {
          value: ImportantObservation.VeryLightNewSnow,
          color: "#ffff33",
          label: "m",
          legend: t("importantObservation.VeryLightNewSnow"),
        },
        {
          value: ImportantObservation.ForBlog,
          color: "#f781bf",
          label: "BLOG",
          legend: t("importantObservation.ForBlog"),
        },
      ],
    }),
    new FilterSelectionData<GenericObservation>({
      type: "AvalancheProblem",
      label: t("admin.observations.charts.avalancheProblem.caption"),
      key: "avalancheProblems",
      chartType: "bar",
      chartRichLabel: "symbol",
      values: [
        // The international classification for seasonal snow on the ground
        // (except for gliding snow - no definition there)
        {
          value: AvalancheProblem.new_snow,
          color: "#00ff00",
          label: "🌨",
          legend: t("avalancheProblem.new_snow"),
        },
        {
          value: AvalancheProblem.wind_slab,
          color: "#229b22",
          label: "🚩",
          legend: t("avalancheProblem.wind_slab"),
        },
        {
          value: AvalancheProblem.persistent_weak_layers,
          color: "#0000ff",
          label: "❗",
          legend: t("avalancheProblem.persistent_weak_layers"),
        },
        {
          value: AvalancheProblem.wet_snow,
          color: "#ff0000",
          label: "☀️",
          legend: t("avalancheProblem.wet_snow"),
        },
        {
          value: AvalancheProblem.gliding_snow,
          color: "#aa0000",
          label: "🐟",
          legend: t("avalancheProblem.gliding_snow"),
        },
      ],
    }),
    new FilterSelectionData<GenericObservation>({
      type: "DangerPattern",
      label: t("admin.observations.charts.dangerPattern.caption"),
      key: "dangerPatterns",
      chartType: "bar",
      chartRichLabel: "label",
      values: [
        // https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=9
        {
          value: DangerPattern.dp1,
          color: "#e41a1c",
          label: "1",
          legend: t("dangerPattern.dp1"),
        },
        {
          value: DangerPattern.dp2,
          color: "#377eb8",
          label: "2",
          legend: t("dangerPattern.dp2"),
        },
        {
          value: DangerPattern.dp3,
          color: "#4daf4a",
          label: "3",
          legend: t("dangerPattern.dp3"),
        },
        {
          value: DangerPattern.dp4,
          color: "#984ea3",
          label: "4",
          legend: t("dangerPattern.dp4"),
        },
        {
          value: DangerPattern.dp5,
          color: "#ff7f00",
          label: "5",
          legend: t("dangerPattern.dp5"),
        },
        {
          value: DangerPattern.dp6,
          color: "#ffff33",
          label: "6",
          legend: t("dangerPattern.dp6"),
        },
        {
          value: DangerPattern.dp7,
          color: "#a65628",
          label: "7",
          legend: t("dangerPattern.dp7"),
        },
        {
          value: DangerPattern.dp8,
          color: "#f781bf",
          label: "8",
          legend: t("dangerPattern.dp8"),
        },
        {
          value: DangerPattern.dp9,
          color: "#999999",
          label: "9",
          legend: t("dangerPattern.dp9"),
        },
        {
          value: DangerPattern.dp10,
          color: "#e41a1c",
          label: "10",
          legend: t("dangerPattern.dp10"),
        },
      ],
    }),
  ];
}
