import { el } from './cards.js';

const LABELS = [['plugin', 'Plugins'], ['skill', 'Skills'], ['command', 'Commands'], ['agent', 'Agents']];

export function renderStats(root, stats) {
  const tiles = LABELS.map(([key, label]) => el('div', { class: 'stat' }, [el('b', { text: String(stats.counts[key] ?? 0) }), el('span', { text: label })]));
  const build = el('div', { class: 'stat-build' }, [
    el('span', { text: `Index built ${stats.generatedAt.slice(0, 10)}` }),
    el('span', { text: `Commit ${stats.commit.slice(0, 7)}` }),
  ]);
  root.replaceChildren(...tiles, build);
}
