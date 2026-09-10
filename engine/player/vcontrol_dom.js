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

      const colors = cfg.colors || {};
      const colorVars = {
        face: "--vc-face", border: "--vc-border", text: "--vc-text", center: "--vc-center",
        outer: "--vc-outer", inner: "--vc-inner", triangle: "--vc-triangle", circle: "--vc-circle",
        cross: "--vc-cross", square: "--vc-square"
      };
      for (const [key, variable] of Object.entries(colorVars)) {
        if (colors[key]) el.style.setProperty(variable, colors[key]);
        else el.style.removeProperty(variable);
      }

      const partOverrides = cfg.parts || {};
      const partDefs = typeof VControlState !== "undefined" ? (VControlState.partDefinitions[groupKey] || []) : [];
      const partOrder = cfg.partOrder || partDefs.map(part => part.key);
      for (const part of partDefs) {
        const partEl = el.querySelector(part.selector);
        const override = partOverrides[part.key] || {};
        if (!partEl) continue;
        partEl.style.display = override.visible === false ? "none" : "";
        partEl.style.zIndex = String(Math.max(1, partOrder.indexOf(part.key) + 1));
        partEl.style.transform = part.scale && override.scale && override.scale !== 1 ? `scale(${override.scale})` : "";
        if (override.colors) {
          const faceVariable = groupKey === "stick" && part.key === "outer" ? "--vc-outer"
            : groupKey === "stick" && part.key === "inner" ? "--vc-inner" : "--vc-face";
          if (override.colors.face) partEl.style.setProperty(faceVariable, override.colors.face); else partEl.style.removeProperty(faceVariable);
          if (override.colors.border) partEl.style.setProperty("--vc-border", override.colors.border); else partEl.style.removeProperty("--vc-border");
          if (override.colors.text) partEl.style.setProperty("--vc-text", override.colors.text); else partEl.style.removeProperty("--vc-text");
        }
        this.applyPartContent(partEl, override);
      }

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
  applyPartContent(partEl, override) {
    const mode = override.contentMode || "icon";
    const icon = partEl.querySelector("i");
    const defaultText = partEl.querySelector("span:not(.vcontrol-custom-content-text)");
    let customText = partEl.querySelector(".vcontrol-custom-content-text");
    let customImage = partEl.querySelector(".vcontrol-custom-content-image");
    if (!customText) {
      customText = document.createElement("span");
      customText.className = "vcontrol-custom-content-text";
      partEl.appendChild(customText);
    }
    if (!customImage) {
      customImage = document.createElement("img");
      customImage.className = "vcontrol-custom-content-image";
      customImage.alt = "";
      partEl.appendChild(customImage);
    }
    if (icon && override.icon) icon.className = `ph ph-${String(override.icon).replace(/-bold$/, "")}`;
    if (icon) icon.style.display = mode === "icon" ? "" : "none";
    if (defaultText) defaultText.style.display = mode === "icon" ? "" : "none";
    customText.textContent = override.text || "";
    customText.style.display = mode === "text" ? "" : "none";
    if (override.image) customImage.src = override.image;
    customImage.style.display = mode === "image" && !!override.image ? "block" : "none";
  },
  updateGamepadVisibility(manager) {
    const pad = document.getElementById("mobile-virtual-gamepad");
    if (!pad) return;

    const wasHidden = pad.style.display === "none" || pad.style.display === "";

    if (manager.isCustomizing) {
      pad.style.display = "block";
      pad.classList.add("customizer-active");
      pad.classList.remove("editor-preview-active");
      if (wasHidden) this.applyLayout(manager);
      return;
    }
    pad.classList.remove("customizer-active");

    if (manager.editorPreviewVisible) {
      pad.style.display = "block";
      pad.classList.add("editor-preview-active");
      if (wasHidden) this.applyLayout(manager);
      return;
    }
    pad.classList.remove("editor-preview-active");

    if (manager.visibilityMode === "show") {
      pad.style.display = "block";
      const isPlay = typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying;
      pad.classList.toggle("editor-preview-active", !isPlay);
      if (wasHidden) this.applyLayout(manager);
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
      if (wasHidden) this.applyLayout(manager);
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
