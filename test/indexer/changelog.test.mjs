import { test } from "node:test";
import assert from "node:assert/strict";
import { buildChangelog } from "../../scripts/lib/changelog.mjs";

const PLUGIN_PATH = "plugins/demo/.claude-plugin/plugin.json";
const SKILL_PATH = "plugins/demo/skills/one/SKILL.md";

function fakeGit({ pluginHistory, pluginVersionsBySha, skillHistory, everAdded = [], deletedAt = {} }) {
  return {
    logForPath(path) {
      if (path === PLUGIN_PATH) return pluginHistory;
      if (path === SKILL_PATH) return skillHistory;
      return [];
    },
    showAtCommit(sha, path) {
      if (path !== PLUGIN_PATH) return null;
      const version = pluginVersionsBySha[sha];
      return version ? JSON.stringify({ version }) : null;
    },
    everyPluginManifestPathEverAdded: () => everAdded,
    deletionDate: (path) => deletedAt[path] ?? null,
  };
}

const items = [
  { id: "demo", type: "plugin", pluginName: "demo", name: "demo", path: PLUGIN_PATH, version: "1.1.0" },
  {
    id: "demo/skills/one",
    type: "skill",
    pluginName: "demo",
    name: "one",
    path: SKILL_PATH,
    version: "1.1.0",
  },
];

test("emits an 'added' entry for each item at its earliest commit", () => {
  const git = fakeGit({
    pluginHistory: [{ sha: "a1", date: "2026-10-01T00:00:00Z" }],
    pluginVersionsBySha: { a1: "1.0.0" },
    skillHistory: [{ sha: "a1", date: "2026-10-01T00:00:00Z" }],
  });
  const { entries } = buildChangelog({ items, git });
  const added = entries.filter((e) => e.kind === "added");
  assert.equal(added.length, 2);

  const pluginAdded = added.find((e) => e.id === "demo");
  assert.equal(pluginAdded.date, "2026-10-01");
  assert.equal(pluginAdded.note, undefined);

  const skillAdded = added.find((e) => e.id === "demo/skills/one");
  assert.equal(skillAdded.note, "in demo 1.1.0");
});

test("emits an 'updated' entry per version bump, skipping no-op rewrites", () => {
  const git = fakeGit({
    pluginHistory: [
      { sha: "a1", date: "2026-10-01T00:00:00Z" },
      { sha: "a2", date: "2026-10-05T00:00:00Z" },
      { sha: "a3", date: "2026-10-10T00:00:00Z" },
    ],
    pluginVersionsBySha: { a1: "1.0.0", a2: "1.0.0", a3: "1.1.0" },
    skillHistory: [],
  });
  const { entries } = buildChangelog({ items, git });
  const updated = entries.filter((e) => e.kind === "updated");
  assert.equal(updated.length, 1);
  assert.equal(updated[0].note, "1.0.0 to 1.1.0");
  assert.equal(updated[0].date, "2026-10-10");
});

test("emits a 'removed' entry for a plugin that no longer exists", () => {
  const git = fakeGit({
    pluginHistory: [{ sha: "a1", date: "2026-10-01T00:00:00Z" }],
    pluginVersionsBySha: { a1: "1.0.0" },
    skillHistory: [],
    everAdded: [PLUGIN_PATH, "plugins/gone/.claude-plugin/plugin.json"],
    deletedAt: { "plugins/gone/.claude-plugin/plugin.json": "2026-10-12T00:00:00Z" },
  });
  const { entries } = buildChangelog({ items, git });
  const removed = entries.filter((e) => e.kind === "removed");
  assert.equal(removed.length, 1);
  assert.equal(removed[0].id, "gone");
  assert.equal(removed[0].note, "no longer in the catalog");
});

test("sorts entries newest first", () => {
  const git = fakeGit({
    pluginHistory: [
      { sha: "a1", date: "2026-10-01T00:00:00Z" },
      { sha: "a2", date: "2026-10-10T00:00:00Z" },
    ],
    pluginVersionsBySha: { a1: "1.0.0", a2: "1.1.0" },
    skillHistory: [{ sha: "a1", date: "2026-10-01T00:00:00Z" }],
  });
  const { entries } = buildChangelog({ items, git });
  const dates = entries.map((e) => e.date);
  const sorted = [...dates].sort().reverse();
  assert.deepEqual(dates, sorted);
});
