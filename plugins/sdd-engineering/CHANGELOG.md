# Changelog

All notable changes to the `sdd-engineering` plugin are documented here.
Versioning follows [SemVer](https://semver.org); see
[`docs/RELEASES.md`](../../docs/RELEASES.md) for this marketplace's release
and tagging convention (`sdd-engineering--v<version>`).

## [1.0.0] - 2026-10-16

Initial release: ported from `dev-digest-shabetya`'s repo-local
`.claude/agents/` and `.claude/skills/`, generalized to drop DevDigest-
specific paths, tools, and package names in favor of explicit inputs and
skill namespacing. See
[`docs/SPEC-sdd-engineering-plugins.md`](../../docs/SPEC-sdd-engineering-plugins.md)
for the full design.

### Added
- `spec-creator`, `implementation-planner`, `implementer`, `plan-verifier`
  agents.
- `run-plan` skill (`/run-plan`) — implement → verify → architecture-review
  → iterate for an approved plan.
- `workflow-retro` skill — post-workflow retrospective.
- `mermaid-diagram` skill, bundled (shared by `spec-creator` and
  `workflow-retro`).

### Changed from the source repo
- Dropped all `mcp__devdigest__*` tool grants (`spec-creator`) — live
  system-state grounding is now conditional on the installing repo
  exposing its own equivalent read-only tooling.
- Dropped hardcoded package names (`server/`, `client/`, `reviewer-core/`,
  `e2e/`, `mcp-server/`) in favor of "this repo's affected packages."
- Dropped hardcoded conventions filenames (`CLAUDE.md`, `AGENTS.md`,
  `INSIGHTS.md`) in favor of "this repo's own conventions/findings file,
  whatever it's called."
- Dropped the frontmatter `skills:` preload lists; skills are now invoked
  on demand via the `Skill` tool using namespaced ids.
- `run-plan`: dropped the `--docs`/`doc-writer` phase and the
  `pr-self-review`/`engineering-insights` hard references (none of those
  are part of this plugin); made the `engineering-insights` reference in
  `workflow-retro` conditional on the installing repo having one.
- `workflow-retro`: `python3 .claude/skills/workflow-retro/scripts/metrics.py`
  → `python3 ${CLAUDE_SKILL_DIR}/scripts/metrics.py`, so the script resolves
  correctly regardless of install location.
- Fixed a stray Ukrainian section header (`## Проблема й навіщо`) in
  `spec-creator`'s spec template back to `## Problem`, matching the rest of
  the (English) template and the agent's own frontmatter description.

### Known gaps
- No evals ported — see this plugin's `README.md` § "Known gap".
