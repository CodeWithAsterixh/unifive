/**
 * UNIFIVE Engine - Canvas Dimensions Subsystem
 * Viewport stage dimension calculations, device pixel scaling, and canvas resize handlers.
 */
let mainCanvas;

function getStageDimensions() {
  if ((typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) || (typeof document !== "undefined" && document.body && document.body.classList.contains("mode-play"))) {
    return {
      w: window.innerWidth,
      h: window.innerHeight
    };
  }
  const container = document.getElementById("canvas-container");
  if (container) {
    return {
      w: container.clientWidth || 800,
      h: container.clientHeight || 600
    };
  }
  return { w: 800, h: 600 };
}

function resizeStageCanvas() {
  const dims = getStageDimensions();
  if (mainCanvas && (width !== dims.w || height !== dims.h)) {
    resizeCanvas(dims.w, dims.h);
    if (typeof WorldConfig !== "undefined") WorldConfig.clampPan();
  }
}