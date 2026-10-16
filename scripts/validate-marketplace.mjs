#!/usr/bin/env node
// Structural lint for this marketplace, no dependencies beyond Node core.
// Complements `claude plugin validate`, which may not be installed in CI.
//
// Usage: node scripts/validate-marketplace.mjs [--strict]

import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const strict = process.argv.includes("--strict");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, ".claude-plugin", "marketplace.json");

const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const RESERVED_NAMES = new Set([
  "claude-plugins-official", "claude-code-marketplace", "claude-code-plugins",
  "anthropic-marketplace", "anthropic-plugins", "agent-skills",
  "anthropic-agent-skills", "life-sciences", "knowledge-work-plugins",
  "claude-for-legal", "claude-for-financial-services",
  "financial-services-plugins", "first-party-plugins", "claude-tag-plugins",
  "claude-community", "claude-plugins-community", "healthcare",
  "anthropic-plugin-directory", "claude-plugin-directory",
  "inline", "builtin", "skills-dir", "synced", "claude-plugin-test",
  "npm", "pip", "uv", "cargo", "github", "gh",
]);

const KNOWN_SOURCE_TYPES = {
  github: ["repo"],
  url: ["url"],
  "git-subdir": ["url", "path"],
  npm: ["package"],
  archive: ["url"],
  command: ["command"],
};

function readJson(path, label) {
  if (!existsSync(path)) {
    err(`${label}: file not found at ${path}`);
    return null;
  }
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (e) {
    err(`${label}: could not read file (${e.message})`);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    err(`${label}: invalid JSON (${e.message})`);
    return null;
  }
}

function checkName(name, kind, path) {
  if (typeof name !== "string" || name.length === 0) {
    err(`${path}: "name" is required`);
    return;
  }
  if (name.includes(" ")) {
    err(`${path}: "name" cannot contain spaces — use kebab-case ("${name}")`);
  } else if (!NAME_RE.test(name) || name.includes("..")) {
    err(`${path}: "name" must match ${NAME_RE} and not contain ".." ("${name}")`);
  }
  if (kind === "marketplace" && RESERVED_NAMES.has(name)) {
    err(`${path}: "${name}" is a reserved marketplace name`);
  }
}

function checkSource(source, entryName, idx) {
  const path = `plugins[${idx}] ("${entryName}").source`;
  if (source === undefined) {
    err(`${path}: "source" is required`);
    return;
  }
  if (typeof source === "string") {
    if (!source.startsWith("./") && source !== ".") {
      err(`${path}: relative string source must start with "./" ("${source}")`);
      return;
    }
    if (source.includes("..")) {
      err(`${path}: relative source cannot contain ".." ("${source}")`);
      return;
    }
    const abs = join(root, source);
    if (!existsSync(abs) || !statSync(abs).isDirectory()) {
      err(`${path}: directory does not exist: ${source}`);
      return;
    }
    const pluginManifestPath = join(abs, ".claude-plugin", "plugin.json");
    if (!existsSync(pluginManifestPath)) {
      warn(`${path}: no .claude-plugin/plugin.json found at ${source} (ok if the plugin has none yet)`);
      return;
    }
    const manifest = readJson(pluginManifestPath, `${source}/.claude-plugin/plugin.json`);
    if (manifest && manifest.name && manifest.name !== entryName) {
      err(
        `${path}: entry name "${entryName}" does not match plugin.json name "${manifest.name}" — ` +
        `installing by the manifest name will fail`
      );
    }
    return;
  }
  if (typeof source === "object" && source !== null) {
    const type = source.source;
    if (!type || !(type in KNOWN_SOURCE_TYPES)) {
      err(`${path}: unknown source type "${type}" — expected one of ${Object.keys(KNOWN_SOURCE_TYPES).join(", ")}`);
      return;
    }
    for (const field of KNOWN_SOURCE_TYPES[type]) {
      if (!source[field]) {
        err(`${path}: "${type}" source is missing required field "${field}"`);
      }
    }
    if (type === "archive" && !source.sha256) {
      warn(`${path}: "archive" source has no "sha256" pin — downloads are unverified`);
    }
    return;
  }
  err(`${path}: "source" must be a string or an object`);
}

function checkRenames(renames, pluginNames) {
  if (renames === undefined) return;
  if (typeof renames !== "object" || renames === null || Array.isArray(renames)) {
    err(`renames: must be an object`);
    return;
  }
  for (const [from, to] of Object.entries(renames)) {
    if (to === null) continue;
    if (typeof to !== "string" || !(pluginNames.has(to) || to in renames)) {
      err(`renames.${from}: target "${to}" is not a current plugin name, a key in renames, or null`);
    }
  }
}

function main() {
  const mp = readJson(manifestPath, ".claude-plugin/marketplace.json");
  if (!mp) {
    report();
    process.exit(1);
  }

  checkName(mp.name, "marketplace", "marketplace.json.name");

  if (!mp.owner || typeof mp.owner !== "object") {
    err("marketplace.json.owner: is required and must be an object");
  } else if (!mp.owner.name) {
    err("marketplace.json.owner.name: is required");
  }

  if (!mp.description) {
    warn("marketplace.json.description: missing — helps users understand what this marketplace offers");
  }

  if (!Array.isArray(mp.plugins)) {
    err("marketplace.json.plugins: is required and must be an array");
  } else {
    if (mp.plugins.length === 0) {
      warn("marketplace.json.plugins: marketplace has no plugins defined");
    }
    const seen = new Set();
    for (const [idx, entry] of mp.plugins.entries()) {
      if (!entry || typeof entry !== "object") {
        err(`plugins[${idx}]: must be an object`);
        continue;
      }
      checkName(entry.name, "plugin", `plugins[${idx}].name`);
      if (entry.name) {
        if (seen.has(entry.name)) {
          err(`plugins[${idx}]: duplicate plugin name "${entry.name}"`);
        }
        seen.add(entry.name);
      }
      checkSource(entry.source, entry.name ?? `#${idx}`, idx);
    }
    checkRenames(mp.renames, seen);
  }

  report();
  process.exit(errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0);
}

function report() {
  for (const w of warnings) console.warn(`⚠ warning: ${w}`);
  for (const e of errors) console.error(`✖ error: ${e}`);
  if (errors.length === 0) {
    console.log(
      warnings.length > 0
        ? `✔ validation passed with ${warnings.length} warning(s)`
        : "✔ validation passed"
    );
  } else {
    console.error(`✖ validation failed: ${errors.length} error(s), ${warnings.length} warning(s)`);
  }
}

main();
