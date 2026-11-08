const StoryWalkSave = (() => {
  "use strict";

  const directory = new URL(".", location.href).pathname;
  const canSave = location.protocol === "http:" || location.protocol === "https:";
  const path = directory.includes(";") ? "/" : directory;
  const key = "storywalkadv2_" + Array.from(new TextEncoder().encode(directory))
    .reduce((hash, byte) => Math.imul(hash ^ byte, 16777619), 2166136261).toString(36);

  function readSave() {
    if (!canSave) return null;
    try {
      const entry = document.cookie.split(/;\s*/).find(value => value.startsWith(key + "="));
      if (!entry) return null;
      const save = JSON.parse(decodeURIComponent(entry.slice(key.length + 1)));
      if (save?.saveVersion !== 1 || typeof save.partId !== "string" || typeof save.stepId !== "string") return false;
      const history = Array.isArray(save.history) ? save.history.slice(-12).filter(entry =>
        typeof entry?.partId === "string" && typeof entry?.next === "string" && [0, 1].includes(entry.option)) : [];
      return { partId: save.partId, stepId: save.stepId, history };
    } catch {
      return false;
    }
  }

  function writeSave(partId, stepId, history) {
    if (!canSave) return false;
    const recent = history.slice(-12);
    const attributes = `; Path=${path}; Max-Age=31536000; SameSite=Lax`
      + (location.protocol === "https:" ? "; Secure" : "");
    function encode() {
      return encodeURIComponent(JSON.stringify({ saveVersion: 1, partId, stepId, history: recent }));
    }
    let value = encode();
    while (recent.length && key.length + value.length + attributes.length > 3800) {
      recent.shift();
      value = encode();
    }
    try {
      document.cookie = `${key}=${value}${attributes}`;
      return document.cookie.split(/;\s*/).includes(`${key}=${value}`);
    } catch {
      return false;
    }
  }

  return { canSave, readSave, writeSave };
})();
