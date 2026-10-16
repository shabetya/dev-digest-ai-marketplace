import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFavorites, saveFavorites, toggleFavorite, FAVORITES_KEY } from "../../site/js/favorites.js";

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    _data: data,
  };
}

test("loadFavorites returns an empty set when storage is empty", () => {
  assert.deepEqual(loadFavorites(fakeStorage()), new Set());
});

test("saveFavorites then loadFavorites round-trips across a page reload", () => {
  const storage = fakeStorage();
  saveFavorites(storage, new Set(["b-plugin", "a-plugin"]));
  const reloaded = loadFavorites(storage);
  assert.deepEqual([...reloaded].sort(), ["a-plugin", "b-plugin"]);
});

test("loadFavorites recovers from corrupted JSON instead of throwing", () => {
  const storage = fakeStorage({ [FAVORITES_KEY]: "{not json" });
  assert.deepEqual(loadFavorites(storage), new Set());
});

test("loadFavorites ignores non-string entries from tampered storage", () => {
  const storage = fakeStorage({ [FAVORITES_KEY]: JSON.stringify(["ok", 42, null]) });
  assert.deepEqual(loadFavorites(storage), new Set(["ok"]));
});

test("toggleFavorite adds then removes without mutating the input set", () => {
  const original = new Set(["x"]);
  const added = toggleFavorite(original, "y");
  assert.deepEqual([...added].sort(), ["x", "y"]);
  assert.deepEqual(original, new Set(["x"])); // unchanged

  const removed = toggleFavorite(added, "y");
  assert.deepEqual(removed, new Set(["x"]));
});

test("saveFavorites does not throw when storage is unavailable (private mode)", () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new DOMException("blocked");
    },
  };
  assert.doesNotThrow(() => saveFavorites(storage, new Set(["x"])));
});
