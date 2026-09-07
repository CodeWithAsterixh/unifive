/**
 * UNIFIVE Scripting - Mode Switcher Subsystem
 * Orchestrates Canvas vs Code vs Play mode transitions, panel layout changes, and preview docking.
 */
(function (global) {
  'use strict';

  const ModeSwitcher = {
    setMode(controller, mode, force = false) {
      if (!force && controller.currentMode === mode) return;
      controller.currentMode = mode;

      const btnCanvas = document.getElementById("btn-mode-canvas");
      const btnCode = document.getElementById("btn-mode-code");
      const controlsPane = document.getElementById("controls-pane");
      const codeToolboxPane = document.getElementById("code-toolbox-pane");
      const codeStageLayout = document.getElementById("code-stage-layout");
      const canvasContainer = document.getElementById("canvas-container");
      const stagePane = document.getElementById("stage-pane");
      const codePreviewBox = document.getElementById("code-preview-canvas-box");
      const floatingDock = document.getElementById("floating-dock");
      const cropBar = document.getElementById("floating-crop-bar");
      const spritePanel = document.getElementById("floating-sprite-poses-panel");

      if (btnCanvas) btnCanvas.classList.toggle("active", mode === "canvas");
      if (btnCode) btnCode.classList.toggle("active", mode === "code");

      const mobileBtnCanvas = document.getElementById("btn-mobile-nav-canvas");
      const mobileBtnCode = document.getElementById("btn-mobile-nav-code");
      const mobileBtnPlay = document.getElementById("btn-mobile-nav-play");
      if (mobileBtnCanvas) mobileBtnCanvas.classList.toggle("active", mode === "canvas");
      if (mobileBtnCode) mobileBtnCode.classList.toggle("active", mode === "code");
      if (mobileBtnPlay) mobileBtnPlay.classList.toggle("active", mode === "play");

      if (typeof MobileNavigationController !== "undefined") {
        MobileNavigationController.closeDrawer();
      }

      if (mode === "code") {
        document.body.classList.add("mode-code");
        document.body.classList.remove("mode-canvas");

        if (typeof PreviewConfig !== "undefined" && typeof PreviewConfig.reset === "function") {
          PreviewConfig.reset();
        }

        const isMobile = window.innerWidth <= 860;

        if (isMobile) {
          if (controlsPane) {
            controlsPane.style.removeProperty("display");
            controlsPane.style.removeProperty("width");
          }
          if (codeToolboxPane) {
            codeToolboxPane.style.removeProperty("display");
            codeToolboxPane.style.removeProperty("width");
          }
        } else {
          if (controlsPane) controlsPane.style.display = "none";
          if (codeToolboxPane) {
            codeToolboxPane.style.display = "flex";
            const savedCodeWidth = localStorage.getItem("unifive_code_split_width");
            codeToolboxPane.style.width = savedCodeWidth && parseInt(savedCodeWidth) >= 360 ? savedCodeWidth : "410px";
          }
        }

        if (codeStageLayout) codeStageLayout.style.display = isMobile ? "block" : "flex";

        if (canvasContainer && codePreviewBox) {
          codePreviewBox.appendChild(canvasContainer);
        }

        if (floatingDock) floatingDock.style.display = "none";
        if (cropBar) cropBar.style.display = "none";
        if (spritePanel) spritePanel.style.display = "none";

        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(520, "sine", 0.08, 0.1);
        }

        controller.renderObjectsList();
        controller.updateTargetBadge();
        controller.renderScriptsForActiveTarget();
        controller.updateWorkspaceTransform();
      } else {
        document.body.classList.remove("mode-code");
        document.body.classList.add("mode-canvas");

        if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
          CodeRuntimeEngine.stopAll();
        }

        const isMobile = window.innerWidth <= 860;

        if (isMobile) {
          if (controlsPane) {
            controlsPane.style.removeProperty("display");
            controlsPane.style.removeProperty("width");
          }
          if (codeToolboxPane) {
            codeToolboxPane.style.removeProperty("display");
            codeToolboxPane.style.removeProperty("width");
          }
        } else {
          if (controlsPane) {
            controlsPane.style.display = "flex";
            const savedWidth = localStorage.getItem("unifive_split_width");
            if (savedWidth) controlsPane.style.width = savedWidth;
          }
          if (codeToolboxPane) codeToolboxPane.style.display = "none";
        }

        if (codeStageLayout) codeStageLayout.style.display = "none";

        if (canvasContainer && stagePane) {
          stagePane.insertBefore(canvasContainer, stagePane.firstChild);
        }

        if (floatingDock) floatingDock.style.display = "flex";

        const sel = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (sel && (sel.type === "sprite" || sel.poses || (sel.assetId && sel.assetId.startsWith("sprite_")))) {
          if (typeof SpritePosesController !== "undefined") {
            SpritePosesController.show(sel);
          }
        }

        if (typeof WorldConfig !== "undefined") WorldConfig.clampPan();
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(440, "sine", 0.08, 0.1);
        }
      }

      setTimeout(() => {
        if (typeof resizeStageCanvas === "function") resizeStageCanvas();
        if (controller.currentMode === "canvas" && typeof WorldConfig !== "undefined") {
          WorldConfig.clampPan();
        }
      }, 60);
    }
  };

  global.ModeSwitcher = ModeSwitcher;
})(typeof window !== 'undefined' ? window : globalThis);
