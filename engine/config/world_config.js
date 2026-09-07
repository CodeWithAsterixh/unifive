/**
 * UNIFIVE Engine - World Config Subsystem
 * Workspace dimensions, background color, viewport pan clamping, and simulation toggles.
 */
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

    // Horizontal Boundary Clamping
    if (this.worldWidth > halfViewW * 2) {
      this.panX = Math.max(halfViewW, Math.min(this.worldWidth - halfViewW, this.panX));
    } else {
      this.panX = this.worldWidth / 2;
    }

    // Vertical Boundary Clamping
    if (this.worldHeight > halfViewH * 2) {
      this.panY = Math.max(halfViewH, Math.min(this.worldHeight - halfViewH, this.panY));
    } else {
      this.panY = this.worldHeight / 2;
    }
  },

  setBgColor(hex) {
    this.bgColor = hex;
    if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
  },

  setWorldSize(w, h) {
    this.worldWidth = Math.max(200, parseInt(w) || 2000);
    this.worldHeight = Math.max(200, parseInt(h) || 1500);
    this.clampPan();
    if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
  },

  setResponsiveLayering(enabled) {
    this.responsiveLayering = !!enabled;
    if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
  },

  setAutoGoAround(enabled) {
    this.autoGoAround = !!enabled;
    if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
  }
};