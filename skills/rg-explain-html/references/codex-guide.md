# Codex Execution Guide for `rg-explain-html`

Codex tends to take two shortcuts on explanatory HTML tasks:
1. Replacing real diagrams with CSS flexbox text-boxes joined by plain `→` arrows (`svg: 0`).
2. Leaving later parallel sections as bare `<dl>` / `<table>` blocks or reducing SVGs to 3–4 identical rounded rectangles without showing the actual mechanism.

Follow this execution protocol whenever generating or revising explanatory HTML on Codex.

## 1. Mandatory Load Order (Before Writing HTML)

1. Read `../core.md` (including `0. 시작 전 짧은 인터뷰` when the brief is incomplete).
2. Read `../../rg-visual-explainer/core.md` and `../../rg-visual-explainer/references/visual-gate.md` (storyboard-first `<desc>`, freeform scene/UI/data/geometry composition, semantic colors, 0-collision geometry, Static-First motion when helpful).
3. Plan a **Visual Plan** before coding: for each major section, decide what concrete phenomenon, structure, or contrast the reader needs to *see* — invented fresh for the topic, not copied from a generic flowchart template.

## 2. Hard Guardrails (Domain-Neutral)

- **Inline `<svg>` is mandatory**: Never substitute CSS `<div>`/`<span>` pill/cell rows + text `→` arrows for diagrams. Every mechanism, structure, or comparison section needs a bespoke inline `<svg>` (`viewBox` width `720..960`, height `200..460`).
- **Write `<desc>` storyboard first inside every `<svg>`**: Describe the concrete visual scene, spatial layout, and causal contrast in 1–2 sentences before drawing shapes.
- **No generic box-and-line fallback**: Do not reduce distinct mechanisms to identical rounded rectangles joined by unadorned lines. Use directional arrowheads, spatial layout, visual contrast between working vs failing cases, and concrete real-world values rather than placeholders.
- **Static-First Motion & Interactivity**: When motion or animation is requested — or when traversal, state transition, or before/after contrast benefits from manipulation — apply it directly to `<svg>` elements (not CSS text-box highlights). Keep the initial frame 100% legible before any click, place controls in a clean `.controls` bar above the `<svg>`, and respect `@media (prefers-reduced-motion: reduce)`.
- **Keep parallel sections balanced**: Do not put visuals in early sections and abandon the last parallel section as a bare `<dl>` or prose wall.
- **SVG Text Discipline**: Short noun phrases, concrete values, and symbols (`✓`, `✕`, `?`) only (`<= 14` Korean chars or short token per label; font-size `>= 12.5px`, primary labels `14–16px`). Put prose in HTML `<p>` and `<figcaption>`.
- **Semantic Color Palette (3–4 hues + neutral gray)**:
  - Neutral: `#37352f`, `#6b6862`, `#d3d1cb`, surface `#ffffff` / `#f7f8fa`
  - Reject / skip / loss / violation (Red): `#b3352b` (fill `#fdf2f1`)
  - Match / valid / allowed (Green): `#2f6f4d` (fill `#eef6f1`)
  - Focus / primary path (Blue): `#2f6ba3` (fill `#f3f7fb`)
  - Caution / partial (Amber): `#8a5a18` (fill `#fdf8ee`)
- **Korean Typography**: Always include `word-break: keep-all; overflow-wrap: break-word;` on Korean body/cards/tables/captions.
- **Metadata**: Always include `<script type="application/json" id="doc-meta">...</script>` in `<head>`.

## 3. Verification Loop (Before Reporting Done)

1. Run the deterministic hard-gate validator:
   ```bash
   node <skill-root>/scripts/check-html.mjs <output.html>
   ```
   Fix every `FAIL` until exit code is `0`.
2. **Browser / screenshot check**: Verify rendered output if browser execution is permitted in the current environment. If launching Playwright/Chromium fails once due to sandbox restrictions (e.g., `SIGABRT` or permission error), **do not retry repeatedly** (to avoid crash dialogs) — stop browser launch, verify coordinates/DOM statically, and explicitly report that rendered screenshot inspection was not performed.
