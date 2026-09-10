/**
 * UNIFIVE Engine - Lifecycle Canvas Mouse Events Subsystem
 * Handles dblclick and mousedown on canvas.
 * Extracted from sketch.js lines 7899-8019.
 */
const LifecycleMouseEvents = {
  getSpacePressed() {
    return typeof isSpacePressed !== "undefined" ? isSpacePressed : (typeof window !== "undefined" && window.isSpacePressed);
  },

  handleDblClick(e, canvasEl) {
    if (typeof MouseToolController !== "undefined" && MouseToolController.activeTool === "select" && !this.getSpacePressed()) {
      const rect = canvasEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { panX: 1000, panY: 750, zoom: 1.0 };
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;

      const hit = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getItemAt(wx, wy) : null;
      if (hit && typeof CropController !== "undefined") {
        CropController.startCrop(hit.id);
      }
    }
  },

  handleMouseDown(e, canvasEl) {
    const rect = canvasEl.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const spacePressed = this.getSpacePressed();

    if (typeof VariableManager !== "undefined" && VariableManager.handleMouseDown(sx, sy)) return;

    const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { panX: 1000, panY: 750, zoom: 1.0 };

    // 0. GAME PLAYER Click-to-Broadcast / Touch Controls
    if (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) {
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;
      if (typeof PlayerInputManager !== "undefined") PlayerInputManager.handleCanvasClick(wx, wy);
      return;
    }

    // 0. CROP MODE Interaction
    if (e.button === 0 && typeof CropController !== "undefined" && CropController.isActive && !spacePressed) {
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;
      const selectedItem = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
      if (selectedItem && selectedItem.id === CropController.targetItemId) {
        const target = CropController.getCropTransformTarget(selectedItem, wx, wy);
        if (target) {
          CropController.cropDragState.isDragging = true;
          CropController.cropDragState.handle = target.handle;
          CropController.cropDragState.startX = wx;
          CropController.cropDragState.startY = wy;
          CropController.cropDragState.startLx = target.lx;
          CropController.cropDragState.startLy = target.ly;
          CropController.cropDragState.startCrop = { ...selectedItem.crop };
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "square", 0.04, 0.06);
          return;
        }
      }
    }

    // 1. SELECT Tool: Transform Gizmo (Rotate / Resize / Move)
    if (e.button === 0 && typeof MouseToolController !== "undefined" && MouseToolController.activeTool === "select" && !spacePressed) {
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;
      const selectedItem = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;

      if (selectedItem) {
        const target = WorldObjectsManager.getTransformTarget(selectedItem, wx, wy);
        if (target) {
          if (target.mode === "locked_only") {
            if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(320, "square", 0.05, 0.08);
            return;
          }
          const cx = selectedItem.x + selectedItem.w / 2;
          const cy = selectedItem.y + selectedItem.h / 2;

          WorldObjectsManager.dragState.isDragging = true;
          WorldObjectsManager.dragState.mode = target.mode;
          WorldObjectsManager.dragState.handle = target.handle;
          WorldObjectsManager.dragState.startX = wx;
          WorldObjectsManager.dragState.startY = wy;
          WorldObjectsManager.dragState.startItemX = selectedItem.x;
          WorldObjectsManager.dragState.startItemY = selectedItem.y;
          WorldObjectsManager.dragState.startItemW = selectedItem.w;
          WorldObjectsManager.dragState.startItemH = selectedItem.h;
          WorldObjectsManager.dragState.anchorX = cx;
          WorldObjectsManager.dragState.anchorY = cy;
          WorldObjectsManager.dragState.initialAngle = selectedItem.rotation || 0;

          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(target.mode === "rotate" ? 640 : 540, "square", 0.05, 0.08);
          return;
        }
      }

      // If no gizmo handle hit, test all items in world
      const hit = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getItemAt(wx, wy) : null;
      if (hit) {
        WorldObjectsManager.selectItem(hit.id);
        const cx = hit.x + hit.w / 2;
        const cy = hit.y + hit.h / 2;

        if (!hit.locked) {
          WorldObjectsManager.dragState.isDragging = true;
          WorldObjectsManager.dragState.mode = "move";
          WorldObjectsManager.dragState.startX = wx;
          WorldObjectsManager.dragState.startY = wy;
          WorldObjectsManager.dragState.startItemX = hit.x;
          WorldObjectsManager.dragState.startItemY = hit.y;
          WorldObjectsManager.dragState.startItemW = hit.w;
          WorldObjectsManager.dragState.startItemH = hit.h;
          WorldObjectsManager.dragState.anchorX = cx;
          WorldObjectsManager.dragState.anchorY = cy;
        }

        // Trigger 'when this sprite clicked' event if running
        if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
          CodeRuntimeEngine.triggerEvent("when_clicked", hit.id);
        }

        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(hit.locked ? 320 : 520, "square", 0.05, 0.08);
      } else {
        WorldObjectsManager.selectItem(null);
      }
      return;
    }

    // 2. MOVE Tool / Spacebar / Middle Click: Pan Canvas World
    if (e.button === 1 || (e.button === 0 && (spacePressed || (typeof MouseToolController !== "undefined" && MouseToolController.activeTool === "move")))) {
      if (typeof WorldConfig !== "undefined") {
        WorldConfig.isPanning = true;
        WorldConfig.panStartX = e.clientX;
        WorldConfig.panStartY = e.clientY;
        WorldConfig.startPanX = cam.panX;
        WorldConfig.startPanY = cam.panY;
      }
      const container = document.getElementById("canvas-container");
      if (container) container.classList.add("panning");
    }
  }
};
