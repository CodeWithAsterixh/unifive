/**
 * UNIFIVE Engine - Lifecycle Canvas Events Subsystem
 * Mouse, touch, wheel, and zoom handlers for the main p5 canvas element.
 */
function bindCanvasEvents(canvasEl) {
  if (!canvasEl) return;

  // Double Click: Enter Crop Mode on selected item
  canvasEl.addEventListener("dblclick", (e) => {
    if (typeof MouseToolController !== "undefined" && MouseToolController.activeTool === "select" && !isSpacePressed) {
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
  });

  canvasEl.addEventListener("mousedown", (e) => {
    const rect = canvasEl.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // 0. Variable Watchers Draggable Positioning
    if (typeof VariableManager !== "undefined" && VariableManager.handleMouseDown(sx, sy)) {
      return;
    }

    const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { panX: 1000, panY: 750, zoom: 1.0 };

    // 0. GAME PLAYER Click-to-Broadcast / Touch Controls
    if (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) {
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;
      if (typeof PlayerInputManager !== "undefined") {
        PlayerInputManager.handleCanvasClick(wx, wy);
      }
      return;
    }

    // 0. CROP MODE Interaction
    if (e.button === 0 && typeof CropController !== "undefined" && CropController.isActive && !isSpacePressed) {
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
    if (e.button === 0 && typeof MouseToolController !== "undefined" && MouseToolController.activeTool === "select" && !isSpacePressed) {
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

          if (typeof SoundEngine !== "undefined") {
            SoundEngine.playChiptuneTone(target.mode === "rotate" ? 640 : 540, "square", 0.05, 0.08);
          }
          return;
        }
      }

      if (typeof WorldObjectsManager !== "undefined") {
        const hit = WorldObjectsManager.getItemAt(wx, wy);
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

          if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
            CodeRuntimeEngine.triggerEvent("when_clicked", hit.id);
          }

          if (typeof SoundEngine !== "undefined") {
            SoundEngine.playChiptuneTone(hit.locked ? 320 : 520, "square", 0.05, 0.08);
          }
        } else {
          WorldObjectsManager.selectItem(null);
        }
      }
      return;
    }

    // 2. MOVE Tool / Spacebar / Middle Click: Pan Canvas World
    if (e.button === 1 || (e.button === 0 && (typeof MouseToolController !== "undefined" && (MouseToolController.activeTool === "move" || isSpacePressed)))) {
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
  });

  window.addEventListener("mousemove", (e) => {
    // 0. Variable Watchers Hover & Dragging
    if (typeof VariableManager !== "undefined" && typeof mainCanvas !== "undefined" && mainCanvas) {
      const rect = mainCanvas.elt.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (VariableManager.handleMouseMove(sx, sy)) {
        if (VariableManager.draggedVar) return;
      }
    }

    const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { panX: 1000, panY: 750, zoom: 1.0 };

    // 0. Crop Dragging in CROP Mode
    if (typeof CropController !== "undefined" && CropController.cropDragState.isDragging && CropController.targetItemId && typeof mainCanvas !== "undefined" && mainCanvas) {
      const selectedItem = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
      if (selectedItem && selectedItem.crop) {
        const rect = mainCanvas.elt.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const wx = cam.panX + (sx - width / 2) / cam.zoom;
        const wy = cam.panY + (sy - height / 2) / cam.zoom;

        const { lx, ly } = WorldObjectsManager.worldToLocal(selectedItem, wx, wy);
        const ds = CropController.cropDragState;
        const nw = selectedItem.naturalW || selectedItem.w;
        const nh = selectedItem.naturalH || selectedItem.h;
        const scaleX = selectedItem.w / nw;
        const scaleY = selectedItem.h / nh;

        const dlx = (lx - ds.startLx) / scaleX;
        const dly = (ly - ds.startLy) / scaleY;

        let { x, y, w, h } = ds.startCrop;

        switch (ds.handle) {
          case "body":
            x = Math.max(0, Math.min(nw - w, Math.round(ds.startCrop.x + dlx)));
            y = Math.max(0, Math.min(nh - h, Math.round(ds.startCrop.y + dly)));
            break;
          case "se":
            w = Math.max(8, Math.min(nw - x, Math.round(ds.startCrop.w + dlx)));
            h = Math.max(8, Math.min(nh - y, Math.round(ds.startCrop.h + dly)));
            break;
          case "nw":
            const candX = Math.max(0, Math.min(ds.startCrop.x + ds.startCrop.w - 8, Math.round(ds.startCrop.x + dlx)));
            const candY = Math.max(0, Math.min(ds.startCrop.y + ds.startCrop.h - 8, Math.round(ds.startCrop.y + dly)));
            w = (ds.startCrop.x + ds.startCrop.w) - candX;
            h = (ds.startCrop.y + ds.startCrop.h) - candY;
            x = candX;
            y = candY;
            break;
          case "ne":
            const candY_ne = Math.max(0, Math.min(ds.startCrop.y + ds.startCrop.h - 8, Math.round(ds.startCrop.y + dly)));
            w = Math.max(8, Math.min(nw - x, Math.round(ds.startCrop.w + dlx)));
            h = (ds.startCrop.y + ds.startCrop.h) - candY_ne;
            y = candY_ne;
            break;
          case "sw":
            const candX_sw = Math.max(0, Math.min(ds.startCrop.x + ds.startCrop.w - 8, Math.round(ds.startCrop.x + dlx)));
            w = (ds.startCrop.x + ds.startCrop.w) - candX_sw;
            x = candX_sw;
            h = Math.max(8, Math.min(nh - y, Math.round(ds.startCrop.h + dly)));
            break;
          case "e":
            w = Math.max(8, Math.min(nw - x, Math.round(ds.startCrop.w + dlx)));
            break;
          case "w":
            const candX_w = Math.max(0, Math.min(ds.startCrop.x + ds.startCrop.w - 8, Math.round(ds.startCrop.x + dlx)));
            w = (ds.startCrop.x + ds.startCrop.w) - candX_w;
            x = candX_w;
            break;
          case "s":
            h = Math.max(8, Math.min(nh - y, Math.round(ds.startCrop.h + dly)));
            break;
          case "n":
            const candY_n = Math.max(0, Math.min(ds.startCrop.y + ds.startCrop.h - 8, Math.round(ds.startCrop.y + dly)));
            h = (ds.startCrop.y + ds.startCrop.h) - candY_n;
            y = candY_n;
            break;
        }

        selectedItem.crop.x = Math.round(x);
        selectedItem.crop.y = Math.round(y);
        selectedItem.crop.w = Math.round(w);
        selectedItem.crop.h = Math.round(h);
        selectedItem.crop.isCropped = (x > 0 || y > 0 || w < nw || h < nh);

        if (typeof PropertiesController !== "undefined") {
          PropertiesController.updateFromSelected(selectedItem);
        }
      }
      return;
    }

    // 1. Transforming Selected Item in SELECT Mode
    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.dragState.isDragging && WorldObjectsManager.selectedId && typeof mainCanvas !== "undefined" && mainCanvas) {
      const selectedItem = WorldObjectsManager.getSelectedItem();
      if (selectedItem) {
        const rect = mainCanvas.elt.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const wx = cam.panX + (sx - width / 2) / cam.zoom;
        const wy = cam.panY + (sy - height / 2) / cam.zoom;

        const ds = WorldObjectsManager.dragState;
        const cx = ds.anchorX;
        const cy = ds.anchorY;

        if (ds.mode === "rotate") {
          const rad = Math.atan2(wy - cy, wx - cx);
          let deg = (rad * 180 / Math.PI) + 90;
          deg = ((deg % 360) + 360) % 360;
          if (e.shiftKey) deg = Math.round(deg / 15) * 15;
          selectedItem.rotation = Math.round(deg);
          if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(selectedItem);
        } else if (ds.mode === "resize") {
          const { lx, ly } = WorldObjectsManager.worldToLocal(selectedItem, wx, wy);
          let w = ds.startItemW;
          let h = ds.startItemH;

          switch (ds.handle) {
            case "se": w = Math.round(lx * 2); h = Math.round(ly * 2); break;
            case "nw": w = Math.round(-lx * 2); h = Math.round(-ly * 2); break;
            case "ne": w = Math.round(lx * 2); h = Math.round(-ly * 2); break;
            case "sw": w = Math.round(-lx * 2); h = Math.round(ly * 2); break;
            case "e":  w = Math.round(lx * 2); break;
            case "w":  w = Math.round(-lx * 2); break;
            case "s":  h = Math.round(ly * 2); break;
            case "n":  h = Math.round(-ly * 2); break;
          }

          if ((typeof PropertiesController !== "undefined" && PropertiesController.lockAspect) || e.shiftKey) {
            const ratio = ds.startItemW / ds.startItemH;
            if (ds.handle === "e" || ds.handle === "w") {
              h = Math.round(w / ratio);
            } else if (ds.handle === "n" || ds.handle === "s") {
              w = Math.round(h * ratio);
            } else {
              if (Math.abs(w / ds.startItemW) > Math.abs(h / ds.startItemH)) {
                h = Math.round(w / ratio);
              } else {
                w = Math.round(h * ratio);
              }
            }
          }

          w = Math.max(16, w);
          h = Math.max(16, h);

          selectedItem.w = w;
          selectedItem.h = h;
          selectedItem.x = Math.round(cx - w / 2);
          selectedItem.y = Math.round(cy - h / 2);
          if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(selectedItem);
        } else if (ds.mode === "move") {
          const dx = wx - ds.startX;
          const dy = wy - ds.startY;
          const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
          const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
          selectedItem.x = Math.round(Math.max(0, Math.min(wWidth - selectedItem.w, ds.startItemX + dx)));
          selectedItem.y = Math.round(Math.max(0, Math.min(wHeight - selectedItem.h, ds.startItemY + dy)));
          if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(selectedItem);
        }
      }
      return;
    }

    // 2. Canvas World Panning
    if (typeof WorldConfig !== "undefined" && WorldConfig.isPanning) {
      if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode() && typeof PreviewConfig !== "undefined") {
        const dx = (e.clientX - WorldConfig.panStartX) / cam.zoom;
        const dy = (e.clientY - WorldConfig.panStartY) / cam.zoom;
        PreviewConfig.panX = WorldConfig.startPanX - dx;
        PreviewConfig.panY = WorldConfig.startPanY - dy;
        PreviewConfig.isUserAdjusted = true;
      } else {
        const dx = (e.clientX - WorldConfig.panStartX) / WorldConfig.zoom;
        const dy = (e.clientY - WorldConfig.panStartY) / WorldConfig.zoom;
        WorldConfig.panX = WorldConfig.startPanX - dx;
        WorldConfig.panY = WorldConfig.startPanY - dy;
        WorldConfig.clampPan();
      }
    }
  });

  window.addEventListener("mouseup", () => {
    if (typeof VariableManager !== "undefined" && VariableManager.handleMouseUp()) {
      return;
    }

    if (typeof CropController !== "undefined" && CropController.cropDragState.isDragging) {
      CropController.cropDragState.isDragging = false;
      if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
    }

    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.dragState.isDragging) {
      WorldObjectsManager.dragState.isDragging = false;
      WorldObjectsManager.saveHistory();
      if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
    }

    if (typeof WorldConfig !== "undefined" && WorldConfig.isPanning) {
      WorldConfig.isPanning = false;
      const container = document.getElementById("canvas-container");
      if (container) container.classList.remove("panning");
    }
  });

  // Touch panning & object interaction
  canvasEl.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvasEl.getBoundingClientRect();
      const sx = touch.clientX - rect.left;
      const sy = touch.clientY - rect.top;

      if (typeof VariableManager !== "undefined" && VariableManager.handleMouseDown(sx, sy)) {
        return;
      }

      const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { panX: 1000, panY: 750, zoom: 1.0 };
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;

      if (typeof WorldObjectsManager !== "undefined") {
        const hit = WorldObjectsManager.getItemAt(wx, wy);
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
        }
      }
    }
  }, { passive: true });

  canvasEl.addEventListener("touchmove", (e) => {
    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.dragState.isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvasEl.getBoundingClientRect();
      const sx = touch.clientX - rect.left;
      const sy = touch.clientY - rect.top;
      const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { panX: 1000, panY: 750, zoom: 1.0 };
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;

      const selectedItem = WorldObjectsManager.getSelectedItem();
      if (selectedItem) {
        const ds = WorldObjectsManager.dragState;
        const dx = wx - ds.startX;
        const dy = wy - ds.startY;
        const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
        const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
        selectedItem.x = Math.round(Math.max(0, Math.min(wWidth - selectedItem.w, ds.startItemX + dx)));
        selectedItem.y = Math.round(Math.max(0, Math.min(wHeight - selectedItem.h, ds.startItemY + dy)));
        if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(selectedItem);
      }
    }
  }, { passive: true });

  canvasEl.addEventListener("touchend", () => {
    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.dragState.isDragging) {
      WorldObjectsManager.dragState.isDragging = false;
      WorldObjectsManager.saveHistory();
    }
  });

  // Wheel Zoom Interaction
  canvasEl.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    
    if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode() && typeof PreviewConfig !== "undefined") {
      PreviewConfig.zoom = Math.min(PreviewConfig.maxZoom, Math.max(PreviewConfig.minZoom, PreviewConfig.zoom * factor));
      PreviewConfig.isUserAdjusted = true;
    } else if (typeof WorldConfig !== "undefined") {
      WorldConfig.setZoom(WorldConfig.zoom * factor);
    }
  }, { passive: false });
}
