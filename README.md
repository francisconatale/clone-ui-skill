# clone-ui-skill

> Multi-agent pipeline to clone UI screenshots into production-grade code with ≥ 95% visual fidelity.

---

## What it does

`clone-ui-skill` takes a screenshot of any UI and automatically converts it into clean, faithful HTML/CSS code using a 4-agent pipeline. Each agent has a specific, isolated role — from geometry extraction to final visual scoring — ensuring high accuracy and maintainability.

---

## Structure

```
clone-ui-skill/
├── clone-ui/
│   ├── SKILL.md              ← Main skill definition (agents 1–4 + delivery spec)
│   └── scripts/
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

Or install Puppeteer directly:

```bash
npm install puppeteer
```

---

## How the pipeline works

The pipeline runs 4 specialized agents in sequence:

| Agent | Role | Notes |
|-------|------|-------|
| **Agent 1** | Raw geometry & color extraction | Text-blind — focuses purely on layout and visual structure |
| **Agent 2** | Component classification + UX audit | Never sees the image — works from structured JSON. Checks WCAG contrast, spacing, hierarchy |
| **Agent 3** | HTML/CSS generation | Builds faithful code from Agent 2's JSON. Applies polish only where the audit authorized it |
| **Agent 4** | Visual scoring & compliance check | Renders via `render.cjs`, then the AI compares both PNGs visually and emits a semantic similarity score + diff description |

### Pipeline diagram

```
┌─────────────────────────────┐
│         UI screenshot       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│    Agent 1 — Visual         │
│    extraction               │
│                             │
│  Geometry, colors, layout   │
│    Text-blind               │
└──────────────┬──────────────┘
               │  JSON layout
               ▼
┌─────────────────────────────┐
│    Agent 2 — Classification │
│    + UX audit               │
│                             │
│  Components, WCAG, spacing  │
│    Never sees the image     │
└──────────────┬──────────────┘
               │  JSON + audit report
               ▼
  ┌────────────────────────────────────────────────────┐
  │                                                    │
  ▼                                              retry + diff
┌─────────────────────────────┐                (score < 95%)
│    Agent 3 — HTML/CSS       │                       │
│    generation               │                       │
│                             │                       │
│  Faithful code from JSON    │                       │
│  Applies feedback on retry  │                       │
└──────────────┬──────────────┘                       │
               │  output_vN.html                      │
               ▼                                      │
┌─────────────────────────────┐         ┌─────────────┐ │
│    Agent 4 — Render         │◄────────│  render.cjs │ │
│    + scoring                │         └─────────────┘ │
│                             │                         │
│  AI visual comparison       │                         │
│  → semantic diff report     │                         │
└──────────────┬──────────────┘                         │
               │                                        │
               ▼                                        │
          ┌─────────┐   score < 95%                     │
          │  ≥ 95%? ├───────────────────────────────────┘
          └────┬────┘
               │ score ≥ 95%
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

## Tech stack

- **JavaScript / Node.js**
- **Puppeteer** — headless browser rendering
- **AI model** — multi-agent orchestration via skill definitions

---

---

## Tested on

Developed and tested using **Gemini CLI** with `auto` model routing. No heavy models or extended thinking required — the pipeline is designed to run efficiently on standard inference, keeping latency and cost low across all agents.

---

