# SPEC: SDD Engineering plugin family

## 1. Purpose and scope

Port the Spec-Driven Development (SDD) engineering workflow — currently
living as repo-local `.claude/agents/` and `.claude/skills/` content inside
[`dev-digest-shabetya`](/Users/vadymshabetia/dev-digest-shabetya) — into four
reusable, installable plugins in this marketplace. The workflow (spec → plan
→ implement → review → verify) stays intact; everything DevDigest-specific
(paths, product specs, `mcp__devdigest__*` tools, hardcoded package names)
is stripped out and replaced with generic inputs so the plugins work in any
repo that installs them.

**Out of scope:** `doc-writer` and `test-writer` agents, the
`pr-self-review` and `engineering-insights` skills, and the
`dependencies-checker` / `onion-architecture-workspace` skills. None of
these were named for this release; they can become a fifth plugin later
without touching the four below.

## 2. The four plugins

| Plugin | Kind | Contains | Depends on |
|---|---|---|---|
| `engineering-paved-path` | dependency | 7 engineering skills (React, Next.js, architecture, testing, Fastify, security) | — |
| `research-tools` | dependency | `researcher` agent (read-only) | — |
| `architecture-review` | dependency | `architecture-reviewer` agent (generalized) | `engineering-paved-path` |
| `sdd-engineering` | top-level | 4 agents, 3 skills (incl. bundled `mermaid-diagram`), README, CHANGELOG | `engineering-paved-path`, `research-tools`, `architecture-review` |

Each plugin is independently installable. `sdd-engineering` is the one most
users install; the other three can also be installed standalone (e.g. a repo
that only wants `researcher`, without the SDD pipeline).

## 3. `engineering-paved-path`

**Purpose:** the stack-specific knowledge the SDD agents reason with and
apply — reusable by anything, not just `sdd-engineering`.

**Source:** `.claude/skills/{react-best-practices,next-best-practices,
frontend-architecture,fastify-best-practices,onion-architecture,
react-testing-library,security}/` in `dev-digest-shabetya` — mostly
framework-knowledge, not DevDigest-specific, but **not** copied fully
verbatim: `onion-architecture` and `frontend-architecture` turned out to
reference actual DevDigest product internals, not just generic examples,
and needed scrubbing:

- `onion-architecture`'s worked example was DevDigest's real package
  `reviewer-core` (its PR-review engine) — renamed to the generic
  `domain-core` throughout `SKILL.md` and `SOURCES.md` (16 occurrences).
  The surrounding architectural lesson (a pure, zero-dependency domain core
  package) is still real and still taught through a concrete example; only
  the product-identifying package name changed.
- Both skills' vendored-contract examples named the actual npm-scoped
  package `@devdigest/shared` — generalized to "this repo's own
  shared-contracts package" in `SKILL.md` (both) and `SOURCES.md`
  (`frontend-architecture`).
- `onion-architecture`'s eval fixture
  (`evals/fixtures/notifications/src/adapters/secrets/local.ts`) read a
  secrets file from `~/.devdigest/secrets.json` — changed to
  `~/.myapp/secrets.json` (verified the literal string isn't asserted on
  anywhere in `evals.json`, only the file path is, so this was safe).

Each skill's own citation trail (`README.md`, `SOURCES.md`) was kept —
`SKILL.md` promises every claim is sourced there, so removing them would
break that promise — but DevDigest's internal naming was scrubbed from them
the same way as from `SKILL.md`. `server/`, `client/` as generic
frontend/backend package names were left as-is (common in many repos, not
identifying); `reviewer-core` was the one name that specifically identifies
a PR-review product's engine and was treated differently for that reason.

```
plugins/engineering-paved-path/
├── .claude-plugin/plugin.json
└── skills/
    ├── react-best-practices/SKILL.md
    ├── next-best-practices/SKILL.md
    ├── frontend-architecture/SKILL.md
    ├── fastify-best-practices/SKILL.md
    ├── onion-architecture/SKILL.md
    ├── react-testing-library/SKILL.md
    └── security/SKILL.md
```

