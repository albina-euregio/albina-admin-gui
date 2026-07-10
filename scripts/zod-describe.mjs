#!/usr/bin/env node
// Post-processes the generated Zod schemas to use `.describe("...")` instead of
// `.register(z.globalRegistry, { description: "..." })`.
//
// hey-api's Zod 4 target only emits descriptions via the `register`/globalRegistry
// metadata API (`metadata: true` in openapi-ts.config.ts); it has no option to use
// the shorter `.describe()` shorthand while staying on Zod 4. This rewrites those
// calls after generation. Run automatically by the `openapi` npm script.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const file = resolve(root, "src/app/providers/albina-api/zod.gen.ts");

const source = readFileSync(file, "utf8");
// Matches `.register(z.globalRegistry, { description: <string literal> })`, both the
// inline and pretty-printed multi-line forms. The metadata object only ever holds
// `description`, so it is safe to collapse the whole call to `.describe(<string>)`.
const pattern = /\.register\(z\.globalRegistry,\s*\{\s*description:\s*("(?:[^"\\]|\\.)*")\s*,?\s*\}\)/gs;

let count = 0;
const output = source.replace(pattern, (_match, description) => {
  count++;
  return `.describe(${description})`;
});

writeFileSync(file, output);
console.log(`zod-describe: rewrote ${count} .register() call(s) to .describe()`);
