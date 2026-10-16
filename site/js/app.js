import { createSearch, readUrlState, writeUrlState, TYPES } from './search.js';
import { renderCards, el } from './cards.js';
import { copyText, toggleCompare, renderCompare, COMPARE_MAX } from './card-actions.js';
import { loadFavorites, saveFavorites, toggleFavorite } from './favorites.js';
import { renderStats } from './stats.js';
import { renderWhatsNew } from './whats-new.js';
import { onboardingCommands } from './onboarding.js';

const $ = (id) => document.getElementById(id);
const getJson = (path) => fetch(path).then((r) => {
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
});

async function main() {
  const [items, stats, changelog] = await Promise.all([
    getJson('data/search-index.json'),
    getJson('data/stats.json'),
    getJson('data/changelog.json'),
  ]);
  const byId = new Map(items.map((i) => [i.id, i]));
  const search = createSearch(items, globalThis.Fuse);

  let state = readUrlState(location.search);
  let favorites = loadFavorites(localStorage);
  let compare = [];
  let copiedId = '';

  const cmds = onboardingCommands(items);
  $('cmd-add').textContent = cmds.add;
  $('cmd-install').textContent = cmds.install;
  $('repo-link').href = `https://github.com/${cmds.repo}`;
  renderStats($('stats'), stats);
  renderWhatsNew($('feed'), changelog, { cardExists: (id) => byId.has(id) });
  $('q').value = state.q;

  function render() {
    const { results, counts } = search.run(state);
    const qs = writeUrlState(state, history, location);

    $('type-chips').replaceChildren(
      ...['all', ...TYPES].map((t) => {
        const label = t === 'all' ? 'All' : t[0].toUpperCase() + t.slice(1) + 's';
        const b = el('button', { type: 'button', class: 'chip', 'data-type': t, 'aria-pressed': String(state.type === t) }, [label, el('span', { class: 'n', text: String(counts[t]) })]);
        return b;
      }),
    );
    $('tag-chips').replaceChildren(
      ...search.allTags.map((t) => el('button', { type: 'button', class: 'tag-btn', 'data-tag': t, 'aria-pressed': String(state.tag === t), text: t })),
    );

    const filtered = state.q || state.tag || state.type !== 'all';
    $('results-title').textContent = filtered ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'Whole catalog';
    $('url-state').textContent = qs || 'no filters';
    $('empty').hidden = results.length > 0;

    renderCards($('cards'), results, { favorites, compare, compareMax: COMPARE_MAX, copiedId });
    renderCompare($('compare'), compare.map((id) => byId.get(id)).filter(Boolean), () => { compare = []; render(); });
  }

  $('search-form').addEventListener('submit', (e) => e.preventDefault());
  $('q').addEventListener('input', (e) => { state = { ...state, q: e.target.value }; render(); });
  $('clear-all').addEventListener('click', () => { state = { q: '', type: 'all', tag: '' }; $('q').value = ''; render(); });

  $('type-chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (b) { state = { ...state, type: b.dataset.type }; render(); }
  });
  $('tag-chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tag]');
    if (b) { state = { ...state, tag: state.tag === b.dataset.tag ? '' : b.dataset.tag }; render(); }
  });

  $('cards').addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    const card = e.target.closest('[data-id]');
    if (!target || !card) return;
    const item = byId.get(card.dataset.id);
    if (target.dataset.action === 'fav') {
      favorites = toggleFavorite(favorites, item.id);
      saveFavorites(localStorage, favorites);
      render();
    } else if (target.dataset.action === 'copy') {
      await copyText(item.installCommand);
      copiedId = item.id;
      render();
      setTimeout(() => { if (copiedId === item.id) { copiedId = ''; render(); } }, 1600);
    }
  });
  $('cards').addEventListener('change', (e) => {
    const card = e.target.closest('[data-id]');
    if (e.target.dataset.action === 'compare' && card) { compare = toggleCompare(compare, card.dataset.id); render(); }
  });

  $('onboarding').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy-target]');
    if (!b) return;
    await copyText($(b.dataset.copyTarget).textContent);
    b.textContent = 'Copied';
    setTimeout(() => { b.textContent = 'Copy'; }, 1600);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) { e.preventDefault(); $('q').focus(); }
  });

  render();
}

main().catch((err) => {
  document.getElementById('cards').textContent = `Could not load the catalog: ${err.message}`;
});
