/**
 * UNIFIVE Engine - Lifecycle Canvas Touch Events Subsystem
 * Extracted from sketch.js lines 8212-8295.
 */
const LifecycleTouchEvents = {
  handleTouchStart(e, canvasEl) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvasEl.getBoundingClientRect();
      const sx = touch.clientX - rect.left;
      const sy = touch.clientY - rect.top;
      const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { panX: 1000, panY: 750, zoom: 1.0 };
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;

      if (typeof MouseToolController !== "undefined" && MouseToolController.activeTool === "select") {
        const hit = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getItemAt(wx, wy) : null;
        if (hit) {
          if (typeof WorldObjectsManager !== "undefined") {
            WorldObjectsManager.selectedId = hit.id;
            WorldObjectsManager.dragState.isDragging = true;
            WorldObjectsManager.dragState.mode = "move";
            WorldObjectsManager.dragState.startX = wx;
            WorldObjectsManager.dragState.startY = wy;
            WorldObjectsManager.dragState.startItemX = hit.x;
            WorldObjectsManager.dragState.startItemY = hit.y;
          }
          return;
        }
      }

      if (typeof MouseToolController !== "undefined" && MouseToolController.activeTool === "move") {
        if (typeof WorldConfig !== "undefined") {
          WorldConfig.isPanning = true;
          WorldConfig.panStartX = touch.clientX;
          WorldConfig.panStartY = touch.clientY;
          WorldConfig.startPanX = cam.panX;
          WorldConfig.startPanY = cam.panY;
        }
      }
    }
  },

  handleTouchMove(e, canvasEl) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { panX: 1000, panY: 750, zoom: 1.0 };

    // Object dragging
    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.dragState.isDragging && WorldObjectsManager.selectedId) {
      const selectedItem = WorldObjectsManager.getSelectedItem();
      if (selectedItem && canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const sx = touch.clientX - rect.left;
        const sy = touch.clientY - rect.top;
        const wx = cam.panX + (sx - width / 2) / cam.zoom;
        const wy = cam.panY + (sy - height / 2) / cam.zoom;
        const ds = WorldObjectsManager.dragState;
        const dx = wx - ds.startX;
        const dy = wy - ds.startY;
        const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
        const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
        selectedItem.x = Math.round(Math.max(0, Math.min(wWidth - selectedItem.w, ds.startItemX + dx)));
        selectedItem.y = Math.round(Math.max(0, Math.min(wHeight - selectedItem.h, ds.startItemY + dy)));
      }
      return;
    }

    // Panning
    if (typeof WorldConfig !== "undefined" && WorldConfig.isPanning) {
      if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
        const dx = (touch.clientX - WorldConfig.panStartX) / cam.zoom;
        const dy = (touch.clientY - WorldConfig.panStartY) / cam.zoom;
        if (typeof PreviewConfig !== "undefined") {
          PreviewConfig.panX = WorldConfig.startPanX - dx;
          PreviewConfig.panY = WorldConfig.startPanY - dy;
          PreviewConfig.isUserAdjusted = true;
        }
      } else {
        const dx = (touch.clientX - WorldConfig.panStartX) / WorldConfig.zoom;
        const dy = (touch.clientY - WorldConfig.panStartY) / WorldConfig.zoom;
        WorldConfig.panX = WorldConfig.startPanX - dx;
        WorldConfig.panY = WorldConfig.startPanY - dy;
        WorldConfig.clampPan();
      }
    }
  },

  handleTouchEnd() {
    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.dragState.isDragging) {
      WorldObjectsManager.dragState.isDragging = false;
      WorldObjectsManager.saveHistory();
    }
    if (typeof WorldConfig !== "undefined" && WorldConfig.isPanning) {
      WorldConfig.isPanning = false;
    }
  }
};
