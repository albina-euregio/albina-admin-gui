export enum DangerRating {
  missing = "missing",
  no_snow = "no_snow",
  no_rating = "no_rating",
  low = "low",
  moderate = "moderate",
  considerable = "considerable",
  high = "high",
  very_high = "very_high",
}

export const WarnLevel = {
  [DangerRating.missing]: -2,
  [DangerRating.no_snow]: -1,
  [DangerRating.no_rating]: 0,
  [DangerRating.low]: 1,
  [DangerRating.moderate]: 2,
  [DangerRating.considerable]: 3,
  [DangerRating.high]: 4,
  [DangerRating.very_high]: 5,
};

export enum DangerRatingModificator {
  minus = "minus",
  equal = "equal",
  plus = "plus",
}

export enum BulletinStatus {
  missing,
  draft,
  submitted,
  published,
  updated,
  resubmitted,
  republished,
}

export enum RegionStatus {
  suggested,
  saved,
  published,
}

export enum Aspect {
  N = 1,
  NE = 2,
  E = 3,
  SE = 4,
  S = 5,
  SW = 6,
  W = 7,
  NW = 8,
}

export enum AvalancheProblem {
  new_snow = "new_snow",
  wind_slab = "wind_slab",
  persistent_weak_layers = "persistent_weak_layers",
  wet_snow = "wet_snow",
  gliding_snow = "gliding_snow",
  favourable_situation = "favourable_situation",
  cornices = "cornices",
  no_distinct_problem = "no_distinct_problem",
}

export enum DangerPattern {
  dp1 = "dp1",
  dp2 = "dp2",
  dp3 = "dp3",
  dp4 = "dp4",
  dp5 = "dp5",
  dp6 = "dp6",
  dp7 = "dp7",
  dp8 = "dp8",
  dp9 = "dp9",
  dp10 = "dp10",
}

export enum AvalancheSize {
  small = "small",
  medium = "medium",
  large = "large",
  very_large = "very_large",
  extreme = "extreme",
}

export enum SnowpackStability {
  good = "good",
  fair = "fair",
  poor = "poor",
  very_poor = "very_poor",
}

export enum Frequency {
  none = "none",
  few = "few",
  some = "some",
  many = "many",
}

export enum Tendency {
  decreasing = "decreasing",
  steady = "steady",
  increasing = "increasing",
}

export enum DangerRatingDirection {
  up = "up",
  down = "down",
}
