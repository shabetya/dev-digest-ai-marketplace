import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { discoverPluginComponents } from "../../scripts/lib/discover.mjs";

function makePlugin() {
  const repoRoot = mkdtempSync(join(tmpdir(), "marketplace-discover-"));
  const pluginDir = join(repoRoot, "plugins", "demo-plugin");

  mkdirSync(join(pluginDir, "skills", "one-skill"), { recursive: true });
  writeFileSync(
    join(pluginDir, "skills", "one-skill", "SKILL.md"),
    `---\nname: one-skill\ndescription: "Does one thing."\n---\nbody`,
  );

  mkdirSync(join(pluginDir, "agents"), { recursive: true });
  writeFileSync(
    join(pluginDir, "agents", "helper.md"),
    `---\nname: helper\ndescription: "Helps out."\n---\nbody`,
  );

  mkdirSync(join(pluginDir, "commands", "nested"), { recursive: true });
  writeFileSync(
    join(pluginDir, "commands", "nested", "do-thing.md"),
    `---\nname: do-thing\ndescription: "Does the thing."\n---\nbody`,
  );

  return { repoRoot, pluginDir };
}

test("discovers skills, agents and nested commands with correct ids/paths", () => {
  const { repoRoot, pluginDir } = makePlugin();
  try {
    const components = discoverPluginComponents(repoRoot, pluginDir, "demo-plugin");
    const bySlug = Object.fromEntries(components.map((c) => [c.slug, c]));

    assert.equal(components.length, 3);

    assert.equal(bySlug["one-skill"].type, "skill");
    assert.equal(bySlug["one-skill"].name, "one-skill");
    assert.equal(bySlug["one-skill"].description, "Does one thing.");
    assert.equal(bySlug["one-skill"].path, "plugins/demo-plugin/skills/one-skill/SKILL.md");

    assert.equal(bySlug["helper"].type, "agent");
    assert.equal(bySlug["helper"].path, "plugins/demo-plugin/agents/helper.md");

    assert.equal(bySlug["nested/do-thing"].type, "command");
    assert.equal(bySlug["nested/do-thing"].path, "plugins/demo-plugin/commands/nested/do-thing.md");
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("falls back to the slug as name when frontmatter has none", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "marketplace-discover-"));
  const pluginDir = join(repoRoot, "plugins", "demo-plugin");
  mkdirSync(join(pluginDir, "agents"), { recursive: true });
  writeFileSync(join(pluginDir, "agents", "nameless.md"), `---\ndescription: "No name field."\n---\n`);
  try {
    const [component] = discoverPluginComponents(repoRoot, pluginDir, "demo-plugin");
    assert.equal(component.name, "nameless");
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("returns nothing for a plugin with no component directories", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "marketplace-discover-"));
  const pluginDir = join(repoRoot, "plugins", "bare-plugin");
  mkdirSync(pluginDir, { recursive: true });
  try {
    assert.deepEqual(discoverPluginComponents(repoRoot, pluginDir, "bare-plugin"), []);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
