function setup() {
  // Initialize non-blocking background store (IndexedDB)
  AsyncSceneStore.init().then(() => {
    const activeView = ViewController.currentView || "sidefacing";
    AsyncSceneStore.loadSceneToActive(activeView);
  });

  WorldConfig.init();
  const dims = getStageDimensions();
  mainCanvas = createCanvas(dims.w, dims.h);
  WorldConfig.clampPan();
  
  const container = document.getElementById("canvas-container");
  if (container) {
    mainCanvas.parent("canvas-container");
  }
  // Crisp pixel rendering
  noSmooth();
  pixelDensity(1);

  initUIEventListeners();
  ViewController.init();
  MobileNavigationController.init();
  TabController.init();
  CreatePanelController.init();
  WorldObjectsManager.init();
  PropertiesController.init();
  LayersController.init();
  ConfigController.init();
  SpritePosesController.init();
  MouseToolController.init();
  SplitterController.init();
  AppModeController.init();
  VariableManager.init();
  CodeRuntimeEngine.init();
  U5Compiler.init();
  HistoryManager.updateUI();
  LayersController.update();

  // Mouse listeners on canvas
  const canvasEl = mainCanvas.elt;

  // Double Click: Enter Crop Mode on selected item
  canvasEl.addEventListener("dblclick", (e) => {
    if (MouseToolController.activeTool === "select" && !isSpacePressed) {
      const rect = canvasEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const cam = getActiveStageCamera();
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;

      const hit = WorldObjectsManager.getItemAt(wx, wy);
      if (hit) {
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

    const cam = getActiveStageCamera();

    // 0. GAME PLAYER Click-to-Broadcast / Touch Controls
    if (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) {
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;
      PlayerInputManager.handleCanvasClick(wx, wy);
      return;
    }

    // 0. CROP MODE Interaction
    if (e.button === 0 && CropController.isActive && !isSpacePressed) {
      const rect = canvasEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;

      const selectedItem = WorldObjectsManager.getSelectedItem();
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
          SoundEngine.playChiptuneTone(540, "square", 0.04, 0.06);
          return;
        }
      }
    }

    // 1. SELECT Tool: Transform Gizmo (Rotate / Resize / Move)
    if (e.button === 0 && MouseToolController.activeTool === "select" && !isSpacePressed) {
      const rect = canvasEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;

      const selectedItem = WorldObjectsManager.getSelectedItem();
      if (selectedItem) {
        const target = WorldObjectsManager.getTransformTarget(selectedItem, wx, wy);
        if (target) {
          if (target.mode === "locked_only") {
            SoundEngine.playChiptuneTone(320, "square", 0.05, 0.08);
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

          SoundEngine.playChiptuneTone(target.mode === "rotate" ? 640 : 540, "square", 0.05, 0.08);
          return;
        }
      }

      // If no gizmo handle hit, test all items in world
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

        // Trigger 'when this sprite clicked' event if running
        if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
          CodeRuntimeEngine.triggerEvent("when_clicked", hit.id);
        }

        SoundEngine.playChiptuneTone(hit.locked ? 320 : 520, "square", 0.05, 0.08);
      } else {
        WorldObjectsManager.selectItem(null);
      }
      return;
    }

    // 2. MOVE Tool / Spacebar / Middle Click: Pan Canvas World
    if (e.button === 1 || (e.button === 0 && (MouseToolController.activeTool === "move" || isSpacePressed))) {
      WorldConfig.isPanning = true;
      WorldConfig.panStartX = e.clientX;
      WorldConfig.panStartY = e.clientY;
      WorldConfig.startPanX = cam.panX;
      WorldConfig.startPanY = cam.panY;
      
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

    const cam = getActiveStageCamera();

    // 0. Crop Dragging in CROP Mode
    if (CropController.cropDragState.isDragging && CropController.targetItemId && mainCanvas) {
      const selectedItem = WorldObjectsManager.getSelectedItem();
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

        PropertiesController.updateFromSelected(selectedItem);
      }
      return;
    }

    // 1. Transforming Selected Item in SELECT Mode
    if (WorldObjectsManager.dragState.isDragging && WorldObjectsManager.selectedId && mainCanvas) {
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
          PropertiesController.updateFromSelected(selectedItem);
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

          if (PropertiesController.lockAspect || e.shiftKey) {
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
          PropertiesController.updateFromSelected(selectedItem);
        } else if (ds.mode === "move") {
          const dx = wx - ds.startX;
          const dy = wy - ds.startY;
          selectedItem.x = Math.round(Math.max(0, Math.min(WorldConfig.worldWidth - selectedItem.w, ds.startItemX + dx)));
          selectedItem.y = Math.round(Math.max(0, Math.min(WorldConfig.worldHeight - selectedItem.h, ds.startItemY + dy)));
          PropertiesController.updateFromSelected(selectedItem);
        }
      }
      return;
    }

    // 2. Canvas World Panning
    if (WorldConfig.isPanning) {
      if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
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

    if (CropController.cropDragState.isDragging) {
      CropController.cropDragState.isDragging = false;
      WorldObjectsManager.saveHistory();
    }

    if (WorldObjectsManager.dragState.isDragging) {
      WorldObjectsManager.dragState.isDragging = false;
      WorldObjectsManager.saveHistory();
      AsyncSceneStore.saveCurrentScene();
    }

    if (WorldConfig.isPanning) {
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

      const cam = getActiveStageCamera();
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;

      if (MouseToolController.activeTool === "select") {
        const hit = WorldObjectsManager.getItemAt(wx, wy);
        if (hit) {
          WorldObjectsManager.selectedId = hit.id;
          WorldObjectsManager.dragState.isDragging = true;
          WorldObjectsManager.dragState.startX = wx;
          WorldObjectsManager.dragState.startY = wy;
          WorldObjectsManager.dragState.startItemX = hit.x;
          WorldObjectsManager.dragState.startItemY = hit.y;
          return;
        }
      }

      if (MouseToolController.activeTool === "move") {
        WorldConfig.isPanning = true;
        WorldConfig.panStartX = touch.clientX;
        WorldConfig.panStartY = touch.clientY;
        WorldConfig.startPanX = cam.panX;
        WorldConfig.startPanY = cam.panY;
      }
    }
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvasEl.getBoundingClientRect();
      const sx = touch.clientX - rect.left;
      const sy = touch.clientY - rect.top;

      if (typeof VariableManager !== "undefined" && VariableManager.handleMouseMove(sx, sy)) {
        if (VariableManager.draggedVar) return;
      }

      const cam = getActiveStageCamera();

      if (WorldObjectsManager.dragState.isDragging && WorldObjectsManager.selectedId) {
        const selectedItem = WorldObjectsManager.getSelectedItem();
        if (selectedItem) {
          const rect = canvasEl.getBoundingClientRect();
          const sx = touch.clientX - rect.left;
          const sy = touch.clientY - rect.top;
          const wx = cam.panX + (sx - width / 2) / cam.zoom;
          const wy = cam.panY + (sy - height / 2) / cam.zoom;

          const dx = wx - WorldObjectsManager.dragState.startX;
          const dy = wy - WorldObjectsManager.dragState.startY;

          selectedItem.x = Math.round(Math.max(0, Math.min(WorldConfig.worldWidth - selectedItem.w, WorldObjectsManager.dragState.startItemX + dx)));
          selectedItem.y = Math.round(Math.max(0, Math.min(WorldConfig.worldHeight - selectedItem.h, WorldObjectsManager.dragState.startItemY + dy)));
        }
        return;
      }

      if (WorldConfig.isPanning) {
        if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
          const dx = (touch.clientX - WorldConfig.panStartX) / cam.zoom;
          const dy = (touch.clientY - WorldConfig.panStartY) / cam.zoom;
          PreviewConfig.panX = WorldConfig.startPanX - dx;
          PreviewConfig.panY = WorldConfig.startPanY - dy;
          PreviewConfig.isUserAdjusted = true;
        } else {
          const dx = (touch.clientX - WorldConfig.panStartX) / WorldConfig.zoom;
          const dy = (touch.clientY - WorldConfig.panStartY) / WorldConfig.zoom;
          WorldConfig.panX = WorldConfig.startPanX - dx;
          WorldConfig.panY = WorldConfig.startPanY - dy;
          WorldConfig.clampPan();
        }
      }
    }
  }, { passive: true });

  window.addEventListener("touchend", () => {
    if (WorldObjectsManager.dragState.isDragging) {
      WorldObjectsManager.dragState.isDragging = false;
      WorldObjectsManager.saveHistory();
    }
    if (WorldConfig.isPanning) {
      WorldConfig.isPanning = false;
    }
  });

  // Mouse wheel zoom
  canvasEl.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
      const cam = getActiveStageCamera();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      PreviewConfig.zoom = Math.max(0.02, Math.min(3.0, cam.zoom * zoomFactor));
      PreviewConfig.isUserAdjusted = true;
    } else {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      WorldConfig.zoom = Math.max(WorldConfig.minZoom, Math.min(WorldConfig.maxZoom, WorldConfig.zoom * zoomFactor));
      WorldConfig.clampPan();
    }
  }, { passive: false });
}

