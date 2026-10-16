import { el, badgeFor } from './cards.js';

export const COMPARE_MAX = 3;

export async function copyText(text, clipboard = navigator.clipboard) {
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function toggleCompare(list, id) {
  if (list.includes(id)) return list.filter((x) => x !== id);
  return list.length < COMPARE_MAX ? [...list, id] : list;
}

const ROWS = [
  ['Type', (i) => i.type],
  ['Plugin', (i) => i.pluginName],
  ['Version', (i) => i.version, 'mono'],
  ['Validation', (i) => badgeFor(i).label],
  ['Tags', (i) => i.tags.join(', ')],
  ['Install', (i) => i.installCommand, 'mono small'],
];

export function renderCompare(root, items, onClear) {
  root.hidden = items.length === 0;
  if (!items.length) return root.replaceChildren();

  const head = el('tr', {}, [el('th', {}), ...items.map((i) => el('th', { scope: 'col', text: i.name }))]);
  const body = ROWS.map(([label, get, cls]) =>
    el('tr', {}, [el('th', { scope: 'row', text: label }), ...items.map((i) => el('td', { class: cls ?? '', text: get(i) }))]),
  );
  const clear = el('button', { type: 'button', class: 'btn-ghost', text: 'Clear selection' });
  clear.addEventListener('click', onClear);

  root.replaceChildren(
    el('div', { class: 'compare-head' }, [el('h2', { text: 'Compare' }), clear]),
    el('div', { class: 'table-scroll' }, el('table', {}, [el('thead', {}, head), el('tbody', {}, body)])),
  );
}
