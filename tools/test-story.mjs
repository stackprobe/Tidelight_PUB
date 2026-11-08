import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
import scenario from "../DocRoot/js/scenario.js";

// Exercise the real loader, game controller and Cookie save code with a minimal
// DOM and scene adapter. This verifies progression, not browser layout/rendering.
const root = new URL("../DocRoot/", import.meta.url);
const source = path => readFileSync(new URL(path, root), "utf8");
const data = path => scenario.parseData(/^\s*StoryWalkScenario\.register\(([\s\S]*)\);\s*$/.exec(source(`data/${path}`))[1]);
const manifest = data("manifest.js");
const parts = Object.fromEntries(Object.entries(manifest.parts).map(([id, entry]) => {
  assert.equal(entry.status, "published", `${id} is still planned`);
  return [id, data(entry.file)];
}));
const catalog = {
  manifest,
  backgrounds: data("backgrounds.js").backgrounds,
  characters: Object.fromEntries(manifest.characters.map(id => [id, data(`characters/${id}.js`)]))
};
const routes = [];
function visit(id, path = [], seen = new Set()) {
  assert.ok(!seen.has(id), `Cycle: ${id}`);
  const last = parts[id].steps.at(-1);
  if (last.type === "end") routes.push({ path, ending: id });
  else last.options.forEach((option, index) => visit(option.next,
    [...path, index], new Set([...seen, id])));
}
visit(manifest.startPart);
assert.equal(new Set(routes.map(route => route.ending)).size, 6);
const incoming = new Map();
assert.deepEqual(manifest.characters, ["mio", "ren", "sayo"]);
for (const part of Object.values(parts)) {
  scenario.validatePart(part, part.id, catalog);
  const visible = new Map();
  for (const step of part.steps) {
    if (step.type === "character.show") {
      assert.ok(![...visible.values()].includes(step.position), `${part.id}/${step.id}: overlapping portraits`);
      visible.set(step.character, step.position);
      assert.ok(visible.size <= 2, `${part.id}/${step.id}: too many portraits`);
    } else if (step.type === "character.hide") visible.delete(step.character);
    else if (step.type === "dialogue" && step.speaker !== null) {
      assert.ok(visible.has(step.speaker), `${part.id}/${step.id}: speaker must be visible`);
    }
  }
  for (const { next } of part.steps.at(-1).options ?? []) incoming.set(next, (incoming.get(next) ?? 0) + 1);
}
for (const id of Object.keys(parts).filter(id => id >= "part_004")) {
  assert.equal(incoming.get(id), 1, `New branch merges at ${id}`);
}
const sample = structuredClone(parts.part_007);
sample.steps.at(-1).text = "";
assert.throws(() => scenario.validatePart(sample, sample.id, catalog), /結末/);
sample.steps.at(-1).text = "END";
sample.steps.push({ id: "after_end", type: "dialogue", speaker: null, text: "invalid" });
assert.throws(() => scenario.validatePart(sample, sample.id, catalog), /末尾/);

