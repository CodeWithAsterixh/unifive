/**
 * UNIFIVE Engine - Player Camera Tracking Subsystem
 */
const PlayerCamera = {
  initCamera(engine) {
    const stageDims = (typeof getStageDimensions === "function") ? getStageDimensions() : { w: window.innerWidth, h: window.innerHeight };
    if (engine.activePlayableItem) {
      engine.camX = engine.activePlayableItem.x;
      engine.camY = engine.activePlayableItem.y;
    } else {
      engine.camX = (typeof WorldConfig !== "undefined") ? WorldConfig.worldWidth / 2 : 1000;
      engine.camY = (typeof WorldConfig !== "undefined") ? WorldConfig.worldHeight / 2 : 750;
    }
    const isMobile = typeof MobileControlsManager !== "undefined" ? MobileControlsManager.isMobile() : false;
    engine.camZoom = isMobile ? Math.min(1.2, stageDims.w / 480) : 1.0;
    engine.targetCamX = engine.camX;
    engine.targetCamY = engine.camY;
    this.clampCamera(engine);
  },
  clampCamera(engine) {
    const stageDims = (typeof getStageDimensions === "function") ? getStageDimensions() : { w: window.innerWidth, h: window.innerHeight };
    const z = engine.camZoom || 1.0;
    const viewW = stageDims.w / z;
    const viewH = stageDims.h / z;
    const worldW = (typeof WorldConfig !== "undefined") ? WorldConfig.worldWidth : 2000;
    const worldH = (typeof WorldConfig !== "undefined") ? WorldConfig.worldHeight : 1500;

    if (worldW > viewW) engine.camX = Math.max(viewW / 2, Math.min(worldW - viewW / 2, engine.camX));
    else engine.camX = worldW / 2;

    if (worldH > viewH) engine.camY = Math.max(viewH / 2, Math.min(worldH - viewH / 2, engine.camY));
    else engine.camY = worldH / 2;

    if (typeof WorldConfig !== "undefined") {
      WorldConfig.panX = engine.camX;
      WorldConfig.panY = engine.camY;
      WorldConfig.zoom = engine.camZoom;
    }
  },
  updateCameraFollow(engine) {
    if (engine.activePlayableItem) {
      engine.targetCamX = engine.activePlayableItem.x;
      engine.targetCamY = engine.activePlayableItem.y;
    }
    engine.camX += (engine.targetCamX - engine.camX) * engine.lerpFactor;
    engine.camY += (engine.targetCamY - engine.camY) * engine.lerpFactor;
    this.clampCamera(engine);
  }
};
