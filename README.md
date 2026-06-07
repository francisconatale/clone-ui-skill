# clone-ui-skill

> Multi-agent pipeline to clone UI screenshots into production-grade code with ≥ 95% visual fidelity.

---

## What it does

`clone-ui-skill` takes a screenshot of any UI and automatically converts it into clean, faithful HTML/CSS code using a 5-phase multi-agent pipeline. Each agent has a specific, isolated role — from geometry extraction to final visual scoring — ensuring high accuracy and maintainability.

---

## Structure

```
clone-ui-skill/
├── clone-ui/
│   ├── SKILL.md              ← Main skill definition
│   ├── agents/               ← Instruction files for each phase
│   │   ├── agent1a_macro.md  ← Phase 1a: Macro layout scan
│   │   ├── agent1b_micro.md  ← Phase 1c: Micro detail extraction
│   │   ├── agent2_semantic.md ← Phase 2: Semantic mapping
│   │   ├── agent3_builder.md  ← Phase 3: HTML/CSS generation
│   │   ├── agent4_validator.md ← Phase 4: Visual validation
│   │   └── agent5_ux.md      ← Phase 5: UX polish (optional)
│   └── scripts/
│       ├── crop.cjs          ← Component cropper
│       └── render.cjs        ← Puppeteer screenshot renderer
├── uses/                     ← Usage examples
├── package.json
└── .gitignore
```

---

## Prerequisites

Node.js and Puppeteer are required to render and compare screenshots.

```bash
npm install
```

---

## Divide & Conquer: Component-Level Analysis

Unlike standard "one-shot" AI coding, `clone-ui-skill` uses a **recursive extraction strategy** to achieve near-perfect fidelity:

1.  **Macro Mapping (Agent 1a)**: First, the entire UI is scanned to identify the geometry of all top-level components.
2.  **Component Isolation (Crop Script)**: The system automatically generates **individual PNG screenshots (crops)** for every single component identified.
3.  **Micro Detail (Agent 1b)**: Agent 1b is invoked **for each individual crop**. Because it only looks at one small component at a time, it can "zoom in" to accurately sample:
    *   Exact background colors and gradients.
    *   Subtle inner and outer shadows.
    *   Precise font weights and sizes.
    *   Border radii and line weights.
4.  **Merged Vision**: These individual data points are merged into a single layout file, providing Agent 3 with an ultra-high-resolution blueprint.

---

## How the pipeline works

The pipeline runs 5 specialized agents in sequence:

| Agent | Role | Notes |
|-------|------|-------|
| **Agent 1a** | Macro Layout Scan | Identifies bounding boxes of top-level components. |
| **Agent 1b** | Micro Detail Extractor | Extracts deep visual details (colors, fonts, shadows) from individual component crops. |
| **Agent 2** | Semantic Mapper | Maps geometry to component roles (button, card, navbar). Never sees the image. |
| **Agent 3** | Faithful Builder | Builds a verbatim structural replica in HTML/CSS from extracted data. |
| **Agent 4** | Visual Validator | Compares render against original, calculates similarity, and identifies discrepancies. |
| **Agent 5** | UX Architect | (Optional) Elevates the replica to production-grade quality with accessibility and interaction polish. |

### Pipeline diagram

```
┌─────────────────────────────┐
│         UI screenshot       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│    Agent 1a — Macro Layout  │
│                             │
│  Bounding boxes of regions  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│    Crop Script — component  │
│    isolation                │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│    Agent 1b — Micro Detail  │
│                             │
│  Colors, Typography, Shadow │
└──────────────┬──────────────┘
               │  JSON (merged)
               ▼
┌─────────────────────────────┐
│    Agent 2 — Semantic       │
│    Mapping                  │
│                             │
│  Role inference (no image)  │
└──────────────┬──────────────┘
               │  JSON + metadata
               ▼
┌─────────────────────────────┐
│    Agent 3 — Faithful       │
│    Builder                  │
│                             │
│  verbatim HTML/CSS replica  │
└──────────────┬──────────────┘
               │  output_vN.html
               ▼
┌─────────────────────────────┐         ┌─────────────┐
│    Agent 4 — Visual         │◄────────│  render.cjs │
│    Validation               │         └─────────────┘
│                             │                ▲
│  Similarity score & diff    │                │
└──────────────┬──────────────┘                │
               │                               │
               ▼                               │
          ┌─────────┐   score < 95%            │
          │  ≥ 95%? ├──────────────────────────┘
          └────┬────┘
               │ score ≥ 95%
               ▼
┌─────────────────────────────┐
│    Agent 5 — UX Architect   │
│    (Optional Polish)        │
│                             │
│  Accessibility, Interaction │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   clone-output/<session>/   │
└─────────────────────────────┘
```

Output is written to:

```
clone-output/<session-id>/
```

---

## Renderer

The skill defines the agent pipeline and the contracts between agents — it is **renderer-agnostic**. Each CLI or environment is responsible for adapting the render step to its own tooling.

The only contract Agent 4 expects is:

> Given an HTML file, produce a PNG screenshot at a known path.

`render.cjs` is the **reference implementation** using Puppeteer, but nothing stops you from replacing it with Playwright, a screenshot API, a headless browser service, or any other tool that satisfies the same contract.

### Reference implementation (Puppeteer)

```bash
node clone-ui/scripts/render.cjs output_v1.html screenshot_v1.png [width] [height]
```

**Defaults:** `1200 × 800` viewport @ `2x` device scale factor.

| Argument | Description | Default |
|----------|-------------|---------|
| `output_v1.html` | HTML file to render | required |
| `screenshot_v1.png` | Output screenshot path | required |
| `width` | Viewport width in px | `1200` |
| `height` | Viewport height in px | `800` |

---

## Quick start

1. Clone the repo:
   ```bash
   git clone https://github.com/francisconatale/clone-ui-skill.git
   cd clone-ui-skill
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Load the skill into your AI environment and point it at a UI screenshot.

4. The pipeline will generate HTML/CSS output in `clone-output/`.

---

## Output quality

The pipeline targets **≥ 95% visual fidelity** to the source screenshot. There is no pixel-diff library involved — **the AI model is the comparator**.

Agent 4 receives both the original screenshot and the Puppeteer render as images, and evaluates them visually. The feedback it produces is semantic, not numeric — instead of "8% pixel mismatch in region (0,0,300,50)" it outputs something like *"the navbar padding is too tight and the background color doesn't match"*. That description is what gets passed back to Agent 3 to guide the next iteration.

---

## Pro-Tip: Skill Synergy

While `clone-ui-skill` is engineered for **exact structural and visual replication**, it works best when combined with other specialized skills:

💡 **Combine with `frontend-design`**: 
Once you have a faithful replica, use the `frontend-design` skill to elevate the aesthetics even further. While `clone-ui` gives you the "bones" and exact look of the original, `frontend-design` can help you refine the code architecture, add modern animations, or adapt the design into a broader design system.

---

## Tech stack

- **JavaScript / Node.js**
- **Puppeteer** — headless browser rendering
- **AI model** — multi-agent orchestration via skill definitions

---

---

## Tested on

Developed and tested using **Gemini CLI** with `auto` model routing. No heavy models or extended thinking required — the pipeline is designed to run efficiently on standard inference, keeping latency and cost low across all agents.

---