async function boot(cookie = "", protocol = "http:", manualTyping = false) {
  const elements = new Map();
  let context;
  let cookieValue = cookie;
  const rendered = new Map();
  let background;
  const errors = [];
  const visibilityChanges = [];
  const timers = new Map();
  let now = 0;
  let timerId = 0;
  function tick(duration) {
    const end = now + duration;
    while (timers.size) {
      const [id, timer] = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (timer.at > end) break;
      now = timer.at;
      timers.delete(id);
      timer.callback();
    }
    now = end;
  }
  const doc = {
    currentScript: { src: new URL("js/scenario.js", root).href },
    activeElement: null,
    listeners: {},
    addEventListener(type, handler) { this.listeners[type] = handler; },
    getElementById(id) { return elements.get(id); },
    createElement() { return { remove() {} }; },
    head: { append(script) {
      queueMicrotask(() => {
        doc.currentScript = script;
        vm.runInContext(readFileSync(new URL(script.src), "utf8"), context);
        script.onload();
      });
    } },
    get cookie() { return cookieValue; },
    set cookie(value) { cookieValue = value.split(";")[0]; }
  };
  function element(id) {
    const value = {
      id, hidden: true, disabled: false, textContent: "", style: {}, inert: false,
      scrollTop: 0, scrollHeight: 0, clientHeight: 0, listeners: {},
      classList: { add() {}, remove() {} },
      addEventListener(type, handler) { this.listeners[type] = handler; },
      setAttribute() {},
      focus() { doc.activeElement = this; },
      closest() { return null; },
      querySelector() { return this.label; }
    };
    let hidden = value.hidden;
    Object.defineProperty(value, "hidden", {
      get() { return hidden; },
      set(next) {
        visibilityChanges.push({ id, hidden: next });
        hidden = next;
      }
    });
    elements.set(id, value);
    return value;
  }
  for (const id of ["game", "scene", "title", "chapter", "part-id", "home", "start", "continue", "status", "message", "speaker", "line", "advance", "choices", "notice", "notice-close", "notice-title", "notice-text", "work-title", "subtitle"]) element(id);
  const buttons = [element("choice0"), element("choice1")];
  for (const button of buttons) button.label = { textContent: "" };
  elements.get("choices").querySelectorAll = () => buttons;
  const scene = {
    reset(keep) { rendered.clear(); if (!keep) background = undefined; },
    fadeOutCharacters() {},
    async background(image) { background = image.src; },
    async show(id, image, position) { rendered.set(id, { src: image.src, position }); },
    async hide(id) { rendered.delete(id); },
    async expression(id, image) { rendered.get(id).src = image.src; }
  };
  class Image {
    async decode() { assert.ok(existsSync(new URL(this.src)), `Missing image ${this.src}`); }
  }
  context = vm.createContext({
    document: doc, URL, Image, TextEncoder,
    setTimeout(callback, delay) {
      timers.set(++timerId, { callback, at: now + delay });
      return timerId;
    },
    clearTimeout(id) { timers.delete(id); },
    location: { protocol, href: `${protocol}//localhost/` },
    console: { error(error) { errors.push(error); } },
    StoryWalkScene: { createScene: () => scene, async animate(duration, render) { render(1); } }
  });
  for (const path of ["js/scenario.js", "js/save.js", "js/game.js"]) vm.runInContext(source(path), context);
  async function flush() {
    for (let count = 0; count < 20; count++) {
      await new Promise(resolve => setImmediate(resolve));
      if (!manualTyping) tick(100000);
    }
    assert.deepEqual(errors, []);
  }
  await flush();
  const el = id => elements.get(id);
  const snapshot = () => ({
    partId: el("part-id").textContent, partIdHidden: el("part-id").hidden,
    chapter: el("chapter").textContent, line: el("line").textContent,
    speaker: el("speaker").textContent, choices: !el("choices").hidden,
    notice: !el("notice").hidden, ending: el("notice-text").textContent,
    rendered: [...rendered], background
  });
  async function click(id) {
    const target = el(id);
    assert.ok(!target.disabled, `Disabled: ${id}`);
    await target.listeners.click({ target });
    await flush();
  }
  async function key(key) {
    doc.listeners.keydown({ key, code: key, preventDefault() {} });
    await flush();
  }
  async function tap(targetId = "advance") {
    el("game").listeners.click({ target: el(targetId) });
    await flush();
  }
  return { el, click, key, tap, tick, snapshot, visibilityChanges, cookie: () => cookieValue,
    saved: () => vm.runInContext("StoryWalkSave.readSave()", context),
    pendingTimers: () => timers.size };
}

// Deterministic clock: gradual display, input-to-complete, cancellation and resume.
const typing = await boot("", "http:", true);
await typing.click("start");
const firstDialogue = parts.part_001.steps.find(step => step.type === "dialogue");
const graphemes = Array.from(new Intl.Segmenter("ja", { granularity: "grapheme" })
  .segment(firstDialogue.text), item => item.segment);
