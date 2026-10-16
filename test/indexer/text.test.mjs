import { test } from "node:test";
import assert from "node:assert/strict";
import { truncate } from "../../scripts/lib/text.mjs";

test("truncate leaves short text untouched", () => {
  assert.equal(truncate("short description", 200), "short description");
});

test("truncate collapses internal whitespace", () => {
  assert.equal(truncate("has   extra\n\nwhitespace", 200), "has extra whitespace");
});

test("truncate cuts long text at a word boundary with an ellipsis", () => {
  const long = "word ".repeat(60).trim(); // 299 chars
  const result = truncate(long, 50);
  assert.ok(result.length <= 51); // 50 + the ellipsis char
  assert.ok(result.endsWith("…"));
  assert.ok(!result.slice(0, -1).endsWith(" ")); // no trailing space before the ellipsis
});

test("truncate never cuts mid-word", () => {
  const result = truncate("abcdefghij abcdefghij abcdefghij", 15);
  assert.equal(result, "abcdefghij…");
});
