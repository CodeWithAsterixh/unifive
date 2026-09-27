/**
 * UNIFIVE World - Sprite Poses Panel UI Subsystem
 */
const SpritePosesPanel = {
  bindUI(controller) {
    controller.panelEl = document.getElementById("floating-sprite-poses-panel");
    controller.gridEl = document.getElementById("sprite-poses-grid");
    controller.btnMinimizeEl = document.getElementById("btn-minimize-sprite-poses");
    controller.charNameEl = document.getElementById("sprite-poses-char-name");
    controller.themeBadgeEl = document.getElementById("sprite-poses-theme-badge");
    controller.countEl = document.getElementById("sprite-poses-count");
    controller.btnAutoplayEl = document.getElementById("btn-toggle-sprite-autoplay");
    controller.autoplayLabelEl = document.getElementById("sprite-autoplay-label");

    if (controller.btnMinimizeEl && controller.panelEl) {
      controller.btnMinimizeEl.addEventListener("click", () => {
        controller.panelEl.classList.toggle("minimized");
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(520, "sine", 0.04, 0.08);
        }
      });
    }

    if (controller.btnAutoplayEl) {
      controller.btnAutoplayEl.addEventListener("click", () => {
        const item = controller.activeItem;
        if (!item) return;

        item.autoplay = !item.autoplay;
        if (item.autoplay && (!item.frameCount || item.frameCount <= 1)) {
          // If frame count isn't set, try resolving from poseData
          if (item.poseData && item.poseData.frameCount) {
            item.frameCount = item.poseData.frameCount;
          } else if (item.poseData && Array.isArray(item.poseData.frames)) {
            item.frameCount = item.poseData.frames.length;
          } else {
            item.frameCount = 4; // default animated cycle
          }
        }

        this.updateToolbar(controller);

        if (typeof WorldObjectsManager !== "undefined" && typeof WorldObjectsManager.saveHistory === "function") {
          WorldObjectsManager.saveHistory();
        }
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(item.autoplay ? 680 : 420, "triangle", 0.05, 0.1);
        }
      });
    }

    const speedChips = document.querySelectorAll(".sprite-autoplay-speed-wrap .btn-speed-chip");
    speedChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const item = controller.activeItem;
        const spd = parseInt(chip.dataset.speed) || 100;
        if (item) {
          item.animSpeed = spd;
          if (typeof WorldObjectsManager !== "undefined" && typeof WorldObjectsManager.saveHistory === "function") {
            WorldObjectsManager.saveHistory();
          }
        }
        speedChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");

        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(750, "sine", 0.03, 0.06);
        }
      });
    });
  },

  updateToolbar(controller) {
    const item = controller.activeItem;
    if (!item) return;

    const btnAutoplay = controller.btnAutoplayEl || document.getElementById("btn-toggle-sprite-autoplay");
    const labelAutoplay = controller.autoplayLabelEl || document.getElementById("sprite-autoplay-label");

    const isAutoplay = !!item.autoplay;
    if (btnAutoplay) {
      btnAutoplay.classList.toggle("active", isAutoplay);
      const icon = btnAutoplay.querySelector("i");
      if (icon) {
        icon.className = isAutoplay ? "ph ph-pause" : "ph ph-play";
      }
    }
    if (labelAutoplay) {
      labelAutoplay.textContent = isAutoplay ? "AUTOPLAY: ON" : "AUTOPLAY: OFF";
    }

    const currentSpeed = item.animSpeed || 100;
    const speedChips = document.querySelectorAll(".sprite-autoplay-speed-wrap .btn-speed-chip");
    speedChips.forEach(chip => {
      const spd = parseInt(chip.dataset.speed) || 100;
      chip.classList.toggle("active", spd === currentSpeed);
    });
  }
};

if (typeof window !== "undefined") window.SpritePosesPanel = SpritePosesPanel;
if (typeof globalThis !== "undefined") globalThis.SpritePosesPanel = SpritePosesPanel;
