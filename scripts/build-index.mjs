#!/usr/bin/env node
// Builds site/data/*.json (the search index Fuse.js loads in the browser)
// and site/{llms.txt,index.json,feed.xml} (machine-readable outputs) from
// plugins/** and .claude-plugin/marketplace.json. Pure read of the repo on
// disk plus `git log`/`claude plugin validate` — never writes back into
// plugins/**. See SPEC.md §8.1 for the schema this must produce.

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { discoverPluginComponents, toRepoPath } from "./lib/discover.mjs";
import { validatePlugin } from "./lib/validate.mjs";
import { truncate } from "./lib/text.mjs";
import { buildChangelog } from "./lib/changelog.mjs";
import { buildLlmsTxt, buildPublicIndex, buildFeedXml } from "./lib/machine-readable.mjs";
import * as git from "./lib/git.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, ".claude-plugin", "marketplace.json");
const siteDir = join(root, "site");
const dataDir = join(siteDir, "data");

function fail(message) {
  console.error(`✖ build-index: ${message}`);
  process.exit(1);
}

function readJson(path, label) {
  if (!existsSync(path)) fail(`${label}: not found at ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`${label}: invalid JSON (${e.message})`);
  }
}

function dedupeSorted(values) {
  return [...new Set(values.map((v) => v.toLowerCase()))].sort();
}

function githubUrlFor(owner, repo, sha, path) {
  return `https://github.com/${owner}/${repo}/blob/${sha}/${path}`;
}

function buildItems(marketplace, { owner, repo, sha }) {
  const items = [];

  for (const entry of marketplace.plugins) {
    if (typeof entry.source !== "string") {
      console.warn(`  skipping "${entry.name}": only local (string) sources are indexed`);
      continue;
    }
    const pluginDir = resolve(root, entry.source);
    const manifestFile = join(pluginDir, ".claude-plugin", "plugin.json");
    const pluginJson = readJson(manifestFile, `plugins/${entry.name}/.claude-plugin/plugin.json`);

    if (!pluginJson.name || !pluginJson.description) {
      fail(`${manifestFile}: "name" and "description" are required`);
    }
    if (pluginJson.name !== entry.name) {
      fail(
        `${manifestFile}: plugin.json name "${pluginJson.name}" does not match marketplace entry "${entry.name}"`,
      );
    }

    const validated = validatePlugin(pluginDir);
    const pluginTags = dedupeSorted([entry.category, ...(entry.tags ?? [])].filter(Boolean));
    const installCommand = `/plugin install ${entry.name}@${marketplace.name}`;
    const version = pluginJson.version ?? "0.0.0";
    const manifestRepoPath = toRepoPath(root, manifestFile);

    items.push({
      id: entry.name,
      type: "plugin",
      pluginName: entry.name,
      name: entry.name,
      description: truncate(entry.description || pluginJson.description),
      tags: pluginTags,
      path: manifestRepoPath,
      githubUrl: githubUrlFor(owner, repo, sha, manifestRepoPath),
      version,
      validated,
      installCommand,
    });

    for (const component of discoverPluginComponents(root, pluginDir, entry.name)) {
      items.push({
        id: `${entry.name}/${component.type}s/${component.slug}`,
        type: component.type,
        pluginName: entry.name,
        name: component.name,
        description: truncate(component.description),
        tags: dedupeSorted([...pluginTags, ...component.extraTags]),
        path: component.path,
        githubUrl: githubUrlFor(owner, repo, sha, component.path),
        version,
        validated,
        installCommand,
      });
    }
  }

  return items;
}

function buildStats(items, sha, generatedAt) {
  const counts = { plugin: 0, skill: 0, command: 0, agent: 0 };
  for (const item of items) counts[item.type] = (counts[item.type] ?? 0) + 1;
  return { commit: sha, generatedAt, counts };
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function vendorFuse() {
  const src = resolve(root, "node_modules/fuse.js/dist/fuse.min.js");
  const dest = join(siteDir, "js", "vendor", "fuse.min.js");
  if (!existsSync(src)) {
    console.warn("  fuse.js not found in node_modules — run `npm install` first. Skipping vendoring.");
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

function main() {
  console.log("Building marketplace search index…");
  const marketplace = readJson(manifestPath, ".claude-plugin/marketplace.json");
  const sha = git.getHeadSha();
  const { owner, repo } = git.getRepoInfo(marketplace.name);
  const generatedAt = new Date().toISOString();

  const items = buildItems(marketplace, { owner, repo, sha });

  const stats = buildStats(items, sha, generatedAt);
  const changelog = buildChangelog({ items, git });

  writeJson(join(dataDir, "search-index.json"), items);
  writeJson(join(dataDir, "stats.json"), stats);
  writeJson(join(dataDir, "changelog.json"), changelog);

  const repoSlug = `${owner}/${repo}`;
  const repoUrl = `https://github.com/${repoSlug}`;
  writeFileSync(
    join(siteDir, "llms.txt"),
    buildLlmsTxt({ marketplace, items, commit: sha, generatedAt, repoSlug }),
  );
  writeJson(join(siteDir, "index.json"), buildPublicIndex({ marketplace, items, commit: sha, generatedAt }));
  writeFileSync(join(siteDir, "feed.xml"), buildFeedXml({ marketplace, changelog, repoUrl, generatedAt }));

  vendorFuse();

  console.log(
    `✔ ${stats.counts.plugin} plugins, ${stats.counts.skill} skills, ${stats.counts.command} commands, ${stats.counts.agent} agents — commit ${sha.slice(0, 7)}`,
  );
}

main();
