---
name: rg-explain-html
description: Use when creating or revising an explanatory HTML document to make an issue, concept, architecture, research finding, design decision, comparison, or incident understandable. Triggers include "HTML로 설명해줘", "HTML로 정리해줘", and requests to show a topic at a glance as an explanatory page. Applies whether or not a project glossary exists; ordinary website or app UI changes do not trigger it.
---

# rg-explain-html

Read `core.md` completely and follow it as the source of truth for document flow, writing style, and navigation layout.

**Visual module (required):** For all diagrams, inline SVGs, Before/After mechanism views, and visual QA, also read `../rg-visual-explainer/core.md` and `../rg-visual-explainer/references/visual-gate.md` completely and follow them. When looking up supplementary HTML/SVG component patterns, use `scripts/read-patterns.mjs` (`--list` first, then `--ids ...`).

**Codex runtime (required when running on Codex / OpenAI GPT coding agents):** Also read `references/codex-guide.md` before drafting, and run `node scripts/check-html.mjs <output.html>` until all hard checks pass.

Before presenting any finished HTML to the user, audit it against `references/quality-gate.md` and `../rg-visual-explainer/references/visual-gate.md`, and resolve every failed check.
