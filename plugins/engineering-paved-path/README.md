# engineering-paved-path

```
/plugin install engineering-paved-path --marketplace shabetya/dev-digest-ai-marketplace
```

Reusable engineering skills for a React/Next.js + Fastify TypeScript
full-stack repo — the "paved path" conventions a team has already settled
on, encoded so an agent applies them instead of reinventing or guessing.
Each skill is invoked on-demand (via the `Skill` tool) by whichever agent
decides it applies — this plugin ships no agents of its own, it only
supplies knowledge other agents draw on.

| Skill | Scope | Description |
|-------|-------|-------------|
| [react-best-practices](skills/react-best-practices/SKILL.md) | Frontend | React anti-patterns, state management, hooks rules |
| [next-best-practices](skills/next-best-practices/SKILL.md) | Frontend | Next.js App Router, RSC boundaries, data fetching, optimization |
| [frontend-architecture](skills/frontend-architecture/SKILL.md) | Frontend | Where files/components/logic/config live; component splitting; App Router data-access layering |
| [fastify-best-practices](skills/fastify-best-practices/SKILL.md) | Backend | Fastify routes, plugins, JSON-schema validation, error handling |
| [onion-architecture](skills/onion-architecture/SKILL.md) | Backend | Layering and dependency direction: module anatomy, ports/adapters, DI, transactions, enforcement |
| [react-testing-library](skills/react-testing-library/SKILL.md) | Frontend | General-purpose React Testing Library guide with Vitest |
| [security](skills/security/SKILL.md) | Full-stack | OWASP Top 10, auth, injection, uploads, secrets |

Most skills ship more than just `SKILL.md` — worked examples
(`examples.md`), a fully-cited `README.md`/`SOURCES.md` research trail, and
`onion-architecture` additionally ships a small eval suite
(`evals/evals.json` + fixtures) that checks the skill actually catches the
violations it documents.

## How to use a skill directly

Each skill triggers automatically once Claude judges it relevant to what
you're doing (e.g. editing a React component triggers
`react-best-practices`). To force one explicitly, name it:

```
Use the react-testing-library skill to review the tests in src/components/Form.
```

or, once this plugin is installed alongside another one, reference it by
its namespaced id from that other plugin's own prompts/skills:
`engineering-paved-path:security`.

## Used by

- [`architecture-review`](../architecture-review) depends on this plugin —
  `architecture-reviewer` reads `onion-architecture` and
  `frontend-architecture` to ground its layering findings.
- [`sdd-engineering`](../sdd-engineering) depends on this plugin —
  `spec-creator`, `implementation-planner`, and `implementer` all read these
  skills for awareness and apply them while planning/implementing.

## Skill namespacing

Once installed alongside another plugin, that plugin invokes a specific
skill here by its namespaced id, e.g. `engineering-paved-path:
react-best-practices`, rather than the bare skill name — this avoids
collisions once more than one installed plugin exposes a skill with the
same short name.

## Not included here

`drizzle-orm-patterns`, `postgresql-table-design`, `zod`,
`typescript-expert` — database/type-system skills out of this plugin's
React/Next.js/Fastify/architecture/testing/security scope. Candidates for a
future `1.x` release of this same plugin (additive, so dependents pinned to
`^1.0.0` keep working).

## Changelog

- 1.0.1 — Add this changelog section (no skill content changes); used to
  verify marketplace auto-update propagation end-to-end.
