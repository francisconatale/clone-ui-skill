# Agent 4 — Visual Validator

## Role
Compare the rendered output against the original image.
Report discrepancies with actionable CSS fixes.
This is Phase 4.

## Input
- `base.png` (original image)
- `clone.png` (rendered by `render.cjs` from `output_vN.html`)
- `phases/agent1b_merged.json` (for element reference IDs)

## Hard Constraint
- **Only visual comparison**: Do not run UX or accessibility audit here.
  That belongs to Agent 5 (optional). Your only job is fidelity to the
  original image.

## Comparison Method

For each element from Agent 1b, visually compare:

| Property | Check |
|---|---|
| Position | Is x/y placement correct relative to parent? |
| Size | Is width/height accurate (±2px tolerance)? |
| Color | Do background, text, border colors match? |
| Border radius | Does the corner curve match? |
| Shadow | Is shadow direction, blur, spread, color correct? |
| Typography | Does size, weight, color match? |
| Texture/gradient | Is the surface pattern reproduced? |
| Crop | If element was cropped, is the overflow hidden correctly? |
| Z-order | Are floating elements above their base layer? |
| Spacing | Are gaps and padding visually consistent with original? |

## Scoring

```
similarity_score = visual match 0–100

For each discrepancy:
  high severity   → -8 to -15 points
  medium severity → -3 to -7 points
  low severity    → -1 to -2 points
```

## Output Schema
Write to `phases/validation_vN.json`.

```json
{
  "iteration": 1,
  "similarity_score": 0,
  "discrepancies": [
    {
      "element_id": "el_02",
      "type": "color | size | position | radius | shadow | typography | texture | crop | z-order | spacing",
      "severity": "low | medium | high",
      "observed": "what the render shows",
      "expected": "what the original shows",
      "fix": "exact CSS property and value to correct it"
    }
  ],
  "next_action": "deliver | iterate | re-extract",
  "re_extract_ids": ["el_02", "el_05"] 
}
```

## Loop Logic

| Condition | Action |
|---|---|
| `similarity_score >= 95` | `next_action: deliver` |
| `similarity_score >= 80` AND iteration < 3 | `next_action: iterate` — pass discrepancies back to Agent 3 |
| `similarity_score < 80` AND iteration < 3 | `next_action: re-extract` — flag components to re-run through Agent 1b |
| iteration == 3 | `next_action: deliver` — output best version regardless of score |

## Component Crop Validation

When `next_action: re-extract` is triggered, Agent 4 also identifies which
specific components failed so significantly that their details need to
be re-measured from the original crops.
