/**
 * UNIFIVE Engine - Lifecycle Draw Subsystem
 * Canvas drawing loop, background fills, grid lines, camera transformations, and HUD overlays.
 */
function drawHUD() {
  push();
  const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
  const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
  const zoom = typeof WorldConfig !== "undefined" ? Math.round(WorldConfig.zoom * 100) : 100;
  const hudText = `WORLD: ${wWidth}x${wHeight} | ZOOM: ${zoom}%`;
  
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

function drawStageCanvas() {
  const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
  const isPlay = typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying;

  if (isPlay && typeof GamePlayerEngine.updateGameLoop === "function") {
    GamePlayerEngine.updateGameLoop();
  }

  // 1. Dark outer void canvas background
  background(isPlay ? 6 : (isCode ? 10 : 18), isPlay ? 2 : (isCode ? 3 : 4), isPlay ? 4 : (isCode ? 5 : 9));

  const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { panX: 1000, panY: 750, zoom: 1.0 };

  // 2. View Transformations
  push();
  translate(width / 2, height / 2);
  scale(cam.zoom);
  translate(-cam.panX, -cam.panY);

  // 3. Draw World Canvas Background
  const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
  const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
  const bgColor = typeof WorldConfig !== "undefined" ? WorldConfig.bgColor : "#ffffff";

  fill(bgColor);
  if (isPlay) {
    noStroke();
  } else {
    stroke(46, 8, 20);
    strokeWeight(3);
  }
  rect(0, 0, wWidth, wHeight);

  // 4. Subtle World Grid (if Grid Toggle is ON and not in Code Mode preview or Play mode)
  if (typeof MouseToolController !== "undefined" && MouseToolController.showGrid && !isCode && !isPlay) {
    stroke(200, 200, 210, 45);
    strokeWeight(1);
    const gridSize = 64;
    for (let x = 0; x <= wWidth; x += gridSize) {
      line(x, 0, x, wHeight);
    }
    for (let y = 0; y <= wHeight; y += gridSize) {
      line(0, y, wWidth, y);
    }
  }

  // 5. Draw Placed World Objects & Drag Preview
  if (typeof WorldObjectsManager !== "undefined") {
    WorldObjectsManager.draw();
  }

  // 6. World Origin Axes / Bounds Accent
  if (!isPlay) {
    stroke(173, 32, 77);
    strokeWeight(isCode ? 1.5 : 2);
    noFill();
    rect(0, 0, wWidth, wHeight);
  }

  pop();

  // 7. HUD Coordinates Overlay (Bottom Right - only in main Canvas mode)
  if (!isCode && !isPlay) {
    drawHUD();
  }

  // 8. Live Dynamic Variable Watcher HUD Badges (Top-Left of stage canvas)
  if (typeof VariableManager !== "undefined" && typeof VariableManager.drawWatchers === "function") {
    VariableManager.drawWatchers();
  }
}
