/**
 * UNIFIVE World - Sprite Poses Controller
 * Floating animated poses drawer aggregator and lifecycle coordinator.
 */
const SpritePosesController = {
  panelEl: null,
  charNameEl: null,
  themeBadgeEl: null,
  countEl: null,
  gridEl: null,
  btnCloseEl: null,
  btnMinimizeEl: null,
  btnAutoplayToggleEl: null,
  autoplayLabelEl: null,
  activeItem: null,

  get activeAnimators() {
    return PoseAnimator.activeAnimators;
  },

  get loadedImages() {
    return PoseAnimator.loadedImages;
  },

  init() {
    this.panelEl = document.getElementById("floating-sprite-poses-panel");
    this.charNameEl = document.getElementById("sprite-poses-char-name");
    this.themeBadgeEl = document.getElementById("sprite-poses-theme-badge");
    this.countEl = document.getElementById("sprite-poses-count");
    this.gridEl = document.getElementById("sprite-poses-grid");
    this.btnCloseEl = document.getElementById("btn-close-sprite-poses");
    this.btnMinimizeEl = document.getElementById("btn-minimize-sprite-poses");
    this.btnAutoplayToggleEl = document.getElementById("btn-toggle-sprite-autoplay");
    this.autoplayLabelEl = document.getElementById("sprite-autoplay-label");

    if (this.btnCloseEl) {
      this.btnCloseEl.addEventListener("click", () => {
        this.hide();
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(380, "square", 0.05, 0.08);
      });
    }

    if (this.btnMinimizeEl) {
      this.btnMinimizeEl.addEventListener("click", () => {
        this.toggleMinimize();
      });
    }

    if (this.btnAutoplayToggleEl) {
      this.btnAutoplayToggleEl.addEventListener("click", () => {
        this.toggleAutoplay();
      });
    }

    const speedChips = document.querySelectorAll(".btn-speed-chip");
    speedChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const spd = parseInt(chip.getAttribute("data-speed")) || 100;
        if (this.activeItem) {
          this.activeItem.animSpeed = spd;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
        speedChips.forEach(c => c.classList.toggle("active", c === chip));
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
      });
    });

    // Close on Escape key
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.panelEl && this.panelEl.style.display !== "none") {
        this.hide();
      }
    });
  },

  toggleMinimize() {
    if (!this.panelEl) return;
    const isMin = this.panelEl.classList.toggle("minimized");
    if (this.btnMinimizeEl) {
      this.btnMinimizeEl.innerHTML = isMin ? '<i class="ph ph-caret-up"></i>' : '<i class="ph ph-caret-down"></i>';
    }
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(isMin ? 440 : 580, "square", 0.05, 0.08);
  },

  toggleAutoplay() {
    if (!this.activeItem) return;
    this.activeItem.autoplay = !this.activeItem.autoplay;
    if (this.activeItem.autoplay && this.activeItem.poseData) {
      this.preparePoseAssetsForCanvas(this.activeItem, this.activeItem.poseData);
    }
    this.updateAutoplayUI();
    if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(this.activeItem.autoplay ? 680 : 380, "square", 0.06, 0.1);
  },

  updateAutoplayUI() {
    const isAuto = this.activeItem ? !!this.activeItem.autoplay : false;
    if (this.btnAutoplayToggleEl) {
      this.btnAutoplayToggleEl.classList.toggle("active", isAuto);
      const icon = this.btnAutoplayToggleEl.querySelector("i");
      if (icon) icon.className = `ph ${isAuto ? "ph-pause" : "ph-play"}`;
    }
    if (this.autoplayLabelEl) {
      this.autoplayLabelEl.textContent = isAuto ? "AUTOPLAY: ON" : "AUTOPLAY: OFF";
    }
    const currentSpd = this.activeItem ? (this.activeItem.animSpeed || 100) : 100;
    const speedChips = document.querySelectorAll(".btn-speed-chip");
    speedChips.forEach(chip => {
      const chipSpd = parseInt(chip.getAttribute("data-speed")) || 100;
      chip.classList.toggle("active", chipSpd === currentSpd);
    });
  },

  preloadImage(src) {
    return PoseAnimator.preloadImage(src);
  },

  preparePoseAssetsForCanvas(item, poseData) {
    return PoseAnimator.preparePoseAssetsForCanvas(item, poseData);
  },

  show(item) {
    if (!this.panelEl) return;
    if (!item) {
      this.hide();
      return;
    }

    let poses = item.poses;
    let theme = item.theme || "";
    let name = item.name || "Sprite";

    if ((!poses || Object.keys(poses).length === 0) && typeof CreatePanelController !== "undefined" && CreatePanelController.assetsData) {
      const allCategories = (CreatePanelController.assetsData.sidefacing || []).concat(CreatePanelController.assetsData.topdown || []);
      for (const cat of allCategories) {
        const found = (cat.items || []).find(it => it.id === item.assetId || it.id === item.id);
        if (found && found.poses) {
          poses = found.poses;
          theme = found.theme || theme;
          name = found.name || name;
          item.poses = found.poses;
          item.theme = found.theme;
          item.type = "sprite";
          break;
        }
      }
    }

    if (!poses || Object.keys(poses).length === 0) {
      this.hide();
      return;
    }

    this.activeItem = item;
    if (typeof item.autoplay === "undefined") {
      item.autoplay = false;
    }

    const currentPoseName = item.currentPose || item.defaultPose || Object.keys(poses)[0];
    const activePoseData = poses[currentPoseName] || poses[Object.keys(poses)[0]];
    if (activePoseData) {
      item.poseData = activePoseData;
      this.preparePoseAssetsForCanvas(item, activePoseData);
    }

    if (this.charNameEl) this.charNameEl.textContent = name.toUpperCase();
    if (this.themeBadgeEl) this.themeBadgeEl.textContent = (theme || "CHARACTER").toUpperCase();
    const poseKeys = Object.keys(poses);
    if (this.countEl) this.countEl.textContent = `${poseKeys.length} ${poseKeys.length === 1 ? "POSE" : "POSES"}`;

    this.updateAutoplayUI();
    this.renderPoseCards(item, poses);
    this.panelEl.style.display = "flex";
  },

  hide() {
    this.stopAllAnimators();
    if (this.panelEl) this.panelEl.style.display = "none";
    this.activeItem = null;
  },

  stopAllAnimators() {
    return PoseAnimator.stopAllAnimators();
  },

  renderPoseCards(item, poses) {
    return PoseCards.renderPoseCards(this, item, poses);
  },

  selectPose(item, poseName, poseData) {
    return PoseCards.selectPose(this, item, poseName, poseData);
  }
};