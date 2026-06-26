#!/usr/bin/env node
// Selects which runtime environment is served locally by copying
// `src/assets/env.<name>.js` to `src/assets/env.js` (loaded by index.html).
// `env.js` itself is gitignored; the `env.<name>.js` snippets are the source.
//
// Usage: node scripts/use-env.mjs <name>   (e.g. local, dev, beta, aran)
import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const name = process.argv[2];
if (!name) {
  console.error("usage: node scripts/use-env.mjs <name>");
  process.exit(1);
}

const assets = resolve(dirname(fileURLToPath(import.meta.url)), "../src/assets");
const source = resolve(assets, `env.${name}.js`);
const target = resolve(assets, "env.js");

if (!existsSync(source)) {
  console.error(`environment snippet not found: ${source}`);
  process.exit(1);
}

copyFileSync(source, target);
console.log(`using environment "${name}" (copied env.${name}.js -> env.js)`);
