# research-tools

```
/plugin install research-tools --marketplace shabetya/dev-digest-ai-marketplace
```

A single read-only `researcher` subagent for evidence-backed research
questions — internal (code/docs/git history) or external (web docs,
changelogs, library comparisons). It never writes or edits files, and it
refuses to invoke the `/deep-research` skill or command even if one is
available in the session (that's a synthesis/report-writing skill; this
agent answers one scoped question with citations instead).

| Agent | Responsibility | Tools | Input | Output |
|---|---|---|---|---|
| [researcher](agents/researcher.md) | Answer a specific, scoped question with cited evidence | `Read, Grep, Glob, Bash, WebFetch, WebSearch` | A specific question (asks clarifying questions first if ambiguous) | A research report: Question, Conclusions, Evidence with citations, References, Could-not-find |

## When to reach for it

- You need an answer grounded in actual code/docs/history, not a guess —
  "how does X work in this repo", "find every place Y is used", "what does
  this library's changelog actually say about Z".
- Another agent in your session can't research on its own — for example
  `sdd-engineering`'s `spec-creator`, which has no `Bash`/`WebFetch`/
  `WebSearch` of its own and explicitly hands research questions to the
  parent session to run through this agent instead of guessing.
- You want a single, scoped question answered with citations, not an
  open-ended multi-source synthesis report (that's a different kind of
  task — see "researcher vs. deep-research" below).

## How to use it

Invoke it directly:

```
Use the researcher subagent to find every place this repo reads
process.env directly, outside the designated config module.
```

```
Use the researcher subagent to check whether the installed version of
<library> still supports <API> — cite the changelog/docs.
```

If the question is ambiguous or open-ended ("look into auth", "what do you
think about X"), the agent stops and asks what to scope before doing any
research — it won't guess at what "done" means.

**Two modes**, usable together: **repository research** (internal
codebase/docs/git history, via `Read`/`Grep`/`Glob`/`Bash`) and **external
research** (web docs/changelogs/comparisons, via `WebFetch`/`WebSearch`).
State which one(s) apply if it isn't obvious from the question.

## researcher vs. `/deep-research`

`researcher` answers one specific, scoped question and stops — it's built
for being invoked repeatedly, once per independent question, often in
parallel from a parent session or another agent. It explicitly refuses to
invoke `/deep-research` (a separate, heavier multi-source synthesis skill)
even if asked to — if your task is actually "research this broad topic and
write me a report," that's a different tool than this plugin.

## Dependencies

Standalone — no dependencies, no skills, no other agents required.
