import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFrontmatter } from "../../scripts/lib/frontmatter.mjs";

test("parses a quoted description", () => {
  const raw = `---\nname: react-best-practices\ndescription: "Covers hooks and state."\n---\n\nbody`;
  assert.deepEqual(parseFrontmatter(raw), {
    name: "react-best-practices",
    description: "Covers hooks and state.",
    tags: [],
  });
});

test("parses an unquoted description", () => {
  const raw = `---\nname: next-best-practices\ndescription: Next.js best practices - RSC, routing\nuser-invocable: false\n---\n`;
  const result = parseFrontmatter(raw);
  assert.equal(result.description, "Next.js best practices - RSC, routing");
});

test("ignores unrelated keys, including ones with embedded escaped quotes", () => {
  const raw = `---\nname: run-plan\ndescription: "Run a plan."\nargument-hint: "<path> [\\"extra\\"]"\n---\n`;
  const result = parseFrontmatter(raw);
  assert.equal(result.name, "run-plan");
  assert.equal(result.description, "Run a plan.");
});

test("parses metadata.tags as a comma-separated list", () => {
  const raw = `---\nname: fastify-best-practices\ndescription: "Guides Fastify."\nmetadata:\n  tags: fastify, nodejs, typescript\n---\n`;
  const result = parseFrontmatter(raw);
  assert.deepEqual(result.tags, ["fastify", "nodejs", "typescript"]);
});

test("returns nulls for content with no frontmatter block", () => {
  assert.deepEqual(parseFrontmatter("# just a heading\n\nbody"), {
    name: null,
    description: null,
    tags: [],
  });
});