function draw() {
  const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
  const isPlay = typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying;

  if (isPlay) {
    GamePlayerEngine.updateGameLoop();
  }

  // 1. Dark outer void canvas background
  background(isPlay ? 6 : (isCode ? 10 : 18), isPlay ? 2 : (isCode ? 3 : 4), isPlay ? 4 : (isCode ? 5 : 9));

  const cam = getActiveStageCamera();

  // 2. View Transformations
  push();
  translate(width / 2, height / 2);
  scale(cam.zoom);
  translate(-cam.panX, -cam.panY);

  // 3. Draw World Canvas Background
  fill(WorldConfig.bgColor);
  if (isPlay) {
    noStroke();
  } else {
    stroke(46, 8, 20);
    strokeWeight(3);
  }
  rect(0, 0, WorldConfig.worldWidth, WorldConfig.worldHeight);

  // 4. Subtle World Grid (if Grid Toggle is ON and not in Code Mode preview or Play mode)
  if (MouseToolController.showGrid && !isCode && !isPlay) {
    stroke(200, 200, 210, 45);
    strokeWeight(1);
    const gridSize = 64;
    for (let x = 0; x <= WorldConfig.worldWidth; x += gridSize) {
      line(x, 0, x, WorldConfig.worldHeight);
    }
    for (let y = 0; y <= WorldConfig.worldHeight; y += gridSize) {
      line(0, y, WorldConfig.worldWidth, y);
    }
  }

  // 5. Draw Placed World Objects & Drag Preview
  WorldObjectsManager.draw();

  // 6. World Origin Axes / Bounds Accent
  if (!isPlay) {
    stroke(173, 32, 77);
    strokeWeight(isCode ? 1.5 : 2);
    noFill();
    rect(0, 0, WorldConfig.worldWidth, WorldConfig.worldHeight);
  }

  pop();

  // 7. HUD Coordinates Overlay (Bottom Right - only in main Canvas mode)
  if (!isCode && !isPlay) {
    drawHUD();
  }

  // 8. Live Dynamic Variable Watcher HUD Badges (Top-Left of stage canvas)
  if (typeof VariableManager !== "undefined") {
    VariableManager.drawWatchers();
  }
}

