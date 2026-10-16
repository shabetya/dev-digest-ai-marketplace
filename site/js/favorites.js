export const FAVORITES_KEY = 'marketplace:favorites';

export function loadFavorites(storage) {
  try {
    const raw = JSON.parse(storage.getItem(FAVORITES_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveFavorites(storage, set) {
  try {
    storage.setItem(FAVORITES_KEY, JSON.stringify([...set].sort()));
  } catch {
    /* storage can be unavailable (private mode); favorites then last for the session only */
  }
}

export function toggleFavorite(set, id) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
