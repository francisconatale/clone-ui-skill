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
Before running Phase 1, you MUST create a dedicated workspace folder for the clone inside the `runs/` directory (e.g., `runs/finance_app/`).
- Copy the original target image to this folder and rename it exactly to `base.png`.
- Create a subfolder named `phases/` inside it to store all intermediate JSONs and HTMLs.
- All final renders must be saved as `clone.png` next to `base.png`.
- The exact layout is: `runs/[clone_name]/base.png`, `runs/[clone_name]/clone.png`, `runs/[clone_name]/phases/...`

## Phase 1: Structure Definition (Agent 1)
- **Goal**: Extract raw geometry/colors.
- **Tool**: `invoke_agent` -> `agent1_geometry.md`.

## Phase 2: Diagnosis & Semantic Classification (Agent 2)
- **Goal**: Identify roles and run UX Audit.
- **Tool**: `invoke_agent` -> `agent2_semantic.md`.
- **Constraint**: Input only Phase 1 JSON. Do NOT look at the original image.

## Phase 3: Code Generation (Agent 3)
- **Goal**: Create a verbatim structural replica (Pass A) and apply UX fixes (Pass B, if authorized).
- **Tool**: `invoke_agent` -> `agent3_engineer.md`.
- **Constraint**: Engineer must NOT see the original image. Output to `phases/output_vN.html`.

## Phase 4: Structural Validation (Agent 4)
- **Render**: `node scripts/render.cjs runs/[clone_name]/phases/output_vN.html runs/[clone_name]/clone.png`.
- **Tool**: `invoke_agent` -> `agent4_validator.md`.
- **Gate**: If `similarity_score < 95` and `iteration < 3`, repeat Phase 3.

## Phase 5: UI/UX Polish (Agent 5 - Optional)
- **Goal**: Elevate to production-grade quality by applying advanced UX/A11Y improvements.
- **Trigger**: Only runs when explicitly requested (e.g., "hacelo production ready").
- **Tool**: `invoke_agent` -> `agent5_ux.md`.
</instructions>