**Not carried over in v1** (DevDigest-specific or out of the "React / Next.js
/ Fastify / architecture / testing / security" bucket named for this
release): `drizzle-orm-patterns`, `postgresql-table-design`, `zod`,
`typescript-expert`, `onion-architecture-workspace`, `mermaid-diagram`,
`engineering-insights`, `pr-self-review`. Candidates for a future minor
release of this same plugin — adding a skill is backward compatible, so
every dependent (`architecture-review`, `sdd-engineering`) keeps working
without a `plugin.json` change on their side.

`plugin.json`: `{ "name": "engineering-paved-path", "version": "1.0.0" }` —
no agents, no dependencies of its own.

## 4. `research-tools`

**Purpose:** a standalone, read-only research agent.

**Source:** `.claude/agents/researcher.md`, copied with no changes needed —
it has no DevDigest paths, no MCP tools, no preloaded skills; its refusal to
invoke `/deep-research` refers to the Claude Code built-in skill of that
name (`anthropic-skills:deep-research`), which exists independently of
DevDigest and stays valid verbatim.

```
plugins/research-tools/
├── .claude-plugin/plugin.json
└── agents/researcher.md
```

`plugin.json`: `{ "name": "research-tools", "version": "1.0.0" }` — no
dependencies.

## 5. `architecture-review`

**Purpose:** a generalized, standalone architecture-layering reviewer.

**Source:** `.claude/agents/architecture-reviewer.md`, **generalized**:

- Drop the frontmatter `skills:` preload list
  (`onion-architecture, frontend-architecture, next-best-practices`) — even
  though this plugin *does* depend on `engineering-paved-path` (below), the
  agent still discovers skills by name at runtime via the `Skill` tool
  rather than hardcoding their content, so it stays resilient to
  `engineering-paved-path` being upgraded independently.
