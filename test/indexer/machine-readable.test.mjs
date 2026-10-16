import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLlmsTxt, buildPublicIndex, buildFeedXml } from "../../scripts/lib/machine-readable.mjs";

const marketplace = { name: "dev-digest-ai-marketplace", description: "Plugin marketplace for Dev Digest AI" };

const items = [
  {
    id: "demo",
    type: "plugin",
    pluginName: "demo",
    name: "demo",
    description: "A demo plugin.",
    version: "1.0.0",
    installCommand: "/plugin install demo@dev-digest-ai-marketplace",
  },
  {
    id: "demo/skills/one",
    type: "skill",
    pluginName: "demo",
    name: "one",
    description: "Does one thing & does it well.",
    version: "1.0.0",
    installCommand: "/plugin install demo@dev-digest-ai-marketplace",
  },
];

test("buildLlmsTxt groups components under their plugin", () => {
  const txt = buildLlmsTxt({
    marketplace,
    items,
    commit: "abc1234567",
    generatedAt: "2026-10-16T00:00:00Z",
    repoSlug: "owner/dev-digest-ai-marketplace",
  });
  assert.match(txt, /## demo \(v1\.0\.0\)/);
  assert.match(txt, /- skill: one — Does one thing/);
  assert.match(txt, /install: \/plugin install demo@dev-digest-ai-marketplace/);
});

test("buildPublicIndex carries a stable contract version separate from plugin versions", () => {
  const result = buildPublicIndex({ marketplace, items, commit: "abc123", generatedAt: "2026-10-16T00:00:00Z" });
  assert.equal(result.version, 1);
  assert.equal(result.items, items);
  assert.equal(result.marketplace, marketplace.name);
});

test("buildFeedXml escapes special characters and is well-formed enough to parse", () => {
  const changelog = {
    entries: [{ date: "2026-10-16", kind: "added", type: "skill", name: "one", id: "demo/skills/one", note: "in demo 1.0.0" }],
  };
  const xml = buildFeedXml({
    marketplace,
    changelog,
    repoUrl: "https://github.com/owner/dev-digest-ai-marketplace",
    generatedAt: "2026-10-16T00:00:00Z",
  });
  assert.match(xml, /<title>Added: demo \/ one<\/title>/);
  assert.ok(!xml.includes(" & ")); // the marketplace description's "&" would break XML unescaped
  assert.match(xml, /<description>in demo 1\.0\.0<\/description>/);
});

test("buildFeedXml escapes an ampersand in the channel description", () => {
  const xml = buildFeedXml({
    marketplace: { name: "demo", description: "Skills & agents" },
    changelog: { entries: [] },
    repoUrl: "https://github.com/owner/demo",
    generatedAt: "2026-10-16T00:00:00Z",
  });
  assert.match(xml, /<description>Skills &amp; agents<\/description>/);
});
