export enum LanguageCode {
  ab, aa, af, ak, sq, am, ar, an, hy, as, av, ae, ay, az, bm, ba, eu, be, bn, bh, bi, bs, br, bg, my, ca, ch, ce, ny, zh, cv, kw, co, cr, hr, cs, da, dv, nl, dz, en, eo, et, ee, fo, fj, fi, fr, ff, gl, ka, de, el, gn, gu, ht, ha, he, hz, hi, ho, hu, ia, id, ie, ga, ig, ik, io, is, it, iu, ja, jv, kl, kn, kr, ks, kk, km, ki, rw, ky, kv, kg, ko, ku, kj, la, lb, lg, li, ln, lo, lt, lu, lv, gv, mk, mg, ms, ml, mt, mi, mr, mh, mn, na, nv, nd, ne, ng, nb, nn, no, ii, nr, oc, oj, cu, om, or, os, pa, pi, fa, pl, ps, pt, qu, rm, rn, ro, ru, sa, sc, sd, se, sm, sg, sr, gd, sn, si, sk, sl, so, st, es, su, sw, ss, sv, ta, te, tg, th, ti, bo, tk, tl, tn, to, tr, ts, tt, tw, ty, ug, uk, ur, uz, ve, vi, vo, wa, cy, wo, fy, xh, yi, yo, za, zu
}

export enum DangerRating {
  missing = -2, no_snow = -1, no_rating = 0, low = 1, moderate = 2, considerable = 3, high = 4, very_high = 5
}

export enum DangerRatingModificator {
  minus, equal, plus
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
  new_snow, wind_slab, persistent_weak_layers, wet_snow, gliding_snow, favourable_situation, cornices, no_distinct_problem
}

export type AvalancheProblemStr = keyof typeof AvalancheProblem;

export enum DangerPattern {
  dp1 = "dp1", dp2 = "dp2", dp3 = "dp3", dp4 = "dp4", dp5 = "dp5", dp6 = "dp6", dp7 = "dp7", dp8 = "dp8", dp9 = "dp9", dp10 = "dp10"
}

export enum AvalancheSize {
  small, medium, large, very_large, extreme
}

export enum SnowpackStability {
  good, fair, poor, very_poor
}

export enum Frequency {
  none, few, some, many
}

export enum Tendency {
  decreasing = "decreasing", steady = "steady", increasing = "increasing"
}

export enum Direction {
  up, down
}
