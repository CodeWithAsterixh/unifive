/**
 * UNIFIVE Engine - World Config Mutations Subsystem
 */
const WorldConfigMutations = {
  setBgColor(config, hex) {
    config.bgColor = hex;
    if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
  },
  setWorldSize(config, w, h) {
    config.worldWidth = Math.max(200, parseInt(w, 10) || 2000);
    config.worldHeight = Math.max(200, parseInt(h, 10) || 1500);
    config.clampPan();
    if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
  },
  setResponsiveLayering(config, enabled) {
    config.responsiveLayering = !!enabled;
    if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
  },
  setAutoGoAround(config, enabled) {
    config.autoGoAround = !!enabled;
    if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
  }
};
