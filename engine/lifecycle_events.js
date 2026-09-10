/**
 * UNIFIVE Engine - Lifecycle Canvas Events Subsystem
 * Binds all canvas and window-level mouse/touch/wheel events.
 */
function bindCanvasEvents(canvasEl) {
  if (!canvasEl) return;

  // Canvas-level events
  canvasEl.addEventListener("dblclick", function(e) {
    if (typeof LifecycleMouseEvents !== "undefined") LifecycleMouseEvents.handleDblClick(e, canvasEl);
  });
  canvasEl.addEventListener("mousedown", function(e) {
    if (typeof LifecycleMouseEvents !== "undefined") LifecycleMouseEvents.handleMouseDown(e, canvasEl);
  });
  canvasEl.addEventListener("wheel", function(e) {
    if (typeof LifecycleZoomEvents !== "undefined") LifecycleZoomEvents.handleWheel(e, canvasEl);
  }, { passive: false });

  // Touch events on canvas
  canvasEl.addEventListener("touchstart", function(e) {
    if (typeof LifecycleTouchEvents !== "undefined") LifecycleTouchEvents.handleTouchStart(e, canvasEl);
  }, { passive: false });

  // Window-level events for drag/pan continuity
  window.addEventListener("mousemove", function(e) {
    if (typeof LifecycleMouseMove !== "undefined") LifecycleMouseMove.handleMouseMove(e);
  });
  window.addEventListener("mouseup", function() {
    if (typeof LifecycleMouseUp !== "undefined") LifecycleMouseUp.handleMouseUp();
  });
  window.addEventListener("touchmove", function(e) {
    if (typeof LifecycleTouchEvents !== "undefined") LifecycleTouchEvents.handleTouchMove(e, canvasEl);
  }, { passive: true });
  window.addEventListener("touchend", function() {
    if (typeof LifecycleTouchEvents !== "undefined") LifecycleTouchEvents.handleTouchEnd();
  });
}
