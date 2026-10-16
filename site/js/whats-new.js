import { el } from './cards.js';

const KIND_LABEL = { added: 'Added', updated: 'Updated', removed: 'Removed' };

export function renderWhatsNew(root, changelog, { limit = 8, cardExists = () => false } = {}) {
  const entries = changelog.entries.slice(0, limit);
  root.replaceChildren(
    ...entries.map((e) => {
      const name = cardExists(e.id) && e.kind !== 'removed'
        ? el('a', { href: `?q=${encodeURIComponent(e.name)}#catalog`, text: e.name })
        : el('b', { text: e.name });
      return el('li', {}, [
        el('div', { class: 'feed-meta' }, [el('time', { datetime: e.date, text: e.date }), el('span', { class: `kind ${e.kind}`, text: KIND_LABEL[e.kind] })]),
        el('div', { class: 'feed-what' }, [`${e.type} `, name]),
        e.note ? el('div', { class: 'feed-note', text: e.note }) : null,
      ]);
    }),
  );
}
