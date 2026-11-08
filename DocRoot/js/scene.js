const StoryWalkScene = (() => {
  "use strict";

  const slots = { left: .32, center: .5, right: .68 };
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  function animate(duration, render) {
    if (!duration || reducedMotion.matches) {
      render(1);
      return Promise.resolve();
    }
    render(0);
    const start = performance.now();
    return new Promise(resolve => {
      function frame(now) {
        const t = Math.min(1, Math.max(0, (now - start) / duration));
        render(t * t * (3 - 2 * t));
        if (t === 1) resolve();
        else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  function createScene(canvas) {
    const { width, height } = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    const blend = document.createElement("canvas");
    blend.width = width;
    blend.height = height;
    const layer = blend.getContext("2d");
    const characters = new Map();
    let background;
    let previousBackground;
    let backgroundMix = 1;

    function scenery(context, { image, fit }) {
      const scale = (fit === "contain" ? Math.min : Math.max)(width / image.width, height / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      context.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
    }

    function portrait(context, character, image) {
      const h = height * .72 * character.scale;
      const w = h * image.width / image.height;
      context.drawImage(image, slots[character.position] * width - w / 2, height - h, w, h);
    }

    function draw() {
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#101b21";
      ctx.fillRect(0, 0, width, height);
      if (previousBackground) scenery(ctx, previousBackground);
      if (background) {
        ctx.globalAlpha = backgroundMix;
        if (background.fit === "contain" && previousBackground && backgroundMix < 1) {
          layer.globalCompositeOperation = "source-over";
          layer.globalAlpha = 1;
          layer.fillStyle = ctx.fillStyle;
          layer.fillRect(0, 0, width, height);
          scenery(layer, background);
          ctx.drawImage(blend, 0, 0);
        } else {
          if (background.fit === "contain") ctx.fillRect(0, 0, width, height);
          scenery(ctx, background);
        }
      }
      for (const character of characters.values()) {
        ctx.globalAlpha = character.opacity;
        if (character.oldImage) {
          // Mix premultiplied portraits in isolation so their common silhouette stays opaque.
          layer.clearRect(0, 0, width, height);
          layer.globalCompositeOperation = "source-over";
          layer.globalAlpha = 1 - character.mix;
          portrait(layer, character, character.oldImage);
          layer.globalCompositeOperation = "lighter";
          layer.globalAlpha = character.mix;
          portrait(layer, character, character.image);
          ctx.drawImage(blend, 0, 0);
        } else {
          portrait(ctx, character, character.image);
        }
      }
      ctx.globalAlpha = 1;
    }

    return {
      reset(keepBackground = false) {
        characters.clear();
        if (!keepBackground) background = undefined;
        draw();
      },
      fadeOutCharacters(progress) {
        if (!characters.size) return;
        for (const character of characters.values()) character.opacity = 1 - progress;
        draw();
      },
      async background(image, fit, duration) {
        if (background?.image === image && background.fit === fit) return;
        previousBackground = background;
        background = { image, fit };
        await animate(duration, t => {
          backgroundMix = t;
          draw();
        });
        previousBackground = undefined;
      },
      async show(id, image, position, scale, duration) {
        const character = { image, position, scale, opacity: 0 };
        characters.set(id, character);
        await animate(duration, t => {
          character.opacity = t;
          draw();
        });
      },
      async hide(id, duration) {
        const character = characters.get(id);
        await animate(duration, t => {
          character.opacity = 1 - t;
          draw();
        });
        characters.delete(id);
      },
      async expression(id, image, duration) {
        const character = characters.get(id);
        if (character.image === image) return;
        character.oldImage = character.image;
        character.image = image;
        await animate(duration, t => {
          character.mix = t;
          draw();
        });
        delete character.oldImage;
      }
    };
  }

  return { animate, createScene };
})();