- Replace the hardcoded rule ("onion-architecture for `server/`/
  `reviewer-core/`, frontend-architecture + next-best-practices for
  `client/`") with: *list the architecture/layering skills available in this
  session (`Skill` tool), apply any whose name matches the given scope's
  stack; if none are available, fall back to stated general layering
  heuristics (dependency direction, separation of concerns, no upward
  imports) and say explicitly that no project-specific layering skill was
  found.*
- Drop DevDigest package names (`server/`, `reviewer-core/`, `client/`) from
  the prompt — it already asks the caller for an explicit file
  list/scope when none is given (no `Bash`/git-diff access), which is the
  "explicit inputs instead of DevDigest paths" pattern this agent already
  followed; just remove the three hardcoded path examples.
- `architecture-reviewer-lite` (the faster/cheaper variant) is **not**
  ported in v1 — same prompt, different model, so it's a candidate for a
  later minor release once there's a concrete need for a cheap pass.

```
plugins/architecture-review/
├── .claude-plugin/plugin.json
└── agents/architecture-reviewer.md
```

`plugin.json`: `{ "name": "architecture-review", "version": "1.0.0",
"dependencies": ["engineering-paved-path"] }` — `architecture-reviewer`
leans on `onion-architecture`/`frontend-architecture` for most of its
concrete rule content, so this plugin declares that dependency explicitly
rather than leaving it implicit. "Generalized" here means something
narrower than "zero dependencies": the agent still discovers skill content
by name at runtime instead of hardcoding it, and degrades to generic
layering heuristics (stated explicitly in its report) if that dependency
ever isn't resolved — not that it has no expected dependency at all.

## 6. `sdd-engineering`

**Purpose:** the orchestrated spec → plan → implement → review → verify
pipeline.

**Source and changes:**

| File | Source | Change |
|---|---|---|
| `agents/spec-creator.md` | `.claude/agents/spec-creator.md` | drop `mcp__devdigest__*` tools and the "ground against live system state" paragraph; the 4 `list_agents/get_findings/get_conventions/get_blast_radius` calls become: *if the repo being specced has its own equivalent read-only tooling, use it; otherwise proceed from `Read/Grep/Glob` only.* Drop `skills:` frontmatter preload list; keep the one narrow `Skill` grant but point it at the namespaced id `engineering-paved-path:mermaid-diagram` is **not** used here — see mermaid note below. |
| `agents/implementation-planner.md` | `.claude/agents/implementation-planner.md` | drop `skills:` frontmatter preload list; replace "every frontend and backend engineering skill preloaded for awareness" with: *read the skills exposed by `engineering-paved-path` (namespaced `engineering-paved-path:<skill>`) to decide which applies to each plan step.* Replace `AGENTS.md`/`INSIGHTS.md` citations with generic "this repo's own conventions files, wherever they are (CLAUDE.md, AGENTS.md, CONTRIBUTING.md, or equivalent) — name the actual file found, don't assume a filename." |
| `agents/implementer.md` | `.claude/agents/implementer.md` | drop `skills:` frontmatter preload list; invoke skills via `Skill` using the namespaced id (`engineering-paved-path:react-best-practices`, etc.) instead of a flat skill name; replace `client/, server/, reviewer-core/, e2e/` with "the packages the plan touches." |
| `agents/plan-verifier.md` | `.claude/agents/plan-verifier.md` | no DevDigest-specific paths found — copied as-is (already generic: reads whatever Development Plan/spec it's handed). |
| `skills/run-plan/SKILL.md` | `.claude/skills/run-plan/SKILL.md` | see §6.1 |
| `skills/workflow-retro/SKILL.md` + `scripts/metrics.py` | `.claude/skills/workflow-retro/` | see §6.2 |
| `skills/mermaid-diagram/SKILL.md` | `.claude/skills/mermaid-diagram/` | bundled directly inside `sdd-engineering` — see note below |
| `evals/agents/*`, `evals/skills/*` | `evals/{agents,skills}/` (the subset covering the 4 agents + 2 skills above) | paths inside eval fixtures updated the same way as the source files |
| `README.md` | new | see §6.3 |
| `CHANGELOG.md` | new | one entry per release, SemVer, matching `docs/RELEASES.md`'s convention |

**Why `mermaid-diagram` ships inside `sdd-engineering` instead of being a
fourth dependency:** both `spec-creator` (optional diagram in a spec) and
`workflow-retro` (sequence/gantt diagram for 4+ agents) need it, but it
isn't React/Next/Fastify/architecture/testing/security knowledge, so it
doesn't belong in `engineering-paved-path`, and it isn't worth a dedicated
one-skill dependency plugin for this release. It's small, generic, and owned
by the same plugin that's the only consumer. Revisit this if a second
unrelated plugin in this marketplace also wants Mermaid output — then it's
worth promoting to its own dependency plugin.

Agents **not** ported here (`doc-writer`): `run-plan`'s `--docs` flag and
Phase 5 doc-writer handoff are dropped (§6.1) since this plugin owns no
documentation agent; a repo that wants that step keeps using its own
doc-writer separately and runs it manually after `/run-plan` finishes.

### 6.1 `run-plan` — genericization

- Replace "orchestrator of the DevDigest implementation pipeline" with
  "orchestrator of this plugin's implementation pipeline."
- Phase 5: drop the `--docs` / `doc-writer` branch entirely (not part of this
  plugin). Drop the `engineering-insights` invocation (not part of this
  plugin) — replace with: *if the repo has its own insights-capture skill
  or convention, offer to use it; otherwise note the finding in the final
  summary only.* Drop the "Suggest `pr-self-review` as the next step" line
  (not part of this plugin) — replace with a generic "suggest the user run
  their own pre-PR review step next."
- Everything else (plan path argument, state/findings files next to the
  plan, implementer/plan-verifier/architecture-reviewer phases, the
  review-feedback loop) is already expressed in terms of explicit inputs
  (a plan path, a file list, `git diff`) and needs no path changes — it was
  already portable.
- Skill invocations (`implementer`, `architecture-reviewer`) stay agent
  names, unaffected by skill namespacing — namespacing (§7) only applies to
  **skills** invoked via the `Skill` tool, not to subagents invoked via the
  `Agent` tool.

### 6.2 `workflow-retro` — genericization

- `python3 .claude/skills/workflow-retro/scripts/metrics.py` →
  `python3 ${CLAUDE_SKILL_DIR}/scripts/metrics.py`. `CLAUDE_SKILL_DIR` is
  set by Claude Code to the invoked skill's own directory, so this resolves
  correctly regardless of where the plugin is installed — a hardcoded
  `.claude/skills/...` path only worked because the skill happened to live
  at a fixed repo-local path in `dev-digest-shabetya`.
- Mermaid diagram step: reference `sdd-engineering:mermaid-diagram` (the
  bundled skill, §6) instead of a bare `mermaid-diagram` name.
- `.claude/retros/` save path stays relative to the *installing* repo's
  working directory (not the plugin's own directory) — that's correct
  as-is, since a retro is project output, not plugin content. No change
  needed there, only called out so it isn't mistaken for a path to fix.
- Drop the `engineering-insights` cross-reference in Step 4, same
  replacement as `run-plan`'s Phase 5.

### 6.3 README and CHANGELOG

`plugins/sdd-engineering/README.md` must cover, adapted from
`dev-digest-shabetya`'s `.claude/agents/README.md` pipeline section but
narrowed to only what this plugin ships:

- The pipeline diagram: `spec-creator → implementation-planner →
  implementer → (plan-verifier ‖ architecture-reviewer)`, noting
  `architecture-reviewer` comes from the `architecture-review` dependency
  and `researcher` (from `research-tools`) is available ad hoc to any agent
  that needs grounded evidence it can't gather itself.
- Which agent is optional/ad hoc (`spec-creator`) vs. always-run.
- That `run-plan` automates implement → verify → architecture-review →
  iterate for an *already-approved* plan (it never runs `spec-creator` or
  `implementation-planner` itself), and `workflow-retro` runs after any
  multi-agent run to report on it.
- Skill namespacing: how to reference `engineering-paved-path:<skill>` when
  extending or re-pointing an agent's skill usage.
- Explicit statement of what's out of scope: no doc generation, no test
  writing, no security review (the pipeline's own agents all declare this in
  their own "out of scope" sections — the README repeats it once at the top
  level so it isn't missed).

`plugins/sdd-engineering/CHANGELOG.md`: one `## [X.Y.Z] - YYYY-MM-DD` entry
per release, matching `docs/RELEASES.md`'s SemVer + tag convention
(`sdd-engineering--v<version>`). First entry is `1.0.0` — initial port.

## 7. Dependency graph and skill namespacing

```
engineering-paved-path (skills only)
            ▲                       ▲
            │                       │
            │           research-tools (researcher)
            │                       │
     architecture-review            │
     (architecture-reviewer)        │
            │                       │
            └──────────┬────────────┘
                        ▼
                  sdd-engineering
         (spec-creator, implementation-planner,
          implementer, plan-verifier,
          run-plan, workflow-retro)
```

- `sdd-engineering/.claude-plugin/plugin.json` declares:
  ```json
  "dependencies": ["engineering-paved-path", "research-tools", "architecture-review"]
  ```
- `architecture-review/.claude-plugin/plugin.json` declares:
  ```json
  "dependencies": ["engineering-paved-path"]
  ```
  **Correction from an earlier draft of this spec:** a plugin's own
  `dependencies` field is a **plain array of plugin names**, not a map of
  name → semver range — `claude plugin validate` rejects the latter
  (`expected array, received object`). A semver range belongs on the
  *marketplace entry*'s own `version`/release tagging
  (`<plugin-name>--v<version>`, per `docs/RELEASES.md`), not on the
  dependency declaration itself.
- The marketplace entries for `sdd-engineering` and `architecture-review`
  in `.claude-plugin/marketplace.json` additionally list the same plugin
  names in their own `dependencies` array (per
  `docs/PLUGIN-GUIDELINES.md`), so install order is explicit at the
  marketplace level too, not just inside `plugin.json`.
- `architecture-review` depends on `engineering-paved-path` directly —
  `architecture-reviewer` leans on `onion-architecture`/
  `frontend-architecture` for most of its concrete rule content, so that
  relationship is now declared rather than left implicit. "Generalized"
  (§5) means something narrower than "zero dependencies": the agent still
  discovers skill content by name at runtime via the `Skill` tool instead
  of hardcoding it (resilient to `engineering-paved-path` shipping a new
  `SKILL.md` revision independently), and it degrades to stated generic
  layering heuristics if that dependency ever isn't resolved — it isn't
  that `architecture-review` has no expected dependency at all.
  `research-tools` declares no dependencies of its own; `sdd-engineering`
  depends on all three.
- Skills are invoked by their **namespaced** id —
  `engineering-paved-path:react-best-practices`,
  `sdd-engineering:mermaid-diagram` — never by the bare skill name, since
  once multiple plugins are installed, bare names collide. Agents are not
  namespaced the same way; they're invoked by plugin-qualified subagent
  name (`architecture-review:architecture-reviewer`) only where the caller
  needs to disambiguate from a same-named agent in another installed
  plugin — in `sdd-engineering`'s own prompts, the plain name is enough
  since each agent name it references is unique across its 3 dependencies.

## 8. Marketplace registration

Four new entries in `.claude-plugin/marketplace.json`'s `plugins` array,
each with its own `name`, `version` (or rolling, per `docs/RELEASES.md` —
this family uses **versioned** mode), `source: "./plugins/<name>"`,
`description`, `category`, `tags`:

```json
{
  "name": "engineering-paved-path",
  "source": "./plugins/engineering-paved-path",
  "description": "React/Next.js/Fastify/architecture/testing/security engineering skills",
  "category": "engineering",
  "tags": ["react", "nextjs", "fastify", "architecture", "testing", "security"]
},
{
  "name": "research-tools",
  "source": "./plugins/research-tools",
  "description": "Read-only research subagent for grounded, cited answers",
  "category": "research",
  "tags": ["research", "agent"]
},
{
  "name": "architecture-review",
  "source": "./plugins/architecture-review",
  "description": "Generalized read-only architecture/layering review subagent",
  "category": "review",
  "tags": ["architecture", "review", "agent"],
  "dependencies": ["engineering-paved-path"]
},
{
  "name": "sdd-engineering",
  "source": "./plugins/sdd-engineering",
  "description": "Spec-Driven Development pipeline: spec, plan, implement, verify, review",
  "category": "engineering",
  "tags": ["sdd", "spec", "planning", "agents"],
  "dependencies": ["engineering-paved-path", "research-tools", "architecture-review"]
}
```

A commit (or tag) of `.claude-plugin/marketplace.json` after all four
entries land fixes the catalog's state for this release, per the existing
release flow in `docs/RELEASES.md`.

## 9. Validation before release

1. `claude plugin validate ./plugins/<name>` for each of the four plugins,
   then `claude plugin validate .` for the marketplace as a whole.
2. `node scripts/validate-marketplace.mjs` (structural lint, already in CI).
3. Local install smoke test — all four plugin directories loadable:
   ```bash
   claude plugin marketplace add .
   claude plugin install engineering-paved-path@dev-digest-ai-marketplace
   claude plugin install research-tools@dev-digest-ai-marketplace
   claude plugin install architecture-review@dev-digest-ai-marketplace
   claude plugin install sdd-engineering@dev-digest-ai-marketplace
   ```
4. Manual chain check: run `spec-creator` → `implementation-planner` →
   `implementer` → (`architecture-reviewer` ‖ `plan-verifier`) end to end on
   a throwaway task in a scratch repo, confirming each handoff works with
   only the files/arguments the agents are explicitly given (no leftover
   assumption about a DevDigest-shaped repo).
5. A dedicated eval (ported from `evals/agents/architecture-reviewer/` and
   `evals/skills/dependencies-checker/` as templates, new fixtures for this
   family) confirms skills and agents are reachable through their plugin
   namespaces (`engineering-paved-path:react-best-practices`,
   `architecture-review:architecture-reviewer`) once more than one of
   these plugins is installed side by side.

## 10. What is intentionally not migrated

- **Product specs**: any `specs/SPEC-NN-*.md` content that describes
  DevDigest's own features — these are product history, not plugin
  content.
- **Secrets**: no `.env`, API keys, or `mcp__devdigest__*` server
  connection details travel with any plugin.
- **Cache / build output**: nothing from `.next/`, `dist/`, `node_modules/`.
- **DevDigest-specific instructions**: `CLAUDE.md`, package `AGENTS.md`/
  `INSIGHTS.md` content, and the 4 `mcp__devdigest__*` tool grants — the
  agents that referenced these now either ask for an equivalent file by
  name or proceed without it, per §6.

## 11. Open decisions for the implementer to confirm, not assumed here

- Whether `sdd-engineering`'s agents get a `category`/`tags` scheme
  distinct from the dependency plugins' (cosmetic, doesn't block release).
- Whether `architecture-reviewer-lite` and the four excluded
  skills/agents (§1, §3) become a fifth plugin later, or get folded into
  one of the four above — no decision needed until there's a concrete
  second consumer.
