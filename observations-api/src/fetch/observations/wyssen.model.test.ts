import { describe, expect, test } from "bun:test";

import {
  Aspect,
  AvalancheProblem,
  ObservationSource,
  ObservationType,
  PersonInvolvement,
} from "../../generic-observation";
import { parseWyssenAvalanche, toWyssenAvalancheObservation } from "./wyssen.model";

/** the agreed payload template sent to the SLF Aval API v5 */
const template = {
  triggerDateTime: "",
  triggerDateTimeAcc: "",
  triggerType: "",
  triggerRemote: "",
  avalancheType: "",
  avalancheSize: "",
  avalancheMoisture: "",
  note: "",
  confidential: false,
  stormeRelevant: false,
  externalId: "",
  detectionType: "MANUALLY",
  avalancheLength: 0,
  avalancheLengthAcc: "",
  weakLayer: "",
  fractureThicknessMean: 0,
  fractureWidth: 0,
  fractureWidthAcc: "",
  startZoneAspect: "",
  startZoneSlopeAngle: "",
  startZoneElevation: 0,
  startZoneElevationAcc: "",
  depositElevation: 0,
  depositHeight: 0.0,
  depositWidth: 0.0,
  depositLength: 0,
  materialDamageExists: "",
  rescueMissionExists: "",
  groupSize: 0,
  groupSizeAccuracy: "",
  location: { type: "Point", coordinates: [0.0, 0.0] },
  zones: [{ type: "AVAL_SHAPE", geo: { type: "Polygon", coordinates: [[[0.0, 0.0]]] } }],
};

const filled = {
  ...template,
  triggerDateTime: "2026-01-15T10:30:00Z",
  triggerDateTimeAcc: "ESTIMATED",
  triggerType: "PERSON",
  triggerRemote: "NO",
  avalancheType: "SLAB",
  avalancheSize: "3",
  avalancheMoisture: "DRY",
  note: "Schneebrett am Nordosthang",
  externalId: "abc-123",
  avalancheLength: 450,
  avalancheLengthAcc: "ESTIMATED",
  weakLayer: "IN_OLD_SNOW",
  fractureThicknessMean: 60,
  fractureWidth: 120,
  startZoneAspect: "NE",
  startZoneSlopeAngle: "38",
  startZoneElevation: 2650,
  startZoneElevationAcc: "ACCURATE",
  depositElevation: 2300,
  materialDamageExists: "NO",
  rescueMissionExists: "YES",
  groupSize: 4,
  groupSizeAccuracy: "ACCURATE",
  location: { type: "Point", coordinates: [11.4, 47.2] },
};

describe("parseWyssenAvalanche", () => {
  test("rejects the empty template (no trigger date)", () => {
    expect(() => parseWyssenAvalanche(template)).toThrow();
  });

  test("treats empty strings and zero placeholders as missing", () => {
    const aval = parseWyssenAvalanche({ ...template, triggerDateTime: "2026-01-15T10:30:00Z" });
    expect(aval.triggerDateTime).toEqual(new Date("2026-01-15T10:30:00Z"));
    expect(aval.externalId).toBeUndefined();
    expect(aval.triggerType).toBeUndefined();
    expect(aval.avalancheSize).toBeUndefined();
    expect(aval.avalancheLength).toBeUndefined();
    expect(aval.startZoneSlopeAngleInDegrees).toBeUndefined();
    expect(aval.prsDmgGroupSize).toBeUndefined();
    expect(aval.detectionType).toBe("manually");
  });

  test("maps aliases to the spec field names and lower-cases enums", () => {
    const aval = parseWyssenAvalanche(filled);
    expect(aval).toMatchObject({
      triggerDateTimeAccuracy: "estimated",
      triggerType: "person",
      triggerRemote: "no",
      avalancheType: "slab",
      avalancheSize: 3,
      avalancheMoisture: "dry",
      avalancheLengthAccuracy: "estimated",
      weakLayer: "in_old_snow",
      startZoneAspect: "ne",
      startZoneSlopeAngleInDegrees: 38,
      startZoneElevationAccuracy: "accurate",
      matDmgExists: "no",
      rescueMissionExists: "yes",
      prsDmgGroupSize: 4,
      prsDmgGroupSizeAccuracy: "accurate",
    });
    expect(aval).not.toHaveProperty("groupSize");
    expect(aval).not.toHaveProperty("startZoneSlopeAngle");
  });

  test("rejects a trigger date without timezone offset", () => {
    expect(() => parseWyssenAvalanche({ ...filled, triggerDateTime: "2026-01-15T10:30:00" })).toThrow();
    expect(() => parseWyssenAvalanche({ ...filled, triggerDateTime: "2026-01-15" })).toThrow();
    expect(parseWyssenAvalanche({ ...filled, triggerDateTime: "2026-01-15T10:30:00+01:00" }).triggerDateTime).toEqual(
      new Date("2026-01-15T09:30:00Z"),
    );
  });

  test("rejects invalid enum values", () => {
    expect(() => parseWyssenAvalanche({ ...filled, triggerType: "AVALANCHE_DOG" })).toThrow();
  });
});

