/**
 * UNIFIVE Engine - Lifecycle Canvas Touch Events Subsystem
 * Handles single-touch object manipulation & canvas panning, and two-finger pinch zoom.
 */
const LifecycleTouchEvents = {
  isPinching: false,
  initialPinchDistance: 0,
  initialZoom: 1.0,
  lastTouchX: 0,
  lastTouchY: 0,

  handleTouchStart(e, canvasEl) {
    if (e.touches.length === 2) {
      this.isPinching = true;
      if (typeof WorldConfig !== "undefined") WorldConfig.isPanning = false;
      if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.dragState) {
        WorldObjectsManager.dragState.isDragging = false;
      }
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      this.initialPinchDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
      this.initialZoom = (isCode && typeof PreviewConfig !== "undefined")
        ? (PreviewConfig.zoom || 1.0)
        : (typeof WorldConfig !== "undefined" ? WorldConfig.zoom : 1.0);
      if (e.cancelable) e.preventDefault();
      return;
    }

    if (e.touches.length === 1) {
      this.isPinching = false;
      const touch = e.touches[0];
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;

      if (typeof LifecycleMouseEvents !== "undefined") {
        LifecycleMouseEvents.handleMouseDown({
          button: 0,
          clientX: touch.clientX,
          clientY: touch.clientY,
          target: canvasEl,
          preventDefault: () => { if (e.cancelable) e.preventDefault(); }
        }, canvasEl);
      }
    }
  },

  handleTouchMove(e, canvasEl) {
    if (e.touches.length === 2 && this.isPinching) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (this.initialPinchDistance > 0) {
        const scale = currDist / this.initialPinchDistance;
        const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
        if (isCode && typeof PreviewConfig !== "undefined") {
          PreviewConfig.zoom = Math.max(0.15, Math.min(4.0, this.initialZoom * scale));
          PreviewConfig.isUserAdjusted = true;
        } else if (typeof WorldConfig !== "undefined") {
          const newZoom = Math.max(WorldConfig.minZoom || 0.15, Math.min(WorldConfig.maxZoom || 4.0, this.initialZoom * scale));
          WorldConfig.zoom = Math.round(newZoom * 100) / 100;
          WorldConfig.clampPan();
        }
        if (e.cancelable) e.preventDefault();
      }
      return;
    }

    if (e.touches.length === 1 && !this.isPinching) {
      const touch = e.touches[0];
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;

      if (typeof LifecycleMouseMove !== "undefined") {
        LifecycleMouseMove.handleMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY
        });
      }

      const isPanning = typeof WorldConfig !== "undefined" && WorldConfig.isPanning;
      const isDraggingObj = typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.dragState && WorldObjectsManager.dragState.isDragging;
      const isCropping = typeof CropController !== "undefined" && CropController.cropDragState && CropController.cropDragState.isDragging;
      if (e.cancelable && (isPanning || isDraggingObj || isCropping)) {
        e.preventDefault();
      }
    }
  },

  handleTouchEnd(e) {
    if (e && e.touches && e.touches.length >= 2) return;
    if (this.isPinching) {
      this.isPinching = false;
      this.initialPinchDistance = 0;
      return;
    }
    if (typeof LifecycleMouseUp !== "undefined") {
      LifecycleMouseUp.handleMouseUp();
    }
  }
};

if (typeof window !== "undefined") window.LifecycleTouchEvents = LifecycleTouchEvents;
if (typeof globalThis !== "undefined") globalThis.LifecycleTouchEvents = LifecycleTouchEvents;
