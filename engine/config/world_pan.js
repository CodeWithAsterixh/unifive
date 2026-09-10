/**
 * UNIFIVE Engine - World Pan Boundary Subsystem
 */
const WorldPan = {
  clamp(config, stageW, stageH) {
    if (!stageW || !stageH || stageW <= 0 || stageH <= 0) {
      config.panX = Math.max(0, Math.min(config.worldWidth, config.panX));
      config.panY = Math.max(0, Math.min(config.worldHeight, config.panY));
      return;
    }
    const halfViewW = (stageW / 2) / config.zoom;
    const halfViewH = (stageH / 2) / config.zoom;
    if (config.worldWidth > halfViewW * 2) {
      config.panX = Math.max(halfViewW, Math.min(config.worldWidth - halfViewW, config.panX));
    } else {
      config.panX = config.worldWidth / 2;
    }
    if (config.worldHeight > halfViewH * 2) {
      config.panY = Math.max(halfViewH, Math.min(config.worldHeight - halfViewH, config.panY));
    } else {
      config.panY = config.worldHeight / 2;
    }
  }
};
