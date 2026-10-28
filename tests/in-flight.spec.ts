import { expect, test } from "@playwright/test";
import { Subject } from "rxjs";

import { InFlight } from "../src/app/modelling/in-flight";

const ignore = () => undefined;

/** A request whose answers the test hands out by url, counting how often each url was asked for. */
function answers() {
  const pending = new Map<string, Subject<unknown>>();
  const asked: string[] = [];
  const request = new InFlight((url) => {
    asked.push(url);
    pending.set(url, new Subject<unknown>());
    return pending.get(url);
  });
  return { request, asked, answer: (url: string, body: unknown) => pending.get(url).next(body), pending };
}

test("a url in flight is not asked again, and its answer is parsed and handed on once", () => {
  const { request, asked, answer } = answers();
  const got: number[] = [];
  request.load("a", Number, (value) => got.push(value), ignore);
  expect(request.loads("a")).toBe(true);
  request.load("a", Number, (value) => got.push(value), ignore);
  expect(asked).toEqual(["a"]);
  answer("a", "7");
  expect(got).toEqual([7]);
  expect(request.loads("a")).toBe(false);
});

test("another url cancels the one in flight, and cancel stops the last one", () => {
  const { request, asked, answer } = answers();
  const got: string[] = [];
  request.load("a", String, (value) => got.push(value), ignore);
  request.load("b", String, (value) => got.push(value), ignore);
  answer("a", "late");
  expect(asked).toEqual(["a", "b"]);
  expect(got).toEqual([]);
  request.cancel();
  answer("b", "late");
  expect(got).toEqual([]);
  expect(request.loads("b")).toBe(false);
});

test("a failed url is forgotten, so asking for it again asks anew", () => {
  const { request, asked, pending } = answers();
  const failures: unknown[] = [];
  request.load("a", String, ignore, (err) => failures.push(err));
  pending.get("a").error("down");
  expect(failures).toEqual(["down"]);
  expect(request.loads("a")).toBe(false);
  request.load("a", String, ignore, (err) => failures.push(err));
  expect(asked).toEqual(["a", "a"]);
});
