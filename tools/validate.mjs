import { readFile, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { relative, isAbsolute, sep } from "node:path";
import scenario from "../DocRoot/js/scenario.js";

const { parseData, validateManifest, validateCatalog, validatePart } = scenario;

const root = new URL("../DocRoot/", import.meta.url);
const data = new URL("data/", root);
const warnings = [];

async function readData(path) {
  try {
    const source = await readFile(new URL(path, data), "utf8");
    const payload = /^\s*StoryWalkScenario\.register\(([\s\S]*)\);\s*$/.exec(source);
    if (!payload) throw new Error("データを StoryWalkScenario.register(...); で囲んでください");
    return parseData(payload[1]);
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

function metadata(bytes) {
  if (bytes.length >= 26 && bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20),
      transparent: [4, 6].includes(bytes[25]) || bytes.includes(Buffer.from("tRNS")) };
  }
  if (bytes.length > 4 && bytes.readUInt16BE(0) === 0xffd8) {
    for (let offset = 2; offset + 8 < bytes.length;) {
      if (bytes[offset++] !== 0xff) break;
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (offset + 7 >= bytes.length || marker === 0xda || marker === 0xd9) break;
      const length = bytes.readUInt16BE(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 7) {
        return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3), transparent: false };
      }
      offset += length;
    }
  }
  return {};
}

async function image(file, realRoot) {
  try {
    const target = await realpath(fileURLToPath(new URL(file, root)));
    const path = relative(realRoot, target);
    if (path === ".." || path.startsWith(".." + sep) || isAbsolute(path)) throw new Error("DocRoot の外を参照しています");
    const bytes = await readFile(target);
    if (!bytes.length) throw new Error("空のファイルです");
    return metadata(bytes);
  } catch (error) {
    throw new Error(`${file}: ${error.message}`);
  }
}

function checkBranches(parts, start) {
  const visited = new Set();
  const visiting = new Set();
  function walk(id) {
    if (!parts.has(id) || visited.has(id)) return;
    visiting.add(id);
    for (const { next } of parts.get(id).steps.at(-1).options ?? []) {
      if (visiting.has(next)) warnings.push(`循環する分岐を確認してください: ${id} → ${next}`);
      else walk(next);
    }
    visiting.delete(id);
    visited.add(id);
  }
  walk(start);
  for (const id of parts.keys()) {
    if (!visited.has(id)) warnings.push(`開始パートから到達できません: ${id}`);
  }
  for (const id of parts.keys()) walk(id);
}

async function main() {
  const manifest = await readData("manifest.js");
  validateManifest(manifest);
  const [world, backgroundsFile, characterEntries] = await Promise.all([
    readData("world.js"), readData("backgrounds.js"),
    Promise.all(manifest.characters.map(async id => [id, await readData(`characters/${id}.js`)]))
  ]);
  const characters = Object.fromEntries(characterEntries);
  const backgrounds = validateCatalog(world, backgroundsFile, characters);
  const parts = new Map();
  for (const [id, entry] of Object.entries(manifest.parts)) {
    if (entry.status === "published") {
      parts.set(id, validatePart(await readData(entry.file), id, { manifest, backgrounds, characters }));
    }
  }
  checkBranches(parts, manifest.startPart);
  const realRoot = await realpath(fileURLToPath(root));
  for (const { file } of Object.values(backgrounds)) {
    const { width, height } = await image(file, realRoot);
    // Asset policy: 720×1280 canvas, approximately 90% source-to-canvas scale.
    // See docs/story/assets.md for rounding and portrait sizing rules.
    if (width !== 800 || height !== 1422) {
      throw new Error(`背景は 800×1422 に統一してください: ${file} (${width}×${height})`);
    }
  }
  for (const { visual } of Object.values(characters)) {
    const images = new Map();
    const expectedHeight = Math.round(1280 * .72 * (visual.defaultScale ?? 1) / .9);
    for (const [expression, file] of Object.entries(visual.expressions)) {
      const info = await image(file, realRoot);
      if (!info.width || info.height !== expectedHeight) {
        throw new Error(`立ち絵は描画時に約90％になる高さ ${expectedHeight}px に統一してください: ${file} (${info.width}×${info.height})`);
      }
      images.set(expression, info);
      if (info.transparent === false) warnings.push(`立ち絵の透過形式を確認してください: ${file}`);
    }
    const normal = images.get("normal");
    for (const [expression, info] of images) {
      if (normal.width && info.width && (info.width !== normal.width || info.height !== normal.height)) {
        warnings.push(`表情差分の画像サイズが通常表情と異なります: ${visual.expressions[expression]}`);
      }
    }
  }
  warnings.forEach(warning => console.warn("警告 " + warning));
  console.log(`検証 OK  公開パート ${parts.size} 件、キャラクター ${manifest.characters.length} 件、警告 ${warnings.length} 件`);
}

main().catch(error => {
  console.error("検証エラー " + error.message);
  process.exitCode = 1;
});
