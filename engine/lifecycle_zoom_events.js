/**
 * UNIFIVE Engine - Lifecycle Canvas Zoom & Wheel Subsystem
 * Extracted from sketch.js lines 8297-8311.
 */
const LifecycleZoomEvents = {
  handleWheel(e, canvasEl) {
    e.preventDefault();
    if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
      const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { zoom: 1.0 };
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      if (typeof PreviewConfig !== "undefined") {
        PreviewConfig.zoom = Math.max(0.02, Math.min(3.0, cam.zoom * zoomFactor));
        PreviewConfig.isUserAdjusted = true;
      }
    } else {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      if (typeof WorldConfig !== "undefined") {
        WorldConfig.zoom = Math.max(WorldConfig.minZoom, Math.min(WorldConfig.maxZoom, WorldConfig.zoom * zoomFactor));
        WorldConfig.clampPan();
      }
    }
  }
};
