/**
 * UNIFIVE Engine - Virtual Controls DOM Subsystem
 */
const VControlDom = {
  applyLayout(manager) {
    if (!manager.currentLayout) return;
    for (const groupKey of Object.keys(manager.currentLayout)) {
      const cfg = manager.currentLayout[groupKey];
      const el = document.getElementById("vcontrol-" + groupKey);
      if (!el || !cfg) continue;

      el.style.removeProperty("top");
      el.style.removeProperty("bottom");
      el.style.removeProperty("left");
      el.style.removeProperty("right");
      el.style.removeProperty("transform");

      const scale = cfg.scale || 1.0;
      if (cfg.anchor === "top-left" || !cfg.anchor) {
        el.style.top = cfg.y + "px";
        el.style.left = cfg.x + "px";
        el.style.transform = "scale(" + scale + ")";
        el.style.transformOrigin = "top left";
      } else if (cfg.anchor === "top-right") {
        el.style.top = cfg.y + "px";
        el.style.right = cfg.x + "px";
        el.style.transform = "scale(" + scale + ")";
        el.style.transformOrigin = "top right";
      } else if (cfg.anchor === "bottom-left") {
        el.style.bottom = cfg.y + "px";
        el.style.left = cfg.x + "px";
        el.style.transform = "scale(" + scale + ")";
        el.style.transformOrigin = "bottom left";
      } else if (cfg.anchor === "bottom-right") {
        el.style.bottom = cfg.y + "px";
        el.style.right = cfg.x + "px";
        el.style.transform = "scale(" + scale + ")";
        el.style.transformOrigin = "bottom right";
      } else if (cfg.anchor === "bottom-center") {
        el.style.bottom = cfg.y + "px";
        el.style.left = "calc(50% + " + cfg.x + "px)";
        el.style.transform = "translateX(-50%) scale(" + scale + ")";
        el.style.transformOrigin = "bottom center";
      }
      el.style.display = cfg.visible !== false ? "" : "none";
    }
  },
  updateGamepadVisibility(manager) {
    const pad = document.getElementById("mobile-virtual-gamepad");
    if (!pad) return;

    if (manager.isCustomizing) {
      pad.style.display = "block";
      pad.classList.add("customizer-active");
      pad.classList.remove("editor-preview-active");
      return;
    }
    pad.classList.remove("customizer-active");

    if (manager.editorPreviewVisible) {
      pad.style.display = "block";
      pad.classList.add("editor-preview-active");
      return;
    }
    pad.classList.remove("editor-preview-active");

    if (manager.visibilityMode === "show") {
      pad.style.display = "block";
      const isPlay = typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying;
      pad.classList.toggle("editor-preview-active", !isPlay);
      return;
    }
    if (manager.visibilityMode === "hide") {
      pad.style.display = "none";
      pad.classList.remove("editor-preview-active");
      return;
    }

    const isPlayingOrRunning = (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) ||
                               (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning);

    if (isPlayingOrRunning && manager.isMobile()) {
      pad.style.display = "block";
      pad.classList.remove("editor-preview-active");
    } else {
      pad.style.display = "none";
      pad.classList.remove("editor-preview-active");
    }
  },
  filterObjectVisibility(manager, items) {
    if (!items || !Array.isArray(items)) return;
    const isMob = manager.isMobile();
    for (const item of items) {
      const vis = item.deviceVisibility || "all";
      if (vis === "mobile_only") item.hiddenInPlayer = !isMob;
      else if (vis === "desktop_only") item.hiddenInPlayer = isMob;
      else item.hiddenInPlayer = false;
    }
  }
};