assert.equal(typing.el("line").textContent, graphemes[0]);
typing.tick(34);
assert.equal(typing.el("line").textContent, graphemes[0]);
typing.tick(1);
assert.equal(typing.el("line").textContent, graphemes.slice(0, 2).join(""));
const firstCookie = typing.cookie();
await typing.tap();
assert.equal(typing.el("line").textContent, firstDialogue.text);
assert.equal(typing.cookie(), firstCookie, "Completing text must not advance the story");
assert.equal(typing.pendingTimers(), 0);
typing.tick(100000);
assert.equal(typing.el("line").textContent, firstDialogue.text, "Completed text must stay visible");
await typing.key("Enter");
const secondDialogue = parts.part_001.steps.filter(step => step.type === "dialogue")[1];
assert.equal(typing.el("line").textContent, Array.from(secondDialogue.text)[0]);
await typing.key("Space");
assert.equal(typing.el("line").textContent, secondDialogue.text);
assert.equal(typing.pendingTimers(), 0);
await typing.key("Enter");
assert.equal(typing.pendingTimers(), 1);
await typing.click("home");
assert.equal(typing.pendingTimers(), 0);
const hiddenLine = typing.el("line").textContent;
typing.tick(100000);
assert.equal(typing.el("line").textContent, hiddenLine, "Title must cancel old text callbacks");
await typing.click("continue");
assert.equal(typing.pendingTimers(), 1, "Only the resumed dialogue should animate");
typing.tick(100000);
const resumedText = typing.el("line").textContent;
assert.equal(resumedText, parts.part_001.steps.filter(step => step.type === "dialogue")[2].text);
assert.equal(typing.pendingTimers(), 0);
typing.tick(100000);
assert.equal(typing.el("line").textContent, resumedText);
console.log("文字送り OK: 35ms間隔、全文表示、次へ、タイマー停止、再開後の表示保持。");

let checkpoints = 0;
const restoredDialogues = new Set();
for (const route of routes) {
  const game = await boot();
  await game.click("start");
  let decision = 0;
  for (let count = 0; count < 160; count++) {
    assert.equal(game.el("part-id").textContent, game.saved().partId);
    assert.equal(game.el("part-id").hidden, false);
    if (!game.el("notice").hidden) break;
    if (!game.el("choices").hidden) {
      // Check restoration of the two choices, text, portraits and background.
      const restored = await boot(game.cookie());
      await restored.click("continue");
      assert.deepEqual(restored.snapshot(), game.snapshot());
      checkpoints++;
      const beforeTransition = game.visibilityChanges.length;
      await game.key(String(route.path[decision++] + 1));
      assert.deepEqual(game.visibilityChanges.slice(beforeTransition).filter(change =>
        ["message", "chapter", "part-id"].includes(change.id) && change.hidden), [],
      "Part transitions must keep the dialogue and headings visible, including during loading");
    } else {
      assert.ok(!game.el("advance").hidden);
      const saved = game.saved();
      const step = parts[saved.partId].steps.find(step => step.id === saved.stepId);
      assert.equal(step.type, "dialogue");
      assert.equal(game.el("line").textContent, step.text);
      assert.equal(game.el("speaker").textContent, step.speaker === null ? "" : catalog.characters[step.speaker].name);
      const key = `${saved.partId}/${saved.stepId}`;
      if (!restoredDialogues.has(key)) {
        const restored = await boot(game.cookie());
        await restored.click("continue");
        assert.deepEqual(restored.snapshot(), game.snapshot());
        restoredDialogues.add(key);
        checkpoints++;
      }
      await game.key("Enter");
    }
  }
  assert.equal(decision, route.path.length);
  assert.equal(game.el("notice-text").textContent, parts[route.ending].steps.at(-1).text);
  assert.equal(game.el("notice-close").textContent, "タイトルへ");
  const restored = await boot(game.cookie());
  await restored.click("continue");
  assert.deepEqual(restored.snapshot(), game.snapshot());
  checkpoints++;
  await game.click("notice-close");
  assert.equal(game.el("title").hidden, false);
  assert.equal(game.el("part-id").hidden, true);
  assert.equal(game.el("title").inert, false);
  await game.click("start");
  assert.equal(game.el("chapter").textContent, parts.part_001.title);
}
const localFile = await boot("", "file:");
await localFile.click("start");
assert.equal(localFile.cookie(), "");
assert.equal(restoredDialogues.size, Object.values(parts).reduce((n, part) =>
  n + part.steps.filter(step => step.type === "dialogue").length, 0));
console.log(`進行・結末・再開 OK: ${routes.length} 経路、6 結末、全${restoredDialogues.size}会話、${checkpoints} 保存地点。追加分岐の合流なし。`);
