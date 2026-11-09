import { describe, expect, test } from "bun:test";

import {
  Aspect,
  AvalancheProblem,
  genericObservationWithIdSchema,
  ObservationSource,
  ObservationType,
  PersonInvolvement,
} from "../../generic-observation";
import { toWyssenAvalancheObservation, type WyssenAvalanche } from "./wyssen.model";

/** the agreed payload template sent to the SLF Aval API v5 */
const template: WyssenAvalanche = {
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

const filled: WyssenAvalanche = {
  ...template,
  triggerDateTime: "2026-01-15T10:30:00+01:00",
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

describe("toWyssenAvalancheObservation", () => {
  test("converts a filled payload", () => {
    const o = toWyssenAvalancheObservation(filled);
    expect(o).toMatchObject({
      $id: "abc-123",
      $source: ObservationSource.Wyssen,
      $type: ObservationType.Avalanche,
      $data: filled,
      $allowEdit: false,
      $deleted: false,
      aspect: Aspect.NE,
      avalancheProblems: [AvalancheProblem.persistent_weak_layers],
      content: "Schneebrett am Nordosthang",
      elevation: 2650,
      eventDate: new Date("2026-01-15T09:30:00Z"),
      latitude: 47.2,
      longitude: 11.4,
      personInvolvement: PersonInvolvement.Unknown,
    });
    expect(o.$extraDialogRows).toContainEqual({ label: "observations.avalancheSize", value: "3" });
    expect(o.$extraDialogRows).toContainEqual({ label: "observations.avalancheLength", value: "450 m (ESTIMATED)" });
    expect(o.$extraDialogRows).toContainEqual({ label: "observations.incline", value: "38 °" });
    expect(o.$extraDialogRows).toContainEqual({ label: "Anrisshöhe", value: "2650 m (ACCURATE)" });
    expect(o.$extraDialogRows).toContainEqual({ label: "Gruppengröße", value: "4 Pers. (ACCURATE)" });
    expect(o.$extraDialogRows).toContainEqual({ label: "Sachschaden", value: "NO" });
  });

  test("accepts the field names of the SLF Aval API v5 spec", () => {
    const o = toWyssenAvalancheObservation({
      ...template,
      externalId: "abc-123",
      triggerDateTime: "2026-01-15T10:30:00+01:00",
      triggerDateTimeAcc: undefined,
      triggerDateTimeAccuracy: "ESTIMATED",
      startZoneSlopeAngle: undefined,
      startZoneSlopeAngleInDegrees: 38,
      materialDamageExists: undefined,
      matDmgExists: "YES",
      groupSize: undefined,
      prsDmgGroupSize: 2,
      location: filled.location,
    });
    expect(o.$extraDialogRows).toContainEqual({ label: "Genauigkeit Abgangszeitpunkt", value: "ESTIMATED" });
    expect(o.$extraDialogRows).toContainEqual({ label: "observations.incline", value: "38 °" });
    expect(o.$extraDialogRows).toContainEqual({ label: "Sachschaden", value: "YES" });
    expect(o.$extraDialogRows).toContainEqual({ label: "Gruppengröße", value: "2 Pers." });
  });

  test("passes values through as sent", () => {
    const o = toWyssenAvalancheObservation({ ...template, externalId: "abc-123", triggerDateTime: "2026-01-15" });
    expect(o.aspect).toBeUndefined();
    expect(o.elevation).toBe(0);
    expect(o.latitude).toBe(0);
    expect(o.longitude).toBe(0);
    expect(o.$extraDialogRows).toContainEqual({ label: "Anrisshöhe", value: "0 m" });
    expect(o.$extraDialogRows.find((r) => r.label === "Auslöseart")).toBeUndefined();
  });

  test("ignores an unknown aspect", () => {
    expect(toWyssenAvalancheObservation({ ...filled, startZoneAspect: "ne" }).aspect).toBeUndefined();
  });

  test("derives avalanche problems and person involvement", () => {
    const gliding = toWyssenAvalancheObservation({ ...filled, avalancheType: "FULL_DEPTH", weakLayer: "" });
    expect(gliding.avalancheProblems).toEqual([AvalancheProblem.gliding_snow]);
    const wet = toWyssenAvalancheObservation({ ...filled, avalancheMoisture: "WET", weakLayer: "" });
    expect(wet.avalancheProblems).toEqual([AvalancheProblem.wet_snow]);
    const dead = toWyssenAvalancheObservation({
      ...filled,
      prsDmgPersons: [{ burialConsequence: "INJURED" }, { burialConsequence: "DEAD" }],
    });
    expect(dead.personInvolvement).toBe(PersonInvolvement.Dead);
    const none = toWyssenAvalancheObservation({ ...filled, prsDmgExists: "NO" });
    expect(none.personInvolvement).toBe(PersonInvolvement.No);
  });
});

describe("genericObservationWithIdSchema", () => {
  test("accepts a converted payload", () => {
    expect(() => genericObservationWithIdSchema.parse(toWyssenAvalancheObservation(filled))).not.toThrow();
  });

  test("accepts a payload without location", () => {
    const o = toWyssenAvalancheObservation({ ...filled, location: undefined });
    expect(() => genericObservationWithIdSchema.parse(o)).not.toThrow();
  });

  test("rejects a payload without externalId", () => {
    const o = toWyssenAvalancheObservation({ ...filled, externalId: "" });
    expect(() => genericObservationWithIdSchema.parse(o)).toThrow();
  });

  test("rejects a payload without valid triggerDateTime", () => {
    const o = toWyssenAvalancheObservation({ ...filled, triggerDateTime: "" });
    expect(() => genericObservationWithIdSchema.parse(o)).toThrow();
  });
});
