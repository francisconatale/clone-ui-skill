---
name: clone-ui
description: >
  Orchestrates a four-phase multi-agent pipeline to clone UI screenshots into
  production-grade code with >= 95% fidelity. Uses strict JSON schemas for
  cross-agent communication. Design intelligence (UX audit + polish) enters
  only after raw visual extraction is complete.
---

# clone-ui Skill

Four-phase pipeline: **extract → diagnose → generate → validate**.
Agent 1 is geometry-only and text-blind. UX intelligence enters at Agent 2.
Code generation happens at Agent 3. Agent 1 never informs Agent 3 directly
about semantics — only about pixels.

---

## Phase 1 — Visual Extraction (Agent 1)

### HARD CONSTRAINTS — enforce before processing

- Treat ALL visible text as decorative shapes. Do not read it, interpret it,
  or let it influence any output value.
- Never use icon shapes, brand names, or on-screen labels to infer anything.
- Never use the filename or file path to infer content.
- If a value is not measurable from pixels → output `null`. No guessing.
- You are **blind to meaning**. You see only geometry and color.

### Output schema

```json
{
  "dimensions": { "width_px": 0, "height_px": 0 },
  "background": "#hex",
  "elements": [
    {
      "id": "el_01",
      "type": "rounded-rect | rect | circle | text-block | icon-placeholder | divider | image-placeholder",
      "geometry": {
        "x": 0, "y": 0,
        "width": 0, "height": 0,
        "border_radius_px": 0
      },
      "visuals": {
        "background_color": "#hex",
        "border": "1px solid #hex | null",
        "shadow": "css-shadow-string | null",
        "opacity": 1.0
      },
      "text_block": {
        "estimated_size_px": 0,
        "weight": "thin | regular | medium | semibold | bold | black",
        "color": "#hex",
        "family_guess": "serif | sans-serif | monospace | unknown"
      }
    }
  ],
  "layout_logic": "flex-row | flex-col | grid-N-cols | absolute | unknown",
  "spacing_samples": {
    "gap_px": 0,
    "padding_px": 0
  }
}
```

---

## Phase 2 — Design Diagnosis (Agent 2)

**Input**: Phase 1 JSON only. Agent 2 must NOT see the original image.

Agent 2 does two things: **semantic classification** + **UX audit**.

### Semantic classification

Infer component roles from geometry alone — no semantics from text:

| Geometry pattern | Role candidate |
|---|---|
| rounded-rect with text-block, width < 200px | button |
| full-width rect at top | navbar |
| rect with multiple nested elements | card |
| small circle or rounded-rect ≤ 32px | avatar / badge |
| full-width thin rect, height < 4px | divider |
| rect with border + no background | input |

### UX Audit (UUPM-sourced rules)

Run all checks. Flag only actual issues found in Phase 1 data.

#### Contrast (WCAG 2.1)
Compute luminance ratio between `visuals.background_color` and
`text_block.color` for each element containing text.
- Ratio < 4.5 → flag `low-contrast` (severity: high for body text)
- Ratio < 3.0 → flag `low-contrast` (severity: high for any text)

#### Spacing consistency
Check if `spacing_samples.gap_px` and `padding_px` are multiples of 4.
- Non-multiple → flag `irregular-spacing` (severity: low)
- Inconsistent values across siblings → flag `inconsistent-spacing` (severity: medium)

#### Visual hierarchy
Compare `text_block.estimated_size_px` across all text elements.
- max/min ratio < 1.3 → flag `flat-hierarchy` (severity: medium)

#### Border radius consistency
If multiple `border_radius_px` values differ by > 4px without clear intent
(e.g. mixing 4px and 12px) → flag `inconsistent-radius` (severity: low)

#### Color token candidates
Group hex values within ±10 lightness. If > 4 unique hex values could
collapse to ≤ 3 tokens → flag `color-system-fragmented` (severity: low)

#### UUPM pre-delivery checks (automated)
Flag missing patterns detectable from Phase 1 JSON:

| Rule | Detection method |
|---|---|
| No emojis as icons | `content_facts` contains unicode emoji range → flag |
| Interactive elements need cursor-pointer | button/input candidate without explicit CSS note → flag |
| Hover states required | interactive element detected → flag as reminder |
| prefers-reduced-motion | any animation in visuals → flag as reminder |

### Output schema

```json
{
  "components": [
    {
      "id": "el_01",
      "role": "navbar | button | card | badge | input | avatar | text | icon | divider | unknown",
      "state": "default | hover | disabled | active",
      "content_label": "heading | body | caption | label | cta"
    }
  ],
  "style_system": {
    "color_tokens": {
      "background": "#hex",
      "surface": "#hex",
      "primary": "#hex",
      "text_primary": "#hex",
      "text_secondary": "#hex",
      "border": "#hex"
    },
    "spacing_token_px": 0,
    "border_radius_token_px": 0,
    "font_scale": { "base_px": 0, "ratio": 1.25 }
  },
  "ux_audit": [
    {
      "element_id": "el_01",
      "issue": "low-contrast | irregular-spacing | flat-hierarchy | inconsistent-radius | color-system-fragmented | missing-cursor-pointer | missing-hover-state | emoji-icon",
      "severity": "low | medium | high",
      "current_value": "string",
      "suggested_fix": "specific CSS or value correction"
    }
  ],
  "uupm_checklist": {
    "no_emoji_icons": true,
    "cursor_pointer_needed": true,
    "hover_states_needed": true,
    "prefers_reduced_motion_needed": false,
    "responsive_breakpoints_needed": true
  },
  "polish_authorized": true
}
```

