(() => {
  "use strict";

  const { loadScenario, loadImage, stepImage } = StoryWalkScenario;
  const { animate, createScene } = StoryWalkScene;
  const { canSave, readSave, writeSave } = StoryWalkSave;

  const $ = id => document.getElementById(id);
  const game = $("game");
  const scene = createScene($("scene"));
  const title = $("title");
  const chapter = $("chapter");
  const partId = $("part-id");
  const home = $("home");
  const start = $("start");
  const resume = $("continue");
  const status = $("status");
  const message = $("message");
  const speaker = $("speaker");
  const line = $("line");
  const advanceButton = $("advance");
  const choices = $("choices");
  const buttons = [...choices.querySelectorAll("button")];
  const notice = $("notice");
  const closeNotice = $("notice-close");
  const noticeTitle = $("notice-title");

  let scenario;
  let part;
  let index;
  let history = [];
  let activeChoice = -1;
  let noticeAction;
  let titleImage;
  let state = "loading";
  let saveFailed = false;
  let lineTimer;
  let fullLine = "";
  const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("ja", { granularity: "grapheme" }) : null;

  game.tabIndex = -1;

  function hideStory() {
    stopTyping();
    chapter.hidden = partId.hidden = home.hidden = message.hidden = choices.hidden = true;
  }

  function showTitle(extra = "") {
    state = "title";
    hideStory();
    notice.hidden = true;
    title.hidden = false;
    scene.reset(true);
    if (titleImage) scene.background(titleImage, scenario.backgrounds[scenario.world.titleBackground].fit, 0);
    const saved = readSave();
    start.disabled = !scenario || !titleImage;
    resume.disabled = !saved || start.disabled;
    status.textContent = extra || (saved === false ? "セーブデータを読み込めません。はじめから遊べます。"
      : !canSave ? "ファイルからプレイ中。進行状況は保存されません。"
      : saveFailed ? "Cookie に進行状況を保存できませんでした。" : "");
  }

  function showNotice(text, label, action, canReturnToTitle = false) {
    stopTyping();
    state = "notice";
    $("notice-text").textContent = text;
    closeNotice.textContent = label;
    noticeTitle.hidden = !canReturnToTitle;
    noticeAction = action;
    for (const element of [title, chapter, home, message, choices]) element.inert = true;
    notice.hidden = false;
    closeNotice.focus();
  }

  function closeDialog(action) {
    notice.hidden = true;
    for (const element of [title, chapter, home, message, choices]) element.inert = false;
    noticeAction = undefined;
    action();
  }

  function fail(error) {
    console.error(error);
    showNotice(`物語を読み込めませんでした。\n${error.message}`, "タイトルへ", () => showTitle());
  }

  async function visual(step, instant) {
    const file = stepImage(step, scenario);
    const image = file ? await loadImage(file) : null;
    const duration = fallback => instant ? 0 : (step.duration ?? fallback);
    switch (step.type) {
      case "background":
        await scene.background(image, scenario.backgrounds[step.background].fit, duration(800));
        break;
      case "character.show":
        await scene.show(step.character, image, step.position,
          scenario.characters[step.character].visual.defaultScale ?? 1, duration(600));
        break;
      case "character.hide":
        await scene.hide(step.character, duration(600));
        break;
      case "character.expression":
        await scene.expression(step.character, image, duration(300));
        break;
    }
  }

  function checkpoint() {
    if (canSave) saveFailed = !writeSave(part.id, part.steps[index].id, history);
  }

  function stopTyping() {
    clearTimeout(lineTimer);
    lineTimer = undefined;
    message.setAttribute("aria-busy", "false");
  }

  function finishLine() {
    stopTyping();
    line.textContent = fullLine;
    advanceButton.setAttribute("aria-label", "次へ");
    state = "waitingForAdvance";
  }

  function displayLine(step, instant = false) {
    stopTyping();
    speaker.hidden = step.speaker === null;
    speaker.textContent = step.speaker === null ? "" : scenario.characters[step.speaker].name;
    fullLine = step.text;
    line.textContent = instant ? fullLine : "";
    message.hidden = false;
    line.scrollTop = 0;
    if (instant) return;
    state = "typing";
    message.setAttribute("aria-busy", "true");
    advanceButton.setAttribute("aria-label", "全文を表示");
    // Append visible text in JS; never hide already displayed characters with CSS.
    const characters = segmenter
      ? Array.from(segmenter.segment(fullLine), item => item.segment) : Array.from(fullLine);
    let count = 0;
    function reveal() {
      if (count < characters.length) line.textContent += characters[count++];
      if (count === characters.length) finishLine();
      else lineTimer = setTimeout(reveal, 35);
    }
    reveal();
  }

  function highlight(next) {
    activeChoice = next;
    buttons.forEach((button, i) => button.setAttribute("aria-current", String(i === next)));
  }

  async function presentChoice(step) {
    advanceButton.hidden = true;
    highlight(-1);
    buttons.forEach((button, i) => {
      button.disabled = true;
      button.classList.remove("selected");
      button.querySelector(".choice-text").textContent = step.options[i].text;
    });
    choices.hidden = false;
    await animate(step.duration ?? 400, t => {
      choices.style.opacity = t;
      choices.style.transform = `scale(${.96 + .04 * t})`;
    });
    buttons.forEach(button => { button.disabled = false; });
    state = "choosing";
  }

  async function run() {
    state = "animating";
    for (; index < part.steps.length; index++) {
      const step = part.steps[index];
      if (step.type === "dialogue") {
        displayLine(step);
        advanceButton.hidden = false;
        checkpoint();
        return;
      }
      if (step.type === "choice") {
        await presentChoice(step);
        checkpoint();
        return;
      }
      if (step.type === "end") {
        advanceButton.hidden = true;
        checkpoint();
        showNotice(step.text, "タイトルへ", () => showTitle());
        return;
      }
      await visual(step, false);
    }
  }

  async function enter(id, stepId) {
    stopTyping();
    state = "loading";
    title.hidden = true;
    home.hidden = false;
    // Keep the previous dialogue and headings visible until the next part is ready.
    choices.hidden = true;
    advanceButton.hidden = true;
    game.focus();
    part = await scenario.part(id);
    const savedIndex = stepId === undefined ? -1 : part.steps.findIndex(step =>
      step.id === stepId && ["dialogue", "choice", "end"].includes(step.type));
    if (stepId !== undefined && savedIndex === -1) {
      showNotice("保存した場面は、シナリオの更新により見つかりません。", "このパートの先頭から",
        () => enter(id).catch(fail), true);
      return;
    }
    const files = new Set(part.steps.map(step => stepImage(step, scenario)).filter(Boolean));
    // Start decoding in parallel. A failed image is reported at the step that needs it.
    await Promise.allSettled([...files].map(loadImage));
    partId.textContent = part.id;
    partId.hidden = false;
    chapter.textContent = part.title;
    chapter.hidden = false;
    scene.reset(savedIndex === -1 && part.steps[0].type === "background");
    index = Math.max(0, savedIndex);
    if (savedIndex >= 0) {
      for (const step of part.steps.slice(0, index)) {
        if (step.type === "dialogue") displayLine(step, true);
        else await visual(step, true);
      }
    }
    await run();
  }

  function advance() {
    if (state === "typing") {
      finishLine();
      return;
    }
    if (state !== "waitingForAdvance") return;
    index++;
    run().catch(fail);
  }

  async function choose(option) {
    if (state !== "choosing") return;
    state = "animating";
    const { next } = part.steps[index].options[option];
    highlight(option);
    if (scenario.manifest.parts[next].status === "planned") {
      showNotice("この先は制作中です。", "選択肢へ戻る", () => {
        state = "choosing";
        buttons[option].focus();
      });
      return;
    }
    buttons.forEach(button => { button.disabled = true; });
    buttons[option].classList.add("selected");
    await animate(210, t => {
      choices.style.opacity = 1 - t;
      choices.style.transform = `scale(${1 - .035 * t})`;
      scene.fadeOutCharacters(t);
    });
    history = [...history.slice(-11), { partId: part.id, option, next }];
    await enter(next);
  }

  start.addEventListener("click", () => {
    if (state !== "title") return;
    history = [];
    enter(scenario.manifest.startPart).catch(fail);
  });
  resume.addEventListener("click", () => {
    if (state !== "title") return;
    const saved = readSave();
    if (!saved || !Object.hasOwn(scenario.manifest.parts, saved.partId)
        || scenario.manifest.parts[saved.partId].status !== "published") {
      showTitle("保存したパートを開けません。はじめから遊べます。");
      return;
    }
    history = saved.history;
    enter(saved.partId, saved.stepId).catch(fail);
  });
  home.addEventListener("click", () => {
    if (state === "typing" || state === "waitingForAdvance" || state === "choosing") {
      showTitle();
      start.focus();
    }
  });
  closeNotice.addEventListener("click", () => closeDialog(noticeAction));
  noticeTitle.addEventListener("click", () => closeDialog(() => {
    showTitle();
    start.focus();
  }));
  buttons.forEach((button, i) => button.addEventListener("click", () => choose(i).catch(fail)));
  game.addEventListener("click", event => {
    if (event.target.closest("a, #home, #choices, #notice, #title")) return;
    if (state !== "typing" && event.target === line && line.scrollHeight > line.clientHeight) return;
    advance();
  });
  document.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const advanceKey = event.key === "Enter" || event.code === "Space";
    if (event.repeat) {
      if (advanceKey && state !== "title") event.preventDefault();
      return;
    }
    const focusedChoice = buttons.indexOf(document.activeElement);
    if (state === "choosing") {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        const current = focusedChoice >= 0 ? focusedChoice : activeChoice;
        highlight(current < 0 ? 0 : 1 - current);
        buttons[activeChoice].focus();
      } else if (event.key === "1" || event.key === "2") {
        event.preventDefault();
        choose(Number(event.key) - 1).catch(fail);
      } else if (advanceKey && document.activeElement !== home) {
        event.preventDefault();
        choose(focusedChoice >= 0 ? focusedChoice : Math.max(0, activeChoice)).catch(fail);
      }
    } else if (["typing", "waitingForAdvance"].includes(state) && advanceKey && document.activeElement !== home
        && !(state !== "typing" && event.code === "Space" && document.activeElement === line && line.scrollHeight > line.clientHeight)) {
      event.preventDefault();
      advance();
    }
  });

  async function boot() {
    scenario = await loadScenario();
    $("work-title").textContent = document.title = scenario.world.title;
    $("subtitle").textContent = scenario.world.subtitle ?? "";
    titleImage = await loadImage(scenario.backgrounds[scenario.world.titleBackground].file);
    showTitle();
  }

  boot().catch(error => {
    console.error(error);
    status.textContent = `起動できませんでした。ページを再読み込みしてください。 ${error.message}`;
  });
})();
