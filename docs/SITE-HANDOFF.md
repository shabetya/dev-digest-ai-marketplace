# Front-end handoff (from the design)

Drop this `site/` folder into the repo root (it matches SPEC.md §3). It is the UI for modules 8.3, 8.4, 8.6 and 8.7.

## What is here
- `index.html`, `css/styles.css` — layout, light/dark via `prefers-color-scheme`.
- `js/` — one responsibility per file, wired only in `app.js`.
- `data/*.json` — SAMPLE data in the exact shapes the indexer must produce. In the real repo `site/data/` is generated and gitignored; replace these with `build-index.mjs` output (keep them for module tests as fixtures).
- Not included: `js/vendor/fuse.min.js`. `build-index.mjs` must copy it from `node_modules/fuse.js/dist/fuse.min.js`; `index.html` loads it as a classic script (global `Fuse`).

## Contracts the indexer must satisfy
- `search-index.json`: array of the §8.1 entries. Needs `id`, `type`, `pluginName`, `name`, `description`, `tags`, `path`, `githubUrl`, `version`, `validated`, `installCommand`.
- `stats.json`: `{ commit, generatedAt (ISO), counts: { plugin, skill, command, agent } }`.
- `changelog.json`: `{ entries: [{ date, kind: added|updated|removed, type, name, id, note }] }`, newest first.
- `githubUrl` is pinned to the commit SHA; `app.js` also derives `owner/repo` for the onboarding command from it.

## Preview
`npm run serve` (npx serve site).

## Prompt for Claude Code
> Read SPEC.md and site/HANDOFF.md. Build the indexer (8.1) so it generates site/data/*.json in the shapes in HANDOFF.md, then add jsdom tests for search.js, favorites.js and URL state, and the two workflows. Do not restyle the UI.