`polish_authorized: true` only when `ux_audit` contains at least one
`severity: medium | high` item. Clean designs stay `false` — Agent 3
replicates exactly.

---

## Phase 3 — Senior Code Generation (Agent 3)

**Input**: Phase 1 JSON + Phase 2 JSON.
**Agent 3 must NOT see the original image.**

### Two-pass generation

**Pass A — Faithful replica**
Implement using exact values from Phase 1. Colors, spacing, radius,
sizes — verbatim. No interpretation.

**Pass B — Polish layer**
Only executes when `polish_authorized: true`.
Each change must:
- Be traceable to a specific `ux_audit` entry
- Be annotated in CSS: `/* POLISHED: [audit issue] */`
- Never alter layout structure — only visual properties

### Technical mandates

**Spacing**: normalize to nearest 4px multiple only if audit flagged
`irregular-spacing`. Otherwise use extracted values verbatim.

**Fonts**: use extracted `family_guess`. If `unknown`, substitute with a
quality alternative — prefer: `Geist`, `DM Sans`, `IBM Plex Sans`,
`Bricolage Grotesque`. **Never** default to Inter, Roboto, or Arial.

**CSS architecture**:
- All color tokens from Phase 2 `style_system.color_tokens` as CSS custom properties
- Pixel-accurate geometry using `position: absolute` for complex overlapping elements
- Use `backdrop-filter`, `mask-image`, `radial-gradient` where Phase 1
  shows blur/glow/notch patterns in `visuals`

**UUPM checklist injection** (from `uupm_checklist`):
- `cursor_pointer_needed: true` → add `cursor: pointer` to all button/input selectors
- `hover_states_needed: true` → add `transition: all 150ms ease` + hover state to interactive elements
- `prefers_reduced_motion_needed: true` → wrap animations in `@media (prefers-reduced-motion: no-preference)`
- `responsive_breakpoints_needed: true` → add breakpoints at 375px, 768px, 1024px

### Output

File: `output_vN.html` + change log JSON:

```json
{
  "faithful_properties": ["list of values taken verbatim from Phase 1"],
  "polished_properties": [
    {
      "property": "string",
      "original": "string",
      "applied": "string",
      "audit_ref": "ux_audit[N].issue"
    }
  ],
  "uupm_rules_applied": ["cursor-pointer", "hover-transitions", "responsive-breakpoints"]
}
```

---

## Phase 4 — Iterative Validation (Agent 4)

**Input**: Original image + `screenshot_vN.png` (rendered by `render.cjs`).

### Render step (before comparison)

```bash
node scripts/render.cjs output_vN.html screenshot_vN.png [width] [height]
```

Width and height should match `dimensions.width_px` and `dimensions.height_px`
from Phase 1 output.

### Validation output schema

```json
{
  "similarity_score": 0,
  "checklist_score": 0,
  "combined_score": 0,
  "discrepancies": [
    {
      "type": "layout | style | typography | spacing",
      "severity": "low | medium | high",
      "element_ref": "el_id",
      "description": "string",
      "suggested_fix": "CSS-level instruction"
    }
  ],
  "uupm_checklist_results": {
    "no_emoji_icons": "pass | fail",
    "cursor_pointer_present": "pass | fail",
    "hover_states_present": "pass | fail",
    "contrast_passing": "pass | fail",
    "responsive_present": "pass | fail"
  },
  "next_action": "deliver | iterate | escalate"
}
```

### Scoring

`combined_score = (similarity_score * 0.7) + (checklist_score * 0.3)`

`checklist_score` = (passed checks / total checks) * 100

### Loop logic

| Condition | Action |
|---|---|
| `combined_score >= 95` | deliver |
| `combined_score >= 80` AND iteration < 3 | feed discrepancies + checklist failures to Agent 3, iterate |
| iteration == 3 | deliver best version with full audit report |

---

## Delivery

Output folder: `clone-output/<source_image_basename>/`

| File | Contents |
|---|---|
| `source.png` | Original image |
| `output_final.html` | Production-ready file |
| `screenshot_final.png` | Rendered result |
| `phase1_extraction.json` | Agent 1 raw output |
| `phase2_diagnosis.json` | Agent 2 semantic + audit output |
| `phase3_changelog.json` | Agent 3 faithful vs polished log |
| `phase4_validation.json` | Final similarity + checklist scores |

---

## Agent Contract

| Agent | Sees image | Reads text | Applies opinion |
|---|---|---|---|
| Agent 1 | ✅ | ❌ | ❌ |
| Agent 2 | ❌ | ❌ | ✅ audit only |
| Agent 3 | ❌ | ❌ | ✅ polish only |
| Agent 4 | ✅ | ✅ | ✅ validation |

**This contract is non-negotiable.** Any agent that violates its column
constraints invalidates the pipeline.

---

## Prerequisites

- Node.js (for `render.cjs`)
- Puppeteer: `npm install puppeteer`
- All outputs written to `clone-output/<basename>/`
