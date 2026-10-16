import { test, before } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

let el, renderCard, renderCards, badgeFor;

before(async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  globalThis.document = dom.window.document;
  ({ el, renderCard, renderCards, badgeFor } = await import("../../site/js/cards.js"));
});

const baseItem = {
  id: "demo",
  type: "plugin",
  pluginName: "demo",
  name: "demo",
  description: "A demo plugin.",
  tags: ["a", "b"],
  version: "1.0.0",
  validated: true,
  path: "plugins/demo/.claude-plugin/plugin.json",
  githubUrl: "https://github.com/owner/repo/blob/sha/plugins/demo/.claude-plugin/plugin.json",
};

const baseCtx = { favorites: new Set(), compare: [], compareMax: 3, copiedId: "" };

test("el() builds an element with class, text and attribute props", () => {
  const node = el("button", { class: "chip", "data-type": "all", text: "All" });
  assert.equal(node.tagName, "BUTTON");
  assert.equal(node.className, "chip");
  assert.equal(node.textContent, "All");
  assert.equal(node.getAttribute("data-type"), "all");
});

test("badgeFor reflects the validated flag", () => {
  assert.deepEqual(badgeFor({ validated: true }), { label: "Validated", cls: "badge" });
  assert.deepEqual(badgeFor({ validated: false }), { label: "Schema-only", cls: "badge schema" });
});

test("renderCard shows the permalink, name and install button", () => {
  const card = renderCard(baseItem, baseCtx);
  assert.equal(card.querySelector("h3").textContent, "demo");
  assert.equal(card.querySelector("a.perma").getAttribute("href"), baseItem.githubUrl);
  assert.equal(card.querySelector("[data-action='copy']").textContent, "Copy install");
});

test("renderCard marks the favorite star pressed when the item is favorited", () => {
  const card = renderCard(baseItem, { ...baseCtx, favorites: new Set(["demo"]) });
  assert.equal(card.querySelector("[data-action='fav']").getAttribute("aria-pressed"), "true");
});

test("renderCard disables the compare checkbox once compareMax is reached", () => {
  const card = renderCard(
    { ...baseItem, id: "other" },
    { ...baseCtx, compare: ["a", "b", "c"], compareMax: 3 },
  );
  assert.ok(card.querySelector("[data-action='compare']").disabled);
});

test("renderCards replaces the root's children with one card per item", () => {
  const root = document.createElement("div");
  renderCards(root, [baseItem, { ...baseItem, id: "demo-2", name: "demo-2" }], baseCtx);
  assert.equal(root.querySelectorAll(".card").length, 2);
});
