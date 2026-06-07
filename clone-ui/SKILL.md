---
name: clone-ui
description: >
  Five-phase pipeline: Extract (Structure) -> Diagnosis & Semantic (Critic) -> Build (Engineer) -> 
  Validate -> Polish (UI/UX). Strict isolation between stages.
---

# clone-ui Skill

<instructions>
You are the **clone-ui Orchestrator**. You MUST strictly follow the order: Structural Fidelity FIRST, then UI/UX Polish.

## Phase 0: Workspace Initialization (Mandatory)
Before running Phase 1, create a dedicated workspace folder: `runs/[clone_name]/`.
- Copy the original target image → `runs/[clone_name]/base.png`
- Create `runs/[clone_name]/phases/` for all intermediate files
- Create `runs/[clone_name]/phases/crops/` for component crops
- Final render → `runs/[clone_name]/clone.png`

## Phase 1a: Macro Layout Scan (Agent 1a)
- **Goal**: Identify bounding boxes of every top-level component. No colors, no detail.
- **Tool**: `invoke_agent` → `agent1a_macro.md`
- **Input**: `base.png`
- **Output**: `phases/agent1a.json`

## Phase 1b: Crop Execution (Script)
- **Goal**: Cut `base.png` into individual component crops using Agent 1a bounding boxes.
- **Command**: `node scripts/crop.cjs phases/agent1a.json runs/[clone_name]/base.png runs/[clone_name]/phases/crops/`
- **Output**: `phases/crops/el_01.png`, `phases/crops/el_02.png` … + `phases/crops/manifest.json`

## Phase 1c: Micro Detail Extraction (Agent 1b — runs per crop)
- **Goal**: Extract deep visual detail from each individual crop.
- **Tool**: `invoke_agent` → `agent1b_micro.md`
- **Input**: ONE crop image at a time + the component's entry from `agent1a.json`
  (provides `absolute_position` context)
- **Output**: One JSON per component → `phases/agent1b_el_01.json`, `phases/agent1b_el_02.json` …
- **Merge**: After all crops are processed, merge all Agent 1b JSONs into
  `phases/agent1b_merged.json` maintaining the same element IDs.

## Phase 2: Semantic Classification (Agent 2)
- **Goal**: Map geometry to component roles.
- **Tool**: `invoke_agent` → `agent2_semantic.md`
- **Input**: `phases/agent1b_merged.json` only. Agent 2 must NOT see any image.
- **Output**: `phases/agent2.json`

## Phase 3: Code Generation (Agent 3)
- **Goal**: Build a verbatim structural replica.
- **Tool**: `invoke_agent` → `agent3_builder.md`
- **Input**: `phases/agent1b_merged.json` + `phases/agent2.json`. Agent 3 must NOT see any image.
- **Output**: `phases/output_v1.html`

## Phase 4: Structural Validation (Agent 4)
- **Render**: `node scripts/render.cjs runs/[clone_name]/phases/output_vN.html runs/[clone_name]/clone.png`
- **Tool**: `invoke_agent` → `agent4_validator.md`
- **Input**: `base.png` + `clone.png` + `phases/agent1b_merged.json`
- **Gate**:
  - `similarity_score >= 95` → `next_action: deliver`
  - `similarity_score >= 80` AND `iteration < 3` → `next_action: iterate` (pass discrepancies to Agent 3)
  - `similarity_score < 80` AND `iteration < 3` → `next_action: re-extract` (flag which components to re-run through Agent 1b)
  - `iteration == 3` → `next_action: deliver` regardless of score

## Phase 5: UI/UX Polish (Agent 5 — Optional)
- **Goal**: Elevate to production-grade quality.
- **Trigger**: Only runs when explicitly requested (e.g., "hacelo production ready").
- **Tool**: `invoke_agent` → `agent5_ux.md`
- **Input**: `phases/output_vN.html` + `phases/agent2.json`. Agent 5 must NOT see any image.
</instructions>
