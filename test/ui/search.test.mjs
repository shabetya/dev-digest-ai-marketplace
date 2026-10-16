import { test } from "node:test";
import assert from "node:assert/strict";
import Fuse from "fuse.js";
import { createSearch, readUrlState, writeUrlState, TYPES } from "../../site/js/search.js";

const items = [
  { id: "code-review", type: "plugin", pluginName: "code-review", name: "code-review", description: "Multi-pass PR review.", tags: ["git", "review"] },
  { id: "code-review/skills/review-diff", type: "skill", pluginName: "code-review", name: "review-diff", description: "Flags risky changes.", tags: ["git", "review"] },
  { id: "test-writer", type: "plugin", pluginName: "test-writer", name: "test-writer", description: "Generates tests.", tags: ["testing"] },
];

test("TYPES lists all four catalog types", () => {
  assert.deepEqual(TYPES, ["plugin", "skill", "command", "agent"]);
});

test("empty query returns the whole catalog with per-type counts", () => {
  const search = createSearch(items, Fuse);
  const { results, counts } = search.run({ q: "", type: "all", tag: "" });
  assert.equal(results.length, 3);
  assert.equal(counts.all, 3);
  assert.equal(counts.plugin, 2);
  assert.equal(counts.skill, 1);
});

test("a keyword query matches by name", () => {
  const search = createSearch(items, Fuse);
  const { results } = search.run({ q: "review-diff", type: "all", tag: "" });
  assert.ok(results.some((r) => r.id === "code-review/skills/review-diff"));
});

test("type filter narrows results independently of the query", () => {
  const search = createSearch(items, Fuse);
  const { results } = search.run({ q: "", type: "plugin", tag: "" });
  assert.deepEqual(results.map((r) => r.id).sort(), ["code-review", "test-writer"]);
});

test("tag filter narrows within the queried/typed results", () => {
  const search = createSearch(items, Fuse);
  const { results } = search.run({ q: "", type: "all", tag: "testing" });
  assert.deepEqual(results.map((r) => r.id), ["test-writer"]);
});

test("allTags is the deduplicated, sorted union of every item's tags", () => {
  const search = createSearch(items, Fuse);
  assert.deepEqual(search.allTags, ["git", "review", "testing"]);
});

test("readUrlState parses q/type/tag and rejects an unknown type", () => {
  assert.deepEqual(readUrlState("?q=review&type=skill&tag=git"), { q: "review", type: "skill", tag: "git" });
  assert.deepEqual(readUrlState("?type=not-a-type"), { q: "", type: "all", tag: "" });
  assert.deepEqual(readUrlState(""), { q: "", type: "all", tag: "" });
});

test("writeUrlState round-trips through readUrlState and omits default values", () => {
  const calls = [];
  const history = { replaceState: (...args) => calls.push(args) };
  const location = { pathname: "/", hash: "" };

  const qs = writeUrlState({ q: "review", type: "all", tag: "" }, history, location);
  assert.equal(qs, "?q=review");
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], [null, "", "/?q=review"]);

  assert.deepEqual(readUrlState(qs), { q: "review", type: "all", tag: "" });
});

test("writeUrlState produces no query string when every value is the default", () => {
  const history = { replaceState: () => {} };
  const qs = writeUrlState({ q: "", type: "all", tag: "" }, history, { pathname: "/", hash: "" });
  assert.equal(qs, "");
});