function drawHUD() {
  push();
  const hudText = `WORLD: ${WorldConfig.worldWidth}x${WorldConfig.worldHeight} | ZOOM: ${Math.round(WorldConfig.zoom * 100)}%`;
  
  textSize(10);
  textAlign(RIGHT, BOTTOM);
  const pad = 10;
  
  // On mobile (<= 860px), lift HUD above mobile bottom nav bar (56px)
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 860;
  const bottomOffset = isMobile ? 68 : 14;
  const rectBottomOffset = isMobile ? 78 : 28;

  // HUD Pill
  fill(13, 2, 5, 190);
  stroke(46, 8, 20);
  strokeWeight(2);
  rect(width - textWidth(hudText) - pad * 2 - 10, height - rectBottomOffset, textWidth(hudText) + pad * 2, 20);

  noStroke();
  fill(201, 146, 162);
  text(hudText, width - pad - 10, height - bottomOffset);
  pop();
}

function windowResized() {
  resizeStageCanvas();
}

// ============================================================================
// 11. WORKSPACE CONTROLS & EVENT HANDLERS
// ============================================================================
function saveWorkspace() {
  SoundEngine.playAction("save");
  saveCanvas(mainCanvas, "unifive_pixel_workspace", "png");
}

function toggleFullscreenMode() {
  const btn = document.getElementById("btn-fullscreen");
  const icon = document.getElementById("fullscreen-icon");
  const label = document.getElementById("fullscreen-label");

  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      if (btn) btn.classList.add("active");
      if (icon) icon.className = "ph ph-corners-in";
      if (label) label.textContent = "WINDOWED";
      setTimeout(resizeStageCanvas, 100);
    }).catch(err => {
      console.warn("Fullscreen error:", err);
    });
  } else {
    document.exitFullscreen().then(() => {
      if (btn) btn.classList.remove("active");
      if (icon) icon.className = "ph ph-corners-out";
      if (label) label.textContent = "FULLSCREEN";
      setTimeout(resizeStageCanvas, 100);
    }).catch(err => {
      console.warn("Exit fullscreen error:", err);
    });
  }
}

