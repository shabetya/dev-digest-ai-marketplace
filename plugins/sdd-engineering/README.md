# sdd-engineering

```
/plugin install sdd-engineering --marketplace shabetya/dev-digest-ai-marketplace
```

A Spec-Driven Development (SDD) pipeline: turn a feature description into a
spec, the spec into a Development Plan, the plan into code, then verify and
architecture-review the result.

## Pipeline

```
researcher (ad hoc, from research-tools — answers a question spec-creator
            or anyone else can't answer from this repo's own files)
      ▼
spec-creator (optional, ad hoc — before scoping starts)
      │  writes <package>/specs/SPEC-NN-*.md, or top-level specs/SPEC-NN-*.md
      │  for a spec whose goals span more than one package
      ▼
implementation-planner  ──Development Plan──▶  implementer
      │  asks: multi-agent pipeline, or single-agent pass?
                                                     │
                                   ┌─────────────────┴─────────────────┐
                                   ▼                                   ▼
                             plan-verifier                  architecture-reviewer
                        (fact-checks the plan's            (layering/boundary judgment —
                         claims against disk)               from the architecture-review plugin)
                                   │                                   │
                                   └─────────────────┬─────────────────┘
                                                      ▼
                                              (your own next step —
                                           docs, tests, PR review, etc.)
```

`spec-creator` is optional and ad hoc: use it when a feature is worth
scoping with Spec-Driven Development before any planning starts.
`implementation-planner` then reads that spec file as one of its grounding
sources, reviews it critically, but never produces or edits a spec itself —
that stays `spec-creator`'s job exclusively. `spec-creator` answers **what
and why** (goals, acceptance criteria, edge cases); `implementation-planner`
answers **how and in what sequence** (files, order, skills, tests) — and
cites the spec's `AC-N` acceptance criteria on every plan step.
`plan-verifier` closes that loop: as a read-only gate, it independently
re-derives whether every `AC-N` actually got covered by verified work,
rather than trusting the plan's self-reported `## AC coverage` table.

`plan-verifier` and `architecture-reviewer` both consume the Implementation
Report but check different things (concrete fact-checking vs. architectural
judgment) and don't depend on each other's output, so they can run in either
order or in parallel. **Neither this plugin nor its agents perform security
review, test writing, or documentation** — those stay separate, explicit
steps (this plugin's own agents each say so in their own "Out of scope"
section, so the step isn't silently skipped).

## What's in this plugin

| Component | Kind | Responsibility |
|---|---|---|
| [spec-creator](agents/spec-creator.md) | agent | Feature/design description → structured SDD spec file |
| [implementation-planner](agents/implementation-planner.md) | agent | Task (+ optional spec) → Development Plan |
| [implementer](agents/implementer.md) | agent | Development Plan → code change + Implementation Report |
| [plan-verifier](agents/plan-verifier.md) | agent | Implementation Report + Plan → independent Verification Report |
| [run-plan](skills/run-plan/SKILL.md) | skill (`/run-plan`) | Automates implement → verify → architecture-review → iterate for an *already-approved* plan |
| [workflow-retro](skills/workflow-retro/SKILL.md) | skill | Retrospective (tokens, sequence, struggles, recommendations) after any multi-agent run |
| [mermaid-diagram](skills/mermaid-diagram/SKILL.md) | skill | Mermaid diagrams, invoked by `spec-creator` and `workflow-retro` |

`run-plan` never runs `spec-creator` or `implementation-planner` itself — it
assumes a plan already exists and has been approved (its `## Execution mode`
question answered). `workflow-retro` runs after any multi-agent workflow,
not only this plugin's own.

## How to use it

Typical flow, start to finish:

```
Use the spec-creator subagent to write a spec for <feature description>.
```

```
Use the implementation-planner subagent to plan <task description>,
against specs/SPEC-04-<slug>.md.
```
The planner ends by asking you to choose the multi-agent pipeline or a
single-agent pass — answer that before anything executes.

```
/run-plan specs/SPEC-04-<slug>.plan.md
```
Runs implement → verify → architecture-review → iterate end to end for an
*already-approved* plan. Optional flags:
`/run-plan <plan-path> ["extra requirements"] [--designs <file|dir|url> ...] [--max-iter N]`.

```
Use the workflow-retro skill for the run that just finished.
```
Or, to persist it: `workflow-retro --save`. Add `--ask-agents` to ask each
still-addressable subagent what was hardest/easiest (costs extra tokens —
off by default).

Each agent can also be invoked directly and standalone — e.g. "use the
plan-verifier subagent against this Development Plan and Implementation
Report" — without going through `/run-plan`, for a single-agent pass or
manual pipeline control.

## Dependencies

This plugin depends on three others, declared in its own
`.claude-plugin/plugin.json` (`dependencies` is a plain array of plugin
names — this marketplace's `plugin.json` schema doesn't carry a semver
range there; a range only appears on the *marketplace entry*'s own
versioning, per `docs/RELEASES.md`):

- [`engineering-paved-path`](../engineering-paved-path) — the engineering
  skills `implementer`/`implementation-planner`/`spec-creator` apply, via
  namespaced invocation (`engineering-paved-path:react-best-practices`,
  etc.).
- [`research-tools`](../research-tools) — the `researcher` agent
  `spec-creator` asks the parent session to run for a question it can't
  answer itself (it has no `Bash`/`WebFetch`/`WebSearch`).
- [`architecture-review`](../architecture-review) — the
  `architecture-reviewer` agent `run-plan`'s Phase 3 and
  `implementation-planner`'s multi-agent execution mode both use.

See [`docs/SPEC-sdd-engineering-plugins.md`](../../docs/SPEC-sdd-engineering-plugins.md)
in this marketplace for the full design rationale, including what was
deliberately left out of this port (`doc-writer`, `test-writer`,
`pr-self-review`, `engineering-insights`) and why `mermaid-diagram` ships
bundled here instead of as a fourth dependency.

## Skill namespacing

When extending or re-pointing an agent's skill usage, reference a skill from
another installed plugin by its namespaced id — `engineering-paved-path:
security`, not bare `security` — since once more than one plugin exposes a
skill with the same short name, the bare name is ambiguous. `mermaid-diagram`
is this plugin's own skill, so it's referenced by its bare name from within
this plugin's own agents/skills.

## Known gap

No evals shipped yet for this plugin's own four agents and two skills — the
source repo had none for these specifically (its only agent evals covered
`architecture-reviewer`, which lives in the separate
[`architecture-review`](../architecture-review) plugin and has its own
"Known gap" note on why those weren't portable as-is). A fresh eval suite
for this plugin is open follow-up work — see §9.5 of
[`docs/SPEC-sdd-engineering-plugins.md`](../../docs/SPEC-sdd-engineering-plugins.md).
