/**
 * UNIFIVE Engine - Stage Camera Subsystem
 * Stage camera fit calculations, code preview camera state, and active camera resolution.
 */
const PreviewConfig = {
  zoom: null,
  panX: null,
  panY: null,
  isUserAdjusted: false,

  reset() {
    this.zoom = null;
    this.panX = null;
    this.panY = null;
    this.isUserAdjusted = false;
  },

  getFitZoom(stageW, stageH, worldW, worldH) {
    if (stageW <= 0 || stageH <= 0 || worldW <= 0 || worldH <= 0) return 0.2;
    const pad = 16;
    const zX = (stageW - pad) / Math.max(1, worldW);
    const zY = (stageH - pad) / Math.max(1, worldH);
    return Math.min(zX, zY);
  },

  getCamera(stageW, stageH, worldW, worldH) {
    const fitZ = this.getFitZoom(stageW, stageH, worldW, worldH);
    const z = (this.isUserAdjusted && this.zoom !== null) ? this.zoom : fitZ;
    const px = (this.isUserAdjusted && this.panX !== null) ? this.panX : (worldW / 2);
    const py = (this.isUserAdjusted && this.panY !== null) ? this.panY : (worldH / 2);
    return { zoom: z, panX: px, panY: py, isPreview: true };
  }
};

function getActiveStageCamera() {
  if (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) {
    return {
      zoom: GamePlayerEngine.camZoom,
      panX: GamePlayerEngine.camX,
      panY: GamePlayerEngine.camY,
      isPreview: false
    };
  }
  if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
    const stageDims = (typeof getStageDimensions === "function") ? getStageDimensions() : { w: 400, h: 300 };
    const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
    const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
    return PreviewConfig.getCamera(stageDims.w, stageDims.h, wWidth, wHeight);
  }
  return {
    zoom: typeof WorldConfig !== "undefined" ? WorldConfig.zoom : 1.0,
    panX: typeof WorldConfig !== "undefined" ? WorldConfig.panX : 1000,
    panY: typeof WorldConfig !== "undefined" ? WorldConfig.panY : 750,
    isPreview: false
  };
}
