import { test, expect } from "@playwright/test";

import { parseLatLng, parseLeitstelleTirol } from "../src/app/shared/leitstelle-tirol";

test("parses a semicolon-separated dispatch report", () => {
  const content =
    "Einsatznummer: 26182454;Einsatzcode: ALP-LAW-NEG;Einsatztext: Bergnotfall Lawine ohne Schäden; " +
    ";Einsatzort: 6290 Mayrhofen ; Zillertaler Alpen; Geoobjekt Wollbachspitze;Zusatzinfo: richtung Zillergrund; " +
    ";Koordinaten: WGS84 N47°3.10 E11°58.78; ;Info zum Einsatz: ;- heute Negativlawine ausgelöst, kein Notstand;" +
    "Bergnotfall, sonstiger Bergnotfall, Lawinenabgang ohne Personen und Sachschäden;;beschickte Einsatzmittel: ;" +
    "Funkrufname:;Info Lawine NEG;;";
  expect(parseLeitstelleTirol(content)).toEqual({
    isDispatchReport: true,
    code: "ALP-LAW-NEG",
    locationName: "6290 Mayrhofen",
    latLng: { lat: 47.05166666666667, lng: 11.979666666666667 },
  });
});

test("parses a newline-separated dispatch report", () => {
  const content = [
    "Einsatznummer: 2026/012345",
    "Einsatzcode: ALP-LAW-GROSS",
    "Einsatzort:",
    "\tGemeinde\tNeustift im Stubaital",
    "\tKoordinaten: WGS84 47.089, 11.312",
    "beschickte Einsatzmittel:",
    "\tBergrettung Neustift",
  ].join("\n");
  expect(parseLeitstelleTirol(content)).toEqual({
    isDispatchReport: true,
    code: "ALP-LAW-GROSS",
    locationName: "Neustift im Stubaital",
    latLng: { lat: 47.089, lng: 11.312 },
  });
});

test("ignores unrelated text", () => {
  expect(parseLeitstelleTirol("Kleines Schneebrett unterhalb des Gipfels.")).toEqual({
    isDispatchReport: false,
    code: "",
  });
});

test("parses coordinates in the notations used by the dispatch centre", () => {
  expect(parseLatLng("47.089, 11.312")).toEqual({ lat: 47.089, lng: 11.312 });
  expect(parseLatLng("47.089 11.312")).toEqual({ lat: 47.089, lng: 11.312 });
  expect(parseLatLng("S47.1 W11.2")).toEqual({ lat: -47.1, lng: -11.2 });
  // degrees and decimal minutes, longitude first
  expect(parseLatLng("E11°58.78 N47°3.10")).toEqual(parseLatLng("N47°3.10 E11°58.78"));
  // degrees, minutes and seconds
  expect(parseLatLng(`47°3'6"N 11°58'46"E`)).toEqual({ lat: 47.05166666666666, lng: 11.979444444444445 });
  expect(parseLatLng("nonsense")).toBeUndefined();
});
