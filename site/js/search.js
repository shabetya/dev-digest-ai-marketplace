export const TYPES = ['plugin', 'skill', 'command', 'agent'];

const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 3 },
    { name: 'tags', weight: 2 },
    { name: 'description', weight: 1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
};

export function readUrlState(search) {
  const p = new URLSearchParams(search);
  const type = p.get('type');
  return { q: p.get('q') ?? '', type: TYPES.includes(type) ? type : 'all', tag: p.get('tag') ?? '' };
}

export function writeUrlState(state, history, location) {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.type !== 'all') p.set('type', state.type);
  if (state.tag) p.set('tag', state.tag);
  const qs = p.toString();
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  return qs ? '?' + qs : '';
}

export function createSearch(items, FuseCtor) {
  const fuse = new FuseCtor(items, FUSE_OPTIONS);
  const allTags = [...new Set(items.flatMap((i) => i.tags))].sort();

  function matchQuery(q) {
    const query = q.trim();
    return query ? fuse.search(query).map((r) => r.item) : items;
  }

  function run(state) {
    const byQuery = matchQuery(state.q);
    const byTag = state.tag ? byQuery.filter((i) => i.tags.includes(state.tag)) : byQuery;
    const results = state.type === 'all' ? byTag : byTag.filter((i) => i.type === state.type);
    const counts = { all: byTag.length };
    for (const t of TYPES) counts[t] = byTag.filter((i) => i.type === t).length;
    return { results, counts };
  }

  return { run, allTags };
}
