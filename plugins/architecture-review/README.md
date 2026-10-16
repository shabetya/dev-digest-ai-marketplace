# architecture-review

```
/plugin install architecture-review --marketplace shabetya/dev-digest-ai-marketplace
```

A single read-only `architecture-reviewer` subagent that checks a given file
list, diff, or package scope against this repo's layering rules and reports
evidence-backed findings (file:line citations, severity CRITICAL/HIGH/
MEDIUM/LOW) — never fixes, never free-form code-quality commentary.

| Agent | Responsibility | Tools | Input | Output |
|---|---|---|---|---|
| [architecture-reviewer](agents/architecture-reviewer.md) | Layering/boundary review of a given scope | `Read, Grep, Glob` | A file list/diff/scope (no git access of its own) | A severity-graded Findings report |

## How to use it

It has no `Bash`, so it can't compute a diff itself — hand it one:

```
Use the architecture-reviewer subagent to review the files changed in my
last commit: git diff --name-only HEAD~1.
```

```
Use the architecture-reviewer subagent on this diff:
<paste a unified diff>
```

```
Use the architecture-reviewer subagent on server/src/modules/billing/.
```

It asks for a concrete scope rather than guessing if you don't give one.
Every finding cites an exact `file:line` with the offending line quoted
verbatim and a rule ID from its "Rule identifiers" table (e.g.
`inward-only-dependencies`, `di-discipline`, `thin-routes`); anything not
backed by a documented rule is explicitly out of scope — it never invents a
finding to look useful, and it never renders a security verdict (that's a
separate review).

## Dependencies

This plugin depends on [`engineering-paved-path`](../engineering-paved-path)
(`^1.0.0`, declared in its own `.claude-plugin/plugin.json`) — in practice,
`architecture-reviewer` leans on that plugin's `onion-architecture` and
`frontend-architecture` skills for most of its concrete rule content (Layer
Map, Enforcement patterns, documented exceptions).

The agent still discovers skills **by name at runtime** rather than
hardcoding their content, for two reasons: it's resilient to
`engineering-paved-path` being upgraded independently (a later `SKILL.md`
revision is picked up automatically, nothing to resync in this agent), and
it degrades gracefully rather than breaking if something ever installs this
agent without that dependency resolving — in that case it falls back to
stated general layering heuristics and says so explicitly in its report
instead of inventing repo-specific rules it has no source for.

## Known gap

No evals shipped yet. The source repo's `evals/agents/architecture-reviewer`
suite tests DevDigest-specific rule IDs (`reviewer-core-zero-io`,
`reviewer-core-ground-findings-gate`) that this generalized agent
deliberately no longer has (see
[`docs/SPEC-sdd-engineering-plugins.md`](../../docs/SPEC-sdd-engineering-plugins.md)
in this marketplace) — porting those fixtures as-is would assert behavior
this agent no longer has. A fresh eval suite against the generalized rule
table (§ "Rule identifiers" in `agents/architecture-reviewer.md`) is open
follow-up work.
