export enum LanguageCode {
  ab, aa, af, ak, sq, am, ar, an, hy, as, av, ae, ay, az, bm, ba, eu, be, bn, bh, bi, bs, br, bg, my, ca, ch, ce, ny, zh, cv, kw, co, cr, hr, cs, da, dv, nl, dz, en, eo, et, ee, fo, fj, fi, fr, ff, gl, ka, de, el, gn, gu, ht, ha, he, hz, hi, ho, hu, ia, id, ie, ga, ig, ik, io, is, it, iu, ja, jv, kl, kn, kr, ks, kk, km, ki, rw, ky, kv, kg, ko, ku, kj, la, lb, lg, li, ln, lo, lt, lu, lv, gv, mk, mg, ms, ml, mt, mi, mr, mh, mn, na, nv, nd, ne, ng, nb, nn, no, ii, nr, oc, oj, cu, om, or, os, pa, pi, fa, pl, ps, pt, qu, rm, rn, ro, ru, sa, sc, sd, se, sm, sg, sr, gd, sn, si, sk, sl, so, st, es, su, sw, ss, sv, ta, te, tg, th, ti, bo, tk, tl, tn, to, tr, ts, tt, tw, ty, ug, uk, ur, uz, ve, vi, vo, wa, cy, wo, fy, xh, yi, yo, za, zu
}

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
  missing, draft, submitted, published, updated, resubmitted, republished
}

export enum RegionStatus {
  suggested, saved, published
}

export enum Aspect {
  N = 1, NE = 2, E = 3, SE = 4, S = 5, SW = 6, W = 7, NW = 8
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
  dp1 = "dp1", dp2 = "dp2", dp3 = "dp3", dp4 = "dp4", dp5 = "dp5", dp6 = "dp6", dp7 = "dp7", dp8 = "dp8", dp9 = "dp9", dp10 = "dp10"
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
  decreasing = "decreasing", steady = "steady", increasing = "increasing"
}

export enum DangerRatingDirection {
  up = "up",
  down = "down",
}
