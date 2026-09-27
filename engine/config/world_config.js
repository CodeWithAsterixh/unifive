/**
 * UNIFIVE Engine - World & Canvas Configuration Subsystem
 */
const WorldConfig = {
  bgColor: "#18181b",
  worldWidth: 2000,
  worldHeight: 1500,
  panX: 1000,
  panY: 750,
  zoom: 1.0,
  minZoom: 0.15,
  maxZoom: 4.0,
  orientation: "landscape",
  responsiveLayering: true,
  autoGoAround: true,
  isPanning: false,

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
    if (this.worldWidth > halfViewW * 2) this.panX = Math.max(halfViewW, Math.min(this.worldWidth - halfViewW, this.panX));
    else this.panX = this.worldWidth / 2;
    if (this.worldHeight > halfViewH * 2) this.panY = Math.max(halfViewH, Math.min(this.worldHeight - halfViewH, this.panY));
    else this.panY = this.worldHeight / 2;
  },

  setBgColor(hex) {
    if (hex) this.bgColor = hex;
    if (typeof WorldConfigMutations !== "undefined") WorldConfigMutations.setBgColor(this, hex);
  },
  setWorldSize(w, h) {
    this.worldWidth = Math.max(200, parseInt(w, 10) || 2000);
    this.worldHeight = Math.max(200, parseInt(h, 10) || 1500);
    this.clampPan();
    if (typeof WorldConfigMutations !== "undefined") WorldConfigMutations.setWorldSize(this, w, h);
  },
  setResponsiveLayering(enabled) {
    this.responsiveLayering = !!enabled;
    if (typeof WorldConfigMutations !== "undefined") WorldConfigMutations.setResponsiveLayering(this, enabled);
  },
  setOrientation(orientation) {
    this.orientation = orientation || "landscape";
    if (typeof WorldConfigMutations !== "undefined") WorldConfigMutations.setOrientation(this, orientation);
  },
  setAutoGoAround(enabled) {
    this.autoGoAround = !!enabled;
    if (typeof WorldConfigMutations !== "undefined") WorldConfigMutations.setAutoGoAround(this, enabled);
  }
};

if (typeof window !== "undefined") window.WorldConfig = WorldConfig;
if (typeof globalThis !== "undefined") globalThis.WorldConfig = WorldConfig;
