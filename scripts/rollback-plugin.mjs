#!/usr/bin/env node
// Roll a plugin back to a previously released version, published as a new
// ("fix forward") release so normal update flows pick it up — see
// docs/RELEASES.md#rollback. This never force-pushes over an existing tag.
//
// Usage:
//   node scripts/rollback-plugin.mjs <plugin-name> <X.Y.Z|tag>
//   node scripts/rollback-plugin.mjs <plugin-name> <X.Y.Z> --release-as <X.Y.Z>
//   node scripts/rollback-plugin.mjs <plugin-name> <X.Y.Z> --no-commit --no-tag
//
// Does not push. Prints the push command to run yourself.

import { relative } from "node:path";
import {
  ROOT,
  requirePluginExists,
  pluginDir,
  pluginManifestPath,
  readJson,
  writeJson,
  parseSemver,
  compareSemver,
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
  const positional = [];
  const opts = { commit: true, tag: true, releaseAs: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-commit") opts.commit = false;
    else if (a === "--no-tag") opts.tag = false;
    else if (a === "--release-as") opts.releaseAs = argv[++i];
    else positional.push(a);
  }
  const [name, target] = positional;
  if (!name || !target) {
    console.error(
      "Usage: node scripts/rollback-plugin.mjs <plugin-name> <X.Y.Z|tag> [--release-as X.Y.Z] [--no-commit] [--no-tag]"
    );
    process.exit(2);
  }
  return { name, target, ...opts };
}

function resolveTag(name, target) {
  if (parseSemver(target)) return releaseTag(name, target);
  return target;
}

function main() {
  const { name, target, commit, tag: shouldTag, releaseAs } = parseArgs(process.argv.slice(2));

  requirePluginExists(name);

  const sourceTag = resolveTag(name, target);
  if (!tagExists(sourceTag)) {
    const available = gitSilent(["tag", "-l", releaseTag(name, "*")]);
    fail(
      `tag "${sourceTag}" does not exist.\nAvailable releases for "${name}":\n` +
        (available.ok && available.out ? available.out : "  (none found)")
    );
  }

  const manifestPath = pluginManifestPath(name);
  const relManifestPath = relative(ROOT, manifestPath);
  const relPluginDir = relative(ROOT, pluginDir(name));

  const liveManifest = readJson(manifestPath);
  const liveVersion = liveManifest.version ?? "0.0.0";

  const targetSemver = parseSemver(target);
  if (targetSemver) {
    const liveSemver = parseSemver(liveVersion);
    if (liveSemver && compareSemver(targetSemver, liveSemver) >= 0) {
      log(
        `⚠ target version ${target} is not older than the current version ${liveVersion} — ` +
          `this isn't really a rollback, proceeding anyway.`
      );
    }
  }

  log(`Restoring plugins/${name} from ${sourceTag}...`);
  git(["checkout", sourceTag, "--", relPluginDir]);

  const restoredManifest = readJson(manifestPath);
  const releaseVersion = releaseAs ?? nextVersion(liveVersion, "patch");

  const newTag = releaseTag(name, releaseVersion);
  if (shouldTag && tagExists(newTag)) {
    fail(`tag "${newTag}" already exists — pass --release-as with a different version`);
  }

  restoredManifest.version = releaseVersion;
  writeJson(manifestPath, restoredManifest);
  log(`Set ${relManifestPath} → version ${releaseVersion} (content restored from ${sourceTag})`);

  log("Validating...");
  if (!runValidator()) {
    fail("validation failed — fix the errors above, then re-run or finish manually");
  }

  if (commit) {
    git(["add", relPluginDir]);
    const status = gitSilent(["diff", "--cached", "--quiet"]);
    if (status.ok) {
      log("Nothing to commit (working tree already matched the restored content).");
    } else {
      git(["commit", "-m", `rollback(${name}): restore ${sourceTag} as v${releaseVersion}`]);
      log(`Committed: rollback(${name}): restore ${sourceTag} as v${releaseVersion}`);
    }
  }

  if (shouldTag) {
    const tagTarget = commit ? "HEAD" : gitSilent(["rev-parse", "HEAD"]).out;
    git(["tag", "-a", newTag, tagTarget, "-m", `${name} v${releaseVersion} (rollback to ${sourceTag})`]);
    log(`Tagged: ${newTag}`);
  }

  log("");
  log(`${sourceTag} was left untouched — never delete or move a published tag.`);
  log("Next steps:");
  log(`  git push origin HEAD --follow-tags`);
}

main();
