#!/usr/bin/env node
// `claude plugin validate` against every locally-sourced plugin. Complements
// scripts/validate-marketplace.mjs (structural lint, no CLI needed).

import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validatePlugin } from "./lib/validate.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, ".claude-plugin", "marketplace.json");

if (!existsSync(manifestPath)) {
  console.error(`✖ ${manifestPath} not found`);
  process.exit(1);
}

const marketplace = JSON.parse(readFileSync(manifestPath, "utf8"));
let failed = 0;

for (const entry of marketplace.plugins ?? []) {
  if (typeof entry.source !== "string") continue;
  const pluginDir = resolve(root, entry.source);
  const ok = validatePlugin(pluginDir);
  console.log(`${ok ? "✔" : "✖"} ${entry.name}`);
  if (!ok) failed += 1;
}

if (failed > 0) {
  console.error(`✖ ${failed} plugin(s) failed \`claude plugin validate\``);
  process.exit(1);
}
console.log("✔ all plugins validated");
