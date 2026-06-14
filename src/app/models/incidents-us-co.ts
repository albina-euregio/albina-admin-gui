import * as z from "zod";

// https://avalanche.state.co.us/observations/avalanches

export const AspectSchema = z.enum(["E", "N", "NE", "NW", "S", "SE", "SW", "W"]);

export const AvalancheDetailTypeSchema = z.enum(["avalanche_detail"]);

export const CategorySchema = z.enum(["backcountry"]);

export const SlugSchema = z.enum([
  "aspen",
  "front-range",
  "gunnison",
  "northern-san-juan",
  "sawatch",
  "vail-and-summit-county",
]);

export const TitleSchema = z.enum([
  "Aspen",
  "Front Range",
  "Gunnison",
  "Northern San Juan",
  "Sawatch",
  "Vail u0026 Summit County",
]);

export const BackcountryZoneTypeSchema = z.enum(["backcountry_zone"]);

export const DateKnownSchema = z.enum(["Estimated", "Known", "Unknown"]);

export const CrownUnitsSchema = z.enum(["cm"]);

export const UnitsSchema = z.enum(["ft", "m"]);

export const DestructiveSizeSchema = z.enum(["D1", "D1.5", "D2", "D2.5"]);

export const ElevationSchema = z.enum(["TL", "u0026#60;TL", "u0026#62;TL"]);

export const HwOpBcSchema = z.enum(["bc"]);

export const StatusSchema = z.enum(["approved"]);

export const PrimaryTriggerSchema = z.enum(["AM", "AR", "AS", "N", "U"]);

export const ProblemTypeSchema = z.enum(["cornice", "loose_wet", "persistent", "storm", "Unknown", "wet_slab", "wind"]);

export const RelativeSizeSchema = z.enum(["R1", "R2", "R3"]);

export const BackcountryAvalancheTypeSchema = z.enum(["avalanche_observation"]);

export const TypeCodeSchema = z.enum(["C", "HS", "SS", "U", "WL", "WS"]);

export const AvalancheDetailSchema = z.object({
  id: z.string(),
  classic_id: z.null(),
  description: z.string(),
  type: AvalancheDetailTypeSchema,
});

export const BackcountryZoneSchema = z.object({
  id: z.string(),
  category: CategorySchema,
  category_order: z.number(),
  created_at: z.coerce.date(),
  geojson_url: z.string(),
  is_leaf: z.boolean(),
  is_root: z.boolean(),
  parent_id: z.string(),
  parent_url: z.string(),
  slug: SlugSchema,
  title: TitleSchema,
  tree_level: z.number(),
  type: BackcountryZoneTypeSchema,
  updated_at: z.coerce.date(),
  url: z.string(),
});

export const ObservationReportSchema = z.object({
  id: z.string(),
  external_canonical_report: z.string(),
  is_anonymous: z.boolean(),
  is_locked: z.boolean(),
  status: StatusSchema,
  url: z.string(),
});

export const BackcountryAvalancheElementSchema = z.object({
  id: z.string(),
  alpha_angle_extreme_event: z.null(),
  alpha_angle_individual_avalanche: z.null(),
  angle: z.null(),
  angle_average: z.null(),
  angle_maximum: z.null(),
  area: z.union([z.null(), z.string()]),
  aspect: AspectSchema,
  avalanche_detail: AvalancheDetailSchema.optional(),
  avalanche_path_comments: z.union([z.null(), z.string()]),
  backcountry_zone: BackcountryZoneSchema,
  backcountry_zone_id: z.string(),
  bed_surface_grain_size: z.null(),
  bed_surface_grain_type: z.union([z.null(), z.string()]),
  bed_surface_hardness: z.null(),
  bed_surface_hardness_modifier: z.null(),
  comments: z.union([z.null(), z.string()]),
  comments_caic: z.string(),
  created_at: z.coerce.date(),
  crown_average: z.union([z.number(), z.null()]),
  crown_location: z.null(),
  crown_maximum: z.null(),
  crown_measured: z.union([DateKnownSchema, z.null()]),
  crown_units: z.union([CrownUnitsSchema, z.null()]),
  date_known: DateKnownSchema,
  debris_density_average: z.null(),
  debris_toe_elevation: z.null(),
  debris_toe_elevation_units: UnitsSchema,
  debris_type: z.union([z.array(z.any()), z.null()]),
  destructive_size: DestructiveSizeSchema,
  elevation: ElevationSchema,
  elevation_feet: z.union([z.number(), z.null()]),
  firstname: z.string().optional(),
  full_name: z.string().optional(),
  grain_type: z.null(),
  had_terrain_trap: z.null(),
  highway_zone_id: z.null(),
  hw_op_bc: HwOpBcSchema,
  is_incident: z.boolean(),
  is_locked: z.boolean(),
  landmark: z.null(),
  lastname: z.string().optional(),
  latitude: z.number(),
  location: z.union([z.null(), z.string()]),
  longitude: z.number(),
  number: z.union([z.number(), z.null()]),
  observation_report: ObservationReportSchema,
  observed_at: z.coerce.date(),
  path: z.null(),
  primary_trigger: z.union([PrimaryTriggerSchema, z.null()]),
  problem_type: z.union([ProblemTypeSchema, z.null()]),
  relative_size: z.union([RelativeSizeSchema, z.null()]),
  road_depth: z.null(),
  road_depth_units: z.null(),
  road_effect: z.null(),
  road_length: z.null(),
  road_length_units: z.null(),
  road_status: z.null(),
  run_out_aspect: z.null(),
  run_out_average_incline: z.null(),
  run_out_ground_cover: z.null(),
  run_out_snow_moisture: z.null(),
  secondary_trigger: z.union([z.null(), z.string()]),
  slab_grain_comments: z.union([z.null(), z.string()]),
  slab_grain_size: z.null(),
  slab_grain_type: z.null(),
  slab_hardness: z.null(),
  slab_hardness_modifier: z.null(),
  slope_characteristics: z.union([z.array(z.any()), z.null()]),
  start_zone_aspect_end: z.null(),
  start_zone_aspect_start: z.null(),
  start_zone_comments: z.union([z.null(), z.string()]),
  start_zone_elevation: z.union([z.number(), z.null()]),
  start_zone_elevation_units: UnitsSchema,
  start_zone_ground_cover: z.null(),
  start_zone_slope_angle_average: z.null(),
  start_zone_slope_angle_maximum: z.null(),
  start_zone_snow_moisture: z.null(),
  surface: z.union([z.null(), z.string()]),
  terminus: z.null(),
  terrain_trap_type: z.union([z.null(), z.string()]),
  time_known: z.union([DateKnownSchema, z.null()]),
  track_aspect: z.null(),
  track_shape: z.null(),
  track_slope_angle_average: z.null(),
  track_snow_moisture: z.null(),
  type: BackcountryAvalancheTypeSchema,
  type_code: z.union([TypeCodeSchema, z.null()]),
  updated_at: z.coerce.date(),
  url: z.string(),
  vertical_average: z.null(),
  vertical_maximum: z.null(),
  vertical_units: z.union([UnitsSchema, z.null()]),
  water_year: z.number(),
  weak_layer: z.null(),
  weak_layer_grain_size: z.null(),
  weak_layer_grain_type: z.union([z.null(), z.string()]),
  weak_layer_hardness: z.null(),
  weak_layer_hardness_modifier: z.null(),
  weak_layer_thickness: z.null(),
  width_average: z.null(),
  width_maximum: z.null(),
  width_units: z.union([UnitsSchema, z.null()]),
});
