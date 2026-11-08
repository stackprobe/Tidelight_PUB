(() => {
  "use strict";

  const ids = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
  const relative = /^(?:[\w-]+\/)*[\w-]+\.[\w-]+$/;
  const positions = ["left", "center", "right"];
  const scriptUrl = typeof document === "undefined" ? null : document.currentScript.src;
  const registered = new Map();

  function check(condition, message) {
    if (!condition) throw new Error(message);
  }

  const isText = value => typeof value === "string" && value.trim() !== "";
  const isId = value => typeof value === "string" && ids.test(value);
  const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const has = (object, key) => Object.hasOwn(object, key);

  function checkPath(path, prefix, extension) {
    check(typeof path === "string" && relative.test(path) && path.startsWith(prefix)
      && (!extension || path.endsWith(extension)), `無効な相対パス: ${path}`);
  }

  function version(data, name) {
    check(isObject(data) && data.schemaVersion === 1, `${name}: schemaVersion が未対応です`);
  }

  function parseData(text) {
    const value = JSON.parse(text);
    // JSON.parse alone silently discards repeated keys in a manifest.
    const objects = [];
    for (const [token, member] of text.matchAll(/("(?:[^"\\]|\\[\s\S])*")(\s*:)?|[{}\[\]]/g)) {
      if (token === "{" || token === "[") objects.push(new Set());
      else if (token === "}" || token === "]") objects.pop();
      else if (member && token.endsWith(":")) {
        const key = JSON.parse(member);
        const keys = objects.at(-1);
        check(!keys.has(key), `JSON のキーが重複しています: ${key}`);
        keys.add(key);
      }
    }
    return value;
  }

  function validateManifest(manifest) {
    version(manifest, "manifest");
    check(Array.isArray(manifest.characters) && manifest.characters.every(isId), "キャラクター一覧が不正です");
    check(new Set(manifest.characters).size === manifest.characters.length, "キャラクター ID が重複しています");
    check(isObject(manifest.parts) && isId(manifest.startPart), "パート一覧または開始 ID が不正です");
    for (const [id, part] of Object.entries(manifest.parts)) {
      check(isId(id) && isObject(part) && ["planned", "published"].includes(part.status), `パート登録が不正です: ${id}`);
      if (part.status === "published") checkPath(part.file, "parts/", ".js");
    }
    check(has(manifest.parts, manifest.startPart) && manifest.parts[manifest.startPart].status === "published",
      "開始パートを published にしてください");
  }

  function validateCatalog(world, backgroundsFile, characters) {
    version(world, "world");
    version(backgroundsFile, "backgrounds");
    const backgrounds = backgroundsFile.backgrounds;
    check(isObject(backgrounds) && isText(world.title)
      && (!has(world, "subtitle") || typeof world.subtitle === "string"), "作品表示情報または背景一覧の形式が不正です");
    for (const [id, background] of Object.entries(backgrounds)) {
      check(isId(id) && isObject(background) && ["cover", "contain", undefined].includes(background.fit), `背景定義が不正です: ${id}`);
      checkPath(background.file, "images/");
    }
    check(isId(world.titleBackground) && has(backgrounds, world.titleBackground), "タイトル背景が見つかりません");
    for (const [id, character] of Object.entries(characters)) {
      version(character, id);
      const { visual } = character;
      check(character.id === id && isText(character.name)
        && isObject(visual) && (visual.anchor ?? "bottom-center") === "bottom-center"
        && Number.isFinite(visual.defaultScale ?? 1) && (visual.defaultScale ?? 1) > 0
        && isObject(visual.expressions) && has(visual.expressions, "normal"), `キャラクター定義が不正です: ${id}`);
      for (const [expression, file] of Object.entries(visual.expressions)) {
        check(isId(expression), `表情 ID が不正です: ${expression}`);
        checkPath(file, "images/");
      }
    }
    return backgrounds;
  }

  function validatePart(part, id, { manifest, backgrounds, characters }) {
    version(part, id);
    check(part.id === id && isText(part.title) && Array.isArray(part.steps) && part.steps.length > 0,
      `パートの ID、題名、またはステップが不正です: ${id}`);
    const seen = new Set();
    const visible = new Set();
    for (const [index, step] of part.steps.entries()) {
      const label = `${id}/${step?.id ?? index}`;
      const valid = (condition, message) => check(condition, `${label}: ${message}`);
      valid(isObject(step) && isId(step.id) && !seen.has(step.id), "ステップ ID が不正か重複しています");
      seen.add(step.id);
      valid((["choice", "end"].includes(step.type)) === (index === part.steps.length - 1), "末尾にのみ選択肢または結末を設定してください");
      valid(!has(step, "duration") || (Number.isFinite(step.duration) && step.duration >= 0), "duration が不正です");
      switch (step.type) {
        case "background":
          valid(isId(step.background) && has(backgrounds, step.background), "背景が見つかりません");
          break;
        case "character.show":
        case "character.expression": {
          const character = isId(step.character) && has(characters, step.character) && characters[step.character];
          valid(character && isId(step.expression) && has(character.visual.expressions, step.expression),
            "キャラクターまたは表情が見つかりません");
          if (step.type === "character.show") {
            valid(!visible.has(step.character) && positions.includes(step.position), "登場が重複しているか位置が不正です");
            visible.add(step.character);
          } else {
            valid(visible.has(step.character), "表情変更の前にキャラクターを登場させてください");
          }
          break;
        }
        case "character.hide":
          valid(visible.delete(step.character), "退場の前にキャラクターを登場させてください");
          break;
        case "dialogue":
          valid((step.speaker === null || (isId(step.speaker) && has(characters, step.speaker)))
            && isText(step.text), "話者または本文が不正です");
          break;
        case "end":
          valid(isText(step.text), "結末の表示文が不正です");
          break;
        case "choice":
          valid(Array.isArray(step.options) && step.options.length === 2 && step.options.every(option =>
            isObject(option) && isText(option.text) && isId(option.next) && has(manifest.parts, option.next)),
          "選択肢を 2 件設定し、登録済みのパートを指定してください");
          break;
        default:
          valid(false, `未対応のステップ: ${step.type}`);
      }
    }
    return part;
  }

  function register(data) {
    registered.set(document.currentScript.src, data);
  }

  function readData(file) {
    const url = new URL(`../data/${file}`, scriptUrl).href;
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const finish = () => {
        const data = registered.get(url);
        registered.delete(url);
        script.remove();
        if (data) resolve(data);
        else reject(new Error(`シナリオデータを読み込めません: ${file}`));
      };
      script.onload = finish;
      script.onerror = finish;
      script.src = url;
      document.head.append(script);
    });
  }

  async function loadScenario() {
    const [manifest, world, backgroundsFile] = await Promise.all(
      ["manifest.js", "world.js", "backgrounds.js"].map(readData));
    validateManifest(manifest);
    const characters = Object.fromEntries(await Promise.all(manifest.characters.map(async id =>
      [id, await readData(`characters/${id}.js`)])));
    const backgrounds = validateCatalog(world, backgroundsFile, characters);
    const catalog = { manifest, world, backgrounds, characters };
    const parts = new Map();
    return {
      ...catalog,
      async part(id) {
        const entry = manifest.parts[id];
        if (!has(manifest.parts, id) || entry.status !== "published") throw new Error(`パートを開けません: ${id}`);
        if (!parts.has(id)) parts.set(id, validatePart(await readData(entry.file), id, catalog));
        return parts.get(id);
      }
    };
  }

  function stepImage(step, { backgrounds, characters }) {
    if (step.type === "background") return backgrounds[step.background].file;
    if (step.type === "character.show" || step.type === "character.expression") {
      return characters[step.character].visual.expressions[step.expression];
    }
    return null;
  }

  const images = new Map();

  function loadImage(file) {
    if (!images.has(file)) {
      const image = new Image();
      image.src = new URL(`../${file}`, scriptUrl).href;
      images.set(file, image.decode().then(() => image).catch(() => {
        images.delete(file);
        throw new Error(`画像を読み込めません: ${file}`);
      }));
    }
    return images.get(file);
  }

  const api = { register, loadScenario, loadImage, stepImage, parseData, validateManifest, validateCatalog, validatePart };
  if (typeof module !== "undefined") module.exports = api;
  else globalThis.StoryWalkScenario = api;
})();