function initUIEventListeners() {
  document.addEventListener("click", () => SoundEngine.init(), { once: true });
  document.addEventListener("keydown", () => SoundEngine.init(), { once: true });

  const btnUndo = document.getElementById("btn-undo");
  if (btnUndo) {
    btnUndo.addEventListener("click", () => HistoryManager.undo());
  }

  const btnRedo = document.getElementById("btn-redo");
  if (btnRedo) {
    btnRedo.addEventListener("click", () => HistoryManager.redo());
  }

  const btnSave = document.getElementById("btn-save");
  if (btnSave) {
    btnSave.addEventListener("click", () => saveWorkspace());
  }

  const btnSound = document.getElementById("btn-sound");
  if (btnSound) {
    btnSound.addEventListener("click", () => SoundEngine.toggle());
  }

  const btnFullscreen = document.getElementById("btn-fullscreen");
  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", () => toggleFullscreenMode());
  }

  document.addEventListener("fullscreenchange", () => {
    const btn = document.getElementById("btn-fullscreen");
    const icon = document.getElementById("fullscreen-icon");
    const label = document.getElementById("fullscreen-label");

    if (document.fullscreenElement) {
      if (btn) btn.classList.add("active");
      if (icon) icon.className = "ph ph-corners-in";
      if (label) label.textContent = "WINDOWED";
    } else {
      if (btn) btn.classList.remove("active");
      if (icon) icon.className = "ph ph-corners-out";
      if (label) label.textContent = "FULLSCREEN";
    }
    setTimeout(resizeStageCanvas, 100);
  });

  // Global Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target.tagName !== "INPUT") {
      isSpacePressed = true;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      HistoryManager.undo();
    } else if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
               ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")) {
      e.preventDefault();
      HistoryManager.redo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveWorkspace();
    } else if (e.key.toLowerCase() === "v" && !e.ctrlKey && !e.metaKey && e.target.tagName !== "INPUT") {
      ViewController.toggleView();
    } else if ((e.key.toLowerCase() === "m" || e.key.toLowerCase() === "h") && !e.ctrlKey && !e.metaKey && e.target.tagName !== "INPUT") {
      MouseToolController.setTool("move");
    } else if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.metaKey && e.target.tagName !== "INPUT") {
      MouseToolController.setTool("select");
    } else if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey && e.target.tagName !== "INPUT") {
      MouseToolController.toggleGrid();
    } else if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey && e.target.tagName !== "INPUT") {
      toggleFullscreenMode();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      isSpacePressed = false;
    }
  });
}
