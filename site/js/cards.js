const TYPE_LABEL = { plugin: 'Plugin', skill: 'Skill', command: 'Command', agent: 'Agent' };
const SVG_NS = 'http://www.w3.org/2000/svg';

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) node.append(c);
  return node;
}

function svg(paths, size = 18) {
  const s = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) s.setAttribute(k, v);
  for (const d of paths) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    s.append(p);
  }
  return s;
}

const STAR = 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z';
const LINK = ['M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1', 'M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1'];

export function badgeFor(item) {
  return item.validated ? { label: 'Validated', cls: 'badge' } : { label: 'Schema-only', cls: 'badge schema' };
}

export function renderCard(item, ctx) {
  const fav = ctx.favorites.has(item.id);
  const inCompare = ctx.compare.includes(item.id);
  const badge = badgeFor(item);
  const copied = ctx.copiedId === item.id;

  return el('article', { class: 'card', 'data-id': item.id }, [
    el('div', { class: 'card-top' }, [
      el('span', { class: 'card-type', text: TYPE_LABEL[item.type] }),
      el('button', { type: 'button', class: 'fav', 'data-action': 'fav', 'aria-pressed': String(fav), 'aria-label': `${fav ? 'Remove' : 'Save'} ${item.name} ${fav ? 'from' : 'to'} favorites` }, svg([STAR], 20)),
    ]),
    el('div', {}, [
      el('h3', { text: item.name }),
      el('span', { class: 'card-meta', text: `in ${item.pluginName} · v${item.version}` }),
    ]),
    el('p', { class: 'card-desc', text: item.description }),
    el('div', { class: 'tags' }, item.tags.map((t) => el('span', { class: 'tag', text: t }))),
    el('div', { class: 'card-foot' }, [
      el('span', { class: badge.cls, text: badge.label }),
      el('span', { class: 'grow' }),
      el('a', { class: 'perma', href: item.githubUrl, target: '_blank', rel: 'noopener', title: item.path, 'aria-label': `Open ${item.name} on GitHub at the build commit` }, svg(LINK)),
      el('button', { type: 'button', class: copied ? 'copy done' : 'copy', 'data-action': 'copy', text: copied ? 'Copied' : 'Copy install' }),
    ]),
    el('label', { class: 'cmp' }, [
      el('input', { type: 'checkbox', 'data-action': 'compare', checked: inCompare, disabled: !inCompare && ctx.compare.length >= ctx.compareMax }),
      'Compare',
    ]),
  ]);
}

export function renderCards(root, items, ctx) {
  root.replaceChildren(...items.map((i) => renderCard(i, ctx)));
}
