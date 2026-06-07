#!/usr/bin/env node
/**
 * crop.cjs
 * Cuts base.png into individual component crops using Agent 1a bounding boxes.
 *
 * Usage:
 *   node scripts/crop.cjs <agent1a_json_path> <base_image_path> <output_dir>
 *
 * Example:
 *   node scripts/crop.cjs runs/my_app/phases/agent1a.json runs/my_app/base.png runs/my_app/phases/crops/
 *
 * Output:
 *   crops/el_01.png
 *   crops/el_02.png
 *   crops/el_01_c01.png  ← children get their own crop too
 *   crops/manifest.json  ← maps each crop file to its component id and absolute coords
 */

const fs   = require("fs");
const path = require("path");

// ─── dependency check ────────────────────────────────────────────────────────
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error(
    "Missing dependency: sharp\n" +
    "Run: npm install sharp\n" +
    "Then retry."
  );
  process.exit(1);
}

// ─── args ─────────────────────────────────────────────────────────────────────
const [,, jsonPath, imagePath, outputDir] = process.argv;

if (!jsonPath || !imagePath || !outputDir) {
  console.error(
    "Usage: node scripts/crop.cjs <agent1a_json> <base_image> <output_dir>"
  );
  process.exit(1);
}

if (!fs.existsSync(jsonPath)) {
  console.error(`JSON not found: ${jsonPath}`);
  process.exit(1);
}

if (!fs.existsSync(imagePath)) {
  console.error(`Image not found: ${imagePath}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

// ─── load data ────────────────────────────────────────────────────────────────
const agent1a   = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const imgWidth  = agent1a.dimensions.width_px;
const imgHeight = agent1a.dimensions.height_px;

const PADDING = 8; // px added around each crop for context

// ─── helpers ─────────────────────────────────────────────────────────────────
/**
 * Clamp and add padding to a bounding box.
 * @param {object} bb    - { x, y, width, height } in absolute image coords
 * @param {number} pad   - padding in px
 */
function safeCrop(bb, pad = PADDING) {
  const left   = Math.max(0, Math.floor(bb.x - pad));
  const top    = Math.max(0, Math.floor(bb.y - pad));
  const right  = Math.min(imgWidth,  Math.ceil(bb.x + bb.width  + pad));
  const bottom = Math.min(imgHeight, Math.ceil(bb.y + bb.height + pad));
  return {
    left,
    top,
    width:  right - left,
    height: bottom - top,
  };
}

/**
 * Crop and save one region.
 */
async function cropAndSave(id, absoluteBB) {
  const region   = safeCrop(absoluteBB);
  const outFile  = path.join(outputDir, `${id}.png`);

  await sharp(imagePath)
    .extract(region)
    .toFile(outFile);

  return { id, file: outFile, region, original_bb: absoluteBB };
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const manifest = [];

  for (const component of agent1a.components) {
    const { id, bounding_box: bb, children = [] } = component;

    // top-level crop
    const entry = await cropAndSave(id, bb);
    manifest.push(entry);
    console.log(`✓ ${id}.png`);

    // children crops — coords are relative to parent, convert to absolute
    for (const child of children) {
      const absoluteChildBB = {
        x:      bb.x + child.bounding_box.x,
        y:      bb.y + child.bounding_box.y,
        width:  child.bounding_box.width,
        height: child.bounding_box.height,
      };
      const childEntry = await cropAndSave(child.id, absoluteChildBB);
      manifest.push(childEntry);
      console.log(`  ✓ ${child.id}.png`);
    }
  }

  // write manifest
  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved: ${manifestPath}`);
  console.log(`Total crops: ${manifest.length}`);
}

main().catch(err => {
  console.error("crop.cjs failed:", err.message);
  process.exit(1);
});
