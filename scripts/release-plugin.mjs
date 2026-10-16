#!/usr/bin/env node
// Release a new version of one plugin: bump plugin.json's version, validate,
// commit, and tag `<plugin>--v<version>` per docs/RELEASES.md.
//
// Usage:
//   node scripts/release-plugin.mjs <plugin-name> <patch|minor|major|X.Y.Z>
//   node scripts/release-plugin.mjs <plugin-name> <bump> --no-commit --no-tag
//
// Does not push. Prints the push command to run yourself.

import { relative } from "node:path";
import {
  ROOT,
  requirePluginExists,
  pluginManifestPath,
  readJson,
  writeJson,
  findMarketplaceEntry,
  nextVersion,
  releaseTag,
  tagExists,
  runValidator,
  git,
  gitSilent,
  fail,
  log,
} from "./lib/plugin-release.mjs";

function parseArgs(argv) {
  const positional = argv.filter((a) => !a.startsWith("--"));
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const [name, bump] = positional;
  if (!name || !bump) {
    console.error(
      "Usage: node scripts/release-plugin.mjs <plugin-name> <patch|minor|major|X.Y.Z> [--no-commit] [--no-tag]"
    );
    process.exit(2);
  }
  return { name, bump, commit: !flags.has("--no-commit"), tag: !flags.has("--no-tag") };
}

function main() {
  const { name, bump, commit, tag: shouldTag } = parseArgs(process.argv.slice(2));

  requirePluginExists(name);

  const manifestPath = pluginManifestPath(name);
  const manifest = readJson(manifestPath);
  const currentVersion = manifest.version ?? "0.0.0";
  const version = nextVersion(currentVersion, bump);

  if (version === currentVersion) {
    fail(`new version "${version}" is the same as the current version`);
  }

  const entry = findMarketplaceEntry(name);
  if (!entry) {
    fail(`no entry named "${name}" found in .claude-plugin/marketplace.json`);
  }
  if (entry.version) {
    log(
      `⚠ marketplace.json's entry for "${name}" also sets "version": "${entry.version}". ` +
        `plugin.json wins at install time, but this is confusing — consider removing the ` +
        `entry's "version" field.`
    );
  }

  const tag = releaseTag(name, version);
  if (shouldTag && tagExists(tag)) {
    fail(`tag "${tag}" already exists — pick a different version`);
  }

  const relManifestPath = relative(ROOT, manifestPath);

  manifest.version = version;
  writeJson(manifestPath, manifest);
  log(`Updated ${relManifestPath} → version ${version}`);

  log("Validating...");
  if (!runValidator()) {
    fail("validation failed — fix the errors above, then re-run this script");
  }

  if (commit) {
    git(["add", relManifestPath]);
    const status = gitSilent(["diff", "--cached", "--quiet"]);
    if (status.ok) {
      log("Nothing to commit (plugin.json already matched this version).");
    } else {
      git(["commit", "-m", `release(${name}): v${version}`]);
      log(`Committed: release(${name}): v${version}`);
    }
  }

  if (shouldTag) {
    const tagTarget = commit ? "HEAD" : gitSilent(["rev-parse", "HEAD"]).out;
    git(["tag", "-a", tag, tagTarget, "-m", `${name} v${version}`]);
    log(`Tagged: ${tag}`);
  }

  log("");
  log("Next steps:");
  log(`  git push origin HEAD --follow-tags`);
  log(`  # or, if you skipped tagging here: git push origin HEAD && git push origin ${tag}`);
}

main();
