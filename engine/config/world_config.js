let isSpacePressed = false;

const WorldConfig = {
  bgColor: "#ffffff",
  worldWidth: 2000,
  worldHeight: 1500,
  panX: 1000,
  panY: 750,
  zoom: 1.0,
  minZoom: 0.15,
  maxZoom: 4.0,
  responsiveLayering: true,
  autoGoAround: true,

  // Pan Drag State
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  startPanX: 0,
  startPanY: 0,

  init() {
    this.panX = Math.round(this.worldWidth / 2);
    this.panY = Math.round(this.worldHeight / 2);
  },

  clampPan() {
    if (typeof width === "undefined" || typeof height === "undefined" || width <= 0 || height <= 0) {
      this.panX = Math.max(0, Math.min(this.worldWidth, this.panX));
      this.panY = Math.max(0, Math.min(this.worldHeight, this.panY));
      return;
    }

    const halfViewW = (width / 2) / this.zoom;
    const halfViewH = (height / 2) / this.zoom;

    // Horizontal Boundary Clamping (World edge never leaves the canvas border)
    if (this.worldWidth > halfViewW * 2) {
      this.panX = Math.max(halfViewW, Math.min(this.worldWidth - halfViewW, this.panX));
    } else {
      this.panX = this.worldWidth / 2;
    }

    // Vertical Boundary Clamping (World edge never leaves the canvas border)
    if (this.worldHeight > halfViewH * 2) {
      this.panY = Math.max(halfViewH, Math.min(this.worldHeight - halfViewH, this.panY));
    } else {
      this.panY = this.worldHeight / 2;
    }
  },

  setBgColor(hex) {
    this.bgColor = hex;
    AsyncSceneStore.saveCurrentScene();
  },

  setWorldSize(w, h) {
    this.worldWidth = Math.max(200, parseInt(w) || 2000);
    this.worldHeight = Math.max(200, parseInt(h) || 1500);
    this.clampPan();
    AsyncSceneStore.saveCurrentScene();
  },

  setResponsiveLayering(enabled) {
    this.responsiveLayering = !!enabled;
    AsyncSceneStore.saveCurrentScene();
  },

  setAutoGoAround(enabled) {
    this.autoGoAround = !!enabled;
    AsyncSceneStore.saveCurrentScene();
  }
};

// ============================================================================
// 2b. INDEPENDENT CODE MODE PREVIEW CAMERA CONFIG
// ============================================================================
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
    const stageDims = getStageDimensions();
    return PreviewConfig.getCamera(stageDims.w, stageDims.h, WorldConfig.worldWidth, WorldConfig.worldHeight);
  }
  return {
    zoom: WorldConfig.zoom,
    panX: WorldConfig.panX,
    panY: WorldConfig.panY,
    isPreview: false
  };
}

// ============================================================================
// 2. MOUSE TOOL & GRID CONTROLLER (Floating Action Dock)
// ============================================================================