describe("toWyssenAvalancheObservation", () => {
  test("converts a filled payload", () => {
    const o = toWyssenAvalancheObservation(parseWyssenAvalanche(filled));
    expect(o).toMatchObject({
      $id: "abc-123",
      $source: ObservationSource.Wyssen,
      $type: ObservationType.Avalanche,
      $allowEdit: false,
      $deleted: false,
      aspect: Aspect.NE,
      avalancheProblems: [AvalancheProblem.persistent_weak_layers],
      content: "Schneebrett am Nordosthang",
      elevation: 2650,
      eventDate: new Date("2026-01-15T10:30:00Z"),
      latitude: 47.2,
      longitude: 11.4,
      personInvolvement: PersonInvolvement.Unknown,
    });
    expect(o.$extraDialogRows).toContainEqual({ label: "observations.avalancheLength", value: "450 m (estimated)" });
    expect(o.$extraDialogRows).toContainEqual({ label: "Anrisshöhe", value: "2650 m" });
    expect(o.$extraDialogRows).toContainEqual({ label: "Gruppengröße", value: "4 Pers." });
    expect(o.$extraDialogRows.find((r) => r.label === "Ablagerung Länge")).toBeUndefined();
  });

  test("rejects a payload without externalId", () => {
    const aval = parseWyssenAvalanche({ ...filled, externalId: "" });
    expect(() => toWyssenAvalancheObservation(aval)).toThrow("Expecting externalId");
  });

  test("rejects placeholder [0, 0] location and zones", () => {
    const aval = parseWyssenAvalanche({ ...template, triggerDateTime: "2026-01-15T10:30:00Z" });
    expect(() => toWyssenAvalancheObservation(aval)).toThrow("Expecting location");
  });

  test("falls back to the centroid of the avalanche shape", () => {
    const aval = parseWyssenAvalanche({
      ...filled,
      location: template.location,
      zones: [
        {
          type: "AVAL_SHAPE",
          geo: {
            type: "Polygon",
            coordinates: [
              [
                [11, 47],
                [12, 47],
                [12, 48],
                [11, 48],
                [11, 47],
              ],
            ],
          },
        },
      ],
    });
    const o = toWyssenAvalancheObservation(aval);
    expect(o.longitude).toBe(11.5);
    expect(o.latitude).toBe(47.5);
  });

  test("handles an empty polygon", () => {
    const aval = parseWyssenAvalanche({
      ...filled,
      location: "",
      zones: [{ type: "AVAL_SHAPE", geo: { type: "Polygon", coordinates: [] } }],
    });
    expect(() => toWyssenAvalancheObservation(aval)).toThrow("Expecting location");
  });

  test("derives avalanche problems and person involvement", () => {
    const gliding = parseWyssenAvalanche({ ...filled, avalancheType: "FULL_DEPTH", weakLayer: "" });
    expect(toWyssenAvalancheObservation(gliding).avalancheProblems).toEqual([AvalancheProblem.gliding_snow]);
    const wet = parseWyssenAvalanche({ ...filled, avalancheMoisture: "WET", weakLayer: "" });
    expect(toWyssenAvalancheObservation(wet).avalancheProblems).toEqual([AvalancheProblem.wet_snow]);
    const dead = parseWyssenAvalanche({
      ...filled,
      prsDmgPersons: [{ burialConsequence: "INJURED" }, { burialConsequence: "DEAD" }],
    });
    expect(toWyssenAvalancheObservation(dead).personInvolvement).toBe(PersonInvolvement.Dead);
    const none = parseWyssenAvalanche({ ...filled, prsDmgExists: "NO" });
    expect(toWyssenAvalancheObservation(none).personInvolvement).toBe(PersonInvolvement.No);
  });
});
