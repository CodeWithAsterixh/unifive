/**
 * UNIFIVE World - Sprite Poses Controller
 */
const SpritePosesController = {
  panelEl: null,
  gridEl: null,
  btnCloseEl: null,
  btnMinimizeEl: null,
  charNameEl: null,
  themeBadgeEl: null,
  countEl: null,
  activeItem: null,

  init() {
    if (typeof SpritePosesPanel !== "undefined") SpritePosesPanel.bindUI(this);
  },

  resolvePosesForAsset(item) {
    if (!item) return null;
    if (typeof PoseAnimator !== "undefined" && typeof PoseAnimator.resolvePoses === "function") {
      return PoseAnimator.resolvePoses(item);
    }
    return item.poses || null;
  },

  selectPose(item, poseName, poseData = null) {
    if (!item) return;
    if (typeof PoseAnimator !== "undefined" && typeof PoseAnimator.setPose === "function") {
      PoseAnimator.setPose(item, poseName, poseData);
    }
    if (typeof PoseCards !== "undefined" && typeof PoseCards.selectPose === "function") {
      PoseCards.selectPose(this, item, poseName, poseData || (item.poses && item.poses[poseName]));
    }
  },

  open(item) {
    if (!item || !this.panelEl) return;
    this.activeItem = item;

    const poses = this.resolvePosesForAsset(item);
    if (poses && typeof poses === "object" && Object.keys(poses).length > 0) {
      if (this.charNameEl) this.charNameEl.textContent = item.name || "CHARACTER";
      if (this.themeBadgeEl) this.themeBadgeEl.textContent = (item.theme || "SPRITE").toUpperCase();
      if (this.countEl) this.countEl.textContent = `${Object.keys(poses).length} POSES`;

      this.panelEl.style.display = "block";
      if (typeof SpritePosesPanel !== "undefined" && typeof SpritePosesPanel.updateToolbar === "function") {
        SpritePosesPanel.updateToolbar(this);
      }
      if (typeof PoseCards !== "undefined" && typeof PoseCards.renderPoseCards === "function") {
        PoseCards.renderPoseCards(this, item, poses);
      }
    } else {
      this.hide();
    }
  },

  hide() {
    if (this.panelEl) this.panelEl.style.display = "none";
    this.activeItem = null;
  }
};

if (typeof window !== "undefined") window.SpritePosesController = SpritePosesController;
if (typeof globalThis !== "undefined") globalThis.SpritePosesController = SpritePosesController;

