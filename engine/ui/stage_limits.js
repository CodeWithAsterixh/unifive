/**
 * UNIFIVE Engine - Stage Limits Subsystem
 */
const StageLimits = {
  init(controller) {
    const stageW = document.getElementById("cfg-stage-width");
    const stageH = document.getElementById("cfg-stage-height");
    if (stageW) {
      stageW.addEventListener("change", (e) => {
        if (typeof WorldConfig !== "undefined") WorldConfig.CANVAS_WIDTH = parseInt(e.target.value, 10) || 1280;
      });
    }
    if (stageH) {
      stageH.addEventListener("change", (e) => {
        if (typeof WorldConfig !== "undefined") WorldConfig.CANVAS_HEIGHT = parseInt(e.target.value, 10) || 720;
      });
    }
  }
};
