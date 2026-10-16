// Shared helpers for release-plugin.mjs and rollback-plugin.mjs.
// No dependencies beyond Node core.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function pluginDir(name) {
  return join(ROOT, "plugins", name);
}

export function pluginManifestPath(name) {
  return join(pluginDir(name), ".claude-plugin", "plugin.json");
}

export function marketplaceManifestPath() {
  return join(ROOT, ".claude-plugin", "marketplace.json");
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

export function requirePluginExists(name) {
  if (!existsSync(pluginDir(name))) {
    fail(`plugins/${name} does not exist`);
  }
  if (!existsSync(pluginManifestPath(name))) {
    fail(`plugins/${name}/.claude-plugin/plugin.json does not exist`);
  }
}

export function findMarketplaceEntry(name) {
  const mp = readJson(marketplaceManifestPath());
  return (mp.plugins || []).find((p) => p.name === name) ?? null;
}

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseSemver(str) {
  const m = SEMVER_RE.exec(String(str ?? ""));
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

export function formatSemver(v) {
  return `${v.major}.${v.minor}.${v.patch}`;
}

export function compareSemver(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

/** bump: "patch" | "minor" | "major" | an explicit "X.Y.Z" string */
export function nextVersion(current, bump) {
  const base = parseSemver(current) ?? { major: 0, minor: 0, patch: 0 };
  if (bump === "patch") return formatSemver({ ...base, patch: base.patch + 1 });
  if (bump === "minor") return formatSemver({ ...base, minor: base.minor + 1, patch: 0 });
  if (bump === "major") return formatSemver({ major: base.major + 1, minor: 0, patch: 0 });
  const explicit = parseSemver(bump);
  if (!explicit) fail(`"${bump}" is not "patch", "minor", "major", or a valid X.Y.Z version`);
  return formatSemver(explicit);
}

export function releaseTag(pluginName, version) {
  return `${pluginName}--v${version}`;
}

export function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

// Like git(), but never lets the child's stderr reach the terminal — for
// checks where a non-zero exit (e.g. "tag not found") is an expected,
// normal outcome, not a failure to report.
export function gitSilent(args) {
  try {
    const out = execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: e.stdout?.toString?.().trim() ?? "", error: e };
  }
}

export function tagExists(tag) {
  return gitSilent(["rev-parse", "--verify", `refs/tags/${tag}`]).ok;
}

export function runValidator() {
  try {
    execFileSync("node", [join(ROOT, "scripts", "validate-marketplace.mjs")], {
      cwd: ROOT,
      stdio: "inherit",
    });
    return true;
  } catch {
    return false;
  }
}

export function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

export function log(message) {
  console.log(message);
}
